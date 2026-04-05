import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useAssignedToMeTasks, useTaskMutations } from '@todo/store';
import TaskList from '../components/tasks/TaskList';
import styles from './Page.module.css';
export default function AssignedPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: tasks = [], isLoading } = useAssignedToMeTasks(supabase, user?.id ?? '');
    const { complete } = useTaskMutations(supabase);
    if (isLoading)
        return _jsx("div", { className: styles.loading, children: "Laddar..." });
    return (_jsxs("div", { className: styles.page, children: [_jsx("h1", { className: styles.title, children: "Tilldelade till mig" }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: 13 }, children: "Uppgifter som kollegor har tilldelat dig" }), _jsx(TaskList, { tasks: tasks, onComplete: (id) => complete.mutateAsync(id), showAssignee: true, emptyText: "Inga uppgifter tilldelade till dig." })] }));
}
