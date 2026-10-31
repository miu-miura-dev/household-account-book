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

  const [openSources, setOpenSources] = useState(
    paymentSources.reduce((acc, source) => ({ ...acc, [source]: true }), {})
  );

  const toggleSource = (source) => {
    setOpenSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  const sourceDataMap = paymentSources.reduce((acc, source) => {
    const matchedExpenses = (expenses || []).filter(
      item => (item.payment_source || item.paymentSource) === source
    );

    // 日付ごとにグループ化
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

    // 日付の新しい順にソート
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

  return (
    <div className="asset-overview-container">
      <h2 className="page-title">🏦 支出元・口座別一覧</h2>

      {/* 総合計カード */}
      <div className="grand-total-card">
        <span className="gt-label">支出元 合計金額</span>
        <span className="gt-value">¥{grandTotal.toLocaleString()}</span>
      </div>

      {/* 支出元ごとのアコーディオンリスト */}
      <div className="sources-stack">
        {paymentSources.map(source => {
          const data = sourceDataMap[source];
          const isOpen = openSources[source];

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
                  {data.items.length === 0 ? (
                    <div className="no-data">該当するデータはありません</div>
                  ) : (
                    data.items.map((dateGroup, index) => (
                      <div key={index} className="date-group-block">
                        {/* 日付ごとの合算ヘッダー */}
                        <div className="date-group-header">
                          <span className="dg-date">{dateGroup.date}</span>
                          <span className="dg-total">合計: ¥{dateGroup.totalAmount.toLocaleString()}</span>
                        </div>

                        {/* その日の個別一覧（明細） */}
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