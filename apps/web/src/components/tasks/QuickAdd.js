import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store';
import styles from './QuickAdd.module.css';
export default function QuickAdd() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { create } = useTaskMutations(supabase);
    const { data: projects = [] } = useProjects(supabase, user?.id ?? '');
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('4');
    const [projectId, setProjectId] = useState('');
    const inputRef = useRef(null);
    useEffect(() => {
        function onKey(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === 'Escape')
                setOpen(false);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);
    useEffect(() => {
        if (open)
            setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);
    async function submit(e) {
        e.preventDefault();
        if (!title.trim() || !user)
            return;
        await create.mutateAsync({
            title: title.trim(),
            notes: notes || null,
            due_date: dueDate || null,
            priority: Number(priority),
            project_id: projectId || null,
            status: 'open',
            user_id: user.id,
            created_by: user.id,
        });
        setTitle('');
        setNotes('');
        setDueDate('');
        setPriority('4');
        setProjectId('');
        setOpen(false);
    }
    return (_jsxs(_Fragment, { children: [_jsx("button", { className: styles.fab, onClick: () => setOpen(true), "aria-label": "L\u00E4gg till uppgift (\u2318N)", title: "L\u00E4gg till uppgift (\u2318N)", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", children: _jsx("path", { d: "M10 4v12M4 10h12", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" }) }) }), open && (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.overlay, onClick: () => setOpen(false) }), _jsx("div", { className: styles.modal, role: "dialog", "aria-label": "Ny uppgift", children: _jsxs("form", { onSubmit: submit, children: [_jsx("input", { ref: inputRef, className: styles.titleInput, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Uppgiftstitel" }), _jsx("textarea", { className: styles.notes, value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Anteckningar (valfritt)", rows: 3 }), _jsxs("div", { className: styles.row, children: [_jsx("input", { type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value), className: styles.field }), _jsxs("select", { value: priority, onChange: (e) => setPriority(e.target.value), className: styles.field, children: [_jsx("option", { value: "1", children: "P1 \u2013 Urgent" }), _jsx("option", { value: "2", children: "P2 \u2013 H\u00F6g" }), _jsx("option", { value: "3", children: "P3 \u2013 Medium" }), _jsx("option", { value: "4", children: "P4 \u2013 L\u00E5g" })] }), projects.length > 0 && (_jsxs("select", { value: projectId, onChange: (e) => setProjectId(e.target.value), className: styles.field, children: [_jsx("option", { value: "", children: "Inget projekt" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }))] }), _jsxs("div", { className: styles.actions, children: [_jsx("button", { type: "button", className: styles.cancel, onClick: () => setOpen(false), children: "Avbryt" }), _jsx("button", { type: "submit", className: styles.submit, disabled: !title.trim() || create.isPending, children: create.isPending ? 'Sparar...' : 'Lägg till' })] })] }) })] }))] }));
}
