import React from 'react';

export default function BudgetSummary({ 
  remainingBudget = 0, 
  weeklyBudget = 0, 
  totalSpentThisWeek = 0, 
  isCarryOver, 
  setIsCarryOver 
}) {
  return (
    <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
      <p style={{ margin: '0', fontSize: '0.85rem', color: '#666' }}>今週あと使える金額</p>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: (remainingBudget ?? 0) >= 0 ? '#2e7d32' : '#c62828', margin: '5px 0' }}>
        ¥{(remainingBudget ?? 0).toLocaleString()}
      </p>
      <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', justifyContent: 'space-around', marginTop: '8px' }}>
        <span>予算: ¥{(weeklyBudget ?? 0).toLocaleString()}</span>
        <span>今週使用: ¥{(totalSpentThisWeek ?? 0).toLocaleString()}</span>
      </div>
      
      {/* 繰り越し切替ボタン */}
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.8rem' }}>繰り越し:</span>
        <button 
          type="button"
          onClick={() => setIsCarryOver && setIsCarryOver(!isCarryOver)}
          style={{
            padding: '4px 12px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: isCarryOver ? '#1976d2' : '#e0e0e0',
            color: isCarryOver ? '#fff' : '#333',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          {isCarryOver ? 'ON（翌週に引き継ぐ）' : 'OFF（リセット）'}
        </button>
      </div>
    </div>
  );
}