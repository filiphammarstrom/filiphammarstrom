import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useProjects, useProjectTasks, useTaskMutations } from '@todo/store';
import TaskList from '../components/tasks/TaskList';
import styles from './Page.module.css';
export default function ProjectPage() {
    const { id } = useParams();
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: projects = [] } = useProjects(supabase, user?.id ?? '');
    const { data: tasks = [], isLoading } = useProjectTasks(supabase, id ?? '');
    const { complete } = useTaskMutations(supabase);
    const project = projects.find((p) => p.id === id);
    if (isLoading)
        return _jsx("div", { className: styles.loading, children: "Laddar..." });
    return (_jsxs("div", { className: styles.page, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [project?.color && (_jsx("span", { style: {
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: project.color,
                            display: 'inline-block',
                        } })), _jsx("h1", { className: styles.title, children: project?.name ?? 'Projekt' })] }), project?.description && (_jsx("p", { style: { color: 'var(--text-muted)', fontSize: 13 }, children: project.description })), _jsx(TaskList, { tasks: tasks, onComplete: (id) => complete.mutateAsync(id), showAssignee: true, emptyText: "Inga uppgifter i det h\u00E4r projektet \u00E4nnu." })] }));
}
