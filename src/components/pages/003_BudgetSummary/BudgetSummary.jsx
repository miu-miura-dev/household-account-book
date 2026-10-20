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
  const [showCalendarSummary, setShowCalendarSummary] = useState(false); // カレンダー集計の表示ON/OFF

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

  // 1日あたりの平均予算
  const totalMonthlyBudget = Object.values(monthlyBudgets).reduce((sum, item) => sum + item.total, 0);
  const dailyBudget = Math.round(totalMonthlyBudget / totalDaysInMonth);
  const weeklyBudget = Math.round((totalMonthlyBudget / totalDaysInMonth) * 7);

  // 日付ごとの支出マップを生成
  const dailySpentMap = {};
  expenses.forEach(item => {
    if (!item.date) return;
    const d = new Date(item.date);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const day = d.getDate();
      dailySpentMap[day] = (dailySpentMap[day] || 0) + Number(item.amount || 0);
    }
  });

  // 月間支出合計
  const monthTotalSpent = Object.values(dailySpentMap).reduce((sum, val) => sum + val, 0);
  const monthTotalDiff = totalMonthlyBudget - monthTotalSpent;

  // カレンダーを週ごとの行に分割（週集計の計算用）
  const calendarRows = [];
  let currentRow = [];
  calendarCells.forEach((cell, idx) => {
    currentRow.push(cell);
    if (currentRow.length === 7 || idx === calendarCells.length - 1) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      calendarRows.push(currentRow);
      currentRow = [];
    }
  });

  // ----------------------------------------------------
  // 4. 予算・ペース・差額の計算ロジック
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

  let periodTotalBudget = totalMonthlyBudget;
  if (viewMode === 'day') {
    periodTotalBudget = dailyBudget;
  } else if (viewMode === 'week') {
    periodTotalBudget = Math.round((totalMonthlyBudget / totalDaysInMonth) * totalDaysInWeek);
  }

  let targetPaceBudget = periodTotalBudget;
  if (viewMode === 'week') {
    targetPaceBudget = Math.round((periodTotalBudget / totalDaysInWeek) * passedDaysInWeek);
  } else if (viewMode === 'month') {
    targetPaceBudget = Math.round((totalMonthlyBudget / totalDaysInMonth) * currentDayNum);
  }

  const totalSpent = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const comparisonBudget = isCarryOver ? periodTotalBudget : targetPaceBudget;
  const balanceDiff = comparisonBudget - totalSpent; 

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
        <div className="budget-header-spacer"></div>
        <h2 className="budget-title">DASHBOARD</h2>
        <button 
          type="button" 
          onClick={() => setIsEditingConfig(!isEditingConfig)}
          className={`config-toggle-btn ${isEditingConfig ? 'active' : ''}`}
        >
          <span>⚙️</span>
          <span>CONFIG</span>
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
          <div className="calendar-header-spacer"></div>
          <span className="calendar-header-title">📅 {currentYear}年 {currentMonth + 1}月</span>
          <button 
            type="button"
            className={`calendar-summary-toggle ${showCalendarSummary ? 'active' : ''}`}
            onClick={() => setShowCalendarSummary(!showCalendarSummary)}
          >
            {showCalendarSummary ? '集計 OFF' : '📊 集計 ON'}
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className={`mini-calendar-grid calendar-weekdays ${showCalendarSummary ? 'show-summary' : ''}`}>
          <span className="weekday-label">月</span>
          <span className="weekday-label">火</span>
          <span className="weekday-label">水</span>
          <span className="weekday-label">木</span>
          <span className="weekday-label">金</span>
          <span className="weekday-label sat">土</span>
          <span className="weekday-label sun">日</span>
          {showCalendarSummary && <span className="weekday-label summary-label">週計</span>}
        </div>

        {/* カレンダーグリッド */}
        <div className={`mini-calendar-grid ${showCalendarSummary ? 'show-summary' : ''}`}>
          {calendarRows.map((row, rowIndex) => {
            const weekSpent = row.reduce((sum, dayNum) => sum + (dayNum ? (dailySpentMap[dayNum] || 0) : 0), 0);
            const weekDiff = weeklyBudget - weekSpent;

            return (
              <React.Fragment key={`row-${rowIndex}`}>
                {row.map((dayNum, cellIndex) => {
                  if (dayNum === null) {
                    return <div key={`empty-${rowIndex}-${cellIndex}`} className="calendar-day-cell empty"></div>;
                  }

                  const active = isSelectedDate(dayNum);
                  const isToday = dayNum === currentDayNum;
                  const daySpent = dailySpentMap[dayNum] || 0;
                  const dayDiff = dailyBudget - daySpent;

                  return (
                    <div 
                      key={dayNum} 
                      className={`calendar-day-cell ${active ? 'active-range' : ''} ${isToday ? 'is-today' : ''}`}
                    >
                      <span className="cell-day-num">{dayNum}</span>
                      <span className="cell-spent-amount">
                        {daySpent > 0 ? daySpent.toLocaleString() : '-'}
                      </span>
                      <span className={`cell-diff-amount ${dayDiff < 0 ? 'over' : 'safe'}`}>
                        {dayDiff >= 0 ? `+${dayDiff.toLocaleString()}` : `-${Math.abs(dayDiff).toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}

                {/* 集計ON時の「週計」セル（¥を除去して省スペース化） */}
                {showCalendarSummary && (
                  <div className="calendar-day-cell week-summary-cell">
                    <span className="cell-day-num">TOT</span>
                    <span className="cell-spent-amount">{weekSpent.toLocaleString()}</span>
                    <span className={`cell-diff-amount ${weekDiff < 0 ? 'over' : 'safe'}`}>
                      {weekDiff >= 0 ? `+${weekDiff.toLocaleString()}` : `-${Math.abs(weekDiff).toLocaleString()}`}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 集計ON時の「月合計」エリア */}
        {showCalendarSummary && (
          <div className="calendar-month-summary-bar">
            <div className="month-summary-item">
              <span className="summary-title">今月の支出合計:</span>
              <strong className="summary-value">¥{monthTotalSpent.toLocaleString()}</strong>
            </div>
            <div className="month-summary-item">
              <span className="summary-title">月予算残り/差額:</span>
              <strong className={`summary-value ${monthTotalDiff < 0 ? 'text-over' : 'text-safe'}`}>
                {monthTotalDiff >= 0 ? `+¥${monthTotalDiff.toLocaleString()}` : `-¥${Math.abs(monthTotalDiff).toLocaleString()}`}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* D. コントロールバー */}
      <div className="control-bar">
        <div className="control-bar-spacer" />
        <div className="view-mode-tabs">
          <button type="button" className={`tab-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>DAY</button>
          <button type="button" className={`tab-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>WEEK</button>
          <button type="button" className={`tab-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>MONTH</button>
        </div>
        {viewMode !== 'day' ? (
          <button 
            type="button" 
            className={`carry-toggle-btn ${isCarryOver ? 'active' : ''}`}
            onClick={() => setIsCarryOver(!isCarryOver)}
          >
            <span>CARRY</span>
            <span>{isCarryOver ? 'ON' : 'OFF'}</span>
          </button>
        ) : (
          <div className="control-bar-spacer" />
        )}
      </div>

      {/* E. メインサマリーカード */}
      <div className={`budget-overview-card ${balanceDiff < 0 ? 'over' : ''}`}>
        <div className="budget-overview-label">
          {viewMode === 'day' && (
            `${String(currentMonth + 1).padStart(2, '0')}/${String(currentDayNum).padStart(2, '0')}`
          )}
          {viewMode === 'week' && (
            isCarryOver 
              ? `${String(weekRange.start.getMonth() + 1).padStart(2, '0')}/${String(weekRange.start.getDate()).padStart(2, '0')} - ${String(weekRange.end.getMonth() + 1).padStart(2, '0')}/${String(weekRange.end.getDate()).padStart(2, '0')}`
              : `${String(weekRange.start.getMonth() + 1).padStart(2, '0')}/${String(weekRange.start.getDate()).padStart(2, '0')} - ${String(currentMonth + 1).padStart(2, '0')}/${String(currentDayNum).padStart(2, '0')}`
          )}
          {viewMode === 'month' && (
            isCarryOver
              ? `${String(currentMonth + 1).padStart(2, '0')}/01 - ${String(currentMonth + 1).padStart(2, '0')}/${String(totalDaysInMonth).padStart(2, '0')}`
              : `${String(currentMonth + 1).padStart(2, '0')}/01 - ${String(currentMonth + 1).padStart(2, '0')}/${String(currentDayNum).padStart(2, '0')}`
          )}
        </div>

        <div className={`budget-overview-value ${balanceDiff < 0 ? 'text-over' : 'text-safe'}`}>
          {balanceDiff >= 0 
            ? `${isCarryOver ? 'あと' : '✨ 今日時点で＋'} ¥ ${balanceDiff.toLocaleString()} ${isCarryOver ? '使えます' : '節約中'}`
            : `⚠️ ¥ ${Math.abs(balanceDiff).toLocaleString()} 超過`
          }
        </div>

        <div className="budget-overview-sub">
          {isCarryOver ? (
            <>全体予算 ¥{periodTotalBudget.toLocaleString()} / 使用額 ¥{totalSpent.toLocaleString()}</>
          ) : (
            <>今日時点の目標 ¥{targetPaceBudget.toLocaleString()} / 使用額 ¥{totalSpent.toLocaleString()}</>
          )}
        </div>

        {/* 月全体の着地予測表示 */}
        {currentDayNum > 0 && currentDayNum < totalDaysInMonth && (
          <div className="forecast-banner">
            {(() => {
              const projectedTotalSpent = Math.round((monthTotalSpent / currentDayNum) * totalDaysInMonth);
              const projectedDiff = totalMonthlyBudget - projectedTotalSpent;
              const isProjectedOver = projectedDiff < 0;

              return (
                <span className={isProjectedOver ? 'forecast-over' : 'forecast-safe'}>
                  🔮 月末の着地予測: 
                  {isProjectedOver 
                    ? ` 約 ¥${Math.abs(projectedDiff).toLocaleString()} の超過ペース` 
                    : ` 約 ¥${projectedDiff.toLocaleString()} の節約ペース`}
                </span>
              );
            })()}
          </div>
        )}

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

      {/* F. カテゴリ別リスト ＆ 着地予測 */}
      <div className="category-budget-list">
        {Object.keys(CATEGORIES).map((mainCategory) => {
          const catConfig = monthlyBudgets[mainCategory] || { total: 0, sub: {} };
          const baseMonthlyBudget = catConfig.total;

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

              {/* ★ カテゴリ別の着地予測（超過分＋順調項目の月換算） */}
              {currentDayNum > 0 && (
                <div className="category-forecast-row">
                  {(() => {
                    const projectedCatSpent = Math.round((spent / currentDayNum) * totalDaysInMonth);
                    const projectedCatDiff = baseMonthlyBudget - projectedCatSpent;
                    
                    if (isCatOver) {
                      return (
                        <span className="forecast-text over">
                          ⚠️ 月換算予測: 約 ¥{projectedCatSpent.toLocaleString()} (-¥{Math.abs(projectedCatDiff).toLocaleString()} 超過)
                        </span>
                      );
                    } else {
                      return (
                        <span className="forecast-text safe">
                          💡 月換算予測: 約 ¥{projectedCatSpent.toLocaleString()} (+¥{projectedCatDiff.toLocaleString()} 節約見込)
                        </span>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}