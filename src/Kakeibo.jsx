import { useState, useEffect } from "react";
import BudgetSummary from "./components/BudgetSummary";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseHistory from "./components/ExpenseHistory";
import BottomNav from "./components/BottomNav";
import { supabase } from "./supabase";

export default function Kakeibo() {
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' または 'history'
  const [isModalOpen, setIsModalOpen] = useState(false); // 入力モーダルの開閉状態

  // Supabaseからデータを取得する関数
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

  // 新しい支出を追加してSupabaseに保存する関数
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
      setIsModalOpen(false); // 記録できたら自動で入力画面を閉じる
    }
  };

  // 支出を削除する関数
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
    <div style={{ padding: '20px 20px 80px 20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>家計簿アプリ</h1>
      
      {/* タブ切り替えに応じて表示内容を変更 */}
      {activeTab === 'dashboard' ? (
        <div>
          {/* 予算・残高サマリー */}
          <BudgetSummary expenses={expenses} />
          
          {/* ダッシュボード内での直近の履歴やサマリー表示 */}
          <h2 style={{ fontSize: '1rem', marginTop: '20px', color: '#444' }}>最近の履歴</h2>
          <ExpenseHistory expenses={expenses.slice(0, 5)} onDeleteExpense={handleDeleteExpense} />
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: '#444' }}>すべての履歴</h2>
          <ExpenseHistory expenses={expenses} onDeleteExpense={handleDeleteExpense} />
        </div>
      )}

      {/* 右下のフローティング・プラスボタン */}
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '75px',
          right: '20px',
          width: '56px',
          height: '56px',
          backgroundColor: '#2e7d32',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          fontSize: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 1001,
        }}
      >
        +
      </button>

      {/* プラスボタンを押したときだけ出てくる入力フォーム（モーダル画面） */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* 閉じるボタン */}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#ccc',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <ExpenseForm onAddExpense={handleAddExpense} />
          </div>
        </div>
      )}

      {/* 画面下の固定ナビゲーション */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}