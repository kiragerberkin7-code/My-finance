const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'transactions.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper function to read transactions
const readTransactions = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
};

// Helper function to write transactions
const writeTransactions = (transactions) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transactions, null, 2));
  } catch (error) {
    console.error('Error writing transactions:', error);
  }
};

// Routes
app.get('/api/transactions', (req, res) => {
  const transactions = readTransactions();
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const { description, amount, type } = req.body;
  if (!description || !amount || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transactions = readTransactions();
  const newTransaction = {
    id: Date.now(),
    description,
    amount: parseFloat(amount),
    type,
    date: new Date().toLocaleDateString('ru-RU')
  };

  transactions.unshift(newTransaction);
  writeTransactions(transactions);

  res.status(201).json(newTransaction);
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const transactions = readTransactions();
  const filteredTransactions = transactions.filter(t => t.id !== id);

  if (filteredTransactions.length === transactions.length) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  writeTransactions(filteredTransactions);
  res.json({ message: 'Transaction deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});