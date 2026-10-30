import React, { useState, useEffect } from 'react';
import './AssetOverview.css'; // 修正: フォルダ名に合わせて AssetOverview.css に変更

// デフォルトの固定費・項目リスト
const DEFAULT_FIXED_ITEMS = [
  { key: 'rent', label: '家賃', defaultAmount: 0 },
  { key: 'water', label: '水道代', defaultAmount: 0 },
  { key: 'gas', label: 'ガス代', defaultAmount: 0 },
  { key: 'electric', label: '電気代', defaultAmount: 0 },
  { key: 'mobile_rakuten', label: '携帯_楽天', defaultAmount: 0 },
  { key: 'transport', label: '交通費', defaultAmount: 0 },
  { key: 'insurance', label: '生命保険', defaultAmount: 0 },
  { key: 'subsc', label: 'サブスク', defaultAmount: 0 },
  { key: 'loan_rakuten', label: '返済：楽天クレカ', defaultAmount: 0 },
  { key: 'loan_paypay', label: '返済：PayPayクレカ', defaultAmount: 0 },
  { key: 'loan_lc', label: '返済：LC', defaultAmount: 0 },
];

export default function AssetOverview({ expenses = [] }) {
  // 固定費設定モーダルの開閉ステート
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  // 固定費マスター設定（localStorageに保持）
  const [fixedSettings, setFixedSettings] = useState(() => {
    const saved = localStorage.getItem('kakeibo_fixed_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const initialMap = {};
    DEFAULT_FIXED_ITEMS.forEach(item => {
      initialMap[item.key] = item.defaultAmount;
    });
    return initialMap;
  });

  // 各項目の「予定金額」（手入力で変更・保持できるようにする）
  const [plannedBudgets, setPlannedBudgets] = useState(() => {
    const savedPlanned = localStorage.getItem('kakeibo_planned_budgets');
    if (savedPlanned) {
      try { return JSON.parse(savedPlanned); } catch (e) { /* ignore */ }
    }
    const initialMap = {};
    DEFAULT_FIXED_ITEMS.forEach(item => {
      initialMap[item.key] = fixedSettings[item.key] || item.defaultAmount;
    });
    return initialMap;
  });

  // 予定金額が変更されたら localStorage に自動保存
  useEffect(() => {
    localStorage.setItem('kakeibo_planned_budgets', JSON.stringify(plannedBudgets));
  }, [plannedBudgets]);

  // 固定費設定が保存された際のハンドラー
  const handleSaveSettings = (newSettings) => {
    setFixedSettings(newSettings);
    localStorage.setItem('kakeibo_fixed_settings', JSON.stringify(newSettings));
    
    // 予定金額もデフォルト固定費で更新
    setPlannedBudgets(prev => {
      const updated = { ...prev };
      DEFAULT_FIXED_ITEMS.forEach(item => {
        updated[item.key] = newSettings[item.key] !== undefined ? newSettings[item.key] : 0;
      });
      return updated;
    });
    setIsSettingOpen(false);
  };

  // 予定金額の手入力変更ハンドラー
  const handleBudgetChange = (key, value) => {
    setPlannedBudgets(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  // 当月（YYYY-MM）の取得
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 実績金額の自動計算（今月かつ除外なしで sub_category が一致するもの）
  const calculateActual = (subCategoryLabel) => {
    return (expenses || []).reduce((sum, item) => {
      const itemMonth = item.date ? item.date.slice(0, 7) : '';
      const subCat = item.sub_category || item.subCategory || '';
      const isExcluded = item.is_excluded || item.isExcluded;

      if (itemMonth === currentMonth && !isExcluded && subCat === subCategoryLabel) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  };

  // 合計金額の算出
  const totalPlanned = DEFAULT_FIXED_ITEMS.reduce((sum, item) => {
    return sum + (plannedBudgets[item.key] || 0);
  }, 0);

  const totalActual = DEFAULT_FIXED_ITEMS.reduce((sum, item) => {
    return sum + calculateActual(item.label);
  }, 0);

  return (
    <div className="fixed-budget-container">
      {/* ── ヘッダー ── */}
      <div className="budget-header">
        <h2 className="budget-title">📊 資産・固定費管理 ({currentMonth})</h2>
        <button
          type="button"
          className="fixed-setting-btn"
          onClick={() => setIsSettingOpen(true)}
        >
          ⚙️ 固定費設定
        </button>
      </div>

      {/* ── サマリーカード ── */}
      <div className="budget-summary-cards">
        <div className="budget-card">
          <span className="card-label">今月の予定合計</span>
          <span className="card-value">¥{totalPlanned.toLocaleString()}</span>
        </div>
        <div className="budget-card">
          <span className="card-label">今月の実績合計</span>
          <span className="card-value actual">¥{totalActual.toLocaleString()}</span>
        </div>
      </div>

      {/* ── 項目一覧リスト ── */}
      <div className="budget-table">
        <div className="budget-table-header">
          <span>項目名</span>
          <span>予定金額 (手入力可)</span>
          <span className="text-right">実績金額 (DB)</span>
        </div>

        <div className="budget-table-body">
          {DEFAULT_FIXED_ITEMS.map((item) => {
            const actualAmount = calculateActual(item.label);
            const plannedAmount = plannedBudgets[item.key] !== undefined ? plannedBudgets[item.key] : 0;
            const isOver = actualAmount > plannedAmount && plannedAmount > 0;

            return (
              <div key={item.key} className={`budget-row ${isOver ? 'over-budget' : ''}`}>
                <span className="item-label">{item.label}</span>
                
                {/* 予定金額（入力欄） */}
                <div className="planned-input-wrapper">
                  <span className="currency-unit">¥</span>
                  <input
                    type="number"
                    value={plannedAmount || ''}
                    placeholder="0"
                    onChange={(e) => handleBudgetChange(item.key, e.target.value)}
                    className="planned-input"
                  />
                </div>

                {/* 実績金額（自動集計） */}
                <div className="actual-amount-wrapper">
                  <span className={`actual-amount ${isOver ? 'over' : ''}`}>
                    ¥{actualAmount.toLocaleString()}
                  </span>
                  {isOver && <span className="over-badge">超過</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 固定費設定モーダル ── */}
      {isSettingOpen && (
        <FixedSettingsModal
          initialSettings={fixedSettings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingOpen(false)}
        />
      )}
    </div>
  );
}

// ── 固定費設定モーダルコンポーネント ──
function FixedSettingsModal({ initialSettings, onSave, onClose }) {
  const [settings, setSettings] = useState(initialSettings);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: Number(value) || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ 固定費のデフォルト設定</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-inputs-list">
            {DEFAULT_FIXED_ITEMS.map(item => (
              <div key={item.key} className="modal-input-row">
                <label>{item.label}</label>
                <div className="modal-input-wrapper">
                  <span>¥</span>
                  <input
                    type="number"
                    value={settings[item.key] !== undefined ? settings[item.key] : ''}
                    placeholder="0"
                    onChange={(e) => handleChange(item.key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="submit" className="save-btn">設定を保存する</button>
            <button type="button" className="cancel-btn" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}