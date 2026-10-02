export const OPEN_TASK_FORM = 'OPEN_TASK_FORM';
export const CLOSE_TASK_FORM = 'CLOSE_TASK_FORM';
export const SET_FILTERS = 'SET_FILTERS';
export const CLEAR_FILTERS = 'CLEAR_FILTERS';

export const openTaskForm = (mode = 'create', taskId = null) => ({ type: OPEN_TASK_FORM, mode, taskId });
export const closeTaskForm = () => ({ type: CLOSE_TASK_FORM });
export const setFilters = (filters) => ({ type: SET_FILTERS, filters });
export const clearFilters = () => ({ type: CLEAR_FILTERS });
