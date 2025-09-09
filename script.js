let expenses = [];
let defaultCurrency = 'INR';
let categoryChart = null;
let monthlyChart = null;
let monthlyBudget = 0;

// Currency symbols mapping
const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$'
};

// Category colors for charts
const categoryColors = {
    'food': '#FF6384',
    'transport': '#36A2EB',
    'entertainment': '#FFCE56',
    'shopping': '#4BC0C0',
    'bills': '#9966FF',
    'health': '#FF9F40',
    'education': '#FF6384',
    'other': '#C9CBCF'
};

// Get DOM elements
const form = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalAmount = document.getElementById('total-amount');
const currencySymbol = document.getElementById('currency-symbol');
const defaultCurrencySelect = document.getElementById('default-currency');
const currencyFilter = document.getElementById('currency-filter');
const categoryFilter = document.getElementById('category-filter');
const currencyTotals = document.getElementById('currency-totals');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetAmountInput = document.getElementById('budget-amount');
const budgetDisplay = document.getElementById('budget-display');
const exportBtn = document.getElementById('export-btn');

// Event listeners
form.addEventListener('submit', addExpense);
defaultCurrencySelect.addEventListener('change', changeDefaultCurrency);
currencyFilter.addEventListener('change', filterExpenses);
categoryFilter.addEventListener('change', filterExpenses);
setBudgetBtn.addEventListener('click', setBudget);
exportBtn.addEventListener('click', exportToExcel);

function addExpense(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const currency = document.getElementById('expense-currency').value;
    
    const expense = {
        id: Date.now(),
        description: description,
        amount: amount,
        category: category,
        date: date,
        currency: currency
    };
    
    expenses.push(expense);
    saveData();
    displayExpenses();
    updateTotal();
    updateCurrencyTotals();
    updateBudgetDisplay(); // FIXED: This will now update budget correctly
    updateCharts();
    
    form.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-currency').value = defaultCurrency;
}

function setBudget() {
    const budget = parseFloat(budgetAmountInput.value);
    if (budget > 0) {
        monthlyBudget = budget;
        budgetDisplay.style.display = 'block';
        budgetAmountInput.value = '';
        updateBudgetDisplay();
        saveData();
    }
}

function updateBudgetDisplay() {
    if (monthlyBudget <= 0) return;
    
    const currentMonth = new Date().toISOString().slice(0, 7); // Gets YYYY-MM format
    const monthlyExpenses = expenses.filter(expense => 
        expense.date.startsWith(currentMonth) && 
        expense.currency === defaultCurrency
    );
    
    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = monthlyBudget - totalSpent;
    const percentage = (totalSpent / monthlyBudget) * 100;
    
    document.getElementById('budget-limit').textContent = 
        `${currencySymbols[defaultCurrency]}${monthlyBudget.toFixed(2)}`;
    document.getElementById('budget-remaining').textContent = 
        `${currencySymbols[defaultCurrency]}${remaining.toFixed(2)}`;
    
    const progressBar = document.getElementById('budget-progress');
    progressBar.style.width = `${Math.min(percentage, 100)}%`;
    
    const statusDiv = document.getElementById('budget-status');
    if (percentage < 70) {
        statusDiv.textContent = '✅ You\'re doing great!';
        statusDiv.className = 'budget-status good';
    } else if (percentage < 90) {
        statusDiv.textContent = '⚠️ Getting close to budget limit';
        statusDiv.className = 'budget-status warning';
    } else {
        statusDiv.textContent = '🚨 Budget exceeded!';
        statusDiv.className = 'budget-status danger';
    }
}

function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

function updateCategoryChart() {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
        if (expense.currency === defaultCurrency) {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        }
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map(label => categoryColors[label] || '#C9CBCF');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateMonthlyChart() {
    const monthlyTotals = {};
    
    expenses.forEach(expense => {
        if (expense.currency === defaultCurrency) {
            const month = expense.date.slice(0, 7);
            if (!monthlyTotals[month]) {
                monthlyTotals[month] = 0;
            }
            monthlyTotals[month] += expense.amount;
        }
    });
    
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const labels = sortedMonths.map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    });
    const data = sortedMonths.map(month => monthlyTotals[month]);
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Spending (${defaultCurrency})`,
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function exportToExcel() {
    if (expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }
    
    let csvContent = "Date,Description,Category,Amount,Currency\n";
    
    expenses.forEach(expense => {
        csvContent += `${expense.date},${expense.description},${expense.category},${expense.amount},${expense.currency}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    const originalText = exportBtn.textContent;
    exportBtn.textContent = '✅ Exported!';
    exportBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    
    setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.style.background = '';
    }, 2000);
}

function displayExpenses() {
    const currencyFilterValue = currencyFilter.value;
    const categoryFilterValue = categoryFilter.value;
    
    let filteredExpenses = expenses;
    
    if (currencyFilterValue) {
        filteredExpenses = filteredExpenses.filter(expense => expense.currency === currencyFilterValue);
    }
    
    if (categoryFilterValue) {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilterValue);
    }
    
    expenseList.innerHTML = '';
    
    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No expenses found</div>';
        return;
    }
    
    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredExpenses.forEach(expense => {
        const expenseDiv = document.createElement('div');
        expenseDiv.className = 'expense-item';
        expenseDiv.innerHTML = `
            <div class="expense-details">
                <strong>${expense.description}</strong><br>
                <small>${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} • ${expense.date}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="expense-amount">${currencySymbols[expense.currency]}${expense.amount.toFixed(2)} ${expense.currency}</span>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
            </div>
        `;
        expenseList.appendChild(expenseDiv);
    });
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveData();
        displayExpenses();
        updateTotal();
        updateCurrencyTotals();
        updateBudgetDisplay(); // FIXED: Budget updates when deleting too
        updateCharts();
    }
}

function updateTotal() {
    const total = expenses
        .filter(expense => expense.currency === defaultCurrency)
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    totalAmount.textContent = total.toFixed(2);
    currencySymbol.textContent = currencySymbols[defaultCurrency];
}

function updateCurrencyTotals() {
    const totals = {};
    
    expenses.forEach(expense => {
        if (!totals[expense.currency]) {
            totals[expense.currency] = 0;
        }
        totals[expense.currency] += expense.amount;
    });
    
    let html = '<h3>💱 Currency Breakdown</h3>';
    
    for (const [currency, total] of Object.entries(totals)) {
        html += `
            <div class="currency-total-item">
                <span>${currencySymbols[currency]} ${currency}</span>
                <strong>${currencySymbols[currency]}${total.toFixed(2)}</strong>
            </div>
        `;
    }
    
    currencyTotals.innerHTML = html;
}

function changeDefaultCurrency() {
    defaultCurrency = defaultCurrencySelect.value;
    document.getElementById('expense-currency').value = defaultCurrency;
    saveData();
    updateTotal();
    updateBudgetDisplay(); // FIXED: Budget updates when changing currency
    updateCharts();
}

function filterExpenses() {
    displayExpenses();
}

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('defaultCurrency', defaultCurrency);
    localStorage.setItem('monthlyBudget', monthlyBudget.toString());
}

function loadData() {
    const savedExpenses = localStorage.getItem('expenses');
    const savedCurrency = localStorage.getItem('defaultCurrency');
    const savedBudget = localStorage.getItem('monthlyBudget');
    
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
    
    if (savedCurrency) {
        defaultCurrency = savedCurrency;
        defaultCurrencySelect.value = defaultCurrency;
    }
    
    if (savedBudget) {
        monthlyBudget = parseFloat(savedBudget);
        if (monthlyBudget > 0) {
            budgetDisplay.style.display = 'block';
        }
    }
    
    document.getElementById('expense-currency').value = defaultCurrency;
    displayExpenses();
    updateTotal();
    updateCurrencyTotals();
    updateBudgetDisplay(); // FIXED: Budget loads correctly on page load
    updateCharts();
}

// Initialize app
window.addEventListener('load', function() {
    loadData();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
});
