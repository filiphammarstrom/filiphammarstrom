import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useUpcomingTasks, useTaskMutations } from '@todo/store';
import TaskList from '../components/tasks/TaskList';
import styles from './Page.module.css';
function groupByDate(tasks) {
    const groups = {};
    for (const task of tasks) {
        const key = task.due_date ?? 'Inget datum';
        if (!groups[key])
            groups[key] = [];
        groups[key].push(task);
    }
    return groups;
}
function formatDateLabel(date) {
    const d = new Date(date);
    return d.toLocaleDateString('sv-SE', { weekday: 'long', month: 'long', day: 'numeric' });
}
export default function UpcomingPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: tasks = [], isLoading } = useUpcomingTasks(supabase, user?.id ?? '');
    const { complete } = useTaskMutations(supabase);
    if (isLoading)
        return _jsx("div", { className: styles.loading, children: "Laddar..." });
    const groups = groupByDate(tasks);
    return (_jsxs("div", { className: styles.page, children: [_jsx("h1", { className: styles.title, children: "Kommande" }), Object.keys(groups).length === 0 ? (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Inga kommande uppgifter." })) : (Object.entries(groups).map(([date, dateTasks]) => (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.sectionTitle, children: formatDateLabel(date) }), _jsx(TaskList, { tasks: dateTasks, onComplete: (id) => complete.mutateAsync(id), showAssignee: true })] }, date))))] }));
}
