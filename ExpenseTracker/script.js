const balanceEl = document.getElementById("balance");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");
const transactionListEl = document.getElementById("transaction-list");
const transactionFormEl = document.getElementById("transaction-form");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

transactionFormEl.addEventListener("submit", addTransaction);

function addTransaction(e){
    e.preventDefault();

    const description = descriptionEl.value.trim();
    const amount = Number(amountEl.value);

    transactions.push({
        id: Date.now(),
        description,
        amount
    });

    localStorage.setItem("transactions", JSON.stringify(transactions));

    updateTransactionList();
    updateSummary();

    transactionFormEl.reset();
}

function updateTransactionList(){
    transactionListEl.innerHTML = "";

    const sortedTransactions = [...transactions].reverse();

    sortedTransactions.forEach(transaction => {
        const transactionEl = createTransactionsElement(transaction);
        transactionListEl.appendChild(transactionEl);
    })
}

function createTransactionsElement(transaction){
    const li = document.createElement("li");
    li.classList.add("transaction");
    li.classList.add(transaction.amount >= 0 ? "income" : "expense");

    li.innerHTML = `
        <span>${transaction.description}</span>
        <span>${formatCurrency(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    return li;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateTransactionList();
    updateSummary();
}

function updateSummary() {
    const balance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
    const income = transactions
        .filter(transaction => transaction.amount >= 0)
        .reduce((acc, transaction) => acc + transaction.amount, 0);
    const expense = transactions
        .filter(transaction => transaction.amount < 0)
        .reduce((acc, transaction) => acc + transaction.amount, 0);
    balanceEl.textContent = formatCurrency(balance);
    incomeAmountEl.textContent = formatCurrency(income);
    expenseAmountEl.textContent = formatCurrency(expense);
}

updateTransactionList();
updateSummary();
