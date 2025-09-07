let expenses = [];
let defaultCurrency = 'INR';

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

// Get DOM elements
const form = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalAmount = document.getElementById('total-amount');
const currencySymbol = document.getElementById('currency-symbol');
const defaultCurrencySelect = document.getElementById('default-currency');
const currencyFilter = document.getElementById('currency-filter');
const categoryFilter = document.getElementById('category-filter');
const currencyTotals = document.getElementById('currency-totals');

// Event listeners
form.addEventListener('submit', addExpense);
defaultCurrencySelect.addEventListener('change', changeDefaultCurrency);
currencyFilter.addEventListener('change', filterExpenses);
categoryFilter.addEventListener('change', filterExpenses);

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
    
    form.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-currency').value = defaultCurrency;
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
    }
}

function updateTotal() {
    // Calculate total in default currency (simplified - in real app you'd use exchange rates)
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
}

function filterExpenses() {
    displayExpenses();
}

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('defaultCurrency', defaultCurrency);
}

function loadData() {
    const savedExpenses = localStorage.getItem('expenses');
    const savedCurrency = localStorage.getItem('defaultCurrency');
    
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
    
    if (savedCurrency) {
        defaultCurrency = savedCurrency;
        defaultCurrencySelect.value = defaultCurrency;
    }
    
    document.getElementById('expense-currency').value = defaultCurrency;
    displayExpenses();
    updateTotal();
    updateCurrencyTotals();
}

// Initialize app
window.addEventListener('load', function() {
    loadData();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
});