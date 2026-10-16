import React, { useState, useEffect, useRef } from 'react'; // ← ここに useEffect と useRef を追加！
import { CATEGORIES, PAYMENT_SOURCES } from '../constants/categories';
import './ExpenseForm.css';

export default function ExpenseForm({ onAddExpense }) {
  const [amount, setAmount] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('食費');
  const [selectedSubCategory, setSelectedSubCategory] = useState('食費');
  const [paymentSource, setPaymentSource] = useState('メインクレカ');

  const inputRef = useRef(null);

  // フォームが表示された瞬間に金額の入力欄にフォーカスを当てる
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleMainCategoryChange = (main) => {
    setSelectedMainCategory(main);
    setSelectedSubCategory(CATEGORIES[main][0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    onAddExpense({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      mainCategory: selectedMainCategory,
      subCategory: selectedSubCategory,
      paymentSource: paymentSource,
    });

    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-group">
        <label className="form-label">金額（円）</label>
        <input 
          ref={inputRef}
          type="number" 
          pattern="\d*"
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="例: 1200" 
          required
          autoFocus
          className="amount-input"
        />
      </div>

      {/* 大項目 */}
      <div className="form-group">
        <label className="form-label">大項目</label>
        <div className="category-container">
          {Object.keys(CATEGORIES).map((main) => (
            <button
              type="button"
              key={main}
              onClick={() => handleMainCategoryChange(main)}
              className={`category-btn ${selectedMainCategory === main ? 'main-active' : 'main-default'}`}
            >
              {main}
            </button>
          ))}
        </div>
      </div>

      {/* 中項目 */}
      <div className="form-group">
        <label className="form-label">中項目</label>
        <div className="category-container">
          {CATEGORIES[selectedMainCategory].map((sub) => (
            <button
              type="button"
              key={sub}
              onClick={() => setSelectedSubCategory(sub)}
              className={`category-btn ${selectedSubCategory === sub ? 'sub-active' : 'sub-default'}`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* 支出元 */}
      <div className="form-group-last">
        <label className="form-label">支出元</label>
        <select 
          value={paymentSource} 
          onChange={(e) => setPaymentSource(e.target.value)}
          className="payment-select"
        >
          {PAYMENT_SOURCES.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="submit-btn">
        記録する
      </button>
    </form>
  );
}