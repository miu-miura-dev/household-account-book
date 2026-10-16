import { createClient } from '@supabase/supabase-js'

// 先ほど確認したプロジェクトのURLと、SupabaseのAPI設定画面にある anon キーを入れてください
const SUPABASE_URL = 'https://szthvuudwfacbpfhrvlv.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_FFSMT2bNF7QBkwAYtdTWfQ_37HltNI2'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)