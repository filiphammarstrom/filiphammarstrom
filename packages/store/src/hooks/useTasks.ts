import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInboxTasks,
  getTodayTasks,
  getUpcomingTasks,
  getAnytimeTasks,
  getSomedayTasks,
  getProjectTasks,
  getSubtasks,
  getAssignedToMeTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  reorderTasks,
} from '@todo/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Task } from '@todo/core'

type DB = SupabaseClient<Database>

export function useInboxTasks(db: DB, userId: string) {
  return useQuery({
    queryKey: ['tasks', 'inbox', userId],
    queryFn: () => getInboxTasks(db, userId),
    enabled: !!userId,
  })
}

export function useTodayTasks(db: DB, userId: string) {
  return useQuery({
    queryKey: ['tasks', 'today', userId],
    queryFn: () => getTodayTasks(db, userId),
    enabled: !!userId,
  })
}

export function useUpcomingTasks(db: DB, userId: string) {
  return useQuery({
    queryKey: ['tasks', 'upcoming', userId],
    queryFn: () => getUpcomingTasks(db, userId),
    enabled: !!userId,
  })
}

export function useAnytimeTasks(db: DB, userId: string) {
  return useQuery({
    queryKey: ['tasks', 'anytime', userId],
    queryFn: () => getAnytimeTasks(db, userId),
    enabled: !!userId,
  })
}

export function useSomedayTasks(db: DB, userId: string) {
  return useQuery({
    queryKey: ['tasks', 'someday', userId],
    queryFn: () => getSomedayTasks(db, userId),
    enabled: !!userId,
  })
}

export function useProjectTasks(db: DB, projectId: string) {
  return useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => getProjectTasks(db, projectId),
    enabled: !!projectId,
  })
}

export function useSubtasks(db: DB, parentTaskId: string | null) {
  return useQuery({
    queryKey: ['tasks', 'subtasks', parentTaskId],
    queryFn: () => getSubtasks(db, parentTaskId!),
    enabled: !!parentTaskId,
  })
}

export function useAssignedToMeTasks(db: DB, userId: string) {
  return useQuery({
    queryKey: ['tasks', 'assigned', userId],
    queryFn: () => getAssignedToMeTasks(db, userId),
    enabled: !!userId,
  })
}

export function useTaskMutations(db: DB) {
  const qc = useQueryClient()

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ['tasks'] })

  const create = useMutation({
    mutationFn: (task: Database['public']['Tables']['tasks']['Insert']) =>
      createTask(db, task),
    onSuccess: invalidateAll,
  })

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Database['public']['Tables']['tasks']['Update'] }) =>
      updateTask(db, id, updates),
    onSuccess: invalidateAll,
  })

  const complete = useMutation({
    mutationFn: (id: string) => completeTask(db, id),
    onSuccess: invalidateAll,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteTask(db, id),
    onSuccess: invalidateAll,
  })

  const reorder = useMutation({
    mutationFn: (updates: Array<{ id: string; sort_order: number }>) =>
      reorderTasks(db, updates),
    onSuccess: invalidateAll,
  })

  return { create, update, complete, remove, reorder }
}
