import React from 'react';
import './ExpenseHistory.css';

export default function ExpenseHistory({ expenses, onDelete }) {
  if (!expenses || expenses.length === 0) {
    return <p className="expense-history-empty">まだ記録がありません</p>;
  }

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
                      {/* 中項目と支出元を1行で表示 */}
                      <div className="expense-history-main-row">
                        <span className="expense-history-category-main">
                          {subCategory}
                        </span>
                        <span className="expense-history-payment">
                          {paymentSource}
                        </span>
                      </div>

                      {/* メモがある場合のみ、その下の行にグレー小文字で表示 */}
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
                      
                      <button 
                        type="button"
                        onClick={() => onDelete(item.id)}
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
    </div>
  );
}