import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useTodayTasks, useTaskMutations } from '@todo/store';
import TaskList from '../components/tasks/TaskList';
import styles from './Page.module.css';
export default function TodayPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: tasks = [], isLoading } = useTodayTasks(supabase, user?.id ?? '');
    const { complete } = useTaskMutations(supabase);
    const today = new Date().toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    if (isLoading)
        return _jsx("div", { className: styles.loading, children: "Laddar..." });
    return (_jsxs("div", { className: styles.page, children: [_jsxs("div", { children: [_jsx("h1", { className: styles.title, children: "Idag" }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: 13 }, children: today })] }), _jsx(TaskList, { tasks: tasks, onComplete: (id) => complete.mutateAsync(id), showAssignee: true, emptyText: "Inga uppgifter f\u00F6r idag \u2013 njut av dagen!" })] }));
}
