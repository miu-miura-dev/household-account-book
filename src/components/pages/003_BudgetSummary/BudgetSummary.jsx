import React, { useState } from 'react';
import { CATEGORIES } from "../../../constants/categories";
import './BudgetSummary.css';

export default function BudgetSummary({ expenses = [] }) {
  // ----------------------------------------------------
  // 1. ステート（状態管理）
  // ----------------------------------------------------
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month'
  const [isCarryOver, setIsCarryOver] = useState(true); // true: 繰り越しあり, false: 繰り越しなし
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // 月間基本予算
  const [monthlyBudgets, setMonthlyBudgets] = useState({
    '食費': { total: 45000, sub: { '食費': 30000, '外食費': 10000, '爆発': 5000 } },
    '日用品': { total: 8000, sub: { '日用品': 8000 } },
    '交際費': { total: 10000, sub: { '交際費': 10000 } },
    '趣味・娯楽': { total: 10000, sub: { '娯楽費': 10000 } },
    '衣服・美容': { total: 10000, sub: { '衣服': 5000, '美容': 5000 } },
    'その他': { total: 11000, sub: { 'その他': 11000 } }
  });

  // ----------------------------------------------------
  // 2. 日付・期間計算の処理
  // ----------------------------------------------------
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const totalDaysInMonth = monthEnd.getDate();
  const currentDayNum = today.getDate();

  // 今週（月曜〜日曜）の範囲
  const getThisWeekRange = () => {
    const d = new Date(today);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    
    const weekStart = new Date(d.setDate(diffToMonday));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { start: weekStart, end: weekEnd };
  };

  const weekRange = getThisWeekRange();
  const totalDaysInWeek = 7;
  const passedDaysInWeek = Math.min(
    Math.floor((today - weekRange.start) / (1000 * 60 * 60 * 24)) + 1, 
    totalDaysInWeek
  );

  // カレンダー用配列 (月曜始まり)
  const firstDayOfWeek = monthStart.getDay();
  const startingEmptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarCells = [];
  for (let i = 0; i < startingEmptyDays; i++) {
    calendarCells.push(null);
  }
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    calendarCells.push(dayNum);
  }

  // ----------------------------------------------------
  // 3. 実際の支出データ（expenses）の期間別フィルタリング
  // ----------------------------------------------------
  const isDateInPeriod = (dateStr, mode) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    
    if (mode === 'day') {
      return (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth &&
        itemDate.getDate() === currentDayNum
      );
    } else if (mode === 'week') {
      return itemDate >= weekRange.start && itemDate <= weekRange.end;
    } else if (mode === 'month') {
      return (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      );
    }
    return false;
  };

  const filteredExpenses = expenses.filter(item => isDateInPeriod(item.date, viewMode));

  // ----------------------------------------------------
  // 4. 予算・ペースト・差額の計算ロジック
  // ----------------------------------------------------
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

  const formatDate = (dateObj) => {
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${month}/${day}(${weekdays[dateObj.getDay()]})`;
  };

  const totalMonthlyBudget = Object.values(monthlyBudgets).reduce((sum, item) => sum + item.total, 0);

  // 期間全体の予算（1期間まるごとの予算）
  let periodTotalBudget = totalMonthlyBudget;
  if (viewMode === 'day') {
    periodTotalBudget = Math.round(totalMonthlyBudget / totalDaysInMonth);
  } else if (viewMode === 'week') {
    periodTotalBudget = Math.round((totalMonthlyBudget / totalDaysInMonth) * totalDaysInWeek);
  }

  // 今日時点（経過日数）での理想の消化目標ペース額
  let targetPaceBudget = periodTotalBudget;
  if (viewMode === 'week') {
    targetPaceBudget = Math.round((periodTotalBudget / totalDaysInWeek) * passedDaysInWeek);
  } else if (viewMode === 'month') {
    targetPaceBudget = Math.round((totalMonthlyBudget / totalDaysInMonth) * currentDayNum);
  }

  // 実際の支出額
  const totalSpent = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 比較対象の決定（繰り越しありなら「期間全体の予算」、無しなら「今日時点の目標ペース」）
  const comparisonBudget = isCarryOver ? periodTotalBudget : targetPaceBudget;
  const balanceDiff = comparisonBudget - totalSpent; // ＋なら節約/残り、ーなら超過

  // プログレスバー計算
  const spentPercentage = comparisonBudget > 0 ? Math.min(Math.round((totalSpent / comparisonBudget) * 100), 100) : 0;
  const markerPercentage = periodTotalBudget > 0 ? Math.min(Math.round((targetPaceBudget / periodTotalBudget) * 100), 100) : 0;

  const isSelectedDate = (dayNumber) => {
    if (!dayNumber) return false;
    const targetDate = new Date(currentYear, currentMonth, dayNumber);
    if (viewMode === 'day') return dayNumber === currentDayNum;
    if (viewMode === 'week') return targetDate >= weekRange.start && targetDate <= weekRange.end;
    return true;
  };

  return (
    <div className="budget-summary-container">
      {/* A. ヘッダー ＆ 設定ボタン */}
      <div className="budget-header">
        <h2 className="budget-title">予算ダッシュボード</h2>
        <button 
          type="button" 
          onClick={() => setIsEditingConfig(!isEditingConfig)}
          className={`config-toggle-btn ${isEditingConfig ? 'active' : ''}`}
        >
          {isEditingConfig ? '設定完了' : '⚙️ 予算設定'}
        </button>
      </div>

      {/* B. 予算設定パネル */}
      {isEditingConfig && (
        <div className="budget-config-panel">
          <h3 className="budget-config-title">月間予算の編集</h3>
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

      {/* C. ミニカレンダー */}
      <div className="mini-calendar-section">
        <div className="mini-calendar-header">
          <span>📅 {currentYear}年 {currentMonth + 1}月</span>
        </div>
        <div className="mini-calendar-grid calendar-weekdays">
          <span className="weekday-label">月</span>
          <span className="weekday-label">火</span>
          <span className="weekday-label">水</span>
          <span className="weekday-label">木</span>
          <span className="weekday-label">金</span>
          <span className="weekday-label sat">土</span>
          <span className="weekday-label sun">日</span>
        </div>
        <div className="mini-calendar-grid">
          {calendarCells.map((dayNum, index) => {
            if (dayNum === null) {
              return <div key={`empty-${index}`} className="calendar-day-cell empty"></div>;
            }
            const active = isSelectedDate(dayNum);
            const isToday = dayNum === currentDayNum;
            return (
              <div 
                key={dayNum} 
                className={`calendar-day-cell ${active ? 'active-range' : ''} ${isToday ? 'is-today' : ''}`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* D. 期間切り替え ＆ 繰り越し切り替え */}
      <div className="control-bar">
        {/* 期間切り替えタブ */}
        <div className="view-mode-tabs">
          <button type="button" className={`tab-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>1日</button>
          <button type="button" className={`tab-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>週ごと</button>
          <button type="button" className={`tab-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>月単位</button>
        </div>

        {/* 繰り越し切り替えボタン (週・月モード時のみ表示) */}
        {viewMode !== 'day' && (
          <button 
            type="button" 
            className={`carry-toggle-btn ${isCarryOver ? 'active' : ''}`}
            onClick={() => setIsCarryOver(!isCarryOver)}
          >
            {isCarryOver ? '🔄 繰り越し：ON' : '⏹️ 繰り越し：OFF'}
          </button>
        )}
      </div>

      {/* E. メインサマリーカード */}
      <div className={`budget-overview-card ${balanceDiff < 0 ? 'over' : ''}`}>
        {/* 1. 補足ラベル（経過日数など） */}
        <div className="budget-overview-label">
          {viewMode === 'day' && `${formatDate(today)}`}
          {viewMode === 'week' && `今週の進捗（${passedDaysInWeek} / ${totalDaysInWeek}日目）`}
          {viewMode === 'month' && `今月の進捗（${currentDayNum} / ${totalDaysInMonth}日目）`}
        </div>

        {/* 2. メインの達成度金額 */}
        <div className={`budget-overview-value ${balanceDiff < 0 ? 'text-over' : 'text-safe'}`}>
          {balanceDiff >= 0 
            ? `${isCarryOver ? 'あと' : '✨ 今日時点で＋'} ¥ ${balanceDiff.toLocaleString()} ${isCarryOver ? '使えます' : '節約中'}`
            : `⚠️ ¥ ${Math.abs(balanceDiff).toLocaleString()} 超過`
          }
        </div>

        {/* 3. 内訳とペース比較 */}
        <div className="budget-overview-sub">
          {isCarryOver ? (
            <>全体予算 ¥{periodTotalBudget.toLocaleString()} / 使用額 ¥{totalSpent.toLocaleString()}</>
          ) : (
            <>今日時点の目標 ¥{targetPaceBudget.toLocaleString()} / 使用額 ¥{totalSpent.toLocaleString()}</>
          )}
        </div>

        {/* 4. プログレスバー ＆ ペースマーカー */}
        <div className="progress-bar-bg" style={{ marginTop: '10px' }}>
          <div 
            className={`progress-bar-fill ${balanceDiff < 0 ? 'over' : ''}`}
            style={{ width: `${spentPercentage}%` }}
          ></div>
          {isCarryOver && viewMode !== 'day' && (
            <div 
              className="pace-marker"
              style={{ left: `${markerPercentage}%` }}
              title={`今日時点の目標ライン: ¥${targetPaceBudget.toLocaleString()}`}
            ></div>
          )}
        </div>
      </div>

      {/* F. カテゴリ別リスト */}
      <div className="category-budget-list">
        {Object.keys(CATEGORIES).map((mainCategory) => {
          const catConfig = monthlyBudgets[mainCategory] || { total: 0, sub: {} };
          const baseMonthlyBudget = catConfig.total;

          // モード別予算
          let catTotalBudget = baseMonthlyBudget;
          if (viewMode === 'day') catTotalBudget = Math.round(baseMonthlyBudget / totalDaysInMonth);
          if (viewMode === 'week') catTotalBudget = Math.round((baseMonthlyBudget / totalDaysInMonth) * totalDaysInWeek);

          let catTargetPace = catTotalBudget;
          if (viewMode === 'week') catTargetPace = Math.round((catTotalBudget / totalDaysInWeek) * passedDaysInWeek);
          if (viewMode === 'month') catTargetPace = Math.round((baseMonthlyBudget / totalDaysInMonth) * currentDayNum);

          const mainCategoryExpenses = filteredExpenses.filter(
            (item) => (item.category || item.mainCategory) === mainCategory
          );
          const spent = mainCategoryExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

          const catCompareBudget = isCarryOver ? catTotalBudget : catTargetPace;
          const catDiff = catCompareBudget - spent;
          const isCatOver = catDiff < 0;

          const catSpentPercentage = catCompareBudget > 0 ? Math.min(Math.round((spent / catCompareBudget) * 100), 100) : 0;

          return (
            <div key={mainCategory} className="category-budget-item">
              <div className="category-info-row">
                <span className="category-name">{mainCategory}</span>
                <span className="category-amounts">
                  <strong className={isCatOver ? 'text-over' : 'text-safe'}>¥{spent.toLocaleString()}</strong> 
                  <span className="budget-total-text"> / {isCarryOver ? '予算' : '目標'} ¥{catCompareBudget.toLocaleString()}</span>
                </span>
              </div>

              <div className="progress-bar-bg">
                <div 
                  className={`progress-bar-fill ${isCatOver ? 'over' : ''}`}
                  style={{ width: `${catSpentPercentage}%` }}
                ></div>
              </div>

              <div className="category-pace-row">
                <span className="pace-label">
                  {isCarryOver ? `期間残り: ¥${(catTotalBudget - spent).toLocaleString()}` : `目標ペース: ¥${catTargetPace.toLocaleString()}`}
                </span>
                <span className={`pace-status ${isCatOver ? 'over' : 'safe'}`}>
                  {isCatOver ? `⚠️ 超過 (-¥${Math.abs(catDiff).toLocaleString()})` : `✨ 節約中 (+¥${catDiff.toLocaleString()})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}