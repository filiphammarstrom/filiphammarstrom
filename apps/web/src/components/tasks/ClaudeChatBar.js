import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useAuthStore, useTaskMutations, useProjects } from '@todo/store';
import styles from './ClaudeChatBar.module.css';
export default function ClaudeChatBar() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { create } = useTaskMutations(supabase);
    const { data: projects = [] } = useProjects(supabase, user?.id ?? '');
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    useEffect(() => {
        if (open)
            setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);
    // Keyboard shortcut: ⌘K
    useEffect(() => {
        function onKey(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === 'Escape')
                setOpen(false);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);
    async function sendMessage(e) {
        e.preventDefault();
        if (!input.trim() || loading || !user)
            return;
        const userMsg = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('claude-task', {
                body: { text: userMsg, userId: user.id },
            });
            if (error)
                throw error;
            const parsed = Array.isArray(data.tasks) ? data.tasks : [data.task].filter(Boolean);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: data.message ?? `Hittade ${parsed.length} uppgift(er). Vill du lägga till dem?`,
                    tasks: parsed,
                },
            ]);
        }
        catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', text: 'Fel: Kunde inte tolka uppgiften. Försök igen.' },
            ]);
        }
        finally {
            setLoading(false);
        }
    }
    async function createParsedTasks(tasks) {
        for (const task of tasks) {
            const project = task.projectName
                ? projects.find((p) => p.name.toLowerCase().includes(task.projectName.toLowerCase()))
                : undefined;
            await create.mutateAsync({
                title: task.title,
                notes: task.notes ?? null,
                due_date: task.dueDate ?? null,
                priority: task.priority ?? 4,
                project_id: project?.id ?? null,
                status: 'open',
                user_id: user.id,
                created_by: user.id,
            });
        }
        setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `${tasks.length} uppgift(er) har lagts till!` },
        ]);
    }
    return (_jsxs(_Fragment, { children: [_jsxs("button", { className: styles.trigger, onClick: () => setOpen(true), title: "Fr\u00E5ga Claude (\u2318K)", "aria-label": "Fr\u00E5ga Claude", children: [_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "none", children: [_jsx("path", { d: "M9 2C5.134 2 2 5.134 2 9s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M6 7.5C6 6.12 7.12 5 8.5 5c1.38 0 2.5 1.12 2.5 2.5 0 1.5-1.5 2-1.5 3.5", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }), _jsx("circle", { cx: "9", cy: "13.5", r: "0.75", fill: "currentColor" })] }), "Claude"] }), open && (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.overlay, onClick: () => setOpen(false) }), _jsxs("div", { className: styles.panel, role: "dialog", "aria-label": "Claude AI", children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { className: styles.panelTitle, children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [_jsx("rect", { width: "16", height: "16", rx: "4", fill: "#CC785C" }), _jsx("path", { d: "M4 12L8 4L12 12M5.5 9h5", stroke: "white", strokeWidth: "1.3", strokeLinecap: "round" })] }), "Claude AI"] }), _jsx("button", { className: styles.close, onClick: () => setOpen(false), children: "\u2715" })] }), _jsxs("div", { className: styles.messages, ref: listRef, children: [messages.length === 0 && (_jsxs("div", { className: styles.welcome, children: [_jsx("p", { children: "Hej! Beskriv uppgifter med naturligt spr\u00E5k." }), _jsxs("p", { className: styles.examples, children: [_jsx("em", { children: "Exempel: \"K\u00F6p mj\u00F6lk imorgon P2 i projekt Hem\"" }), _jsx("br", {}), _jsx("em", { children: "\"Skapa subtasks f\u00F6r hemsida: design, kod, test\"" })] })] })), messages.map((msg, i) => (_jsxs("div", { className: `${styles.message} ${styles[msg.role]}`, children: [_jsx("p", { children: msg.text }), msg.tasks && msg.tasks.length > 0 && (_jsxs("div", { className: styles.taskPreview, children: [msg.tasks.map((t, j) => (_jsxs("div", { className: styles.taskChip, children: [_jsxs("span", { className: styles.taskChipPriority, style: {
                                                                    background: t.priority === 1 ? 'var(--red)' : t.priority === 2 ? 'var(--orange)' : t.priority === 3 ? 'var(--yellow)' : 'var(--text-placeholder)'
                                                                }, children: ["P", t.priority ?? 4] }), t.title, t.dueDate && _jsx("span", { className: styles.taskChipDate, children: t.dueDate })] }, j))), _jsx("button", { className: styles.createBtn, onClick: () => createParsedTasks(msg.tasks), disabled: create.isPending, children: "L\u00E4gg till alla" })] }))] }, i))), loading && (_jsx("div", { className: `${styles.message} ${styles.assistant}`, children: _jsx("span", { className: styles.typing, children: "\u2022\u2022\u2022" }) }))] }), _jsxs("form", { className: styles.inputRow, onSubmit: sendMessage, children: [_jsx("input", { ref: inputRef, value: input, onChange: (e) => setInput(e.target.value), placeholder: "Skriv en uppgift eller fr\u00E5ga Claude...", disabled: loading }), _jsx("button", { type: "submit", disabled: !input.trim() || loading, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M2 8h12M8 2l6 6-6 6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] })] })] }))] }));
}
