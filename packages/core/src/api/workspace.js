export async function getMyWorkspaces(db, userId) {
    const { data, error } = await db
        .from('workspace_members')
        .select('workspace:workspaces(*)')
        .eq('user_id', userId)
        .not('accepted_at', 'is', null);
    if (error)
        throw error;
    return (data ?? []).map((row) => row.workspace);
}
export async function getWorkspaceMembers(db, workspaceId) {
    const { data, error } = await db
        .from('workspace_members')
        .select('*, profile:profiles(*)')
        .eq('workspace_id', workspaceId);
    if (error)
        throw error;
    return data;
}
export async function createWorkspace(db, name, ownerId) {
    const { data: ws, error: wsErr } = await db
        .from('workspaces')
        .insert({ name, owner_id: ownerId })
        .select()
        .single();
    if (wsErr)
        throw wsErr;
    await db.from('workspace_members').insert({
        workspace_id: ws.id,
        user_id: ownerId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
    });
    return ws;
}
export async function inviteMember(db, workspaceId, email) {
    // Insert pending member – the user will accept via email link
    const { error } = await db.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: '00000000-0000-0000-0000-000000000000', // placeholder until user accepts
        role: 'member',
        invited_email: email,
        accepted_at: null,
    });
    if (error)
        throw error;
}
export async function acceptInvite(db, workspaceId, userId) {
    const { error } = await db
        .from('workspace_members')
        .update({ user_id: userId, accepted_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId)
        .is('accepted_at', null);
    // match by email is handled via Supabase auth metadata in production
    if (error)
        throw error;
}
