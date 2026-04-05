import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useInboxTasks, useTaskMutations } from '@todo/store';
import TaskList from '../components/tasks/TaskList';
import styles from './Page.module.css';
export default function InboxPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: allTasks = [], isLoading } = useInboxTasks(supabase, user?.id ?? '');
    const { complete } = useTaskMutations(supabase);
    if (isLoading)
        return _jsx("div", { className: styles.loading, children: "Laddar..." });
    const today = new Date().toISOString().slice(0, 10);
    const idag = allTasks.filter((t) => t.due_date === today || t.start_date === today);
    const inkorg = allTasks.filter((t) => t.due_date !== today && t.start_date !== today);
    return (_jsxs("div", { className: styles.page, children: [_jsx("h1", { className: styles.title, children: "Inkorg" }), idag.length > 0 && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.sectionTitle, children: "Idag" }), _jsx(TaskList, { tasks: idag, onComplete: (id) => complete.mutateAsync(id), emptyText: "Inga uppgifter f\u00F6r idag" })] })), _jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.sectionTitle, children: idag.length > 0 ? 'Osorterat' : 'Inkorg' }), _jsx(TaskList, { tasks: inkorg, onComplete: (id) => complete.mutateAsync(id), emptyText: "Inkorg \u00E4r tom \u2013 bra jobbat!" })] })] }));
}
