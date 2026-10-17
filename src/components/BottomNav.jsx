// src/components/BottomNav.jsx
import React from 'react';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '60px',
      backgroundColor: '#fff',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      zIndex: 1000,
    }}>
      <button 
        onClick={() => setActiveTab('input')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '0.8rem',
          color: activeTab === 'input' ? '#2e7d32' : '#666',
          fontWeight: activeTab === 'input' ? 'bold' : 'normal',
          cursor: 'pointer'
        }}
      >
        ✍️ 新規入力
      </button>
      <button 
        onClick={() => setActiveTab('dashboard')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '0.8rem',
          color: activeTab === 'dashboard' ? '#2e7d32' : '#666',
          fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal',
          cursor: 'pointer'
        }}
      >
        🏠 ダッシュボード
      </button>
      <button 
        onClick={() => setActiveTab('history')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '0.8rem',
          color: activeTab === 'history' ? '#2e7d32' : '#666',
          fontWeight: activeTab === 'history' ? 'bold' : 'normal',
          cursor: 'pointer'
        }}
      >
        📜 履歴
      </button>
    </div>
  );
}