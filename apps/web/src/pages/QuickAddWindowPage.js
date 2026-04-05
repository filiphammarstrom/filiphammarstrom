import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store';
/**
 * Rendered inside the Electron floating quick-add window (hash route #/quick-add).
 * Also works in browser for testing.
 */
export default function QuickAddWindowPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { create } = useTaskMutations(supabase);
    const { data: projects = [] } = useProjects(supabase, user?.id ?? '');
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('4');
    const [projectId, setProjectId] = useState('');
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    useEffect(() => {
        // Listen for main process open event
        const cleanup = window.electronAPI?.onQuickAddOpen(() => {
            setTitle('');
            inputRef.current?.focus();
        });
        return cleanup;
    }, []);
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') {
                if (window.electronAPI) {
                    window.electronAPI.closeQuickAdd();
                }
                else {
                    window.history.back();
                }
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    async function submit(e) {
        e.preventDefault();
        if (!title.trim() || !user)
            return;
        await create.mutateAsync({
            title: title.trim(),
            priority: Number(priority),
            project_id: projectId || null,
            status: 'open',
            user_id: user.id,
            created_by: user.id,
        });
        window.electronAPI?.notify('Uppgift tillagd', title.trim());
        window.electronAPI?.closeQuickAdd();
        setTitle('');
    }
    return (_jsx("div", { style: {
            padding: '20px 20px 16px',
            background: '#2c2c2e',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            height: '100vh',
            boxSizing: 'border-box',
        }, children: _jsxs("form", { onSubmit: submit, style: { display: 'flex', flexDirection: 'column', gap: 10 }, children: [_jsx("input", { ref: inputRef, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "L\u00E4gg till uppgift...", style: {
                        fontSize: 17,
                        fontWeight: 600,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #3a3a3c',
                        borderRadius: 0,
                        color: '#f2f2f7',
                        padding: '4px 0 10px',
                        outline: 'none',
                        width: '100%',
                    } }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsxs("select", { value: priority, onChange: (e) => setPriority(e.target.value), style: { flex: 1, padding: '6px 8px', background: '#3a3a3c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#f2f2f7', fontSize: 13 }, children: [_jsx("option", { value: "1", children: "P1 \u2013 Urgent" }), _jsx("option", { value: "2", children: "P2 \u2013 H\u00F6g" }), _jsx("option", { value: "3", children: "P3 \u2013 Medium" }), _jsx("option", { value: "4", children: "P4 \u2013 L\u00E5g" })] }), projects.length > 0 && (_jsxs("select", { value: projectId, onChange: (e) => setProjectId(e.target.value), style: { flex: 1, padding: '6px 8px', background: '#3a3a3c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#f2f2f7', fontSize: 13 }, children: [_jsx("option", { value: "", children: "Inget projekt" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] })), _jsx("button", { type: "submit", disabled: !title.trim() || create.isPending, style: {
                                padding: '6px 16px',
                                background: title.trim() ? '#007aff' : '#3a3a3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: title.trim() ? 'pointer' : 'default',
                                transition: 'background 0.15s',
                                whiteSpace: 'nowrap',
                            }, children: create.isPending ? '...' : 'Lägg till' })] }), _jsx("p", { style: { fontSize: 11, color: '#636366', margin: 0 }, children: "Esc f\u00F6r att st\u00E4nga \u00B7 \u2318\u21E7N f\u00F6r att \u00F6ppna igen" })] }) }));
}
