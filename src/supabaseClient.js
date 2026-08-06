import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gveddunbmltxullpnqdz.supabase.co'
const supabaseAnonKey = 'sb_publishable_MbGAhEKe2LUPx9C4WYV8tg_PQ_qAfNh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
