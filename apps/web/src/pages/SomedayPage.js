import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore, useSomedayTasks, useTaskMutations } from '@todo/store';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';
import styles from './SomedayPage.module.css';
import pageStyles from './Page.module.css';
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
function SortableTask({ task, onSelect }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    return (_jsxs("div", { ref: setNodeRef, style: { transform: CSS.Transform.toString(transform), transition }, className: `${styles.taskRow} ${isDragging ? styles.dragging : ''}`, onClick: () => onSelect(task), children: [_jsx("span", { className: styles.handle, ...attributes, ...listeners, title: "Drag f\u00F6r att sortera", children: "\u283F" }), _jsx("span", { className: styles.priorityDot, style: { background: PRIORITY_COLORS[task.priority] } }), _jsx("span", { className: styles.taskTitle, children: task.title })] }));
}
export default function SomedayPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const { data: tasks = [], isLoading } = useSomedayTasks(supabase, user?.id ?? '');
    const { complete, update, reorder } = useTaskMutations(supabase);
    const [selected, setSelected] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    // Group by priority, within each group maintain sort_order
    const groups = { 1: [], 2: [], 3: [], 4: [] };
    for (const t of tasks) {
        groups[t.priority].push(t);
    }
    function handleDragEnd(event, priorityGroup) {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        const oldIdx = priorityGroup.findIndex((t) => t.id === active.id);
        const newIdx = priorityGroup.findIndex((t) => t.id === over.id);
        if (oldIdx === -1 || newIdx === -1)
            return;
        const reordered = [...priorityGroup];
        const [moved] = reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, moved);
        reorder.mutate(reordered.map((t, i) => ({ id: t.id, sort_order: i })));
    }
    if (isLoading)
        return _jsx("div", { className: pageStyles.loading, children: "Laddar..." });
    return (_jsxs("div", { className: pageStyles.page, children: [_jsx("h1", { className: pageStyles.title, children: "Someday" }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: 13 }, children: "Uppgifter sorterade efter prioritet. Dra f\u00F6r att \u00E4ndra ordning inom samma prioritetsniv\u00E5." }), [1, 2, 3, 4].map((p) => {
                const group = groups[p];
                if (group.length === 0)
                    return null;
                return (_jsxs("section", { className: pageStyles.section, children: [_jsxs("h2", { className: pageStyles.sectionTitle, style: { color: PRIORITY_COLORS[p] }, children: [PRIORITY_LABELS[p], _jsxs("span", { style: { color: 'var(--text-placeholder)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12, marginLeft: 6 }, children: [group.length, " uppgift", group.length !== 1 ? 'er' : ''] })] }), _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: (e) => handleDragEnd(e, group), children: _jsx(SortableContext, { items: group.map((t) => t.id), strategy: verticalListSortingStrategy, children: group.map((task) => (_jsx(SortableTask, { task: task, onSelect: setSelected }, task.id))) }) })] }, p));
            }), tasks.length === 0 && (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Inga someday-uppgifter." })), selected && (_jsx(TaskDetailPanel, { task: selected, onClose: () => setSelected(null) }))] }));
}
