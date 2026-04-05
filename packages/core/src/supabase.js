import { createClient } from '@supabase/supabase-js';
let _client = null;
export function getSupabaseClient(url, anonKey) {
    if (!_client) {
        _client = createClient(url, anonKey);
    }
    return _client;
}
