import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useAreas, useProjects } from '@todo/store';
import { NavLink } from 'react-router-dom';
import styles from './Page.module.css';
export default function AreaPage() {
    const { id } = useParams();
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: areas = [] } = useAreas(supabase, user?.id ?? '');
    const { data: projects = [] } = useProjects(supabase, user?.id ?? '');
    const area = areas.find((a) => a.id === id);
    const areaProjects = projects.filter((p) => p.area_id === id && p.status === 'active');
    return (_jsxs("div", { className: styles.page, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [area?.color && (_jsx("span", { style: {
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: area.color,
                            display: 'inline-block',
                        } })), _jsx("h1", { className: styles.title, children: area?.name ?? 'Område' })] }), areaProjects.length === 0 ? (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Inga aktiva projekt i det h\u00E4r omr\u00E5det." })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: areaProjects.map((project) => (_jsxs(NavLink, { to: `/project/${project.id}`, style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)',
                        textDecoration: 'none',
                    }, children: [project.color && (_jsx("span", { style: { width: 10, height: 10, borderRadius: '50%', background: project.color, display: 'inline-block' } })), project.name] }, project.id))) }))] }));
}
