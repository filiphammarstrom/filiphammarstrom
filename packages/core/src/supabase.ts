import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

let _client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient(url: string, anonKey: string) {
  if (!_client) {
    _client = createClient<Database>(url, anonKey)
  }
  return _client
}
