import React, { useState } from 'react';
import './AssetOverview.css';

export default function AssetOverview({ expenses = [] }) {
  const paymentSources = [
    '楽天銀行',
    '三井住友銀行',
    '現金',
    '楽天カード',
    'PayPayカード',
    'PayPay',
    'まるとく',
    'Suica',
    'その他'
  ];

  const formatYearMonth = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/\//g, '-').slice(0, 7);
  };

  // 1. 当月を基準に「過去12か月分 (YYYY-MM)」のリストを生成
  const generatePast12Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(ym);
    }
    return months; // [当月, 1ヶ月前, 2ヶ月前, ... 11ヶ月前]
  };

  const past12Months = generatePast12Months(); // ドロップダウン用（新しい順）
  const past12MonthsAsc = [...past12Months].reverse(); // グラフ表示用（古い順 -> 新しい順）

  // 初期選択月（当月）
  const [selectedYearMonth, setSelectedYearMonth] = useState(past12Months[0]);

  // 月切り替えハンドラー
  const handlePrevMonth = () => {
    const currentIndex = past12Months.indexOf(selectedYearMonth);
    if (currentIndex < past12Months.length - 1) {
      setSelectedYearMonth(past12Months[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = past12Months.indexOf(selectedYearMonth);
    if (currentIndex > 0) {
      setSelectedYearMonth(past12Months[currentIndex - 1]);
    }
  };

  // アコーディオンの開閉状態
  const [openSources, setOpenSources] = useState(
    paymentSources.reduce((acc, source) => ({ ...acc, [source]: true }), {})
  );

  const toggleSource = (source) => {
    setOpenSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  // 2. 選択された年月に一致するデータのみにフィルタリング（除外・振替を除く）
  const filteredExpenses = (expenses || []).filter(item => {
    if (!item.date) return false;
    const isExcluded = Boolean(item.is_excluded || item.isExcluded);
    const isTransfer = Boolean(item.is_transfer || item.isTransfer);
    return formatYearMonth(item.date) === selectedYearMonth && !isExcluded && !isTransfer;
  });

  // 3. 支出元ごとの集計（選択月用）
  const sourceDataMap = paymentSources.reduce((acc, source) => {
    const matchedExpenses = filteredExpenses.filter(
      item => (item.payment_source || item.paymentSource) === source
    );

    const dateMap = {};
    matchedExpenses.forEach(item => {
      const dateKey = item.date || '未設定日付';
      const amount = Number(item.amount || 0);
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          details: []
        };
      }
      dateMap[dateKey].totalAmount += amount;
      dateMap[dateKey].details.push(item);
    });

    const aggregatedList = Object.values(dateMap).sort((a, b) => {
      const dateA = new Date((a.date || '').replace(/\//g, '-'));
      const dateB = new Date((b.date || '').replace(/\//g, '-'));
      return dateB - dateA;
    });

    const totalAmount = aggregatedList.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    acc[source] = {
      items: aggregatedList,
      total: totalAmount
    };
    return acc;
  }, {});

  const grandTotal = Object.values(sourceDataMap).reduce(
    (sum, data) => sum + data.total,
    0
  );

  // 4. 【過去12か月分】支出元ごとの月別集計マップを作成（データなしは0円）
  const monthlyTrendMap = {};
  paymentSources.forEach(source => {
    monthlyTrendMap[source] = {};
    past12Months.forEach(ym => {
      monthlyTrendMap[source][ym] = 0; // デフォルト0円
    });
  });

  (expenses || []).forEach(item => {
    if (!item.date) return;
    const isExcluded = Boolean(item.is_excluded || item.isExcluded);
    const isTransfer = Boolean(item.is_transfer || item.isTransfer);
    if (isExcluded || isTransfer) return;

    const ym = formatYearMonth(item.date);
    const source = item.payment_source || item.paymentSource;
    if (monthlyTrendMap[source] && monthlyTrendMap[source][ym] !== undefined) {
      monthlyTrendMap[source][ym] += Number(item.amount || 0);
    }
  });

  const selectedYear = selectedYearMonth ? selectedYearMonth.split('-')[0] : '';
  const selectedMonthNum = selectedYearMonth ? Number(selectedYearMonth.split('-')[1]) : '';

  return (
    <div className="asset-overview-container">
      <h2 className="page-title">🏦 支出元・口座別一覧</h2>

      {/* ── ① 月別切り替えバー（＜ YYYY年MM月 ＞） ── */}
      <div className="month-selector-bar">
        <button 
          type="button" 
          onClick={handlePrevMonth}
          className="month-arrow-btn"
          disabled={past12Months.indexOf(selectedYearMonth) >= past12Months.length - 1}
        >
          ＜
        </button>
        
        <div className="month-display-wrapper">
          <select 
            value={selectedYearMonth} 
            onChange={(e) => setSelectedYearMonth(e.target.value)}
            className="month-selector-select"
          >
            {past12Months.map((ym) => {
              const [y, m] = ym.split('-');
              return (
                <option key={ym} value={ym}>
                  {y}年 {Number(m)}月
                </option>
              );
            })}
          </select>
        </div>

        <button 
          type="button" 
          onClick={handleNextMonth}
          className="month-arrow-btn"
          disabled={past12Months.indexOf(selectedYearMonth) <= 0}
        >
          ＞
        </button>
      </div>

      {/* 総合計カード（選択月） */}
      <div className="grand-total-card">
        <span className="gt-label">{selectedYear}年{selectedMonthNum}月 支出元合計金額</span>
        <span className="gt-value">¥{grandTotal.toLocaleString()}</span>
      </div>

      {/* 支出元ごとのアコーディオンリスト */}
      <div className="sources-stack">
        {paymentSources.map(source => {
          const data = sourceDataMap[source];
          const isOpen = openSources[source];
          const trendData = monthlyTrendMap[source] || {};
          
          // グラフの最高額（スケール用）
          const maxTrendAmount = Math.max(...Object.values(trendData), 1);

          return (
            <div key={source} className="source-accordion-card">
              <div className="source-header" onClick={() => toggleSource(source)}>
                <div className="source-title-area">
                  <span className="source-dot"></span>
                  <span className="source-name">{source}</span>
                  <span className="item-count">({data.items.length}日分)</span>
                </div>
                <div className="source-header-right">
                  <span className="source-total">¥{data.total.toLocaleString()}</span>
                  <span className={`arrow-icon ${isOpen ? 'open' : ''}`}>▼</span>
                </div>
              </div>

              {isOpen && (
                <div className="source-body">
                  
                  {/* ── ② 過去12か月分 横スクロールグラフ ── */}
                  <div className="source-trend-chart-section">
                    <div className="chart-section-title">📊 過去12か月の推移 (横スクロール)</div>
                    
                    {/* 横スクロール対応のコンテナ */}
                    <div className="trend-scroll-wrapper">
                      <div className="trend-bars-container-12m">
                        {past12MonthsAsc.map(ym => {
                          const [y, m] = ym.split('-');
                          const amt = trendData[ym] || 0;
                          const barHeightPercent = Math.round((amt / maxTrendAmount) * 100);
                          const isSelected = ym === selectedYearMonth;

                          return (
                            <div 
                              key={ym} 
                              className={`trend-bar-col ${isSelected ? 'active-month' : ''}`}
                              onClick={() => setSelectedYearMonth(ym)}
                              title={`${y}年${Number(m)}月: ¥${amt.toLocaleString()}`}
                            >
                              {/* 金額表示（万単位、0円は0と表示） */}
                              <span className="trend-bar-val">
                                {amt > 0 ? `${(amt / 10000).toFixed(1)}万` : '0円'}
                              </span>

                              {/* 棒グラフ本体 */}
                              <div className="trend-bar-wrapper">
                                <div 
                                  className="trend-bar-fill" 
                                  style={{ height: amt > 0 ? `${Math.max(barHeightPercent, 6)}%` : '2px' }}
                                ></div>
                              </div>
                              
                              {/* 月ラベル */}
                              <span className="trend-bar-label">{Number(m)}月</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 明細リスト */}
                  {data.items.length === 0 ? (
                    <div className="no-data">この月の該当データはありません</div>
                  ) : (
                    data.items.map((dateGroup, index) => (
                      <div key={index} className="date-group-block">
                        <div className="date-group-header">
                          <span className="dg-date">{dateGroup.date}</span>
                          <span className="dg-total">合計: ¥{dateGroup.totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="date-group-items">
                          {dateGroup.details.map((item, dIndex) => (
                            <div key={item.id || dIndex} className="expense-item-row">
                              <div className="item-info">
                                <span className="item-category">
                                  {item.sub_category || item.category || '未分類'}
                                </span>
                              </div>
                              <div className="item-memo">{item.memo || '-'}</div>
                              <div className="item-amount">¥{Number(item.amount || 0).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}