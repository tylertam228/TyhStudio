/**
 * Supabase Client
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

function getSupabase() {
    if (!supabase) {
        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not configured');
            return null;
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
    }
    return supabase;
}

async function testConnection() {
    const client = getSupabase();
    if (!client) return false;
    
    try {
        const { error } = await client.from('_test').select('*').limit(1);
        return !error || error.code === 'PGRST116';
    } catch {
        return false;
    }
}

module.exports = { getSupabase, testConnection };
