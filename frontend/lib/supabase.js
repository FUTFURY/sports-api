
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wcgkkdnixqxivtuuhokl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X0xPbbbZZLJnAiS2nhx44w_49Tcg2uu'; // Anon Key for Frontend

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
