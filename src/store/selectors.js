import { createSelector } from 'reselect';

export const selectTaskEntities = (state) => state.entities.tasks.byId;
export const selectTaskIds = (state) => state.entities.tasks.allIds;
export const selectUsers = createSelector(
  [(state) => state.entities.users.byId, (state) => state.entities.users.allIds],
  (byId, allIds) => allIds.map((id) => byId[id]),
);
export const selectProjects = createSelector(
  [(state) => state.entities.projects.byId, (state) => state.entities.projects.allIds],
  (byId, allIds) => allIds.map((id) => byId[id]),
);
export const selectAllTasks = createSelector(
  [selectTaskEntities, selectTaskIds],
  (byId, allIds) => allIds.map((id) => byId[id]).filter(Boolean),
);
export const selectFilters = (state) => state.ui.filters;
export const selectFilteredTasks = createSelector(
  [selectAllTasks, selectFilters],
  (tasks, filters) => {
    const search = filters.search.trim().toLowerCase();
    return tasks.filter((task) => (
      (!filters.projectId || task.projectId === filters.projectId)
      && (!filters.assigneeId || task.assigneeId === filters.assigneeId)
      && (filters.status === 'all' || task.status === filters.status)
      && (filters.taskType === 'all' || task.taskType === filters.taskType)
      && (!search || `${task.title} ${task.description || ''}`.toLowerCase().includes(search))
    ));
  },
);
export const selectTaskById = (state, taskId) => state.entities.tasks.byId[taskId];
export const selectTaskForm = (state) => state.ui.taskForm;
export const selectLoading = (state) => state.ui.loading;
export const selectErrors = (state) => state.ui.errors;
export const selectTaskStats = createSelector([selectAllTasks], (tasks) => ({
  total: tasks.length,
  active: tasks.filter((task) => task.status === 'In Progress').length,
  review: tasks.filter((task) => task.status === 'Review').length,
  done: tasks.filter((task) => task.status === 'Done').length,
}));
