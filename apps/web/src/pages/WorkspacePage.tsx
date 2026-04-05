import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore } from '@todo/store'
import { getMyWorkspaces, getWorkspaceMembers, createWorkspace, inviteMember } from '@todo/core'
import type { Workspace } from '@todo/core'
import styles from './WorkspacePage.module.css'
import pageStyles from './Page.module.css'

export default function WorkspacePage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null)
  const [newWsName, setNewWsName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: () => getMyWorkspaces(supabase, user!.id),
    enabled: !!user,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members', selectedWs?.id],
    queryFn: () => getWorkspaceMembers(supabase, selectedWs!.id),
    enabled: !!selectedWs,
  })

  const createWs = useMutation({
    mutationFn: () => createWorkspace(supabase, newWsName.trim(), user!.id),
    onSuccess: (ws) => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
      setNewWsName('')
      setSelectedWs(ws)
    },
  })

  const invite = useMutation({
    mutationFn: () => inviteMember(supabase, selectedWs!.id, inviteEmail.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members'] })
      setInviteEmail('')
    },
  })

  if (isLoading) return <div className={pageStyles.loading}>Laddar...</div>

  return (
    <div className={pageStyles.page}>
      <h1 className={pageStyles.title}>Team & Workspace</h1>

      <div className={styles.grid}>
        {/* Workspace list */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Mina workspaces</div>
          {workspaces.length === 0 ? (
            <p className={styles.empty}>Du har inget workspace ännu.</p>
          ) : (
            workspaces.map((ws) => (
              <button
                key={ws.id}
                className={`${styles.wsItem} ${selectedWs?.id === ws.id ? styles.wsItemActive : ''}`}
                onClick={() => setSelectedWs(ws)}
              >
                <span className={styles.wsIcon}>
                  {ws.name.charAt(0).toUpperCase()}
                </span>
                {ws.name}
              </button>
            ))
          )}

          {creating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newWsName.trim()) createWs.mutate()
              }}
              className={styles.createForm}
            >
              <input
                autoFocus
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="Workspace-namn"
              />
              <div className={styles.formActions}>
                <button type="button" onClick={() => setCreating(false)}>Avbryt</button>
                <button type="submit" disabled={!newWsName.trim() || createWs.isPending}>
                  Skapa
                </button>
              </div>
            </form>
          ) : (
            <button className={styles.addBtn} onClick={() => setCreating(true)}>
              + Nytt workspace
            </button>
          )}
        </div>

        {/* Members */}
        {selectedWs && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>{selectedWs.name} – Medlemmar</div>

            {members.map((member) => (
              <div key={`${member.workspace_id}-${member.user_id}`} className={styles.memberRow}>
                <div className={styles.memberAvatar}>
                  {(member.profile?.full_name ?? member.invited_email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>
                    {member.profile?.full_name ?? member.invited_email ?? 'Okänd'}
                  </span>
                  <span className={styles.memberRole}>
                    {member.role}
                    {!member.accepted_at && ' (inbjuden, ej accepterat)'}
                  </span>
                </div>
              </div>
            ))}

            <div className={styles.inviteSection}>
              <div className={styles.sectionTitle}>Bjud in kollega</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (inviteEmail.trim()) invite.mutate()
                }}
                className={styles.inviteForm}
              >
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="kollega@example.com"
                />
                <button type="submit" disabled={!inviteEmail.trim() || invite.isPending}>
                  {invite.isPending ? 'Skickar...' : 'Bjud in'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
