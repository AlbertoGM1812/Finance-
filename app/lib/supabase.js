// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Aquí irán tus credenciales de Supabase
const supabaseUrl = 'https://faxscagizitayrqnzymi.supabase.co';
const supabaseKey = 'sb_publishable_uEq2lqCJ3km5ZZz4Eoc4mA_RerJxZP0'; // Obtén esto desde el panel de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

