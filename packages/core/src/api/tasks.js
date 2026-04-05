// Shared select clause that joins tags and assignee
const TASK_SELECT = `
  *,
  tags:task_tags(tag:tags(*)),
  assignee:profiles!tasks_assignee_id_fkey(id, email, full_name, avatar_url),
  blocked_by:tasks!tasks_blocked_by_task_id_fkey(id, title, status)
`;
function toTask(row) {
    // The select returns tags as task_tags(tag:tags(*)) so each element has a `tag` key.
    // Cast via unknown to avoid type conflicts with the joined shape.
    const raw = row;
    return {
        ...raw,
        tags: (raw.tags ?? []).map((t) => t.tag),
    };
}
// Tasks are visible when not blocked (or when blocker is done).
// This is enforced in each query by including blocked_by in the select.
export async function getInboxTasks(db, userId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', userId)
        .eq('status', 'open')
        .is('project_id', null)
        .is('parent_task_id', null)
        .order('sort_order');
    if (error)
        throw error;
    const tasks = data.map(toTask);
    const idag = tasks.filter((t) => t.due_date === today || t.start_date === today);
    const inkorg = tasks.filter((t) => t.due_date !== today && t.start_date !== today && !t.due_date && !t.start_date);
    return [...idag, ...inkorg];
}
export async function getTodayTasks(db, userId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', userId)
        .eq('status', 'open')
        .is('parent_task_id', null)
        .or(`due_date.eq.${today},start_date.eq.${today}`)
        .order('priority')
        .order('sort_order');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function getUpcomingTasks(db, userId) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', userId)
        .eq('status', 'open')
        .is('parent_task_id', null)
        .gt('due_date', today)
        .order('due_date')
        .order('priority');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function getAnytimeTasks(db, userId) {
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', userId)
        .eq('status', 'open')
        .is('parent_task_id', null)
        .not('project_id', 'is', null)
        .is('due_date', null)
        .is('start_date', null)
        .order('priority')
        .order('sort_order');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function getSomedayTasks(db, userId) {
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', userId)
        .eq('status', 'someday')
        .is('parent_task_id', null)
        .order('priority')
        .order('sort_order');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function getProjectTasks(db, projectId) {
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('project_id', projectId)
        .is('parent_task_id', null)
        .order('sort_order');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function getSubtasks(db, parentTaskId) {
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('parent_task_id', parentTaskId)
        .order('sort_order');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function getAssignedToMeTasks(db, userId) {
    const { data, error } = await db
        .from('tasks')
        .select(TASK_SELECT)
        .eq('assignee_id', userId)
        .neq('created_by', userId)
        .in('status', ['open', 'someday'])
        .is('parent_task_id', null)
        .order('priority')
        .order('sort_order');
    if (error)
        throw error;
    return data.map(toTask);
}
export async function createTask(db, task) {
    const { data, error } = await db
        .from('tasks')
        .insert(task)
        .select(TASK_SELECT)
        .single();
    if (error)
        throw error;
    return toTask(data);
}
export async function updateTask(db, id, updates) {
    const { data, error } = await db
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(TASK_SELECT)
        .single();
    if (error)
        throw error;
    return toTask(data);
}
export async function completeTask(db, id) {
    return updateTask(db, id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
    });
}
export async function deleteTask(db, id) {
    const { error } = await db.from('tasks').delete().eq('id', id);
    if (error)
        throw error;
}
export async function reorderTasks(db, updates) {
    await Promise.all(updates.map(({ id, sort_order }) => db.from('tasks').update({ sort_order }).eq('id', id)));
}
