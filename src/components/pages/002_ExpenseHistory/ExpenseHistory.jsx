import React, { useState } from 'react';
import { CATEGORIES, PAYMENT_SOURCES } from '../../../constants/categories';
import './ExpenseHistory.css';

export default function ExpenseHistory({ expenses, onDeleteExpense, onDelete, onUpdateExpense }) {
  // 編集中のアイテムを保持するステート（nullでなければ編集モーダルを開く）
  const [editingItem, setEditingItem] = useState(null);

  if (!expenses || expenses.length === 0) {
    return <p className="expense-history-empty">まだ記録がありません</p>;
  }

  // 実際の削除ハンドラー（どちらのプロップス名でも動くように配慮）
  const handleDelete = (id) => {
    const deleteFn = onDeleteExpense || onDelete;
    if (deleteFn) {
      deleteFn(id);
    }
  };

  // 編集内容の保存処理
  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (onUpdateExpense) {
      onUpdateExpense(editingItem);
    }
    setEditingItem(null); // モーダルを閉じる
  };

  // 1. 月の合計金額と楽天クレカの合計金額の計算
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const monthTotal = expenses.reduce((sum, item) => {
    if (item.date && item.date.startsWith(currentMonth)) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  const rakutenTotal = expenses.reduce((sum, item) => {
    const payment = item.payment_source || item.paymentSource || '';
    if (payment.includes('楽天')) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  // 2. 日付ごとにグループ化
  const groupedByDate = expenses.reduce((acc, item) => {
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

      {/* 日付ごとのグループ表示 */}
      {sortedDates.map((date) => {
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

                return (
                  <li key={item.id} className="expense-history-item">
                    <div className="expense-history-details">
                      <div className="expense-history-main-row">
                        <span className="expense-history-category-main">
                          {subCategory}
                        </span>
                        <span className="expense-history-payment">
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
                        ¥{Number(item.amount).toLocaleString()}
                      </span>
                      
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
      })}

      {/* ── 編集モーダル ── */}
      {editingItem && (
        <div className="expense-edit-modal-overlay">
          <div className="expense-edit-modal">
            <h3>EDIT EXPENSE</h3>
            <form onSubmit={handleUpdateSubmit} className="edit-form">
              <div className="form-group">
                <label>金額</label>
                <input 
                  type="number"
                  value={editingItem.amount}
                  onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>日付</label>
                <input 
                  type="date"
                  value={editingItem.date}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>中項目</label>
                <input 
                  type="text"
                  value={editingItem.sub_category || editingItem.subCategory || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, sub_category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>メモ</label>
                <input 
                  type="text"
                  value={editingItem.memo || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, memo: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">保存</button>
                <button type="button" onClick={() => setEditingItem(null)} className="cancel-btn">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}