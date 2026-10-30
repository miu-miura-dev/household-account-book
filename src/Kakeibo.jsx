import { useState, useEffect } from "react";
import ExpenseForm from "./components/pages/001_ExpenseForm/ExpenseForm";
import ExpenseHistory from "./components/pages/002_ExpenseHistory/ExpenseHistory";
import BudgetStatus from "./components/pages/003_BudgetStatus/BudgetStatus";
import AssetOverview from "./components/pages/004_AssetOverview/AssetOverview";
import MonthlySummary from "./components/pages/005_MonthlySummary/MonthlySummary";
//import LoanManagement from "./components/pages/006_LoanManagement/LoanManagement";
import BottomNav from "./components/common/BottomNav";
import { supabase } from "./supabase";
import "./Kakeibo.css";

export default function Kakeibo() {
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('input');

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('データ取得エラー:', error);
    } else {
      setExpenses(data || []);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // 新規追加ハンドラー
  const handleAddExpense = async (newExpense) => {
    const payload = {
      amount: Number(newExpense.amount),
      date: newExpense.date,
      category: newExpense.mainCategory || newExpense.category,
      sub_category: newExpense.subCategory || newExpense.sub_category,
      payment_source: newExpense.paymentSource || newExpense.payment_source,
      memo: newExpense.memo || '',
      is_pending: newExpense.is_pending !== undefined ? newExpense.is_pending : true,
      is_excluded: Boolean(newExpense.is_excluded || newExpense.isExcluded),
    };

    const { error } = await supabase
      .from('expenses')
      .insert([payload]);

    if (error) {
      console.error('データ追加エラー:', error);
    } else {
      fetchExpenses();
    }
  };

  // 削除ハンドラー
  const handleDeleteExpense = async (id) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('データ削除エラー:', error);
    } else {
      fetchExpenses();
    }
  };

  // 更新ハンドラー
  const handleUpdateExpense = async (updatedItem) => {
    const { error } = await supabase
      .from('expenses')
      .update({
        amount: Number(updatedItem.amount),
        date: updatedItem.date,
        category: updatedItem.category,
        sub_category: updatedItem.sub_category || updatedItem.subCategory,
        payment_source: updatedItem.payment_source || updatedItem.paymentSource,
        memo: updatedItem.memo,
        is_pending: updatedItem.is_pending !== undefined ? updatedItem.is_pending : false,
        is_excluded: Boolean(updatedItem.is_excluded || updatedItem.isExcluded),
      })
      .eq('id', updatedItem.id);

    if (error) {
      console.error('データ更新エラー:', error);
    } else {
      fetchExpenses();
    }
  };

  return (
    <div className="kakeibo-container">

      {/* 1. 入力 */}
      {activeTab === 'input' && (
        <div>
          <ExpenseForm 
            onAddExpense={handleAddExpense} 
            onNavigateHistory={() => setActiveTab('history')} 
          />
        </div>
      )}

      {/* 2. 履歴 */}
      {activeTab === 'history' && (
        <div>
          <ExpenseHistory 
            expenses={expenses} 
            onDeleteExpense={handleDeleteExpense} 
            onUpdateExpense={handleUpdateExpense} 
          />      
        </div>
      )}

      {/* 3. 予算残高 */}
      {activeTab === 'budgetStatus' && (
        <div>
          <BudgetStatus expenses={expenses} />
        </div>
      )}

      {/* 4. 資産一覧 */}
      {activeTab === 'assetOverview' && (
        <div>
          <AssetOverview expenses={expenses} />
        </div>
      )}

      {/* 5. 月間収支 */}
      {activeTab === 'monthlySummary' && (
        <div>
          <MonthlySummary expenses={expenses} />
        </div>
      )}

      {/* 6. ローン管理 */}
      {activeTab === 'loanManagement' && (
        <div>
          <LoanManagement expenses={expenses} />
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}