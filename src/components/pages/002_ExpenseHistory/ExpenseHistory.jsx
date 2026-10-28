import React, { useState } from 'react';
import { CATEGORIES, PAYMENT_SOURCES } from '../../../constants/categories';
import ExpenseForm from '../001_ExpenseForm/ExpenseForm';
import './ExpenseHistory.css';

export default function ExpenseHistory({ expenses, onDeleteExpense, onDelete, onUpdateExpense, onAddExpense }) {
  // 編集中のアイテムを保持するステート（nullでなければボトムシートを開く）
  const [editingItem, setEditingItem] = useState(null);

  // 実際の削除ハンドラー
  const handleDelete = (id) => {
    const deleteFn = onDeleteExpense || onDelete;
    if (deleteFn) {
      deleteFn(id);
    }
  };

  // ── 集計除外（マイナス）のトグルハンドラー ──
  const handleToggleExclude = (item) => {
    if (!onUpdateExpense) return;
    const currentExcluded = Boolean(item.is_excluded || item.isExcluded);
    onUpdateExpense({
      ...item,
      is_excluded: !currentExcluded,
    });
  };

  // ── is_pending（未整理）の判定用ヘルパー関数 ──
  const isPendingItem = (item) => {
    const val = item.is_pending !== undefined ? item.is_pending : item.isPending;
    return val === true || val === 'true' || val === 1 || val === '1';
  };

  // 1. 未整理データ と 通常履歴データ に分ける
  const pendingItems = (expenses || []).filter(item => isPendingItem(item));
  const normalItems = (expenses || []).filter(item => !isPendingItem(item));

  // 2. 集計用の有効データ（除外されていない通常履歴のみ）
  const validExpenses = normalItems.filter(item => !(item.isExcluded || item.is_excluded));

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const monthTotal = validExpenses.reduce((sum, item) => {
    if (item.date && item.date.startsWith(currentMonth)) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  const rakutenTotal = validExpenses.reduce((sum, item) => {
    const payment = item.payment_source || item.paymentSource || '';
    if (payment.includes('楽天')) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  // 3. 通常履歴を日付ごとにグループ化
  const groupedByDate = normalItems.reduce((acc, item) => {
    const dateKey = item.date || '日付なし';
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="expense-history-container">
      
      {/* ── ① 未整理アイテムエリア（上部インボックス） ── */}
      {pendingItems.length > 0 && (
        <div className="pending-section-container" style={{ marginBottom: '24px' }}>
          <h3 className="pending-section-title">
            📌 未整理の仮保存アイテム ({pendingItems.length})
          </h3>
          <ul className="expense-history-list">
            {pendingItems.map((item) => {
              const subCategory = item.sub_category || item.subCategory || '未分類';
              const paymentSource = item.payment_source || item.paymentSource || '未設定';

              return (
                <li key={item.id} className="expense-history-item pending-item">
                  <div className="expense-history-details">
                    <div className="expense-history-main-row">
                      <span className="expense-history-category-main">
                        {subCategory}
                      </span>
                      <span className="pending-badge">
                        {paymentSource}
                      </span>
                    </div>
                    {item.memo && (
                      <div className="expense-history-memo">
                        {item.memo}
                      </div>
                    )}
                  </div>

                  <div className="expense-history-right">
                    <span className="expense-history-amount">
                      ¥{Number(item.amount || 0).toLocaleString()}
                    </span>
                    
                    {/* 編集ボタン（編集時は is_pending: false に変更して確定できるようにする） */}
                    <button 
                      type="button"
                      onClick={() => setEditingItem({ ...item, is_pending: false })} 
                      className="expense-history-edit-btn"
                      title="編集して確定する"
                    >
                      ✎
                    </button>

                    {/* 削除ボタン */}
                    <button 
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="expense-history-delete-btn"
                      title="削除"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* サマリー表示 */}
      <div className="expense-summary-header">
        <div className="expense-summary-item">
          <span className="expense-summary-label">今月の合計</span>
          <span className="expense-summary-value">¥{monthTotal.toLocaleString()}</span>
        </div>
        <div className="expense-summary-item">
          <span className="expense-summary-label">楽天クレカ合計</span>
          <span className="expense-summary-value">¥{rakutenTotal.toLocaleString()}</span>
        </div>
      </div>

      {(!expenses || expenses.length === 0) ? (
        <p className="expense-history-empty">まだ記録がありません</p>
      ) : (
        /* 日付ごとのグループ表示（通常履歴のみ） */
        sortedDates.map((date) => {
          const dayItems = groupedByDate[date];
          const dayTotal = dayItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

          return (
            <div key={date} className="expense-date-group">
              <div className="expense-date-heading">
                <span>{date}</span>
                <span className="expense-date-total"> ¥{dayTotal.toLocaleString()}</span>
              </div>
              
              <ul className="expense-history-list">
                {dayItems.map((item) => {
                  const subCategory = item.sub_category || item.subCategory;
                  const paymentSource = item.payment_source || item.paymentSource;
                  const isExcluded = Boolean(item.is_excluded || item.isExcluded);

                  return (
                    <li 
                      key={item.id} 
                      className={`expense-history-item ${isExcluded ? 'excluded-item' : ''}`}
                      style={isExcluded ? { opacity: 0.5, backgroundColor: '#f5f5f5' } : {}}
                    >
                      <div className="expense-history-details">
                        <div className="expense-history-main-row">
                          <span 
                            className="expense-history-category-main"
                            style={isExcluded ? { textDecoration: 'line-through' } : {}}
                          >
                            {subCategory}
                          </span>
                          <span className="expense-history-payment">
                            {paymentSource}
                          </span>
                          {isExcluded && (
                            <span style={{ fontSize: '11px', color: '#e74c3c', marginLeft: '6px', fontWeight: 'bold' }}>
                              [集計外]
                            </span>
                          )}
                        </div>
                        {item.memo && (
                          <div className="expense-history-memo">
                            {item.memo}
                          </div>
                        )}
                      </div>

                      <div className="expense-history-right">
                        <span 
                          className="expense-history-amount"
                          style={isExcluded ? { textDecoration: 'line-through' } : {}}
                        >
                          ¥{Number(item.amount).toLocaleString()}
                        </span>
                        
                        {/* 集計から除外（マイナス）トグルボタン */}
                        <button
                          type="button"
                          onClick={() => handleToggleExclude(item)}
                          className="expense-history-exclude-btn"
                          title={isExcluded ? "集計に含める" : "集計から除外する（マイナス）"}
                          style={{
                            border: '1px solid #ccc',
                            background: isExcluded ? '#e74c3c' : '#fff',
                            color: isExcluded ? '#fff' : '#666',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginRight: '4px'
                          }}
                        >
                          {isExcluded ? '＋含める' : 'ー除外'}
                        </button>

                        {/* 編集ボタン */}
                        <button 
                          type="button"
                          onClick={() => setEditingItem({ ...item })}
                          className="expense-history-edit-btn"
                          title="編集"
                        >
                          ✎
                        </button>

                        {/* 削除ボタン */}
                        <button 
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="expense-history-delete-btn"
                          title="削除"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}

      {/* ── ② 編集・詳細設定用ボトムシート（下から出てくるフォーム） ── */}
      {editingItem && (
        <div className="bottom-sheet-overlay" onClick={() => setEditingItem(null)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>EDIT EXPENSE</h3>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)} 
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}
              >
                ✕
              </button>
            </div>
            
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