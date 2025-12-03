import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [transactions, setTransactions] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [showQuickAdd, setShowQuickAdd] = useState(null)
  const [quickAmount, setQuickAmount] = useState('')
  const [quickDescription, setQuickDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async (e) => {
    e.preventDefault()
    if (!description || !amount) {
      alert('Пожалуйста, заполните все поля')
      return
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amount: parseFloat(amount), type })
      })

      if (!response.ok) throw new Error('Failed to add transaction')

      const newTransaction = await response.json()
      setTransactions([newTransaction, ...transactions])
      setDescription('')
      setAmount('')
      setType('expense')
    } catch (err) {
      alert('Ошибка при добавлении транзакции: ' + err.message)
    }
  }

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete transaction')

      setTransactions(transactions.filter(t => t.id !== id))
    } catch (err) {
      alert('Ошибка при удалении транзакции: ' + err.message)
    }
  }

  const handleQuickAdd = async (transactionType) => {
    if (!quickAmount) {
      alert('Пожалуйста, введите сумму')
      return
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: quickDescription || (transactionType === 'income' ? 'Доход' : 'Расход'),
          amount: parseFloat(quickAmount),
          type: transactionType
        })
      })

      if (!response.ok) throw new Error('Failed to add transaction')

      const newTransaction = await response.json()
      setTransactions([newTransaction, ...transactions])
      setShowQuickAdd(null)
      setQuickAmount('')
      setQuickDescription('')
    } catch (err) {
      alert('Ошибка при добавлении транзакции: ' + err.message)
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  if (loading) return <div className="app"><h1>Загрузка...</h1></div>
  if (error) return <div className="app"><h1>Ошибка: {error}</h1></div>

  return (
    <div className="app">
      <h1>💰 Мой бюджет</h1>
      
      {/* Статистика */}
      <div className="stats-main">
        <div className="balance-display">
          <h2 className="balance-label">Ваш баланс</h2>
          <div className="balance-amount">${balance.toFixed(2)}</div>
          <div className="balance-details">
            <div className="balance-income">
              <span className="label">Доход</span>
              <div className="value-with-btn">
                <span className="value">+${totalIncome.toFixed(2)}</span>
                <button className="quick-add-btn income-btn" onClick={() => setShowQuickAdd('income')}>+</button>
              </div>
            </div>
            <div className="balance-expense">
              <span className="label">Расход</span>
              <div className="value-with-btn">
                <span className="value">-${totalExpense.toFixed(2)}</span>
                <button className="quick-add-btn expense-btn" onClick={() => setShowQuickAdd('expense')}>+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Форма добавления */}
      <form className="form" onSubmit={addTransaction}>
        <h2>Добавить транзакцию</h2>
        <input
          type="text"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Сумма"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
        <button type="submit">Добавить</button>
      </form>

      {/* Список транзакций */}
      <div className="transactions">
        <h2>История операций ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p className="empty">Нет транзакций. Начните добавлять!</p>
        ) : (
          <ul>
            {transactions.map(t => (
              <li key={t.id} className={`transaction ${t.type}`}>
                <div className="transaction-info">
                  <span className="description">{t.description}</span>
                  <span className="date">{t.date}</span>
                </div>
                <div className="transaction-amount">
                  <span className="amount">
                    {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} $
                  </span>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteTransaction(t.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Модальное окно для быстрого добавления */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => setShowQuickAdd(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{showQuickAdd === 'income' ? 'Добавить доход' : 'Добавить расход'}</h3>
            <input
              type="text"
              placeholder="Описание (необязательно)"
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              autoFocus
            />
            <input
              type="number"
              placeholder="Сумма"
              step="0.01"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="modal-btn confirm" onClick={() => handleQuickAdd(showQuickAdd)}>
                Добавить
              </button>
              <button className="modal-btn cancel" onClick={() => setShowQuickAdd(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
