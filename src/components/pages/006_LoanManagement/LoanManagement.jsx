import React, { useState, useEffect } from 'react';
import './LoanManagement.css';

// 初期ローンマスター
const DEFAULT_LOANS = [
  {
    id: 'smbc_lc',
    name: '三井住友 LC',
    subCategoryKey: '三井住友',
    initialBalance: 844771,
    startMonth: '2026-09',
    monthlyRepayment: 14000,
    annualInterestRate: 9.9,
  },
  {
    id: 'scholarship',
    name: '奨学金',
    subCategoryKey: '奨学金',
    initialBalance: 4474630,
    startMonth: '2026-09',
    monthlyRepayment: 27965,
    annualInterestRate: 0.15,
  }
];

export default function LoanManagement({ expenses = [] }) {
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('kakeibo_loans_config');
    return saved ? JSON.parse(saved) : DEFAULT_LOANS;
  });

  const [activeTab, setActiveTab] = useState('all');

  // 表示する対象月リスト（12ヶ月分）
  const months = [
    '2026-09', '2026-10', '2026-11', '2026-12',
    '2027-01', '2027-02', '2027-03', '2027-04',
    '2027-05', '2027-06', '2027-07', '2027-08'
  ];

  useEffect(() => {
    localStorage.setItem('kakeibo_loans_config', JSON.stringify(loans));
  }, [loans]);

  // Supabaseの実績集計
  const getActualRepayment = (subCategoryKey, month) => {
    return (expenses || []).reduce((sum, item) => {
      const itemMonth = item.date ? item.date.slice(0, 7).replace('/', '-') : '';
      const isExcluded = item.is_excluded || item.isExcluded;

      const matchesCategory = 
        (item.sub_category && item.sub_category.includes(subCategoryKey)) ||
        (item.subCategory && item.subCategory.includes(subCategoryKey)) ||
        (item.category && item.category.includes(subCategoryKey));

      if (itemMonth === month && matchesCategory && !isExcluded) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  };

  const getMonthlyInterest = (balance, annualRate) => {
    if (!annualRate || annualRate <= 0) return 0;
    return Math.round((balance * (annualRate / 100)) / 12);
  };

  const getPlannedBalance = (loan, monthIndex) => {
    let currentBalance = loan.initialBalance;
    for (let i = 0; i <= monthIndex; i++) {
      if (i === 0) continue;
      const interest = getMonthlyInterest(currentBalance, loan.annualInterestRate);
      const principalPay = Math.max(loan.monthlyRepayment - interest, 0);
      currentBalance = Math.max(currentBalance - principalPay, 0);
    }
    return currentBalance;
  };

  const getTotalPlannedBalance = (monthIdx) => {
    return loans.reduce((sum, loan) => sum + getPlannedBalance(loan, monthIdx), 0);
  };

  const getTotalActualRepayment = (month) => {
    return loans.reduce((sum, loan) => sum + getActualRepayment(loan.subCategoryKey, month), 0);
  };

  const calcPayoffMonths = (loan) => {
    let bal = loan.initialBalance;
    let m = 0;
    while (bal > 0 && m < 360) {
      const interest = getMonthlyInterest(bal, loan.annualInterestRate);
      const principal = loan.monthlyRepayment - interest;
      if (principal <= 0) return '返済額不足';
      bal -= principal;
      m++;
    }
    return `${m}ヶ月 (${(m / 12).toFixed(1)}年)`;
  };

  // ページ側での設定変更ハンドラ
  const handleFieldChange = (loanId, field, value) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          [field]: field === 'name' || field === 'subCategoryKey' || field === 'startMonth' ? value : Number(value) || 0
        };
      }
      return l;
    }));
  };

  // 新規ローン追加
  const handleAddNewLoan = () => {
    const newId = `loan_${Date.now()}`;
    setLoans(prev => [
      ...prev,
      {
        id: newId,
        name: '新しい借入・ローン',
        subCategoryKey: '',
        initialBalance: 100000,
        startMonth: '2026-09',
        monthlyRepayment: 10000,
        annualInterestRate: 0.0,
      }
    ]);
    setActiveTab(newId); // 追加したタブに切り替え
  };

  // ローン削除
  const handleDeleteLoan = (loanId) => {
    if (window.confirm('この借入設定を削除しますか？')) {
      setLoans(prev => prev.filter(l => l.id !== loanId));
      setActiveTab('all');
    }
  };

  // 折れ線グラフ描画
  const renderLineChart = (dataArray, actualArray, maxVal) => {
    const chartWidth = months.length * 60;
    const chartHeight = 160;
    const padding = 24;

    const getY = (val) => {
      if (maxVal === 0) return padding;
      const ratio = val / maxVal;
      return padding + ratio * (chartHeight - padding * 2);
    };

    const points = dataArray.map((val, idx) => {
      const x = idx * 60 + 30;
      const y = getY(val);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="chart-svg-scroll">
        <svg width={chartWidth} height={chartHeight} className="svg-chart">
          <line x1="0" y1={padding} x2={chartWidth} y2={padding} stroke="#ef4444" strokeDasharray="4" strokeWidth="1" />
          <text x="5" y={padding - 4} fill="#ef4444" fontSize="10" fontWeight="bold">0円 (完済基準線)</text>

          <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} />

          {dataArray.map((val, idx) => {
            const x = idx * 60 + 30;
            const y = getY(val);
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                <text x={x} y={y - 8} fill="#1d4ed8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  -¥{(val / 10000).toFixed(0)}万
                </text>
                <text x={x} y={chartHeight - 4} fill="#64748b" fontSize="9" textAnchor="middle">
                  {months[idx].replace('-', '/')}
                </text>
              </g>
            );
          })}

          {actualArray && actualArray.map((actVal, idx) => {
            if (!actVal) return null;
            const x = idx * 60 + 30;
            return (
              <g key={`act-${idx}`}>
                <rect x={x - 14} y={chartHeight - 26} width="28" height="12" rx="3" fill="#10b981" />
                <text x={x} y={chartHeight - 17} fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">
                  ¥{(actVal / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const maxTotalPlanned = Math.max(...months.map((_, i) => getTotalPlannedBalance(i)), 100000);

  return (
    <div className="loan-management-container">
      <div className="top-header-area">
        <h2 className="page-title">💳 負債返済計画 ＆ 設定管理</h2>
        <button type="button" className="add-loan-btn" onClick={handleAddNewLoan}>
          ＋ 借入を追加
        </button>
      </div>

      {/* タブ切り替え（「全体」＋各ローン＋「⚙️ 設定・管理」） */}
      <div className="loan-tabs-row">
        <button className={`loan-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全体サマリー
        </button>
        {loans.map(loan => (
          <button key={loan.id} className={`loan-tab ${activeTab === loan.id ? 'active' : ''}`} onClick={() => setActiveTab(loan.id)}>
            {loan.name || '未設定'}
          </button>
        ))}
        <button className={`loan-tab settings-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ 借入条件の設定・編集
        </button>
      </div>

      {/* ── 【全体サマリー】 ── */}
      {activeTab === 'all' && (
        <div className="section-card">
          <h3 className="section-heading">📈 負債残高推移 (完済まで)</h3>
          {renderLineChart(
            months.map((_, i) => getTotalPlannedBalance(i)),
            months.map(m => getTotalActualRepayment(m)),
            maxTotalPlanned
          )}

          <h3 className="section-heading mt-4">📋 予定残高 vs Supabase実績返済額</h3>
          <div className="table-scroll-wrap">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>管理項目</th>
                  {months.map(m => <th key={m}>{m.replace('-', '/')}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="total-summary-row">
                  <td className="row-title">予定負債合計</td>
                  {months.map((_, i) => (
                    <td key={i} className="val-cell minus bold">
                      -¥{getTotalPlannedBalance(i).toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="row-title">実績返済額 (DB)</td>
                  {months.map(m => {
                    const act = getTotalActualRepayment(m);
                    return (
                      <td key={m} className="val-cell actual-highlight">
                        {act > 0 ? `¥${act.toLocaleString()}` : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 【設定・管理ページ（ページ側で一括管理）】 ── */}
      {activeTab === 'settings' && (
        <div className="section-card">
          <h3 className="section-heading">⚙️ 借入条件・初期設定の一括管理</h3>
          <p className="settings-desc">
            ここで変更した数値はリアルタイムにシミュレーションやグラフに反映されます。
          </p>

          <div className="settings-list">
            {loans.map((loan, index) => (
              <div key={loan.id} className="setting-card-item">
                <div className="setting-card-header">
                  <h4># {index + 1} 借入設定</h4>
                  <button type="button" className="delete-btn" onClick={() => handleDeleteLoan(loan.id)}>
                    🗑️ 削除
                  </button>
                </div>

                <div className="setting-grid">
                  <div className="form-group">
                    <label>ローン/借入名</label>
                    <input
                      type="text"
                      value={loan.name}
                      onChange={(e) => handleFieldChange(loan.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Supabaseの中項目(sub_category)</label>
                    <input
                      type="text"
                      value={loan.subCategoryKey}
                      placeholder="例: 奨学金 / 三井住友"
                      onChange={(e) => handleFieldChange(loan.id, 'subCategoryKey', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>借入初期金額 (円)</label>
                    <input
                      type="number"
                      value={loan.initialBalance}
                      onChange={(e) => handleFieldChange(loan.id, 'initialBalance', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>年利率 (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={loan.annualInterestRate}
                      onChange={(e) => handleFieldChange(loan.id, 'annualInterestRate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>毎月の予定返済額 (円)</label>
                    <input
                      type="number"
                      value={loan.monthlyRepayment}
                      onChange={(e) => handleFieldChange(loan.id, 'monthlyRepayment', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>返済開始月</label>
                    <input
                      type="text"
                      value={loan.startMonth}
                      placeholder="2026-09"
                      onChange={(e) => handleFieldChange(loan.id, 'startMonth', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 【個別ローン詳細】 ── */}
      {loans.map(loan => {
        if (activeTab !== loan.id) return null;

        const plannedArray = months.map((_, i) => getPlannedBalance(loan, i));
        const actualArray = months.map(m => getActualRepayment(loan.subCategoryKey, m));
        const maxLoanVal = Math.max(...plannedArray, 100000);

        return (
          <div key={loan.id} className="section-card">
            <div className="loan-detail-header">
              <div>
                <h3 className="section-heading">📊 {loan.name || '名称未設定'} 返済推移</h3>
                <span className="payoff-badge">完済まで: あと {calcPayoffMonths(loan)}</span>
              </div>
              <button type="button" className="jump-settings-btn" onClick={() => setActiveTab('settings')}>
                ⚙️ 条件を変更する
              </button>
            </div>

            {renderLineChart(plannedArray, actualArray, maxLoanVal)}

            <h3 className="section-heading mt-4">📋 返済シミュレーション＆実績データ</h3>
            <div className="table-scroll-wrap">
              <table className="loan-table">
                <thead>
                  <tr>
                    <th>項目</th>
                    {months.map(m => <th key={m}>{m.replace('-', '/')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-title">シミュレーション残高</td>
                    {months.map((_, i) => (
                      <td key={i} className="val-cell minus">
                        -¥{getPlannedBalance(loan, i).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="row-title">Supabase実績返済額</td>
                    {months.map(m => {
                      const act = getActualRepayment(loan.subCategoryKey, m);
                      return (
                        <td key={m} className="val-cell actual-highlight">
                          {act > 0 ? `¥${act.toLocaleString()}` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="row-title">予定毎月返済額</td>
                    {months.map(m => <td key={m} className="val-cell">¥{loan.monthlyRepayment.toLocaleString()}</td>)}
                  </tr>
                  <tr>
                    <td className="row-title">予定利息分 (年利 {loan.annualInterestRate}%)</td>
                    {months.map((_, i) => {
                      const bal = getPlannedBalance(loan, i);
                      const interest = getMonthlyInterest(bal, loan.annualInterestRate);
                      return <td key={i} className="val-cell interest">¥{interest.toLocaleString()}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}