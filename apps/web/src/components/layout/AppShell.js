import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';
import QuickAdd from '../tasks/QuickAdd';
import ClaudeChatBar from '../tasks/ClaudeChatBar';
export default function AppShell() {
    return (_jsxs("div", { className: styles.shell, children: [_jsx(Sidebar, {}), _jsx("main", { className: styles.main, children: _jsx(Outlet, {}) }), _jsx(QuickAdd, {}), _jsx(ClaudeChatBar, {})] }));
}
