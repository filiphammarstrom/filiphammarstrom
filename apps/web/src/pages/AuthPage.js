import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore } from '@todo/store';
import styles from './AuthPage.module.css';
export default function AuthPage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    if (user)
        return _jsx(Navigate, { to: "/", replace: true });
    async function submit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } },
                });
                if (error)
                    throw error;
                setDone(true);
            }
            else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error)
                    throw error;
            }
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    if (done) {
        return (_jsx("div", { className: styles.wrap, children: _jsxs("div", { className: styles.card, children: [_jsx("h1", { children: "Kolla din e-post" }), _jsxs("p", { children: ["Vi har skickat en bekr\u00E4ftelsel\u00E4nk till ", email, "."] })] }) }));
    }
    return (_jsx("div", { className: styles.wrap, children: _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.logo, children: _jsxs("svg", { width: "40", height: "40", viewBox: "0 0 40 40", fill: "none", children: [_jsx("rect", { width: "40", height: "40", rx: "10", fill: "#007aff" }), _jsx("path", { d: "M12 28L20 12L28 28", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M14.5 22h11", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round" })] }) }), _jsx("h1", { children: mode === 'login' ? 'Logga in' : 'Skapa konto' }), _jsxs("form", { onSubmit: submit, children: [mode === 'signup' && (_jsxs("div", { className: styles.field, children: [_jsx("label", { children: "Namn" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Ditt namn", required: true })] })), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "E-post" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "du@example.com", required: true })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { children: "L\u00F6senord" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 8 })] }), error && _jsx("p", { className: styles.error, children: error }), _jsx("button", { type: "submit", className: styles.btn, disabled: loading, children: loading ? 'Vänta...' : mode === 'login' ? 'Logga in' : 'Skapa konto' })] }), _jsxs("p", { className: styles.toggle, children: [mode === 'login' ? 'Inget konto? ' : 'Har du redan ett konto? ', _jsx("button", { onClick: () => setMode(mode === 'login' ? 'signup' : 'login'), children: mode === 'login' ? 'Skapa konto' : 'Logga in' })] })] }) }));
}
