import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useAuthStore, useTaskMutations, useSubtasks } from '@todo/store';
import styles from './TaskDetailPanel.module.css';
const PRIORITY_LABELS = {
    1: 'P1 – Urgent',
    2: 'P2 – Hög',
    3: 'P3 – Medium',
    4: 'P4 – Låg',
};
const PRIORITY_COLORS = {
    1: 'var(--red)',
    2: 'var(--orange)',
    3: 'var(--yellow)',
    4: 'var(--text-placeholder)',
};
export default function TaskDetailPanel({ task, onClose }) {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { update, complete, create } = useTaskMutations(supabase);
    const { data: subtasks = [] } = useSubtasks(supabase, task.id);
    const [title, setTitle] = useState(task.title);
    const [notes, setNotes] = useState(task.notes ?? '');
    const [dueDate, setDueDate] = useState(task.due_date ?? '');
    const [priority, setPriority] = useState(task.priority);
    const [newSubtask, setNewSubtask] = useState('');
    const [saving, setSaving] = useState(false);
    // Sync if task prop changes
    useEffect(() => {
        setTitle(task.title);
        setNotes(task.notes ?? '');
        setDueDate(task.due_date ?? '');
        setPriority(task.priority);
    }, [task.id]);
    async function save() {
        setSaving(true);
        try {
            await update.mutateAsync({
                id: task.id,
                updates: {
                    title,
                    notes: notes || null,
                    due_date: dueDate || null,
                    priority: priority,
                },
            });
        }
        finally {
            setSaving(false);
        }
    }
    async function handleComplete() {
        await complete.mutateAsync(task.id);
        onClose();
    }
    async function addSubtask(e) {
        e.preventDefault();
        if (!newSubtask.trim() || !user)
            return;
        const lastSubtask = subtasks[subtasks.length - 1];
        await create.mutateAsync({
            title: newSubtask.trim(),
            status: 'open',
            priority: 4,
            parent_task_id: task.id,
            user_id: user.id,
            created_by: user.id,
            workspace_id: task.workspace_id,
            project_id: task.project_id,
            sort_order: subtasks.length,
            // Block by previous subtask if any (sequential ordering)
            blocked_by_task_id: lastSubtask?.id ?? null,
        });
        setNewSubtask('');
    }
    async function completeSubtask(id) {
        await complete.mutateAsync(id);
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.overlay, onClick: onClose }), _jsxs("aside", { className: styles.panel, children: [_jsxs("div", { className: styles.header, children: [_jsx("button", { className: styles.close, onClick: onClose, "aria-label": "St\u00E4ng", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8" }) }) }), _jsx("button", { className: styles.completeBtn, onClick: handleComplete, disabled: task.status === 'completed', children: task.status === 'completed' ? 'Slutförd' : 'Slutför uppgift' })] }), _jsxs("div", { className: styles.body, children: [_jsx("input", { className: styles.titleInput, value: title, onChange: (e) => setTitle(e.target.value), onBlur: save, placeholder: "Uppgiftstitel" }), _jsxs("div", { className: styles.fields, children: [_jsxs("label", { children: [_jsx("span", { children: "Prioritet" }), _jsx("select", { value: priority, onChange: (e) => setPriority(Number(e.target.value)), onBlur: save, style: { color: PRIORITY_COLORS[priority] }, children: [1, 2, 3, 4].map((p) => (_jsx("option", { value: p, style: { color: PRIORITY_COLORS[p] }, children: PRIORITY_LABELS[p] }, p))) })] }), _jsxs("label", { children: [_jsx("span", { children: "Deadline" }), _jsx("input", { type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value), onBlur: save })] })] }), task.blocked_by && task.blocked_by.status !== 'completed' && (_jsxs("div", { className: styles.blockInfo, children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: [_jsx("circle", { cx: "7", cy: "7", r: "5.5" }), _jsx("path", { d: "M7 4v3.5" }), _jsx("circle", { cx: "7", cy: "10.5", r: "0.5", fill: "currentColor" })] }), "Blockerad av: ", _jsx("strong", { children: task.blocked_by.title })] })), _jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.sectionTitle, children: "Anteckningar" }), _jsx("textarea", { className: styles.notes, value: notes, onChange: (e) => setNotes(e.target.value), onBlur: save, placeholder: "L\u00E4gg till anteckningar...", rows: 4 })] }), _jsxs("div", { className: styles.section, children: [_jsxs("div", { className: styles.sectionTitle, children: ["Deluppgifter", subtasks.length > 0 && _jsxs("span", { className: styles.badge, children: [subtasks.filter(t => t.status === 'completed').length, "/", subtasks.length] })] }), subtasks.map((sub, i) => {
                                        const isBlocked = i > 0 && subtasks[i - 1].status !== 'completed';
                                        return (_jsxs("div", { className: `${styles.subtaskRow} ${isBlocked ? styles.subtaskBlocked : ''}`, children: [_jsx("button", { className: styles.subtaskCheck, onClick: () => !isBlocked && completeSubtask(sub.id), disabled: isBlocked || sub.status === 'completed', children: sub.status === 'completed' && (_jsx("svg", { width: "8", height: "7", viewBox: "0 0 8 7", fill: "none", children: _jsx("path", { d: "M1 3.5L3 6L7 1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })) }), _jsxs("span", { className: sub.status === 'completed' ? styles.subtaskDone : '', children: [isBlocked && _jsx("span", { className: styles.lockIcon, children: "\uD83D\uDD12 " }), sub.title] })] }, sub.id));
                                    }), _jsxs("form", { onSubmit: addSubtask, className: styles.addSubtask, children: [_jsx("input", { value: newSubtask, onChange: (e) => setNewSubtask(e.target.value), placeholder: "L\u00E4gg till deluppgift..." }), _jsx("button", { type: "submit", disabled: !newSubtask.trim(), children: "L\u00E4gg till" })] })] })] }), _jsxs("div", { className: styles.footer, children: [_jsxs("span", { className: styles.footerMeta, children: ["Skapad ", new Date(task.created_at).toLocaleDateString('sv-SE')] }), saving && _jsx("span", { className: styles.saving, children: "Sparar..." })] })] })] }));
}
