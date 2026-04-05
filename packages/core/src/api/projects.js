export async function getAreas(db, userId) {
    const { data, error } = await db
        .from('areas')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');
    if (error)
        throw error;
    return data;
}
export async function getProjects(db, userId) {
    const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');
    if (error)
        throw error;
    return data;
}
export async function getProjectSections(db, projectId) {
    const { data, error } = await db
        .from('task_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
    if (error)
        throw error;
    return data;
}
export async function createArea(db, area) {
    const { data, error } = await db.from('areas').insert(area).select().single();
    if (error)
        throw error;
    return data;
}
export async function createProject(db, project) {
    const { data, error } = await db.from('projects').insert(project).select().single();
    if (error)
        throw error;
    return data;
}
export async function updateProject(db, id, updates) {
    const { data, error } = await db
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteProject(db, id) {
    const { error } = await db.from('projects').delete().eq('id', id);
    if (error)
        throw error;
}
