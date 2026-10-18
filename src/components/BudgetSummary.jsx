import React, { useState } from 'react';
import { CATEGORIES } from '../constants/categories';
import './BudgetSummary.css';

export default function BudgetSummary({ expenses }) {
  const [viewMode, setViewMode] = useState('week');
  
  // ★ 予算設定画面の開閉ステート
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // ★ 大項目ごとの「1ヶ月（月単位）の予算」をステートで管理
  const [monthlyBudgets, setMonthlyBudgets] = useState({
    '食費': {
      total: 45000,
      sub: { '爆発': 5000, '食費': 30000, '外食費': 10000 }
    },
    '日用品': {
      total: 8000,
      sub: { '日用品': 8000 }
    },
    '交際費': {
      total: 10000,
      sub: { '交際費': 10000 }
    },
    '趣味・娯楽': {
      total: 10000,
      sub: { '娯楽費': 10000 }
    },
    '衣服・美容': {
      total: 10000,
      sub: { '衣服': 5000, '美容': 5000 }
    },
    'その他': {
      total: 11000,
      sub: { 'その他': 11000 }
    }
  });

  // 予算変更ハンドラー
  const handleBudgetChange = (mainCat, type, subCat = null, value = 0) => {
    const numVal = Number(value) || 0;
    setMonthlyBudgets(prev => {
      const updated = { ...prev };
      if (type === 'total') {
        updated[mainCat] = { ...updated[mainCat], total: numVal };
      } else if (type === 'sub') {
        updated[mainCat] = {
          ...updated[mainCat],
          sub: { ...updated[mainCat].sub, [subCat]: numVal }
        };
      }
      return updated;
    });
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const totalDaysInMonth = monthEnd.getDate();
  const currentDayNum = today.getDate();

  const getThisWeekRange = () => {
    const d = new Date(today);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    
    const weekStart = new Date(d.setDate(diffToMonday));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const effectiveStart = weekStart < monthStart ? monthStart : weekStart;
    const effectiveEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

    return { start: effectiveStart, end: effectiveEnd };
  };

  const weekRange = getThisWeekRange();
  const totalDaysInWeek = Math.round((weekRange.end - weekRange.start) / (1000 * 60 * 60 * 24)) + 1;
  const passedDaysInWeek = Math.min(Math.round((today - weekRange.start) / (1000 * 60 * 60 * 24)) + 1, totalDaysInWeek);

  const formatDate = (dateObj) => {
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[dateObj.getDay()];
    
    return `${month}/${day}(${weekday})`;
  };

  const getDateRangeLabel = (mode) => {
    if (mode === 'day') return `${formatDate(today)}`;
    if (mode === 'week') return `${formatDate(weekRange.start)} 〜 ${formatDate(weekRange.end)}`;
    return `${formatDate(monthStart)} 〜 ${formatDate(monthEnd)}`;
  };

  const getMultiplier = (mode) => {
    switch (mode) {
      case 'day': return 1 / totalDaysInMonth;
      case 'week': return totalDaysInWeek / totalDaysInMonth;
      case 'month':
      default: return 1;
    }
  };

  const multiplier = getMultiplier(viewMode);

  // 全体の合計月予算・支出
  const totalMonthlyBudget = Object.values(monthlyBudgets).reduce((sum, item) => sum + item.total, 0);
  const totalBudget = Math.round(totalMonthlyBudget * multiplier);
  
  const totalSpentRaw = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  const getPeriodSpent = (rawAmount, mode) => {
    if (mode === 'day') return Math.round(rawAmount / totalDaysInMonth);
    if (mode === 'week') return Math.round(rawAmount * (totalDaysInWeek / totalDaysInMonth));
    return rawAmount;
  };

  const totalSpent = getPeriodSpent(totalSpentRaw, viewMode);
  const totalDiff = totalBudget - totalSpent;

  // 全体カード用の進捗率計算
  const totalSpentPercentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;
  
  let totalTargetBudget = totalBudget;
  if (viewMode === 'week') {
    totalTargetBudget = Math.round(totalBudget * (passedDaysInWeek / totalDaysInWeek));
  } else if (viewMode === 'month') {
    totalTargetBudget = Math.round(totalBudget * (currentDayNum / totalDaysInMonth));
  }
  const totalMarkerPercentage = totalBudget > 0 ? Math.min(Math.round((totalTargetBudget / totalBudget) * 100), 100) : 0;
  const isTotalOver = totalSpent > totalTargetBudget;

  return (
    <div className="budget-summary-container">
      {/* ヘッダー ＆ 設定ボタン */}
      <div className="budget-header">
        <h2 className="budget-title">予算ダッシュボード</h2>
        <div className="budget-header-right">
          <button 
            type="button" 
            onClick={() => setIsEditingConfig(!isEditingConfig)}
            className={`config-toggle-btn ${isEditingConfig ? 'active' : ''}`}
          >
            {isEditingConfig ? '設定完了' : '⚙️ 予算設定'}
          </button>
        </div>
      </div>

      {/* 予算設定パネル */}
      {isEditingConfig && (
        <div className="budget-config-panel">
          <h3 className="budget-config-title">月間予算の編集（大項目・中項目）</h3>
          {Object.keys(CATEGORIES).map((mainCat) => {
            const currentTotal = monthlyBudgets[mainCat]?.total || 0;
            const subList = CATEGORIES[mainCat] || [];

            return (
              <div key={mainCat} className="config-item-box">
                <div className="config-main-row">
                  <strong>{mainCat} 合計:</strong>
                  <div>
                    <input 
                      type="number" 
                      value={currentTotal} 
                      onChange={(e) => handleBudgetChange(mainCat, 'total', null, e.target.value)}
                      className="config-input-total"
                    />円
                  </div>
                </div>
                {/* 中項目ごとの予算入力 */}
                <div className="config-sub-list">
                  {subList.map((subCat) => {
                    const subVal = monthlyBudgets[mainCat]?.sub?.[subCat] || 0;
                    return (
                      <div key={subCat} className="config-sub-item">
                        <span>{subCat}:</span>
                        <div>
                          <input 
                            type="number" 
                            value={subVal}
                            onChange={(e) => handleBudgetChange(mainCat, 'sub', subCat, e.target.value)}
                            className="config-input-sub"
                          />円
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 期間切り替えタブ */}
      <div className="view-mode-tabs">
        <button type="button" className={`tab-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>1日</button>
        <button type="button" className={`tab-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>週ごと</button>
        <button type="button" className={`tab-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>月単位</button>
      </div>

      {/* 全体カード */}
      <div className={`budget-overview-card ${totalDiff < 0 ? 'over' : ''}`}>
        <div className="budget-overview-label">
          {getDateRangeLabel(viewMode)}
        </div>
        <div className="budget-overview-value">
          {totalDiff < 0 ? '＋ ' : '- '}¥{Math.abs(totalDiff).toLocaleString()} 
        </div>
        <div className="budget-overview-sub" style={{ marginBottom: '10px' }}>
          予算 ¥{totalBudget.toLocaleString()} / 実際の支出 ¥{totalSpent.toLocaleString()}
        </div>

        {/* 全体のプログレスバー ＆ 目安マーカー */}
        <div className="progress-bar-bg">
          <div 
            className={`progress-bar-fill ${isTotalOver ? 'over' : ''}`}
            style={{ width: `${totalSpentPercentage}%` }}
          ></div>
          <div 
            className="pace-marker"
            style={{ left: `${totalMarkerPercentage}%` }}
            title={`目安ライン: ¥${totalTargetBudget.toLocaleString()}`}
          ></div>
        </div>
      </div>

      {/* 大項目ごとの予算進捗 ＆ ペース可視化 */}
      <div className="category-budget-list">
        {Object.keys(CATEGORIES).map((mainCategory) => {
          const catConfig = monthlyBudgets[mainCategory] || { total: 10000, sub: {} };
          const baseMonthlyBudget = catConfig.total;
          const budget = Math.round(baseMonthlyBudget * multiplier);

          const mainCategoryExpenses = expenses.filter(
            (item) => (item.category || item.mainCategory) === mainCategory
          );

          const spentRaw = mainCategoryExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
          const spent = getPeriodSpent(spentRaw, viewMode);

          let targetBudget = budget;
          if (viewMode === 'day') {
            targetBudget = Math.round(budget);
          } else if (viewMode === 'week') {
            targetBudget = Math.round(budget * (passedDaysInWeek / totalDaysInWeek));
          } else if (viewMode === 'month') {
            targetBudget = Math.round(budget * (currentDayNum / totalDaysInMonth));
          }

          const diffFromTarget = targetBudget - spent;
          const isOverTarget = spent > targetBudget;

          const spentPercentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
          const markerPercentage = budget > 0 ? Math.min(Math.round((targetBudget / budget) * 100), 100) : 0;

          const subCategoryList = CATEGORIES[mainCategory] || [];
          const subCategoryTotals = subCategoryList.reduce((acc, subName) => {
            acc[subName] = 0;
            return acc;
          }, {});

          mainCategoryExpenses.forEach((item) => {
            const sub = item.sub_category || item.subCategory;
            if (sub in subCategoryTotals) {
              subCategoryTotals[sub] += Number(item.amount || 0);
            } else if (sub) {
              subCategoryTotals[sub] = (subCategoryTotals[sub] || 0) + Number(item.amount || 0);
            }
          });

          // ★ 中項目が2個以上ある場合のみリスト対象にする
          const subCategoryEntries = Object.entries(subCategoryTotals);
          const hasMultipleSubCategories = subCategoryEntries.length >= 2;

          return (
            <div key={mainCategory} className="category-budget-item">
              {/* 1段目: 項目名 と 金額/予算 */}
              <div className="category-info-row">
                <span className="category-name">{mainCategory}</span>
                <span className="category-amounts">
                  <strong className={isOverTarget ? 'text-over' : 'text-safe'}>¥{spent.toLocaleString()}</strong> 
                  <span className="budget-total-text"> / 予算 ¥{budget.toLocaleString()}</span>
                </span>
              </div>

              {/* 2段目: プログレスバー ＆ 目安マーカー */}
              <div className="progress-bar-bg">
                <div 
                  className={`progress-bar-fill ${isOverTarget ? 'over' : ''}`}
                  style={{ width: `${spentPercentage}%` }}
                ></div>
                <div 
                  className="pace-marker"
                  style={{ left: `${markerPercentage}%` }}
                  title={`目安ライン: ¥${targetBudget.toLocaleString()}`}
                ></div>
              </div>

              {/* 3段目: ペース情報 と 節約・超過バッジ */}
              <div className="category-pace-row">
                <span className="pace-label">
                  {viewMode === 'week' ? `${passedDaysInWeek}日目ペース (目安: ¥${targetBudget.toLocaleString()})` : 
                   viewMode === 'month' ? `${currentDayNum}日目ペース (目安: ¥${targetBudget.toLocaleString()})` : '1日予算'}
                </span>
                <span className={`pace-status ${isOverTarget ? 'over' : 'safe'}`}>
                  {isOverTarget ? `⚠️ 超過 (-¥${Math.abs(diffFromTarget).toLocaleString()})` : `✨ 節約中 (+¥${diffFromTarget.toLocaleString()})`}
                </span>
              </div>

              {/* 4段目: 中項目が2個以上ある場合のみバー付き内訳を表示 */}
              {hasMultipleSubCategories && (
                <div className="sub-category-bar-list">
                  {subCategoryEntries.map(([subName, subAmount]) => {
                    const adjustedSubAmount = getPeriodSpent(subAmount, viewMode);
                    const subPercentage = spent > 0 ? Math.min(Math.round((adjustedSubAmount / spent) * 100), 100) : 0;

                    return (
                      <div key={subName} className="sub-category-bar-item">
                        <div className="sub-category-info">
                          {/* 「・」を削除しました */}
                          <span>{subName}</span>
                          <span className="sub-category-amount">¥{adjustedSubAmount.toLocaleString()}</span>
                        </div>
                        <div className="sub-progress-bar-bg">
                          <div className="sub-progress-bar-fill" style={{ width: `${subPercentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}  
            </div>
          );
        })}
      </div>
    </div>
  );
}