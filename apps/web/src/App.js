import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSupabase } from './context/SupabaseContext';
import { useAuthStore } from '@todo/store';
import AppShell from './components/layout/AppShell';
import AuthPage from './pages/AuthPage';
import InboxPage from './pages/InboxPage';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import AnytimePage from './pages/AnytimePage';
import SomedayPage from './pages/SomedayPage';
import ProjectPage from './pages/ProjectPage';
import AreaPage from './pages/AreaPage';
import AssignedPage from './pages/AssignedPage';
import WorkspacePage from './pages/WorkspacePage';
import QuickAddWindowPage from './pages/QuickAddWindowPage';
function RequireAuth({ children }) {
    const user = useAuthStore((s) => s.user);
    if (!user)
        return _jsx(Navigate, { to: "/auth", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    const supabase = useSupabase();
    const setSession = useAuthStore((s) => s.setSession);
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, [supabase, setSession]);
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/quick-add", element: _jsx(QuickAddWindowPage, {}) }), _jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(RequireAuth, { children: _jsx(AppShell, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/inbox", replace: true }) }), _jsx(Route, { path: "inbox", element: _jsx(InboxPage, {}) }), _jsx(Route, { path: "today", element: _jsx(TodayPage, {}) }), _jsx(Route, { path: "upcoming", element: _jsx(UpcomingPage, {}) }), _jsx(Route, { path: "anytime", element: _jsx(AnytimePage, {}) }), _jsx(Route, { path: "someday", element: _jsx(SomedayPage, {}) }), _jsx(Route, { path: "assigned", element: _jsx(AssignedPage, {}) }), _jsx(Route, { path: "project/:id", element: _jsx(ProjectPage, {}) }), _jsx(Route, { path: "area/:id", element: _jsx(AreaPage, {}) }), _jsx(Route, { path: "workspace", element: _jsx(WorkspacePage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
