import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInboxTasks, getTodayTasks, getUpcomingTasks, getAnytimeTasks, getSomedayTasks, getProjectTasks, getSubtasks, getAssignedToMeTasks, createTask, updateTask, completeTask, deleteTask, reorderTasks, } from '@todo/core';
export function useInboxTasks(db, userId) {
    return useQuery({
        queryKey: ['tasks', 'inbox', userId],
        queryFn: () => getInboxTasks(db, userId),
        enabled: !!userId,
    });
}
export function useTodayTasks(db, userId) {
    return useQuery({
        queryKey: ['tasks', 'today', userId],
        queryFn: () => getTodayTasks(db, userId),
        enabled: !!userId,
    });
}
export function useUpcomingTasks(db, userId) {
    return useQuery({
        queryKey: ['tasks', 'upcoming', userId],
        queryFn: () => getUpcomingTasks(db, userId),
        enabled: !!userId,
    });
}
export function useAnytimeTasks(db, userId) {
    return useQuery({
        queryKey: ['tasks', 'anytime', userId],
        queryFn: () => getAnytimeTasks(db, userId),
        enabled: !!userId,
    });
}
export function useSomedayTasks(db, userId) {
    return useQuery({
        queryKey: ['tasks', 'someday', userId],
        queryFn: () => getSomedayTasks(db, userId),
        enabled: !!userId,
    });
}
export function useProjectTasks(db, projectId) {
    return useQuery({
        queryKey: ['tasks', 'project', projectId],
        queryFn: () => getProjectTasks(db, projectId),
        enabled: !!projectId,
    });
}
export function useSubtasks(db, parentTaskId) {
    return useQuery({
        queryKey: ['tasks', 'subtasks', parentTaskId],
        queryFn: () => getSubtasks(db, parentTaskId),
        enabled: !!parentTaskId,
    });
}
export function useAssignedToMeTasks(db, userId) {
    return useQuery({
        queryKey: ['tasks', 'assigned', userId],
        queryFn: () => getAssignedToMeTasks(db, userId),
        enabled: !!userId,
    });
}
export function useTaskMutations(db) {
    const qc = useQueryClient();
    const invalidateAll = () => qc.invalidateQueries({ queryKey: ['tasks'] });
    const create = useMutation({
        mutationFn: (task) => createTask(db, task),
        onSuccess: invalidateAll,
    });
    const update = useMutation({
        mutationFn: ({ id, updates }) => updateTask(db, id, updates),
        onSuccess: invalidateAll,
    });
    const complete = useMutation({
        mutationFn: (id) => completeTask(db, id),
        onSuccess: invalidateAll,
    });
    const remove = useMutation({
        mutationFn: (id) => deleteTask(db, id),
        onSuccess: invalidateAll,
    });
    const reorder = useMutation({
        mutationFn: (updates) => reorderTasks(db, updates),
        onSuccess: invalidateAll,
    });
    return { create, update, complete, remove, reorder };
}
