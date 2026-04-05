import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import styles from './TaskRow.module.css';
const PRIORITY_COLORS = {
    1: 'var(--red)',
    2: 'var(--orange)',
    3: 'var(--yellow)',
    4: 'var(--text-placeholder)',
};
export default function TaskRow({ task, onComplete, onSelect, showAssignee, blocked }) {
    const [checking, setChecking] = useState(false);
    async function handleCheck(e) {
        e.stopPropagation();
        if (blocked)
            return;
        setChecking(true);
        try {
            await onComplete(task.id);
        }
        finally {
            setChecking(false);
        }
    }
    const isCompleted = task.status === 'completed';
    return (_jsxs("div", { className: `${styles.row} ${isCompleted ? styles.completed : ''} ${blocked ? styles.blocked : ''}`, onClick: () => !blocked && onSelect(task), role: "button", tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && !blocked && onSelect(task), "aria-label": task.title, children: [_jsx("button", { className: `${styles.check} ${checking ? styles.checking : ''}`, onClick: handleCheck, "aria-label": isCompleted ? 'Markera som öppen' : 'Slutför uppgift', disabled: blocked, style: { borderColor: PRIORITY_COLORS[task.priority] }, children: (isCompleted || checking) && (_jsx("svg", { width: "10", height: "8", viewBox: "0 0 10 8", fill: "none", children: _jsx("path", { d: "M1 4L4 7L9 1", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })) }), _jsxs("div", { className: styles.content, children: [_jsx("span", { className: styles.title, children: task.title }), _jsxs("div", { className: styles.meta, children: [blocked && task.blocked_by && (_jsxs("span", { className: styles.blockedBadge, children: ["V\u00E4ntar p\u00E5: ", task.blocked_by.title] })), task.due_date && !blocked && (_jsx("span", { className: `${styles.dueDate} ${isDue(task.due_date) ? styles.overdue : ''}`, children: formatDate(task.due_date) })), showAssignee && task.assignee && (_jsx("span", { className: styles.assignee, title: task.assignee.full_name ?? task.assignee.email, children: _jsx(Avatar, { user: task.assignee, size: 16 }) })), task.tags && task.tags.length > 0 && (_jsx("div", { className: styles.tags, children: task.tags.map((tag) => (_jsx("span", { className: styles.tag, style: { background: tag.color ?? undefined }, children: tag.name }, tag.id))) }))] })] })] }));
}
function Avatar({ user, size }) {
    if (user.avatar_url) {
        return _jsx("img", { src: user.avatar_url, width: size, height: size, style: { borderRadius: '50%' }, alt: "" });
    }
    const initials = (user.full_name ?? user.email).slice(0, 2).toUpperCase();
    return (_jsx("span", { style: {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: size, height: size, borderRadius: '50%',
            background: 'var(--accent)', color: 'white',
            fontSize: size * 0.45, fontWeight: 600,
        }, children: initials }));
}
function formatDate(date) {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString())
        return 'Idag';
    if (d.toDateString() === tomorrow.toDateString())
        return 'Imorgon';
    return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
}
function isDue(date) {
    return new Date(date) < new Date();
}
