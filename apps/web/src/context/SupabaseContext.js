import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
const SupabaseContext = createContext(supabase);
export function SupabaseProvider({ children }) {
    return (_jsx(SupabaseContext.Provider, { value: supabase, children: children }));
}
export function useSupabase() {
    return useContext(SupabaseContext);
}
