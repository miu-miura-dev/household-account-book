import React, { useState, useEffect, useRef } from 'react'; 
import { CATEGORIES, PAYMENT_SOURCES } from '../../../constants/categories';
import './ExpenseForm.css';

export default function ExpenseForm({ onAddExpense, onNavigateHistory, initialData, onClose }) {
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [selectedMainCategory, setSelectedMainCategory] = useState(initialData ? initialData.category : '食費');
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialData ? initialData.sub_category : '食費');
  const [paymentSource, setPaymentSource] = useState(initialData ? initialData.payment_source : 'メインクレカ');
  const [date, setDate] = useState(initialData ? initialData.date : new Date().toISOString().split('T')[0]);
  const [memo, setMemo] = useState(initialData ? initialData.memo || '' : '');

  // ── ★ ここに必ず isPending のステート定義が必要です！ ──
  const [isPending, setIsPending] = useState(() => {
    if (initialData && initialData.id !== undefined) {
      return initialData.is_pending !== undefined ? initialData.is_pending : false;
    }
    return true; // 新規作成時は強制的に true（未整理）にする
  });

  // 送信完了後の確認画面用ステート
  const [submittedData, setSubmittedData] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!submittedData && inputRef.current) {
      inputRef.current.focus();
    }
  }, [submittedData]);

  const handleMainCategoryChange = (main) => {
    setSelectedMainCategory(main);
    setSelectedSubCategory(CATEGORIES[main][0]);
  };

　　const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    const newExpense = {
      // 編集時の場合は既存の id を必ず含める
      ...(initialData && initialData.id ? { id: initialData.id } : {}),
      amount: Number(amount),
      date: date,
      category: selectedMainCategory,
      sub_category: selectedSubCategory,
      payment_source: paymentSource,
      memo: memo || null,
      is_pending: isPending, 
    };

    // 親のSupabase保存処理を実行
    onAddExpense(newExpense);

    // ★ 修正：編集モーダルのときだけ閉じて、新規入力のときは未整理・通常問わず確認画面をずっと表示させる
    if (initialData) {
      if (typeof onClose === 'function') {
        onClose(); // 編集のときはモーダルを閉じる
      }
    } else {
      // 新規作成のときは、必ず確認（プレビュー）画面にセットしてずっと表示させる
      setSubmittedData(newExpense);
    }
  };

  // 1. 続けて入力ボタン
  const handleContinueInput = () => {
    setSubmittedData(null);
    setAmount('');
    setMemo('');
  };

  // 2. 修正するボタン
  const handleEdit = () => {
    setSubmittedData(null);
  };

  // 3. 完了ボタン（ここで初めて履歴へ飛ぶ）
  const handleFinish = () => {
    if (onNavigateHistory) {
      onNavigateHistory();
    }
  };

  // ── プレビュー（確認）画面 ──
  if (submittedData) {
    return (
      <div className="expense-form success-screen">
        <h2 className="success-title">支出を保存しました</h2>
        
        <div className="success-content-box">
          <div className="success-row">
            <span className="success-label">ステータス</span>
            <span className="success-value" style={{ color: submittedData.is_pending ? '#e67e22' : '#27ae60', fontWeight: 'bold' }}>
              {submittedData.is_pending ? '未整理 (Pending)' : '通常登録 (確定)'}
            </span>
          </div>
          <div className="success-row">
            <span className="success-label">金額</span>
            <span className="success-value amount">¥{submittedData.amount.toLocaleString()}</span>
          </div>
          <div className="success-row">
            <span className="success-label">日付</span>
            <span className="success-value">{submittedData.date}</span>
          </div>
          <div className="success-row">
            <span className="success-label">カテゴリ</span>
            <span className="success-value">{submittedData.category} / {submittedData.sub_category}</span>
          </div>
          <div className="success-row">
            <span className="success-label">支出元</span>
            <span className="success-value">{submittedData.payment_source}</span>
          </div>
          {submittedData.memo && (
            <div className="success-row">
              <span className="success-label">メモ</span>
              <span className="success-value">{submittedData.memo}</span>
            </div>
          )}
        </div>

        <div className="success-actions">
          <button type="button" onClick={handleFinish} className="action-btn finish-btn">
            完了（履歴へ）
          </button>
          <button type="button" onClick={handleEdit} className="action-btn edit-btn">
            修正する
          </button>
          <button type="button" onClick={handleContinueInput} className="action-btn continue-btn">
            続けて入力
          </button>
        </div>
      </div>
    );
  }

  // ── 通常の入力フォーム画面 ──
  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h1 className="expense-form-title">{initialData ? 'EDIT EXPENSE' : 'NEW ENTRY'}</h1>

      {/* 金額 */}
      <div className="form-group">
        <div className="amount-input-wrapper">
          <span className="currency-symbol">¥</span>
          <input 
            ref={inputRef}
            type="number" 
            inputMode="numeric"
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
      <div className="form-group">
        <label className="form-label">メモ（任意）</label>
        <input 
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="memo-input"
        />
      </div>

      {/* ★ 記録ボタンの上のPendingトグルボタン */}
      <div className="form-group pending-toggle-group">
        <button
          type="button"
          onClick={() => setIsPending(!isPending)}
          className={`pending-toggle-btn ${isPending ? 'is-pending' : 'is-confirmed'}`}
        >
          {isPending ? '📌 ステータス: 未整理 (Pending) [ON]' : '📌 ステータス: 通常登録 (確定) [OFF]'}
        </button>
      </div>

      <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>
        {initialData ? '更新して確定する' : '記録する'}
      </button>
    </form>
  );
}