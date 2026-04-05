import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type { Area, Project, TaskSection } from '../types/domain'

type DB = SupabaseClient<Database>

export async function getAreas(db: DB, userId: string): Promise<Area[]> {
  const { data, error } = await db
    .from('areas')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')

  if (error) throw error
  return data as Area[]
}

export async function getProjects(db: DB, userId: string): Promise<Project[]> {
  const { data, error } = await db
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')

  if (error) throw error
  return data as Project[]
}

export async function getProjectSections(db: DB, projectId: string): Promise<TaskSection[]> {
  const { data, error } = await db
    .from('task_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')

  if (error) throw error
  return data as TaskSection[]
}

export async function createArea(
  db: DB,
  area: Database['public']['Tables']['areas']['Insert'],
): Promise<Area> {
  const { data, error } = await db.from('areas').insert(area).select().single()
  if (error) throw error
  return data as Area
}

export async function createProject(
  db: DB,
  project: Database['public']['Tables']['projects']['Insert'],
): Promise<Project> {
  const { data, error } = await db.from('projects').insert(project).select().single()
  if (error) throw error
  return data as Project
}

export async function updateProject(
  db: DB,
  id: string,
  updates: Database['public']['Tables']['projects']['Update'],
): Promise<Project> {
  const { data, error } = await db
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export async function deleteProject(db: DB, id: string): Promise<void> {
  const { error } = await db.from('projects').delete().eq('id', id)
  if (error) throw error
}
