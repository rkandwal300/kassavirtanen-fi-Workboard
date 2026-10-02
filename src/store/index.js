import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { createLogger } from 'redux-logger';
import * as taskActions from './actions/taskActions';
import { CLEAR_FILTERS, CLOSE_TASK_FORM, OPEN_TASK_FORM, SET_FILTERS } from './actions/uiActions';
import rootSaga from './sagas/taskSagas';

const emptyCollection = { byId: {}, allIds: [] };
const initialFilters = { projectId: null, assigneeId: null, status: 'all', taskType: 'all', search: '' };
const normalize = (items) => ({
  byId: Object.fromEntries(items.map((item) => [item.id, item])),
  allIds: items.map((item) => item.id),
});

function tasksReducer(state = emptyCollection, action) {
  switch (action.type) {
    case taskActions.FETCH_TASKS_SUCCESS: {
      const fetched = normalize(action.tasks);
      return { byId: { ...state.byId, ...fetched.byId }, allIds: [...new Set([...state.allIds, ...fetched.allIds])] };
    }
    case taskActions.CREATE_TASK_OPTIMISTIC:
      return { byId: { ...state.byId, [action.task.id]: action.task }, allIds: [...state.allIds, action.task.id] };
    case taskActions.CREATE_TASK_SUCCESS: {
      const byId = { ...state.byId };
      delete byId[action.tempId];
      byId[action.task.id] = action.task;
      return { byId, allIds: state.allIds.map((id) => id === action.tempId ? action.task.id : id) };
    }
    case taskActions.CREATE_TASK_FAILURE: {
      const byId = { ...state.byId };
      delete byId[action.tempId];
      return { byId, allIds: state.allIds.filter((id) => id !== action.tempId) };
    }
    case taskActions.UPDATE_TASK_OPTIMISTIC:
      return { ...state, byId: { ...state.byId, [action.taskId]: { ...state.byId[action.taskId], ...action.updates } } };
    case taskActions.UPDATE_TASK_SUCCESS:
      return { ...state, byId: { ...state.byId, [action.taskId]: action.task } };
    case taskActions.UPDATE_TASK_FAILURE:
      return { ...state, byId: { ...state.byId, [action.taskId]: action.originalTask } };
    case taskActions.DELETE_TASK_OPTIMISTIC: {
      const byId = { ...state.byId };
      delete byId[action.taskId];
      return { byId, allIds: state.allIds.filter((id) => id !== action.taskId) };
    }
    case taskActions.DELETE_TASK_FAILURE: {
      const allIds = [...state.allIds];
      allIds.splice(Math.max(0, action.index), 0, action.taskId);
      return { byId: { ...state.byId, [action.taskId]: action.task }, allIds };
    }
    default:
      return state;
  }
}

function collectionReducer(successType, property) {
  return (state = emptyCollection, action) => action.type === successType ? normalize(action[property]) : state;
}

const entitiesReducer = combineReducers({
  tasks: tasksReducer,
  users: collectionReducer(taskActions.FETCH_USERS_SUCCESS, 'users'),
  projects: collectionReducer(taskActions.FETCH_PROJECTS_SUCCESS, 'projects'),
});

const initialUi = {
  taskForm: { isOpen: false, mode: 'create', taskId: null },
  filters: initialFilters,
  loading: { tasks: false, users: false, projects: false, saving: false },
  errors: { tasks: null, users: null, projects: null, form: null },
};

function uiReducer(state = initialUi, action) {
  switch (action.type) {
    case OPEN_TASK_FORM:
      return { ...state, taskForm: { isOpen: true, mode: action.mode, taskId: action.taskId }, errors: { ...state.errors, form: null } };
    case CLOSE_TASK_FORM:
      return { ...state, taskForm: { isOpen: false, mode: 'create', taskId: null }, errors: { ...state.errors, form: null } };
    case SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case CLEAR_FILTERS:
      return { ...state, filters: initialFilters };
    case taskActions.FETCH_TASKS_REQUEST:
      return { ...state, loading: { ...state.loading, tasks: true }, errors: { ...state.errors, tasks: null } };
    case taskActions.FETCH_TASKS_SUCCESS:
      return { ...state, loading: { ...state.loading, tasks: false } };
    case taskActions.FETCH_TASKS_FAILURE:
      return { ...state, loading: { ...state.loading, tasks: false }, errors: { ...state.errors, tasks: action.error } };
    case taskActions.FETCH_USERS_REQUEST:
      return { ...state, loading: { ...state.loading, users: true }, errors: { ...state.errors, users: null } };
    case taskActions.FETCH_USERS_SUCCESS:
      return { ...state, loading: { ...state.loading, users: false } };
    case taskActions.FETCH_USERS_FAILURE:
      return { ...state, loading: { ...state.loading, users: false }, errors: { ...state.errors, users: action.error } };
    case taskActions.FETCH_PROJECTS_REQUEST:
      return { ...state, loading: { ...state.loading, projects: true }, errors: { ...state.errors, projects: null } };
    case taskActions.FETCH_PROJECTS_SUCCESS:
      return { ...state, loading: { ...state.loading, projects: false } };
    case taskActions.FETCH_PROJECTS_FAILURE:
      return { ...state, loading: { ...state.loading, projects: false }, errors: { ...state.errors, projects: action.error } };
    case taskActions.CREATE_TASK_REQUEST:
    case taskActions.CREATE_TASK_OPTIMISTIC:
    case taskActions.UPDATE_TASK_REQUEST:
    case taskActions.UPDATE_TASK_OPTIMISTIC:
    case taskActions.DELETE_TASK_REQUEST:
    case taskActions.DELETE_TASK_OPTIMISTIC:
      return { ...state, loading: { ...state.loading, saving: true }, errors: { ...state.errors, form: null } };
    case taskActions.CREATE_TASK_SUCCESS:
    case taskActions.UPDATE_TASK_SUCCESS:
      return { ...state, taskForm: { isOpen: false, mode: 'create', taskId: null }, loading: { ...state.loading, saving: false }, errors: { ...state.errors, form: null } };
    case taskActions.DELETE_TASK_SUCCESS:
      return { ...state, loading: { ...state.loading, saving: false } };
    case taskActions.CREATE_TASK_FAILURE:
    case taskActions.UPDATE_TASK_FAILURE:
      return { ...state, loading: { ...state.loading, saving: false }, errors: { ...state.errors, form: action.error } };
    case taskActions.DELETE_TASK_FAILURE:
      return { ...state, loading: { ...state.loading, saving: false }, errors: { ...state.errors, tasks: action.error } };
    default:
      return state;
  }
}

const initialOptimistic = { pendingCreates: [], pendingUpdates: {}, pendingDeletes: [] };
function optimisticReducer(state = initialOptimistic, action) {
  switch (action.type) {
    case taskActions.CREATE_TASK_OPTIMISTIC:
      return { ...state, pendingCreates: [...state.pendingCreates, action.task.id] };
    case taskActions.CREATE_TASK_SUCCESS:
    case taskActions.CREATE_TASK_FAILURE:
      return { ...state, pendingCreates: state.pendingCreates.filter((id) => id !== action.tempId) };
    case taskActions.UPDATE_TASK_OPTIMISTIC:
      return { ...state, pendingUpdates: { ...state.pendingUpdates, [action.taskId]: true } };
    case taskActions.UPDATE_TASK_SUCCESS:
    case taskActions.UPDATE_TASK_FAILURE: {
      const pendingUpdates = { ...state.pendingUpdates };
      delete pendingUpdates[action.taskId];
      return { ...state, pendingUpdates };
    }
    case taskActions.DELETE_TASK_OPTIMISTIC:
      return { ...state, pendingDeletes: [...state.pendingDeletes, action.taskId] };
    case taskActions.DELETE_TASK_SUCCESS:
    case taskActions.DELETE_TASK_FAILURE:
      return { ...state, pendingDeletes: state.pendingDeletes.filter((id) => id !== action.taskId) };
    default:
      return state;
  }
}

const rootReducer = combineReducers({ entities: entitiesReducer, ui: uiReducer, optimistic: optimisticReducer });
const sagaMiddleware = createSagaMiddleware();
const logger = createLogger({ collapsed: true, predicate: () => import.meta.env.DEV });
const composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, traceLimit: 25 })
  : compose;
const store = createStore(rootReducer, composeEnhancers(applyMiddleware(sagaMiddleware, logger)));

sagaMiddleware.run(rootSaga);

export default store;
