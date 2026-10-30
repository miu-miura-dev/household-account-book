// src/components/BottomNav.jsx
import React from 'react';
import './BottomNav.css';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      {/* 1. 入力 */}
      <button 
        type="button"
        onClick={() => setActiveTab('input')}
        className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
      >
        <img src="/BottonNav/001_ExpenseForm.png" alt="入力" className="nav-icon" />
        <span>入力</span>
      </button>

      {/* 2. 履歴 */}
      <button 
        type="button"
        onClick={() => setActiveTab('history')}
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
      >
        <img src="/BottonNav/002_ExpenseHistory.png" alt="履歴" className="nav-icon" />
        <span>履歴</span>
      </button>

      {/* 3. 予算残高 */}
      <button 
        type="button"
        onClick={() => setActiveTab('budgetStatus')}
        className={`nav-item ${activeTab === 'budgetStatus' ? 'active' : ''}`}
      >
        <img src="/BottonNav/003_BudgetStatus.png" alt="予算残高" className="nav-icon" />
        <span>予算残高</span>
      </button>

      {/* 4. 資産一覧 */}
      <button 
        type="button"
        onClick={() => setActiveTab('assetOverview')}
        className={`nav-item ${activeTab === 'assetOverview' ? 'active' : ''}`}
      >
        <img src="/BottonNav/004_AssetOverview.png" alt="資産一覧" className="nav-icon" />
        <span>資産一覧</span>
      </button>

      {/* 5. 月間収支 */}
      <button 
        type="button"
        onClick={() => setActiveTab('monthlySummary')}
        className={`nav-item ${activeTab === 'monthlySummary' ? 'active' : ''}`}
      >
        <img src="/BottonNav/005_MonthlySummary.png" alt="月間収支" className="nav-icon" />
        <span>月間収支</span>
      </button>

      {/* 6. ローン管理 */}
      <button 
        type="button"
        onClick={() => setActiveTab('loanManagement')}
        className={`nav-item ${activeTab === 'loanManagement' ? 'active' : ''}`}
      >
        <img src="/BottonNav/006_LoanManagement.png" alt="ローン管理" className="nav-icon" />
        <span>ローン管理</span>
      </button>
    </nav>
  );
}