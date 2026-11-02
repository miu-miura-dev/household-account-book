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
      { id: 'carry_yucho', label: 'ゆうちょ銀行', keyName: 'payment_source' },
      { id: 'carry_cash', label: '現金', keyName: 'payment_source' },
      { id: 'carry_paypay', label: 'PayPay', keyName: 'payment_source' },
      { id: 'carry_suica', label: 'Suica', keyName: 'payment_source' },
      { id: 'carry_marutoku', label: 'まるとく', keyName: 'payment_source' },
    ]
  },
  {
    id: 'income',
    title: '収入',
    colorClass: 'sec-income',
    groups: [
      {
        groupTitle: '給与関連',
        items: [
          { id: 'inc_salary_base', label: '給与', main: '収入', sub: '給与' },
          { id: 'inc_salary_transport', label: '給与：交通費', main: '収入', sub: '給与：交通費' },
          { id: 'inc_salary_marutoku', label: '給与：まるとく', main: '収入', sub: '給与：まるとく' },
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
          { id: 'exp_rent', label: '家賃', main: '住宅', sub: '家賃' },
          { id: 'exp_water', label: '水道代', main: '水道・光熱費', sub: '水道代' },
          { id: 'exp_gas', label: 'ガス代', main: '水道・光熱費', sub: 'ガス代' },
          { id: 'exp_electric', label: '電気代', main: '水道・光熱費', sub: '電気代' },
          { id: 'exp_mobile_rakuten', label: '携帯_楽天', main: '通信費', sub: '携帯_楽天' },
          { id: 'exp_mobile_aham', label: '携帯_aham', main: '通信費', sub: '携帯_aham' },
          { id: 'exp_transport', label: '交通費', main: '交通費', sub: '交通費' },
          { id: 'exp_insurance', label: '生命保険', main: '保険', sub: '生命保険' },
          { id: 'exp_subsc', label: 'サブスク', main: '通信費', sub: 'サブスク' },
          { id: 'exp_rakuten_cc', label: '楽天クレカ', main: '現金・カード', sub: '返済：クレカ' },
          { id: 'exp_paypay_cc', label: 'PayPayクレカ', main: '現金・カード', sub: '返済：PayPay' },
          { id: 'exp_lc', label: 'LC', main: '現金・カード', sub: 'LC：利息' },
        ]
      },
      {
        groupTitle: '変動費',
        items: [
          { id: 'exp_food', label: '食費', main: '食費', sub: '食費' },
          { id: 'exp_eatout', label: '外食費', main: '食費', sub: '外食費' },
          { id: 'exp_bakufu', label: '爆発', main: '食費', sub: '爆発' },
          { id: 'exp_daily', label: '日用品', main: '日用品', sub: '日用品' },
          { id: 'exp_social', label: '交際費', main: '交際費', sub: '交際費' },
          { id: 'exp_play', label: '娯楽費', main: '娯楽費', sub: '娯楽費' },
          { id: 'exp_beauty', label: '美容', main: '美容・衣服', sub: '美容' },
          { id: 'exp_clothes', label: '衣服', main: '美容・衣服', sub: '衣服' },
          { id: 'exp_hospital', label: '病院代', main: '医療費', sub: '病院代' },
          { id: 'exp_medicine', label: '薬代', main: '医療費', sub: '薬代' },
          { id: 'exp_business', label: '副業経費', main: '特別な支出', sub: '副業経費' },
          { id: 'exp_fee', label: '手数料', main: '現金・カード', sub: '手数料' },
          { id: 'exp_other_etc', label: 'その他', main: 'その他', sub: 'その他' },
          { id: 'exp_sbf_marutoku', label: 'まるとく', main: '食費', sub: 'まるとく' },
          { id: 'exp_suica_train', label: 'Suica交通費', main: '交通費', sub: '電車' },
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
      { id: 'cf_rakuten', label: '楽天銀行', keyName: 'payment_source' },
      { id: 'cf_smbc', label: '三井住友銀行', keyName: 'payment_source' },
      { id: 'cf_yucho', label: 'ゆうちょ銀行', keyName: 'payment_source' },
      { id: 'cf_cash', label: '現金', keyName: 'payment_source' },
      { id: 'cf_paypay', label: 'PayPay', keyName: 'payment_source' },
      { id: 'cf_suica', label: 'Suica', keyName: 'payment_source' },
      { id: 'cf_marutoku', label: 'まるとく', keyName: 'payment_source' },
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
    'income_給与関連': true,
    'income_その他収入': true,
    'expense_固定費': true,
    'expense_変動費': true,
    'expense_その他支出': true,
  });

  const [customIncomeItems, setCustomIncomeItems] = useState(() => {
    const saved = localStorage.getItem('kakeibo_custom_income_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [customExpenseItems, setCustomExpenseItems] = useState(() => {
    const saved = localStorage.getItem('kakeibo_custom_expense_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [newIncomeLabel, setNewIncomeLabel] = useState('');
  const [newIncomeSub, setNewIncomeSub] = useState('');

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newExpenseLabel, setNewExpenseLabel] = useState('');
  const [newExpenseSub, setNewExpenseSub] = useState('');

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
    const cleanVal = value.replace(/,/g, '');
    const updated = {
      ...plannedBudgets,
      [id]: cleanVal === '' ? '' : Number(cleanVal) || 0
    };
    setPlannedBudgets(updated);
    localStorage.setItem(`kakeibo_planned_${selectedMonth}`, JSON.stringify(updated));
  };

  const handleSaveDefaultSettings = (newDefaults) => {
    setDefaultPlanned(newDefaults);
    localStorage.setItem('kakeibo_default_monthly_planned', JSON.stringify(newDefaults));
    setIsSettingOpen(false);
  };

  const handleAddCustomIncome = (e) => {
    e.preventDefault();
    if (!newIncomeLabel.trim()) return;

    const uniqueId = `custom_inc_${Date.now()}`;
    const newItem = {
      id: uniqueId,
      label: newIncomeLabel.trim(),
      main: '収入',
      sub: newIncomeSub.trim() || newIncomeLabel.trim()
    };

    const updatedList = [...customIncomeItems, newItem];
    setCustomIncomeItems(updatedList);
    localStorage.setItem('kakeibo_custom_income_items', JSON.stringify(updatedList));

    setNewIncomeLabel('');
    setNewIncomeSub('');
    setIsAddIncomeModalOpen(false);
  };

  const handleDeleteCustomIncome = (id) => {
    const updatedList = customIncomeItems.filter(item => item.id !== id);
    setCustomIncomeItems(updatedList);
    localStorage.setItem('kakeibo_custom_income_items', JSON.stringify(updatedList));
  };

  const handleAddCustomExpense = (e) => {
    e.preventDefault();
    if (!newExpenseLabel.trim()) return;

    const uniqueId = `custom_exp_${Date.now()}`;
    const newItem = {
      id: uniqueId,
      label: newExpenseLabel.trim(),
      main: '',
      sub: newExpenseSub.trim() || newExpenseLabel.trim()
    };

    const updatedList = [...customExpenseItems, newItem];
    setCustomExpenseItems(updatedList);
    localStorage.setItem('kakeibo_custom_expense_items', JSON.stringify(updatedList));

    setNewExpenseLabel('');
    setNewExpenseSub('');
    setIsAddExpenseModalOpen(false);
  };

  const handleDeleteCustomExpense = (id) => {
    const updatedList = customExpenseItems.filter(item => item.id !== id);
    setCustomExpenseItems(updatedList);
    localStorage.setItem('kakeibo_custom_expense_items', JSON.stringify(updatedList));
  };

  const getActualAmount = (item) => {
    return (expenses || []).reduce((sum, record) => {
      const recordMonth = record.date ? record.date.slice(0, 7).replace('/', '-') : '';
      const isExcluded = record.is_excluded || record.isExcluded;
      const isTransfer = record.is_transfer || record.isTransfer;

      if (recordMonth === selectedMonth && !isExcluded && !isTransfer) {
        if (item.keyName === 'payment_source') {
          if (record.payment_source === item.label || record.paymentSource === item.label) {
            return sum + Number(record.amount || 0);
          }
        } else {
          const subCat = record.sub_category || record.subCategory || '';
          const mainCat = record.category || '';
          if (subCat === item.sub || (item.main && mainCat === item.main && subCat.includes(item.sub)) || subCat.includes(item.label)) {
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
      planned += (Number(plannedBudgets[item.id]) || 0);
      actual += getActualAmount(item);
    };
    if (sectionObj.items) sectionObj.items.forEach(accumulateItem);
    if (sectionObj.groups) {
      sectionObj.groups.forEach(g => g.items.forEach(accumulateItem));
    }
    if (sectionObj.id === 'income') {
      customIncomeItems.forEach(accumulateItem);
    }
    if (sectionObj.id === 'expense') {
      customExpenseItems.forEach(accumulateItem);
    }
    return { planned, actual };
  };

  const calcGroupTotal = (groupObj, itemsList = null) => {
    const items = itemsList || (groupObj ? groupObj.items : []);
    const planned = items.reduce((s, i) => s + (Number(plannedBudgets[i.id]) || 0), 0);
    const actual = items.reduce((s, i) => s + getActualAmount(i), 0);
    return { planned, actual };
  };

  const carryoverTotal = calcSectionTotal(SUMMARY_SECTIONS.find(s => s.id === 'carryover'));
  const incomeSectionObj = SUMMARY_SECTIONS.find(s => s.id === 'income');
  const incomeTotal = calcSectionTotal(incomeSectionObj);

  const salaryGroupItems = incomeSectionObj.groups[0].items;
  const salaryTotalPlanned = salaryGroupItems.reduce((s, i) => s + (Number(plannedBudgets[i.id]) || 0), 0);
  const salaryTotalActual = salaryGroupItems.reduce((s, i) => s + getActualAmount(i), 0);

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
                    ¥{secTotal.planned.toLocaleString()} / ¥{secTotal.actual.toLocaleString()}
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
                    const rawVal = plannedBudgets[item.id];
                    const displayVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal).toLocaleString() : '';
                    const actualVal = getActualAmount(item);

                    return (
                      <div key={item.id} className="item-row">
                        <span className="item-label-text">{item.label}</span>
                        <div className="input-cell-box">
                          <span>¥</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={displayVal}
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
                            <span className="group-sub-total">
                              ¥{groupTotal.planned.toLocaleString()} / ¥{groupTotal.actual.toLocaleString()}
                            </span>
                            <span className={`arrow-icon small ${isGroupOpen ? 'open' : ''}`}>▼</span>
                          </div>
                        </div>

                        {isGroupOpen && group.items.map(item => {
                          const rawVal = plannedBudgets[item.id];
                          const displayVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal).toLocaleString() : '';
                          const actualVal = getActualAmount(item);

                          return (
                            <div key={item.id} className="item-row indented">
                              <span className="item-label-text">{item.label}</span>
                              <div className="input-cell-box">
                                <span>¥</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={displayVal}
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

                  {/* ── 給与合計 ── */}
                  {sec.id === 'income' && (
                    <div className="salary-total-banner-row">
                      <span className="salary-total-label">💼 給与合計</span>
                      <span className="salary-total-vals">
                        予定: ¥{salaryTotalPlanned.toLocaleString()} / 実績: <strong>¥{salaryTotalActual.toLocaleString()}</strong>
                      </span>
                    </div>
                  )}

                  {/* ── その他収入 ── */}
                  {sec.id === 'income' && (() => {
                    const customGroupKey = 'income_その他収入';
                    const isCustomOpen = openGroups[customGroupKey] !== false;
                    const customGroupTotal = calcGroupTotal(null, customIncomeItems);

                    return (
                      <div className="group-wrapper custom-income-group">
                        <div className="group-header" onClick={() => toggleGroup(customGroupKey)}>
                          <div className="group-title-left">
                            <span className="sub-badge-icon">📂</span>
                            <span className="group-title-text">その他収入</span>
                          </div>
                          <div className="group-header-right">
                            <span className="group-sub-total">
                              ¥{customGroupTotal.planned.toLocaleString()} / ¥{customGroupTotal.actual.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              className="add-custom-item-inline-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddIncomeModalOpen(true);
                              }}
                              title="その他収入項目を追加"
                            >
                              ＋ 追加
                            </button>
                            <span className={`arrow-icon small ${isCustomOpen ? 'open' : ''}`}>▼</span>
                          </div>
                        </div>

                        {isCustomOpen && (
                          <>
                            {customIncomeItems.length === 0 ? (
                              <div className="no-custom-items-msg" onClick={() => setIsAddIncomeModalOpen(true)}>
                                ＋ タップしてその他収入項目を追加
                              </div>
                            ) : (
                              customIncomeItems.map(item => {
                                const rawVal = plannedBudgets[item.id];
                                const displayVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal).toLocaleString() : '';
                                const actualVal = getActualAmount(item);

                                return (
                                  <div key={item.id} className="item-row indented custom-row-item">
                                    <div className="custom-label-with-delete">
                                      <span className="item-label-text">{item.label}</span>
                                      <button 
                                        type="button" 
                                        className="delete-custom-item-btn"
                                        onClick={() => handleDeleteCustomIncome(item.id)}
                                        title="項目を削除"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="input-cell-box">
                                      <span>¥</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={displayVal}
                                        placeholder="0"
                                        onChange={(e) => handlePlannedChange(item.id, e.target.value)}
                                      />
                                    </div>
                                    <span className="actual-val-text">¥{actualVal.toLocaleString()}</span>
                                  </div>
                                );
                              })
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── その他支出 ── */}
                  {sec.id === 'expense' && (() => {
                    const customExpGroupKey = 'expense_その他支出';
                    const isCustomExpOpen = openGroups[customExpGroupKey] !== false;
                    const customExpGroupTotal = calcGroupTotal(null, customExpenseItems);

                    return (
                      <div className="group-wrapper custom-expense-group">
                        <div className="group-header" onClick={() => toggleGroup(customExpGroupKey)}>
                          <div className="group-title-left">
                            <span className="sub-badge-icon">📂</span>
                            <span className="group-title-text">その他支出</span>
                          </div>
                          <div className="group-header-right">
                            <span className="group-sub-total">
                              ¥{customExpGroupTotal.planned.toLocaleString()} / ¥{customExpGroupTotal.actual.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              className="add-custom-item-inline-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddExpenseModalOpen(true);
                              }}
                              title="その他支出項目を追加"
                            >
                              ＋ 追加
                            </button>
                            <span className={`arrow-icon small ${isCustomExpOpen ? 'open' : ''}`}>▼</span>
                          </div>
                        </div>

                        {isCustomExpOpen && (
                          <>
                            {customExpenseItems.length === 0 ? (
                              <div className="no-custom-items-msg" onClick={() => setIsAddExpenseModalOpen(true)}>
                                ＋ タップしてその他支出項目を追加
                              </div>
                            ) : (
                              customExpenseItems.map(item => {
                                const rawVal = plannedBudgets[item.id];
                                const displayVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal).toLocaleString() : '';
                                const actualVal = getActualAmount(item);

                                return (
                                  <div key={item.id} className="item-row indented custom-row-item">
                                    <div className="custom-label-with-delete">
                                      <span className="item-label-text">{item.label}</span>
                                      <button 
                                        type="button" 
                                        className="delete-custom-item-btn"
                                        onClick={() => handleDeleteCustomExpense(item.id)}
                                        title="項目を削除"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="input-cell-box">
                                      <span>¥</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={displayVal}
                                        placeholder="0"
                                        onChange={(e) => handlePlannedChange(item.id, e.target.value)}
                                      />
                                    </div>
                                    <span className="actual-val-text">¥{actualVal.toLocaleString()}</span>
                                  </div>
                                );
                              })
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
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
          customIncomeItems={customIncomeItems}
          customExpenseItems={customExpenseItems}
          onSave={handleSaveDefaultSettings}
          onClose={() => setIsSettingOpen(false)}
        />
      )}

      {/* ── その他収入 追加モーダル ── */}
      {isAddIncomeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddIncomeModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>＋ その他収入項目の追加</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddIncomeModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddCustomIncome}>
              <div className="modal-form-body">
                <label className="modal-field-label">
                  項目名（表示名）
                  <input
                    type="text"
                    value={newIncomeLabel}
                    onChange={(e) => setNewIncomeLabel(e.target.value)}
                    placeholder="例: 副業収入、メルカリ売上 など"
                    required
                    className="modal-text-input"
                  />
                </label>
                <label className="modal-field-label">
                  集計対象の中項目（任意）
                  <input
                    type="text"
                    value={newIncomeSub}
                    onChange={(e) => setNewIncomeSub(e.target.value)}
                    placeholder="未入力の場合は項目名と同じ中項目を集計"
                    className="modal-text-input"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">追加する</button>
                <button type="button" className="cancel-btn" onClick={() => setIsAddIncomeModalOpen(false)}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── その他支出 追加モーダル ── */}
      {isAddExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddExpenseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>＋ その他支出項目の追加</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddExpenseModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddCustomExpense}>
              <div className="modal-form-body">
                <label className="modal-field-label">
                  項目名（表示名）
                  <input
                    type="text"
                    value={newExpenseLabel}
                    onChange={(e) => setNewExpenseLabel(e.target.value)}
                    placeholder="例: 特別の出費、交際費予備 など"
                    required
                    className="modal-text-input"
                  />
                </label>
                <label className="modal-field-label">
                  集計対象の中項目（任意）
                  <input
                    type="text"
                    value={newExpenseSub}
                    onChange={(e) => setNewExpenseSub(e.target.value)}
                    placeholder="未入力の場合は項目名と同じ中項目を集計"
                    className="modal-text-input"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">追加する</button>
                <button type="button" className="cancel-btn" onClick={() => setIsAddExpenseModalOpen(false)}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DefaultSettingsModal({ initialDefaults, customIncomeItems, customExpenseItems, onSave, onClose }) {
  const [modalValues, setModalValues] = useState(initialDefaults);

  const handleChange = (id, val) => {
    const cleanVal = val.replace(/,/g, '');
    setModalValues(prev => ({ ...prev, [id]: cleanVal === '' ? '' : Number(cleanVal) || 0 }));
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

  customIncomeItems.forEach(i => {
    allModalItems.push({ ...i, section: '収入 / その他収入' });
  });

  customExpenseItems.forEach(i => {
    allModalItems.push({ ...i, section: '支出 / その他支出' });
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
            {allModalItems.map((item) => {
              const rawVal = modalValues[item.id];
              const displayVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal).toLocaleString() : '';

              return (
                <div key={item.id} className="modal-item-row">
                  <span className="modal-item-label">
                    <small>[{item.section}]</small> {item.label}
                  </span>
                  <div className="modal-input-wrap">
                    <span>¥</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={displayVal}
                      placeholder="0"
                      onChange={(e) => handleChange(item.id, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
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