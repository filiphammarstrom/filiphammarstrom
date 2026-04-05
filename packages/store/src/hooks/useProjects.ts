import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAreas,
  getProjects,
  getProjectSections,
  createArea,
  createProject,
  updateProject,
  deleteProject,
} from '@todo/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@todo/core'

type DB = SupabaseClient<Database>

export function useAreas(db: DB, userId: string) {
  return useQuery({
    queryKey: ['areas', userId],
    queryFn: () => getAreas(db, userId),
    enabled: !!userId,
  })
}

export function useProjects(db: DB, userId: string) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: () => getProjects(db, userId),
    enabled: !!userId,
  })
}

export function useProjectSections(db: DB, projectId: string) {
  return useQuery({
    queryKey: ['sections', projectId],
    queryFn: () => getProjectSections(db, projectId),
    enabled: !!projectId,
  })
}

export function useProjectMutations(db: DB) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] })
  const invalidateAreas = () => qc.invalidateQueries({ queryKey: ['areas'] })

  const addArea = useMutation({
    mutationFn: (area: Database['public']['Tables']['areas']['Insert']) =>
      createArea(db, area),
    onSuccess: invalidateAreas,
  })

  const addProject = useMutation({
    mutationFn: (project: Database['public']['Tables']['projects']['Insert']) =>
      createProject(db, project),
    onSuccess: invalidate,
  })

  const editProject = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Database['public']['Tables']['projects']['Update'] }) =>
      updateProject(db, id, updates),
    onSuccess: invalidate,
  })

  const removeProject = useMutation({
    mutationFn: (id: string) => deleteProject(db, id),
    onSuccess: invalidate,
  })

  return { addArea, addProject, editProject, removeProject }
}
