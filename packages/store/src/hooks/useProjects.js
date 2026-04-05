import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAreas, getProjects, getProjectSections, createArea, createProject, updateProject, deleteProject, } from '@todo/core';
export function useAreas(db, userId) {
    return useQuery({
        queryKey: ['areas', userId],
        queryFn: () => getAreas(db, userId),
        enabled: !!userId,
    });
}
export function useProjects(db, userId) {
    return useQuery({
        queryKey: ['projects', userId],
        queryFn: () => getProjects(db, userId),
        enabled: !!userId,
    });
}
export function useProjectSections(db, projectId) {
    return useQuery({
        queryKey: ['sections', projectId],
        queryFn: () => getProjectSections(db, projectId),
        enabled: !!projectId,
    });
}
export function useProjectMutations(db) {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] });
    const invalidateAreas = () => qc.invalidateQueries({ queryKey: ['areas'] });
    const addArea = useMutation({
        mutationFn: (area) => createArea(db, area),
        onSuccess: invalidateAreas,
    });
    const addProject = useMutation({
        mutationFn: (project) => createProject(db, project),
        onSuccess: invalidate,
    });
    const editProject = useMutation({
        mutationFn: ({ id, updates }) => updateProject(db, id, updates),
        onSuccess: invalidate,
    });
    const removeProject = useMutation({
        mutationFn: (id) => deleteProject(db, id),
        onSuccess: invalidate,
    });
    return { addArea, addProject, editProject, removeProject };
}
