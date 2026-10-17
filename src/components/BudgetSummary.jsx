import React, { useState } from 'react';
import { CATEGORIES } from '../constants/categories';
import './BudgetSummary.css';

export default function BudgetSummary({ expenses }) {
  // 1. 繰り越し機能のON/OFFステート
  const [isCarryoverEnabled, setIsCarryoverEnabled] = useState(false);

  // 仮の週予算設定（大項目ごと・必要に応じて調整・設定画面から変えられるように拡張可能です）
  const weeklyBudgets = {
    '食費': 10000,
    '日用品': 3000,
    '交際費': 5000,
    '趣味・娯楽': 4000,
    '衣類・美容': 5000,
    'その他': 3000,
  };

  // 今週の支出データを抽出するロジック（例として直近の簡易的な日付判定、または全件）
  // 実際の日付判定や週の始まり（月曜始まりなど）に合わせて調整できます
  const totalBudget = Object.values(weeklyBudgets).reduce((a, b) => a + b, 0);
  
  // 今週使った金額の合計（簡易的に全件、または今週のデータで計算）
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="budget-summary-container">
      {/* ヘッダー ＆ 繰り越しボタン */}
      <div className="budget-header">
        <h2 className="budget-title">今週の予算ダッシュボード</h2>
        <button 
          type="button"
          className={`carryover-toggle-btn ${isCarryoverEnabled ? 'active' : ''}`}
          onClick={() => setIsCarryoverEnabled(!isCarryoverEnabled)}
        >
          繰り越し: {isCarryoverEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 全体の残り金額カード */}
      <div className="budget-overview-card">
        <div className="budget-overview-label">今週の残り使えるお金</div>
        <div className="budget-overview-value">
          ¥{remainingBudget.toLocaleString()}
        </div>
        <div className="budget-overview-sub">
          予算 ¥{totalBudget.toLocaleString()} / 支出 ¥{totalSpent.toLocaleString()}
          {isCarryoverEnabled && ' (前週の余りを加算中)'}
        </div>
      </div>

      {/* 大項目ごとの予算進捗 ＆ 中項目内訳 */}
      <div className="category-budget-list">
        {Object.keys(CATEGORIES).map((mainCategory) => {
          const budget = weeklyBudgets[mainCategory] || 5000; // 未設定の場合はデフォルト値

          // この大項目に属する支出を抽出
          const mainCategoryExpenses = expenses.filter(
            (item) => (item.category || item.mainCategory) === mainCategory
          );

          // 大項目ごとの合計支出
          const spent = mainCategoryExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
          const percentage = Math.min(Math.round((spent / budget) * 100), 100);
          const isOver = spent > budget;

          // 中項目ごとの内訳を集計
          const subCategoryTotals = mainCategoryExpenses.reduce((acc, item) => {
            const sub = item.sub_category || item.subCategory;
            if (!acc[sub]) acc[sub] = 0;
            acc[sub] += Number(item.amount || 0);
            return acc;
          }, {});

          return (
            <div key={mainCategory} className="category-budget-item">
              <div className="category-info-row">
                <span className="category-name">{mainCategory}</span>
                <span className="category-amounts">
                  <strong style={{ color: isOver ? '#c62828' : '#2e7d32' }}>¥{spent.toLocaleString()}</strong> / 予算 ¥{budget.toLocaleString()}
                </span>
              </div>

              {/* プログレスバー */}
              <div className="progress-bar-bg">
                <div 
                  className={`progress-bar-fill ${isOver ? 'over' : ''}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* 中項目ごとの確認用チップ */}
              {Object.keys(subCategoryTotals).length > 0 && (
                <div className="sub-category-breakdown">
                  {Object.entries(subCategoryTotals).map(([subName, subAmount]) => (
                    <span key={subName} className="sub-chip">
                      {subName}: ¥{subAmount.toLocaleString()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}