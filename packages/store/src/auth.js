import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    setSession: (session) => set({ session, user: session?.user ?? null }),
}));
