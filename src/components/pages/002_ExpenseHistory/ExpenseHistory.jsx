import React, { useState } from 'react';
import { CATEGORIES, PAYMENT_SOURCES } from '../../../constants/categories';
import ExpenseForm from '../001_ExpenseForm/ExpenseForm';
import './ExpenseHistory.css';

export default function ExpenseHistory({ expenses, onDeleteExpense, onDelete, onUpdateExpense, onAddExpense }) {
  const [editingItem, setEditingItem] = useState(null);

  const formatYearMonth = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/\//g, '-').slice(0, 7);
  };

  const handleDelete = (id) => {
    const deleteFn = onDeleteExpense || onDelete;
    if (deleteFn) deleteFn(id);
  };

  const handleToggleExclude = (item) => {
    if (!onUpdateExpense) return;
    const currentExcluded = Boolean(item.is_excluded || item.isExcluded);
    onUpdateExpense({ ...item, is_excluded: !currentExcluded });
  };

  const handleConfirmPending = (item) => {
    if (!onUpdateExpense) return;
    onUpdateExpense({ ...item, is_pending: false });
  };

  const isPendingItem = (item) => {
    const val = item.is_pending !== undefined ? item.is_pending : item.isPending;
    return val === true || val === 'true' || val === '1' || val === 1;
  };

  const pendingItems = (expenses || []).filter(item => isPendingItem(item));
  const normalItems = (expenses || []).filter(item => !isPendingItem(item));

  // ── ① 当月（YYYY-MM）を確実に取得 ──
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 2. 登録されているデータから存在する「年月」を抽出
  const rawMonths = (expenses || []).map(item => formatYearMonth(item.date)).filter(Boolean);
  
  // 3. データ内の月 ＋ 「当月」を必ずセットにして重複を排除・降順ソート
  const availableMonths = Array.from(new Set([...rawMonths, currentYearMonth])).sort().reverse();

  // 4. 初期値・選択中の月のステート（データがなくても必ず当月が選択される）
  const [selectedYearMonth, setSelectedYearMonth] = useState(currentYearMonth);

  // 選択中の月がリストにない場合のフォールバック
  if (!availableMonths.includes(selectedYearMonth)) {
    setSelectedYearMonth(currentYearMonth);
  }

  const handlePrevMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedYearMonth);
    if (currentIndex < availableMonths.length - 1) {
      setSelectedYearMonth(availableMonths[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedYearMonth);
    if (currentIndex > 0) {
      setSelectedYearMonth(availableMonths[currentIndex - 1]);
    }
  };

  const filteredNormalItems = normalItems.filter(item => {
    if (!item.date) return false;
    return formatYearMonth(item.date) === selectedYearMonth;
  });

  const validExpenses = filteredNormalItems.filter(item => !(item.isExcluded || item.is_excluded));
  const monthTotal = validExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const rakutenTotal = validExpenses.reduce((sum, item) => {
    const payment = item.payment_source || item.paymentSource || '';
    if (payment.includes('楽天')) return sum + Number(item.amount || 0);
    return sum;
  }, 0);

  const groupedByDate = filteredNormalItems.reduce((acc, item) => {
    const dateKey = item.date || '日付なし';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-')));

  const selectedYear = selectedYearMonth ? selectedYearMonth.split('-')[0] : '';
  const selectedMonthNum = selectedYearMonth ? Number(selectedYearMonth.split('-')[1]) : '';

  return (
    <div className="expense-history-container">
      
      {/* ── ① 未整理エリア ── */}
      {pendingItems.length > 0 && (
        <div className="pending-section-box">
          <div className="pending-header-title">
            📌 未整理アイテム <span className="pending-count-badge">{pendingItems.length}</span>
          </div>
          <div className="pending-list-wrapper">
            {pendingItems.map((item) => {
              const subCategory = item.sub_category || item.subCategory || '未分類';
              const paymentSource = item.payment_source || item.paymentSource || '未設定';
              const itemDate = item.date || '';

              return (
                <div key={item.id} className="pending-card-row">
                  <div className="pending-card-info">
                    <div className="pending-top-meta">
                      {itemDate && <span className="pending-date-tag">{itemDate}</span>}
                      <span className="pending-payment-tag">{paymentSource}</span>
                    </div>
                    <div className="pending-category-name">{subCategory}</div>
                    {item.memo && <div className="pending-memo-text">{item.memo}</div>}
                  </div>

                  <div className="pending-card-right">
                    <span className="pending-amount-text">
                      ¥{Number(item.amount || 0).toLocaleString()}
                    </span>
                    <div className="action-buttons-group">
                      <button 
                        type="button"
                        onClick={() => handleConfirmPending(item)} 
                        className="expense-action-btn confirm-btn"
                        title="確認して確定"
                      >
                        〇
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingItem({ ...item, is_pending: false })} 
                        className="expense-action-btn"
                        title="編集"
                      >
                        ✎
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="expense-action-btn delete-btn"
                        title="削除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ② 年月選択バー（＜ YYYY年MM月 ＞） ── */}
      <div className="month-selector-bar">
        <button 
          type="button" 
          onClick={handlePrevMonth}
          className="month-arrow-btn"
          disabled={availableMonths.indexOf(selectedYearMonth) >= availableMonths.length - 1}
        >
          ＜
        </button>
        
        <div className="month-display-wrapper">
          <select 
            value={selectedYearMonth} 
            onChange={(e) => setSelectedYearMonth(e.target.value)}
            className="month-selector-select"
          >
            {availableMonths.map((ym) => {
              const [y, m] = ym.split('-');
              return (
                <option key={ym} value={ym}>
                  {y}年 {Number(m)}月
                </option>
              );
            })}
          </select>
        </div>

        <button 
          type="button" 
          onClick={handleNextMonth}
          className="month-arrow-btn"
          disabled={availableMonths.indexOf(selectedYearMonth) <= 0}
        >
          ＞
        </button>
      </div>

      {/* ── ③ サマリー表示 ── */}
      <div className="expense-summary-header">
        <div className="expense-summary-item">
          <span className="expense-summary-label">
            {selectedYear}年{selectedMonthNum}月 合計
          </span>
          <span className="expense-summary-value highlight">¥{monthTotal.toLocaleString()}</span>
        </div>
        <div className="expense-summary-item">
          <span className="expense-summary-label">楽天クレカ合計</span>
          <span className="expense-summary-value">¥{rakutenTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* ── ④ 通常履歴リスト ── */}
      {(!expenses || expenses.length === 0) ? (
        <p className="expense-history-empty">まだ記録がありません</p>
      ) : filteredNormalItems.length === 0 ? (
        <p className="expense-history-empty">この月の記録はありません</p>
      ) : (
        sortedDates.map((date) => {
          const dayItems = groupedByDate[date];
          const dayTotal = dayItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

          return (
            <div key={date} className="expense-date-group">
              <div className="expense-date-heading">
                <span className="expense-date-title">{date}</span>
                <span className="expense-date-total">¥{dayTotal.toLocaleString()}</span>
              </div>
              
              <ul className="expense-history-list border-list">
                {dayItems.map((item) => {
                  const subCategory = item.sub_category || item.subCategory;
                  const paymentSource = item.payment_source || item.paymentSource;
                  const isExcluded = Boolean(item.is_excluded || item.isExcluded);

                  return (
                    <li 
                      key={item.id} 
                      className={`expense-history-item ${isExcluded ? 'excluded-item' : ''}`}
                    >
                      <div className="expense-history-details">
                        <div className="expense-history-main-row">
                          <span className={`expense-history-category-main ${isExcluded ? 'strike' : ''}`}>
                            {subCategory}
                          </span>
                          <span className="expense-history-payment">{paymentSource}</span>
                          {isExcluded && <span className="excluded-badge">[集計外]</span>}
                        </div>
                        {item.memo && <div className="expense-history-memo">{item.memo}</div>}
                      </div>

                      <div className="expense-history-right">
                        <span className={`expense-history-amount ${isExcluded ? 'strike' : ''}`}>
                          ¥{Number(item.amount).toLocaleString()}
                        </span>
                        
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            onClick={() => handleToggleExclude(item)}
                            className={`expense-action-btn ${isExcluded ? 'is-excluded' : ''}`}
                            title={isExcluded ? "集計に含める" : "集計から除外する"}
                          >
                            {isExcluded ? '＋' : 'ー'}
                          </button>

                          <button 
                            type="button"
                            onClick={() => setEditingItem({ ...item })}
                            className="expense-action-btn"
                            title="編集"
                          >
                            ✎
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="expense-action-btn delete-btn"
                            title="削除"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}

      {/* ── 編集ボトムシート ── */}
      {editingItem && (
        <div className="bottom-sheet-overlay" onClick={() => setEditingItem(null)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              onClick={() => setEditingItem(null)} 
              className="modal-close-icon"
              aria-label="閉じる"
            >
              ✕
            </button>
            <ExpenseForm 
              initialData={editingItem}
              isSpeedMode={false}
              onAddExpense={(updated) => {
                const finalizedData = {
                  ...updated,
                  id: editingItem.id,
                  is_pending: false,
                };

                if (onUpdateExpense) {
                  onUpdateExpense(finalizedData);
                } else if (onAddExpense) {
                  onAddExpense(finalizedData);
                }
                setEditingItem(null);
              }}
              onClose={() => setEditingItem(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}