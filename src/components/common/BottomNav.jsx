// src/components/BottomNav.jsx
import React from 'react';
import './BottomNav.css';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      <button 
        type="button"
        onClick={() => setActiveTab('input')}
        className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
      >
        <span>✍️</span>
        <span>新規入力</span>
      </button>

      <button 
        type="button"
        onClick={() => setActiveTab('history')}
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
      >
        <span>📜</span>
        <span>履歴</span>
      </button>

      <button 
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
      >
        <span>🏠</span>
        <span>ダッシュボード</span>
      </button>
    </nav>
  );
}