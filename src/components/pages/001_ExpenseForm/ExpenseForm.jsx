import React, { useState, useEffect, useRef } from 'react'; 
import { CATEGORIES, PAYMENT_SOURCES } from '../../../constants/categories';
import './ExpenseForm.css';

export default function ExpenseForm({ onAddExpense, onNavigateHistory, initialData, onClose }) {
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  
  // 1. 支出 / 収入
  const [transactionType, setTransactionType] = useState(() => {
    if (initialData && initialData.category === '収入') return 'income';
    return 'expense';
  });

  // 2. 支出の中の分類（固定費 / 変動費）
  const [expenseGroup, setExpenseGroup] = useState(() => {
    if (initialData && initialData.category) {
      if (initialData.category === '収入') return '変動費';
      if (CATEGORIES['固定費'] && CATEGORIES['固定費'][initialData.category]) return '固定費';
    }
    return '変動費';
  });

  // 3. 大項目
  const [selectedMainCategory, setSelectedMainCategory] = useState(() => {
    if (initialData && initialData.category) return initialData.category;
    const defaultGroupObj = CATEGORIES['変動費'] || {};
    return Object.keys(defaultGroupObj)[0] || '';
  });

  // 4. 中項目
  const [selectedSubCategory, setSelectedSubCategory] = useState(() => {
    if (initialData && initialData.sub_category) return initialData.sub_category;
    return '';
  });
  
  // 「その他」などの自由入力用
  const [customSubCategory, setCustomSubCategory] = useState(() => {
    if (initialData && initialData.sub_category) {
      const targetGroup = initialData.category === '収入' ? '収入' : expenseGroup;
      const currentSubs = CATEGORIES[targetGroup]?.[initialData.category] || [];
      if (!currentSubs.includes(initialData.sub_category)) {
        return initialData.sub_category;
      }
    }
    return '';
  });

  const [paymentSource, setPaymentSource] = useState(initialData ? initialData.payment_source : (PAYMENT_SOURCES?.[0] || '現金'));
  const [date, setDate] = useState(initialData ? initialData.date : new Date().toISOString().split('T')[0]);
  const [memo, setMemo] = useState(initialData ? initialData.memo || '' : '');

  // ステータス（未整理）：ボタンをやめてすっきりしたチェックボックスに変更
  const [isPending, setIsPending] = useState(() => {
    if (initialData && initialData.id !== undefined) {
      return initialData.is_pending !== undefined ? initialData.is_pending : false;
    }
    return true;
  });

  const [submittedData, setSubmittedData] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!submittedData && inputRef.current) {
      inputRef.current.focus();
    }
  }, [submittedData]);

  const handleTransactionTypeChange = (type) => {
    setTransactionType(type);
    if (type === 'income') {
      const incomeMains = Object.keys(CATEGORIES['収入'] || {});
      const firstMain = incomeMains[0] || '収入';
      setSelectedMainCategory(firstMain);
      setSelectedSubCategory(CATEGORIES['収入'][firstMain]?.[0] || '');
    } else {
      setExpenseGroup('変動費');
      const firstMain = Object.keys(CATEGORIES['変動費'])[0] || '';
      setSelectedMainCategory(firstMain);
      setSelectedSubCategory(CATEGORIES['変動費'][firstMain]?.[0] || '');
    }
    setCustomSubCategory('');
  };

  const handleExpenseGroupChange = (group) => {
    setExpenseGroup(group);
    const groupObj = CATEGORIES[group] || {};
    const firstMain = Object.keys(groupObj)[0] || '';
    setSelectedMainCategory(firstMain);
    setSelectedSubCategory(groupObj[firstMain]?.[0] || '');
    setCustomSubCategory('');
  };

  const handleMainCategoryChange = (main) => {
    setSelectedMainCategory(main);
    const targetGroup = transactionType === 'income' ? '収入' : expenseGroup;
    const subs = CATEGORIES[targetGroup]?.[main] || [];
    setSelectedSubCategory(subs[0] || '');
    setCustomSubCategory('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    const finalSubCategory = (selectedSubCategory === 'その他' && customSubCategory.trim() !== '')
      ? customSubCategory.trim()
      : selectedSubCategory;

    const newExpense = {
      ...(initialData && initialData.id ? { id: initialData.id } : {}),
      amount: Number(amount),
      date: date,
      category: selectedMainCategory,
      sub_category: finalSubCategory,
      payment_source: paymentSource,
      memo: memo || null,
      is_pending: isPending,
    };

    onAddExpense(newExpense);

    if (initialData) {
      if (typeof onClose === 'function') onClose();
    } else {
      setSubmittedData(newExpense);
    }
  };

  const handleContinueInput = () => {
    setSubmittedData(null);
    setAmount('');
    setMemo('');
    setCustomSubCategory('');
  };

  const handleEdit = () => {
    setSubmittedData(null);
  };

  const handleFinish = () => {
    if (onNavigateHistory) onNavigateHistory();
  };

  if (submittedData) {
    return (
      <div className="expense-form success-screen">
        <h2 className="success-title">記録を保存しました</h2>
        <div className="success-content-box">
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
        </div>
        <div className="success-actions">
          <button type="button" onClick={handleFinish} className="action-btn finish-btn">完了（履歴へ）</button>
          <button type="button" onClick={handleEdit} className="action-btn edit-btn">修正する</button>
          <button type="button" onClick={handleContinueInput} className="action-btn continue-btn">続けて入力</button>
        </div>
      </div>
    );
  }

  const activeGroupKey = transactionType === 'income' ? '収入' : expenseGroup;
  const currentGroupObj = CATEGORIES[activeGroupKey] || {};
  const mainCategories = Object.keys(currentGroupObj);
  const subCategories = currentGroupObj[selectedMainCategory] || [];

  return (
    <form onSubmit={handleSubmit} className="expense-form modern-form">
      <h1 className="expense-form-title">{initialData ? 'EDIT ENTRY' : 'NEW ENTRY'}</h1>

      {/* 1. 支出 / 収入（下線タブ）[cite: 1] */}
      <div className="underline-tabs">
        <button
          type="button"
          onClick={() => handleTransactionTypeChange('expense')}
          className={`underline-tab-btn ${transactionType === 'expense' ? 'active' : ''}`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => handleTransactionTypeChange('income')}
          className={`underline-tab-btn ${transactionType === 'income' ? 'active' : ''}`}
        >
          収入
        </button>
      </div>

      {/* 2. 金額入力（右寄せ・シンプル）[cite: 1] */}
      <div className="form-row amount-row">
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
          className="amount-input-modern"
        />
      </div>

      {/* 3. 支出のとき：固定費と変動費（ピル型・丸い枠の選択肢） */}
      {transactionType === 'expense' && (
        <div className="pill-group-container">
          {['変動費', '固定費'].map((group) => (
            <button
              type="button"
              key={group}
              onClick={() => handleExpenseGroupChange(group)}
              className={`pill-btn ${expenseGroup === group ? 'active' : ''}`}
            >
              {group}
            </button>
          ))}
        </div>
      )}

      {/* 4. 大項目 */}
      <div className="form-section-title">大項目</div>
      <div className="chips-container">
        {mainCategories.map((main) => (
          <button
            type="button"
            key={main}
            onClick={() => handleMainCategoryChange(main)}
            className={`chip-btn ${selectedMainCategory === main ? 'active' : ''}`}
          >
            {main}
          </button>
        ))}
      </div>

      {/* 5. 中項目 */}
      <div className="form-section-title">中項目</div>
      <div className="chips-container">
        {subCategories.map((sub) => (
          <button
            type="button"
            key={sub}
            onClick={() => setSelectedSubCategory(sub)}
            className={`chip-btn ${selectedSubCategory === sub ? 'active' : ''}`}
          >
            {sub}
          </button>
        ))}
      </div>

{/* その他が選ばれたときの自由入力 */}
      {selectedSubCategory === 'その他' && (
        <div className="list-group" style={{ marginTop: '0px', marginBottom: '12px' }}>
          <div className="list-item">
            <span className="list-label">具体的な内容</span>
            <input 
              type="text"
              value={customSubCategory}
              onChange={(e) => setCustomSubCategory(e.target.value)}
              placeholder="内容を入力"
              required
              className="list-value-input"
              style={{ textAlign: 'right' }}
            />
          </div>
        </div>
      )}

      {/* リスト形式の各項目（上下の線で区切る）[cite: 1] */}
      <div className="list-group">
        {/* 日付 */}
        <div className="list-item">
          <span className="list-label">日付</span>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="list-value-input"
          />
        </div>

        {/* 支出元 */}
        <div className="list-item">
          <span className="list-label">支出元</span>
          <select 
            value={paymentSource} 
            onChange={(e) => setPaymentSource(e.target.value)}
            className="list-value-select"
          >
            {PAYMENT_SOURCES.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        {/* メモ */}
        <div className="list-item">
          <span className="list-label">メモ</span>
          <input 
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="任意"
            className="list-value-input"
          />
        </div>
      </div>

      {/* ステータス（ボタンをやめてシンプルなチェックボックスに変更） */}
      <div className="checkbox-row">
        <label className="checkbox-label">
          <input 
            type="checkbox"
            checked={isPending}
            onChange={(e) => setIsPending(e.target.checked)}
            className="custom-checkbox"
          />
          <span>未整理（あとで確認する）として保存する</span>
        </label>
      </div>

      <button type="submit" className="submit-btn-modern">
        {initialData ? '更新して確定する' : '保存'}
      </button>
    </form>
  );
}