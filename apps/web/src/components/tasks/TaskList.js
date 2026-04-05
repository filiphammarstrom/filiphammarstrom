import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import TaskRow from './TaskRow';
import TaskDetailPanel from './TaskDetailPanel';
import styles from './TaskList.module.css';
export default function TaskList({ tasks, onComplete, showAssignee, emptyText = 'Inga uppgifter' }) {
    const [selected, setSelected] = useState(null);
    if (tasks.length === 0) {
        return (_jsx("div", { className: styles.empty, children: _jsx("p", { children: emptyText }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.list, children: tasks.map((task) => {
                    const blocked = !!task.blocked_by_task_id &&
                        task.blocked_by?.status !== 'completed';
                    return (_jsx(TaskRow, { task: task, onComplete: onComplete, onSelect: setSelected, showAssignee: showAssignee, blocked: blocked }, task.id));
                }) }), selected && (_jsx(TaskDetailPanel, { task: selected, onClose: () => setSelected(null) }))] }));
}
