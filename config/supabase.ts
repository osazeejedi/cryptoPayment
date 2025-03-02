import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Initialize Supabase client
export const supabase = createClient(
  config.database.supabaseUrl,
  config.database.supabaseKey
); 