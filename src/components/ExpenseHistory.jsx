import React from 'react';

export default function ExpenseHistory({ expenses, onDelete }) {
  return (
    <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '1rem', margin: '0 0 10px 0', color: '#333' }}>最近の入力履歴</h2>
      {expenses.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center' }}>まだ記録がありません</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {expenses.slice(0, 10).map((item) => (
            <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.subCategory} <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'normal' }}>({item.mainCategory})</span></div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.date} / {item.paymentSource}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>¥{item.amount.toLocaleString()}</span>
                <button 
                  type="button"
                  onClick={() => onDelete(item.id)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}