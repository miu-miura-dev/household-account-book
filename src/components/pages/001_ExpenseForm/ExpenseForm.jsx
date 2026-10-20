import React, { useState, useEffect, useRef } from 'react'; 
import { CATEGORIES, PAYMENT_SOURCES } from '../../../constants/categories';
import './ExpenseForm.css';

export default function ExpenseForm({ onAddExpense }) {
  const [amount, setAmount] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('食費');
  const [selectedSubCategory, setSelectedSubCategory] = useState('食費');
  const [paymentSource, setPaymentSource] = useState('メインクレカ');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [memo, setMemo] = useState('');

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
      amount: Number(amount),
      date: date,
      category: selectedMainCategory,      // Supabaseの `category` カラムに対応
      sub_category: selectedSubCategory,  // Supabaseの `sub_category` カラムに対応
      payment_source: paymentSource,      // Supabaseの `payment_source` カラムに対応
      memo: memo || null,                 // Supabaseの `memo` カラムに対応（空欄ならnull）
    });

    // フォームのリセット（金額とメモをクリア、日付は今日のままにする場合が多いですが必要に応じて調整してください）
    setAmount('');
    setMemo('');
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">

      <h1 className="expense-form-title">新規入力</h1>

{/* 金額 */}
<div className="form-group">
  <div className="amount-input-wrapper">
    <span className="currency-symbol">¥</span>
    <input 
      ref={inputRef}
      type="number" 
      pattern="\d*"
      value={amount} 
      onChange={(e) => setAmount(e.target.value)} 
      placeholder="0" 
      required
      autoFocus
      className="amount-input"
    />
  </div>
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

      {/* 日付 */}
      <div className="form-group">
        <label className="form-label">日付</label>
        <input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="date-input"
        />
      </div>

      {/* 支出元 */}
      <div className="form-group">
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

      {/* メモ */}
      <div className="form-group-last">
        <label className="form-label">メモ（任意）</label>
        <input 
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="memo-input"
        />
      </div>

      <button type="submit" className="submit-btn">
        記録する
      </button>
    </form>
  );
}