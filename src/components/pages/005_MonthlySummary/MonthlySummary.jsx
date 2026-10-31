import React, { useState, useEffect } from 'react';
import './MonthlySummary.css';

// 全項目のマスター定義
const SUMMARY_SECTIONS = [
  {
    id: 'carryover',
    title: '前月繰り越し',
    colorClass: 'sec-carryover',
    items: [
      { id: 'carry_rakuten', label: '楽天銀行', keyName: 'payment_source' },
      { id: 'carry_smbc', label: '三井住友銀行', keyName: 'payment_source' },
      { id: 'carry_cash', label: '現金', keyName: 'payment_source' },
    ]
  },
  {
    id: 'income',
    title: '収入',
    colorClass: 'sec-income',
    groups: [
      {
        groupTitle: '固定費',
        items: [
          { id: 'inc_salary', label: '給与', main: '収入', sub: '給与' },
        ]
      },
      {
        groupTitle: '変動費',
        items: [
          { id: 'inc_other', label: 'その他 収入', main: '収入', sub: 'その他' },
        ]
      }
    ]
  },
  {
    id: 'expense',
    title: '支出',
    colorClass: 'sec-expense',
    groups: [
      {
        groupTitle: '固定費',
        items: [
          { id: 'exp_beauty', label: '美容・衣服 美容', main: '美容・衣服', sub: '美容' },
          { id: 'exp_hospital', label: '医療費 病院代', main: '医療費', sub: '病院代' },
        ]
      },
      {
        groupTitle: '変動費',
        items: [
          { id: 'exp_daily', label: '日用品', main: '日用品', sub: '日用品' },
          { id: 'exp_social', label: '交際費', main: '交際費', sub: '交際費' },
          { id: 'exp_play', label: '娯楽費', main: '娯楽費', sub: '娯楽費' },
          { id: 'exp_clothes', label: '美容・衣服 衣服', main: '美容・衣服', sub: '衣服' },
        ]
      }
    ]
  },
  {
    id: 'borrow',
    title: '借入',
    colorClass: 'sec-borrow',
    items: [
      { id: 'borrow_main', label: '借入金' }
    ]
  },
  {
    id: 'savings',
    title: '預金',
    colorClass: 'sec-savings',
    items: [
      { id: 'savings_main', label: '預金・貯蓄' }
    ]
  },
  {
    id: 'carryforward',
    title: '繰り越し',
    colorClass: 'sec-carryforward',
    items: [
      { id: 'carryforward_main', label: '次月繰越調整' }
    ]
  }
];

export default function MonthlySummary({ expenses = [] }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  const [openSections, setOpenSections] = useState({
    carryover: true,
    income: true,
    expense: true,
    borrow: true,
    savings: true,
    carryforward: true,
  });

  const [openGroups, setOpenGroups] = useState({
    'income_固定費': true,
    'income_変動費': true,
    'expense_固定費': true,
    'expense_変動費': true,
  });

  const [defaultPlanned, setDefaultPlanned] = useState(() => {
    const saved = localStorage.getItem('kakeibo_default_monthly_planned');
    return saved ? JSON.parse(saved) : {};
  });

  const [plannedBudgets, setPlannedBudgets] = useState(() => {
    const saved = localStorage.getItem(`kakeibo_planned_${selectedMonth}`);
    if (saved) return JSON.parse(saved);
    return defaultPlanned;
  });

  const [isSettingOpen, setIsSettingOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`kakeibo_planned_${selectedMonth}`);
    if (saved) {
      setPlannedBudgets(JSON.parse(saved));
    } else {
      setPlannedBudgets(defaultPlanned);
    }
  }, [selectedMonth, defaultPlanned]);

  const handlePlannedChange = (id, value) => {
    const updated = {
      ...plannedBudgets,
      [id]: Number(value) || 0
    };
    setPlannedBudgets(updated);
    localStorage.setItem(`kakeibo_planned_${selectedMonth}`, JSON.stringify(updated));
  };

  const handleSaveDefaultSettings = (newDefaults) => {
    setDefaultPlanned(newDefaults);
    localStorage.setItem('kakeibo_default_monthly_planned', JSON.stringify(newDefaults));
    setIsSettingOpen(false);
  };

  const getActualAmount = (item) => {
    return (expenses || []).reduce((sum, record) => {
      const recordMonth = record.date ? record.date.slice(0, 7).replace('/', '-') : '';
      const isExcluded = record.is_excluded || record.isExcluded;

      if (recordMonth === selectedMonth && !isExcluded) {
        if (item.keyName === 'payment_source') {
          if (record.payment_source === item.label) {
            return sum + Number(record.amount || 0);
          }
        } else {
          const subCat = record.sub_category || record.subCategory || '';
          const mainCat = record.category || '';
          if (subCat === item.sub || (item.main && mainCat === item.main)) {
            return sum + Number(record.amount || 0);
          }
        }
      }
      return sum;
    }, 0);
  };

  const calcSectionTotal = (sectionObj) => {
    let planned = 0;
    let actual = 0;
    const accumulateItem = (item) => {
      planned += (plannedBudgets[item.id] || 0);
      actual += getActualAmount(item);
    };
    if (sectionObj.items) sectionObj.items.forEach(accumulateItem);
    if (sectionObj.groups) {
      sectionObj.groups.forEach(g => g.items.forEach(accumulateItem));
    }
    return { planned, actual };
  };

  const calcGroupTotal = (groupObj) => {
    const planned = groupObj.items.reduce((s, i) => s + (plannedBudgets[i.id] || 0), 0);
    const actual = groupObj.items.reduce((s, i) => s + getActualAmount(i), 0);
    return { planned, actual };
  };

  const carryoverTotal = calcSectionTotal(SUMMARY_SECTIONS.find(s => s.id === 'carryover'));
  const incomeTotal = calcSectionTotal(SUMMARY_SECTIONS.find(s => s.id === 'income'));
  const expenseTotal = calcSectionTotal(SUMMARY_SECTIONS.find(s => s.id === 'expense'));
  const borrowTotal = calcSectionTotal(SUMMARY_SECTIONS.find(s => s.id === 'borrow'));
  const savingsTotal = calcSectionTotal(SUMMARY_SECTIONS.find(s => s.id === 'savings'));

  const totalIncomePlanned = carryoverTotal.planned + incomeTotal.planned + borrowTotal.planned;
  const totalIncomeActual = carryoverTotal.actual + incomeTotal.actual + borrowTotal.actual;

  const netBalancePlanned = totalIncomePlanned - expenseTotal.planned;
  const netBalanceActual = totalIncomeActual - expenseTotal.actual;

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="monthly-summary-container">
      {/* ── 月変更ヘッダー ── */}
      <div className="top-nav-bar">
        <button className="month-nav-btn" onClick={() => {
          const d = new Date(selectedMonth + '-01');
          d.setMonth(d.getMonth() - 1);
          setSelectedMonth(d.toISOString().slice(0, 7));
        }}>&lt;</button>
        <div className="month-picker-wrapper">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-input-clean"
          />
        </div>
        <button className="month-nav-btn" onClick={() => {
          const d = new Date(selectedMonth + '-01');
          d.setMonth(d.getMonth() + 1);
          setSelectedMonth(d.toISOString().slice(0, 7));
        }}>&gt;</button>
        <button
          type="button"
          className="setting-open-pill-btn"
          onClick={() => setIsSettingOpen(true)}
        >
          ⚙️ 設定
        </button>
      </div>

      {/* ── サマリーカード ── */}
      <div className="summary-overview-box">
        <div className="overview-title-row">
          <span className="overview-icon">📊</span>
          <span className="overview-heading">今月の収支</span>
        </div>
        <div className="overview-cards-grid">
          <div className="ov-card">
            <span className="ov-card-title">収入合計</span>
            <div className="ov-row"><span>予定</span><span>¥{totalIncomePlanned.toLocaleString()}</span></div>
            <div className="ov-row"><span>実績</span><strong>¥{totalIncomeActual.toLocaleString()}</strong></div>
          </div>
          <div className="ov-card">
            <span className="ov-card-title">支出合計</span>
            <div className="ov-row"><span>予定</span><span>¥{expenseTotal.planned.toLocaleString()}</span></div>
            <div className="ov-row"><span>実績</span><strong className="text-expense">¥{expenseTotal.actual.toLocaleString()}</strong></div>
          </div>
          <div className="ov-card">
            <span className="ov-card-title">残高</span>
            <div className="ov-row"><span>予定</span><span>¥{netBalancePlanned.toLocaleString()}</span></div>
            <div className="ov-row"><span>実績</span><strong className={netBalanceActual < 0 ? 'text-minus' : 'text-plus'}>¥{netBalanceActual.toLocaleString()}</strong></div>
          </div>
        </div>
        <div className="net-balance-banner">
          <span className="banner-label">💼 今月の残高 (前月繰越+収入-支出)</span>
          <span className={`banner-val ${netBalanceActual < 0 ? 'text-minus' : 'text-plus'}`}>
            {netBalanceActual < 0 ? `-¥${Math.abs(netBalanceActual).toLocaleString()}` : `¥{netBalanceActual.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* ── アコーディオンセクション一覧 ── */}
      <div className="accordion-sections-stack">
        {SUMMARY_SECTIONS.map((sec) => {
          const secTotal = calcSectionTotal(sec);
          const isOpen = openSections[sec.id];

          return (
            <div key={sec.id} className={`accordion-section-card ${sec.colorClass}`}>
              <div className="sec-header" onClick={() => toggleSection(sec.id)}>
                <div className="sec-title-area">
                  <span className="sec-dot"></span>
                  <span className="sec-name">{sec.title}</span>
                </div>
                <div className="sec-header-right">
                  <span className="sec-total-amount">
                    {sec.id === 'expense' || sec.id === 'income' 
                      ? `¥${secTotal.planned.toLocaleString()} ¥${secTotal.actual.toLocaleString()}` 
                      : `¥${secTotal.actual.toLocaleString()}`}
                  </span>
                  <span className={`arrow-icon ${isOpen ? 'open' : ''}`}>▼</span>
                </div>
              </div>

              {isOpen && (
                <div className="sec-body">
                  <div className="table-col-labels">
                    <span>項目</span>
                    <span>予定金額</span>
                    <span>実績金額</span>
                  </div>

                  {sec.items && sec.items.map(item => {
                    const plannedVal = plannedBudgets[item.id] !== undefined ? plannedBudgets[item.id] : '';
                    const actualVal = getActualAmount(item);

                    return (
                      <div key={item.id} className="item-row">
                        <span className="item-label-text">{item.label}</span>
                        <div className="input-cell-box">
                          <span>¥</span>
                          <input
                            type="number"
                            value={plannedVal}
                            placeholder="0"
                            onChange={(e) => handlePlannedChange(item.id, e.target.value)}
                          />
                        </div>
                        <span className="actual-val-text">¥{actualVal.toLocaleString()}</span>
                      </div>
                    );
                  })}

                  {sec.groups && sec.groups.map(group => {
                    const groupKey = `${sec.id}_${group.groupTitle}`;
                    const isGroupOpen = openGroups[groupKey] !== false;
                    const groupTotal = calcGroupTotal(group);

                    return (
                      <div key={group.groupTitle} className="group-wrapper">
                        <div className="group-header" onClick={() => toggleGroup(groupKey)}>
                          <div className="group-title-left">
                            <span className="sub-badge-icon">🔒</span>
                            <span className="group-title-text">{group.groupTitle}</span>
                          </div>
                          <div className="group-header-right">
                            <span className="group-sub-total">¥{groupTotal.planned.toLocaleString()} ¥{groupTotal.actual.toLocaleString()}</span>
                            <span className={`arrow-icon small ${isGroupOpen ? 'open' : ''}`}>▼</span>
                          </div>
                        </div>

                        {isGroupOpen && group.items.map(item => {
                          const plannedVal = plannedBudgets[item.id] !== undefined ? plannedBudgets[item.id] : '';
                          const actualVal = getActualAmount(item);

                          return (
                            <div key={item.id} className="item-row indented">
                              <span className="item-label-text">{item.label}</span>
                              <div className="input-cell-box">
                                <span>¥</span>
                                <input
                                  type="number"
                                  value={plannedVal}
                                  placeholder="0"
                                  onChange={(e) => handlePlannedChange(item.id, e.target.value)}
                                />
                              </div>
                              <span className="actual-val-text">¥{actualVal.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 設定モーダル ── */}
      {isSettingOpen && (
        <DefaultSettingsModal
          initialDefaults={defaultPlanned}
          onSave={handleSaveDefaultSettings}
          onClose={() => setIsSettingOpen(false)}
        />
      )}
    </div>
  );
}

function DefaultSettingsModal({ initialDefaults, onSave, onClose }) {
  const [modalValues, setModalValues] = useState(initialDefaults);

  const handleChange = (id, val) => {
    setModalValues(prev => ({ ...prev, [id]: Number(val) || 0 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(modalValues);
  };

  const allModalItems = [];
  SUMMARY_SECTIONS.forEach(sec => {
    if (sec.items) sec.items.forEach(i => allModalItems.push({ ...i, section: sec.title }));
    if (sec.groups) {
      sec.groups.forEach(g => {
        g.items.forEach(i => allModalItems.push({ ...i, section: `${sec.title} / ${g.groupTitle}` }));
      });
    }
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ デフォルト予定金額の設定</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-items-list">
            {allModalItems.map((item) => (
              <div key={item.id} className="modal-item-row">
                <span className="modal-item-label">
                  <small>[{item.section}]</small> {item.label}
                </span>
                <div className="modal-input-wrap">
                  <span>¥</span>
                  <input
                    type="number"
                    value={modalValues[item.id] !== undefined ? modalValues[item.id] : ''}
                    placeholder="0"
                    onChange={(e) => handleChange(item.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="submit" className="save-btn">一括設定を保存</button>
            <button type="button" className="cancel-btn" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}