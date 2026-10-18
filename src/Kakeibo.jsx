import { useState, useEffect } from "react";
import BudgetSummary from "./components/BudgetSummary";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseHistory from "./components/ExpenseHistory";
import BottomNav from "./components/BottomNav";
import { supabase } from "./supabase";
import "./Kakeibo.css"; 

export default function Kakeibo() {
  const [expenses, setExpenses] = useState([]);
  // 初期タブを 'input'（新規入力）に変更
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

  const handleAddExpense = async (newExpense) => {
    const payload = {
      amount: Number(newExpense.amount),
      date: newExpense.date,
      category: newExpense.mainCategory || newExpense.category,
      sub_category: newExpense.subCategory || newExpense.sub_category,
      payment_source: newExpense.paymentSource || newExpense.payment_source,
      memo: newExpense.memo || '',
    };

    const { error } = await supabase
      .from('expenses')
      .insert([payload]);

    if (error) {
      console.error('データ追加エラー:', error);
    } else {
      fetchExpenses();
      // 入力完了したら自動で「履歴」タブに切り替える
      setActiveTab('history');
    }
  };

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

  return (
    <div className="kakeibo-container">
      
      {/* タブ切り替えに応じた画面表示 */}
      {activeTab === 'input' && (
        <div>
          <ExpenseForm onAddExpense={handleAddExpense} />
        </div>
      )}

       {activeTab === 'history' && (
        <div>
          <ExpenseHistory expenses={expenses} onDeleteExpense={handleDeleteExpense} />
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div>
          <BudgetSummary expenses={expenses} />
        </div>
      )}



      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}