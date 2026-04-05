export type TaskStatus = 'open' | 'completed' | 'cancelled' | 'someday'
export type TaskPriority = 1 | 2 | 3 | 4

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: 'owner' | 'member'
  invited_email: string | null
  accepted_at: string | null
  profile?: Profile
}

export interface Area {
  id: string
  workspace_id: string | null
  user_id: string
  name: string
  color: string | null
  icon: string | null
  sort_order: number
}

export interface Project {
  id: string
  workspace_id: string | null
  user_id: string
  area_id: string | null
  name: string
  description: string | null
  color: string | null
  icon: string | null
  status: 'active' | 'completed' | 'archived' | 'someday'
  due_date: string | null
  sort_order: number
}

export interface TaskSection {
  id: string
  project_id: string
  name: string
  sort_order: number
}

export interface Task {
  id: string
  workspace_id: string | null
  user_id: string
  project_id: string | null
  section_id: string | null
  parent_task_id: string | null
  assignee_id: string | null
  created_by: string
  blocked_by_task_id: string | null
  title: string
  notes: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  start_date: string | null
  reminder_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  completed_at: string | null
  // joined
  tags?: Tag[]
  assignee?: Profile | null
  subtasks?: Task[]
  blocked_by?: Task | null
}

export interface Tag {
  id: string
  workspace_id: string | null
  user_id: string
  name: string
  color: string | null
}

export interface TaskTag {
  task_id: string
  tag_id: string
}
