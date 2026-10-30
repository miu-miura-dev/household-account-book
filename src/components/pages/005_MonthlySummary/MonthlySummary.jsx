import React, { useState, useEffect } from 'react';
import './MonthlySummary.css';

// 全項目のマスター定義（借入・預金・繰り越しも含めて完備）
const SUMMARY_ITEMS = [
  // 前月繰り越し（口座・決済手段）
  { id: 'carry_rakuten', section: '前月繰り越し', label: '楽天銀行', keyName: 'payment_source' },
  { id: 'carry_smbc', section: '前月繰り越し', label: '三井住友銀行', keyName: 'payment_source' },
  { id: 'carry_cash', section: '前月繰り越し', label: '現金', keyName: 'payment_source' },
  { id: 'carry_paypay', section: '前月繰り越し', label: 'PayPay', keyName: 'payment_source' },
  { id: 'carry_suica', section: '前月繰り越し', label: 'Suica', keyName: 'payment_source' },
  { id: 'carry_merpay', section: '前月繰り越し', label: 'メルペイ', keyName: 'payment_source' },
  { id: 'carry_marutoku', section: '前月繰り越し', label: 'まるとく', keyName: 'payment_source' },

  // 収入
  { id: 'inc_salary', section: '収入', main: '収入', sub: '給与', keyName: 'sub_category' },
  { id: 'inc_trans', section: '収入', main: '収入', sub: '給与：交通費', keyName: 'sub_category' },
  { id: 'inc_marutoku', section: '収入', main: '収入', sub: '給与：まるとく', keyName: 'sub_category' },
  { id: 'inc_other', section: '収入', main: '収入', sub: 'その他', keyName: 'sub_category' },

  // 支出
  { id: 'exp_daily', section: '支出', main: '日用品', sub: '日用品', keyName: 'sub_category' },
  { id: 'exp_social', section: '支出', main: '交際費', sub: '交際費', keyName: 'sub_category' },
  { id: 'exp_play', section: '支出', main: '娯楽費', sub: '娯楽費', keyName: 'sub_category' },
  { id: 'exp_beauty', section: '支出', main: '美容・衣服', sub: '美容', keyName: 'sub_category' },
  { id: 'exp_clothes', section: '支出', main: '美容・衣服', sub: '衣服', keyName: 'sub_category' },
  { id: 'exp_hospital', section: '支出', main: '医療費', sub: '病院代', keyName: 'sub_category' },
  { id: 'exp_medicine', section: '支出', main: '医療費', sub: '薬代', keyName: 'sub_category' },
  { id: 'exp_other', section: '支出', main: 'その他', sub: 'その他', keyName: 'sub_category' },

  // 借入
  { id: 'borrow_item', section: '借入', label: '借入金', keyName: 'borrow' },

  // 預金
  { id: 'savings_item', section: '預金', label: '預金・貯蓄', keyName: 'savings' },

  // 繰り越し
  { id: 'carryforward_item', section: '繰り越し', label: '次月繰越調整', keyName: 'carryforward' },
];

export default function MonthlySummary({ expenses = [] }) {
  // 表示年月の管理 (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // デフォルト予定金額設定 (localStorage)
  const [defaultPlanned, setDefaultPlanned] = useState(() => {
    const saved = localStorage.getItem('kakeibo_default_monthly_planned');
    return saved ? JSON.parse(saved) : {};
  });

  // 選択月の予定金額ステート (手入力で変更可能)
  const [plannedBudgets, setPlannedBudgets] = useState(() => {
    const saved = localStorage.getItem(`kakeibo_planned_${selectedMonth}`);
    if (saved) return JSON.parse(saved);
    return defaultPlanned;
  });

  // 設定モーダル開閉ステート
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  // 月が切り替わったときに該当月の予定金額を読み込み
  useEffect(() => {
    const saved = localStorage.getItem(`kakeibo_planned_${selectedMonth}`);
    if (saved) {
      setPlannedBudgets(JSON.parse(saved));
    } else {
      setPlannedBudgets(defaultPlanned);
    }
  }, [selectedMonth, defaultPlanned]);

  // 予定金額を変更した際に localStorage へ自動保存
  const handlePlannedChange = (id, value) => {
    const updated = {
      ...plannedBudgets,
      [id]: Number(value) || 0
    };
    setPlannedBudgets(updated);
    localStorage.setItem(`kakeibo_planned_${selectedMonth}`, JSON.stringify(updated));
  };

  // デフォルト予定設定の保存ハンドラー
  const handleSaveDefaultSettings = (newDefaults) => {
    setDefaultPlanned(newDefaults);
    localStorage.setItem('kakeibo_default_monthly_planned', JSON.stringify(newDefaults));
    setIsSettingOpen(false);
  };

  // DB(expenses)から当月・各項目の実績金額を動的集計
  const getActualAmount = (item) => {
    return (expenses || []).reduce((sum, record) => {
      const recordMonth = record.date ? record.date.slice(0, 7).replace('/', '-') : '';
      const isExcluded = record.is_excluded || record.isExcluded;

      if (recordMonth === selectedMonth && !isExcluded) {
        if (item.section === '前月繰り越し') {
          if (record.payment_source === item.label) {
            return sum + Number(record.amount || 0);
          }
        } else if (item.section === '借入' || item.section === '預金' || item.section === '繰り越し') {
          // 専用カテゴリやメモ等で紐付ける場合の拡張用（必要に応じて調整可能）
          return sum;
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

  // セクションごとの合計計算 helper
  const calcSectionTotal = (sectionName) => {
    const items = SUMMARY_ITEMS.filter(i => i.section === sectionName);
    const planned = items.reduce((sum, item) => sum + (plannedBudgets[item.id] || 0), 0);
    const actual = items.reduce((sum, item) => sum + getActualAmount(item), 0);
    return { planned, actual };
  };

  const carryoverTotal = calcSectionTotal('前月繰り越し');
  const incomeTotal = calcSectionTotal('収入');
  const expenseTotal = calcSectionTotal('支出');
  const borrowTotal = calcSectionTotal('借入');
  const savingsTotal = calcSectionTotal('預金');
  const carryforwardTotal = calcSectionTotal('繰り越し');

  // 上部サマリー用計算（総資金 = 前月繰越 + 収入 + 借入）
  const totalFundsPlanned = carryoverTotal.planned + incomeTotal.planned + borrowTotal.planned;
  const totalFundsActual = carryoverTotal.actual + incomeTotal.actual + borrowTotal.actual;

  // 差額 (総資金 - 支出 - 預金)
  const balancePlanned = totalFundsPlanned - expenseTotal.planned - savingsTotal.planned;
  const balanceActual = totalFundsActual - expenseTotal.actual - savingsTotal.actual;

  // テーブルセクション描画関数
  const renderTableSection = (sectionTitle, sectionColorClass) => {
    const items = SUMMARY_ITEMS.filter(i => i.section === sectionTitle);
    const sectionTotal = calcSectionTotal(sectionTitle);

    return (
      <div className={`summary-section ${sectionColorClass}`}>
        <div className="section-header-badge">{sectionTitle}</div>
        <div className="summary-rows">
          {items.map((item) => {
            const plannedVal = plannedBudgets[item.id] !== undefined ? plannedBudgets[item.id] : '';
            const actualVal = getActualAmount(item);

            return (
              <div key={item.id} className="summary-row">
                <div className="row-labels">
                  {item.main && <span className="main-label">{item.main}</span>}
                  <span className={`sub-label ${item.sub === 'その他' ? 'highlight-red' : ''}`}>
                    {item.sub || item.label}
                  </span>
                </div>

                <div className="input-cell">
                  <span className="unit">¥</span>
                  <input
                    type="number"
                    value={plannedVal}
                    placeholder="0"
                    onChange={(e) => handlePlannedChange(item.id, e.target.value)}
                  />
                </div>

                <div className="actual-cell">
                  ¥{actualVal.toLocaleString()}
                </div>
              </div>
            );
          })}

          {/* セクションごとの合計行 */}
          <div className="summary-row section-total-row">
            <div className="row-labels">
              <span className="sub-label" style={{ fontWeight: 'bold' }}>【 {sectionTitle} 合計 】</span>
            </div>
            <div className="total-planned-cell">
              ¥{sectionTotal.planned.toLocaleString()}
            </div>
            <div className="actual-cell" style={{ fontWeight: 'bold' }}>
              ¥{sectionTotal.actual.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="monthly-summary-container">
      {/* ── 1. 最上部：月変更タブ & 設定ボタン ── */}
      <div className="top-bar">
        <div className="month-picker-wrapper">
          <label>表示月:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-input"
          />
        </div>
        <button
          type="button"
          className="setting-open-btn"
          onClick={() => setIsSettingOpen(true)}
        >
          ⚙️ デフォルト予定設定
        </button>
      </div>

      <h2 className="page-title">📋 月間収支表 ({selectedMonth})</h2>

      {/* ── 2. 上部サマリーカード ── */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <span className="sc-label">総資金 (繰越+収入+借入)</span>
          <span className="sc-val">予定: ¥{totalFundsPlanned.toLocaleString()}</span>
          <span className="sc-val actual">実績: ¥{totalFundsActual.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="sc-label">支出合計</span>
          <span className="sc-val">予定: ¥{expenseTotal.planned.toLocaleString()}</span>
          <span className="sc-val expense">実績: ¥{expenseTotal.actual.toLocaleString()}</span>
        </div>
        <div className={`summary-card ${balanceActual < 0 ? 'minus-card' : 'plus-card'}`}>
          <span className="sc-label">差額 (残高)</span>
          <span className="sc-val">予定: ¥{balancePlanned.toLocaleString()}</span>
          <span className="sc-val">実績: ¥{balanceActual.toLocaleString()}</span>
        </div>
      </div>

      {/* ── 3. 各セクション表示 ── */}
      <div className="sections-container">
        <div className="table-column-header">
          <span>項目 / 中項目</span>
          <span>予定金額</span>
          <span>実績金額 (DB)</span>
        </div>

        {/* ① 前月繰り越し */}
        {renderTableSection('前月繰り越し', 'bg-carryover')}

        {/* ② 収入 */}
        {renderTableSection('収入', 'bg-income')}

        {/* ③ 支出 */}
        {renderTableSection('支出', 'bg-expense')}

        {/* ④ 借入 */}
        {renderTableSection('借入', 'bg-borrow')}

        {/* ⑤ 預金 */}
        {renderTableSection('預金', 'bg-savings')}

        {/* ⑥ 繰り越し */}
        {renderTableSection('繰り越し', 'bg-carryforward')}
      </div>

      {/* ── 4. デフォルト予定金額設定モーダル ── */}
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

// ── デフォルト予定設定モーダル ──
function DefaultSettingsModal({ initialDefaults, onSave, onClose }) {
  const [modalValues, setModalValues] = useState(initialDefaults);

  const handleChange = (id, val) => {
    setModalValues(prev => ({
      ...prev,
      [id]: Number(val) || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(modalValues);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ デフォルト予定金額の設定</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-items-list">
            {SUMMARY_ITEMS.map((item) => (
              <div key={item.id} className="modal-item-row">
                <span className="modal-item-label">
                  [{item.section}] {item.sub || item.label}
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