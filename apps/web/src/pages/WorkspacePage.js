import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../context/SupabaseContext';
import { useAuthStore } from '@todo/store';
import { getMyWorkspaces, getWorkspaceMembers, createWorkspace, inviteMember } from '@todo/core';
import styles from './WorkspacePage.module.css';
import pageStyles from './Page.module.css';
export default function WorkspacePage() {
    const supabase = useSupabase();
    const user = useAuthStore((s) => s.user);
    const qc = useQueryClient();
    const [selectedWs, setSelectedWs] = useState(null);
    const [newWsName, setNewWsName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [creating, setCreating] = useState(false);
    const { data: workspaces = [], isLoading } = useQuery({
        queryKey: ['workspaces', user?.id],
        queryFn: () => getMyWorkspaces(supabase, user.id),
        enabled: !!user,
    });
    const { data: members = [] } = useQuery({
        queryKey: ['workspace-members', selectedWs?.id],
        queryFn: () => getWorkspaceMembers(supabase, selectedWs.id),
        enabled: !!selectedWs,
    });
    const createWs = useMutation({
        mutationFn: () => createWorkspace(supabase, newWsName.trim(), user.id),
        onSuccess: (ws) => {
            qc.invalidateQueries({ queryKey: ['workspaces'] });
            setNewWsName('');
            setSelectedWs(ws);
        },
    });
    const invite = useMutation({
        mutationFn: () => inviteMember(supabase, selectedWs.id, inviteEmail.trim()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['workspace-members'] });
            setInviteEmail('');
        },
    });
    if (isLoading)
        return _jsx("div", { className: pageStyles.loading, children: "Laddar..." });
    return (_jsxs("div", { className: pageStyles.page, children: [_jsx("h1", { className: pageStyles.title, children: "Team & Workspace" }), _jsxs("div", { className: styles.grid, children: [_jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.cardTitle, children: "Mina workspaces" }), workspaces.length === 0 ? (_jsx("p", { className: styles.empty, children: "Du har inget workspace \u00E4nnu." })) : (workspaces.map((ws) => (_jsxs("button", { className: `${styles.wsItem} ${selectedWs?.id === ws.id ? styles.wsItemActive : ''}`, onClick: () => setSelectedWs(ws), children: [_jsx("span", { className: styles.wsIcon, children: ws.name.charAt(0).toUpperCase() }), ws.name] }, ws.id)))), creating ? (_jsxs("form", { onSubmit: (e) => {
                                    e.preventDefault();
                                    if (newWsName.trim())
                                        createWs.mutate();
                                }, className: styles.createForm, children: [_jsx("input", { autoFocus: true, value: newWsName, onChange: (e) => setNewWsName(e.target.value), placeholder: "Workspace-namn" }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { type: "button", onClick: () => setCreating(false), children: "Avbryt" }), _jsx("button", { type: "submit", disabled: !newWsName.trim() || createWs.isPending, children: "Skapa" })] })] })) : (_jsx("button", { className: styles.addBtn, onClick: () => setCreating(true), children: "+ Nytt workspace" }))] }), selectedWs && (_jsxs("div", { className: styles.card, children: [_jsxs("div", { className: styles.cardTitle, children: [selectedWs.name, " \u2013 Medlemmar"] }), members.map((member) => (_jsxs("div", { className: styles.memberRow, children: [_jsx("div", { className: styles.memberAvatar, children: (member.profile?.full_name ?? member.invited_email ?? '?').charAt(0).toUpperCase() }), _jsxs("div", { className: styles.memberInfo, children: [_jsx("span", { className: styles.memberName, children: member.profile?.full_name ?? member.invited_email ?? 'Okänd' }), _jsxs("span", { className: styles.memberRole, children: [member.role, !member.accepted_at && ' (inbjuden, ej accepterat)'] })] })] }, `${member.workspace_id}-${member.user_id}`))), _jsxs("div", { className: styles.inviteSection, children: [_jsx("div", { className: styles.sectionTitle, children: "Bjud in kollega" }), _jsxs("form", { onSubmit: (e) => {
                                            e.preventDefault();
                                            if (inviteEmail.trim())
                                                invite.mutate();
                                        }, className: styles.inviteForm, children: [_jsx("input", { type: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), placeholder: "kollega@example.com" }), _jsx("button", { type: "submit", disabled: !inviteEmail.trim() || invite.isPending, children: invite.isPending ? 'Skickar...' : 'Bjud in' })] })] })] }))] })] }));
}
