import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type { Workspace, WorkspaceMember } from '../types/domain'

type DB = SupabaseClient<Database>

export async function getMyWorkspaces(db: DB, userId: string): Promise<Workspace[]> {
  const { data, error } = await db
    .from('workspace_members')
    .select('workspace:workspaces(*)')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)

  if (error) throw error
  return (data ?? []).map((row) => (row as { workspace: Workspace }).workspace)
}

export async function getWorkspaceMembers(
  db: DB,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const { data, error } = await db
    .from('workspace_members')
    .select('*, profile:profiles(*)')
    .eq('workspace_id', workspaceId)

  if (error) throw error
  return data as WorkspaceMember[]
}

export async function createWorkspace(db: DB, name: string, ownerId: string): Promise<Workspace> {
  const { data: ws, error: wsErr } = await db
    .from('workspaces')
    .insert({ name, owner_id: ownerId })
    .select()
    .single()
  if (wsErr) throw wsErr

  await db.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: ownerId,
    role: 'owner',
    accepted_at: new Date().toISOString(),
  })

  return ws as Workspace
}

export async function inviteMember(
  db: DB,
  workspaceId: string,
  email: string,
): Promise<void> {
  // Insert pending member – the user will accept via email link
  const { error } = await db.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: '00000000-0000-0000-0000-000000000000', // placeholder until user accepts
    role: 'member',
    invited_email: email,
    accepted_at: null,
  })
  if (error) throw error
}

export async function acceptInvite(db: DB, workspaceId: string, userId: string): Promise<void> {
  const { error } = await db
    .from('workspace_members')
    .update({ user_id: userId, accepted_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    // match by email is handled via Supabase auth metadata in production
  if (error) throw error
}
