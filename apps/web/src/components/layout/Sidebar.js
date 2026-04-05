import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import { useAuthStore, useProjects, useAreas } from '@todo/store';
import styles from './Sidebar.module.css';
const ICONS = {
    inbox: (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M14 9.5V12a2 2 0 01-2 2H4a2 2 0 01-2-2V9.5l2-4h8l2 4zM1 9.5h4l1 2h4l1-2h4", stroke: "currentColor", strokeWidth: "1.2", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) })),
    today: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: [_jsx("rect", { x: "2", y: "3", width: "12", height: "12", rx: "2" }), _jsx("path", { d: "M5 1v3M11 1v3M2 7h12" }), _jsx("text", { x: "5", y: "13", fill: "currentColor", stroke: "none", fontSize: "6", fontWeight: "bold", children: new Date().getDate() })] })),
    upcoming: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: [_jsx("path", { d: "M8 2v4l3 3" }), _jsx("circle", { cx: "8", cy: "8", r: "6" })] })),
    anytime: (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: _jsx("path", { d: "M2 8h12M8 2l6 6-6 6" }) })),
    someday: (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: _jsx("path", { d: "M8 3l1.5 3 3.5.5-2.5 2.5.5 3.5L8 11l-3 1.5.5-3.5L3 7l3.5-.5z" }) })),
    assigned: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: [_jsx("circle", { cx: "8", cy: "5", r: "3" }), _jsx("path", { d: "M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" })] })),
    area: (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: _jsx("rect", { x: "1", y: "1", width: "12", height: "12", rx: "2" }) })),
    project: (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: [_jsx("circle", { cx: "7", cy: "7", r: "5" }), _jsx("path", { d: "M7 4v3l2 2" })] })),
};
export default function Sidebar() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const { data: projects = [] } = useProjects(supabase, user?.id ?? '');
    const { data: areas = [] } = useAreas(supabase, user?.id ?? '');
    async function signOut() {
        await supabase.auth.signOut();
        navigate('/auth');
    }
    const link = (to, label, icon) => (_jsxs(NavLink, { to: to, className: ({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`, children: [_jsx("span", { className: styles.icon, children: icon }), label] }));
    return (_jsxs("nav", { className: styles.sidebar, children: [_jsxs("div", { className: styles.top, children: [_jsx("div", { className: styles.appName, children: "Todo" }), _jsxs("div", { className: styles.section, children: [link('/inbox', 'Inkorg', ICONS.inbox), link('/today', 'Idag', ICONS.today), link('/upcoming', 'Kommande', ICONS.upcoming), link('/anytime', 'Närsomhelst', ICONS.anytime), link('/someday', 'Someday', ICONS.someday), link('/assigned', 'Tilldelade till mig', ICONS.assigned)] }), areas.length > 0 && (_jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.sectionLabel, children: "Omr\u00E5den" }), areas.map((area) => (_jsxs(NavLink, { to: `/area/${area.id}`, className: ({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`, children: [_jsx("span", { className: styles.icon, style: { color: area.color ?? undefined }, children: ICONS.area }), area.name] }, area.id)))] })), projects.length > 0 && (_jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.sectionLabel, children: "Projekt" }), projects
                                .filter((p) => p.status === 'active')
                                .map((project) => (_jsxs(NavLink, { to: `/project/${project.id}`, className: ({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`, children: [_jsx("span", { className: styles.icon, style: { color: project.color ?? undefined }, children: ICONS.project }), project.name] }, project.id)))] }))] }), _jsxs("div", { className: styles.bottom, children: [_jsxs(NavLink, { to: "/workspace", className: ({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`, children: [_jsx("span", { className: styles.icon, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", children: _jsx("path", { d: "M2 4h12M4 8h8M6 12h4" }) }) }), "Team & Workspace"] }), _jsx("button", { className: styles.signOut, onClick: signOut, children: "Logga ut" })] })] }));
}
