import { all, call, delay, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { mockApi } from '../../api/mockApi';
import {
  CREATE_TASK_REQUEST,
  DELETE_TASK_REQUEST,
  FETCH_PROJECTS_REQUEST,
  FETCH_TASKS_REQUEST,
  FETCH_USERS_REQUEST,
  UPDATE_TASK_REQUEST,
  createTaskFailure,
  createTaskOptimistic,
  createTaskSuccess,
  deleteTaskFailure,
  deleteTaskOptimistic,
  deleteTaskSuccess,
  fetchProjectsFailure,
  fetchProjectsSuccess,
  fetchTasksFailure,
  fetchTasksSuccess,
  fetchUsersFailure,
  fetchUsersSuccess,
  updateTaskFailure,
  updateTaskOptimistic,
  updateTaskSuccess,
} from '../actions/taskActions';

function* callWithRetry(apiMethod, ...args) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return yield call(apiMethod, ...args);
    } catch (error) {
      lastError = error;
      if (attempt < 2) yield delay(250 * (attempt + 1));
    }
  }
  throw lastError;
}

export function* fetchTasksSaga(action) {
  yield delay(180);
  try {
    const response = yield call(callWithRetry, mockApi.fetchTasks, action.filters || {});
    yield put(fetchTasksSuccess(response.data));
  } catch (error) {
    yield put(fetchTasksFailure(error.message));
  }
}

export function* fetchUsersSaga() {
  try {
    const response = yield call(callWithRetry, mockApi.fetchUsers);
    yield put(fetchUsersSuccess(response.data));
  } catch (error) {
    yield put(fetchUsersFailure(error.message));
  }
}

export function* fetchProjectsSaga() {
  try {
    const response = yield call(callWithRetry, mockApi.fetchProjects);
    yield put(fetchProjectsSuccess(response.data));
  } catch (error) {
    yield put(fetchProjectsFailure(error.message));
  }
}

const clearDraft = (draftKey) => {
  if (!draftKey) return;
  try {
    window.localStorage.removeItem(draftKey);
  } catch {
    return;
  }
};

export function* createTaskSaga(action) {
  const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const optimisticTask = { ...action.task, id: tempId, status: action.task.status || 'Todo', createdAt: new Date().toISOString() };
  yield put(createTaskOptimistic(optimisticTask));
  try {
    const response = yield call(callWithRetry, mockApi.createTask, action.task);
    clearDraft(action.draftKey);
    yield put(createTaskSuccess(tempId, response.data));
  } catch (error) {
    yield put(createTaskFailure(tempId, error.message));
  }
}

export function* updateTaskSaga(action) {
  const originalTask = yield select((state) => state.entities.tasks.byId[action.taskId]);
  if (!originalTask) return;
  yield put(updateTaskOptimistic(action.taskId, action.updates));
  try {
    const response = yield call(callWithRetry, mockApi.updateTask, action.taskId, action.updates);
    clearDraft(action.draftKey);
    yield put(updateTaskSuccess(action.taskId, response.data));
  } catch (error) {
    yield put(updateTaskFailure(action.taskId, originalTask, error.message));
  }
}

export function* deleteTaskSaga(action) {
  const task = yield select((state) => state.entities.tasks.byId[action.taskId]);
  if (!task) return;
  const index = yield select((state) => state.entities.tasks.allIds.indexOf(action.taskId));
  yield put(deleteTaskOptimistic(action.taskId, task, index));
  try {
    yield call(callWithRetry, mockApi.deleteTask, action.taskId);
    yield put(deleteTaskSuccess(action.taskId));
  } catch (error) {
    yield put(deleteTaskFailure(action.taskId, task, index, error.message));
  }
}

export default function* rootSaga() {
  yield all([
    takeLatest(FETCH_TASKS_REQUEST, fetchTasksSaga),
    takeLatest(FETCH_USERS_REQUEST, fetchUsersSaga),
    takeLatest(FETCH_PROJECTS_REQUEST, fetchProjectsSaga),
    takeEvery(CREATE_TASK_REQUEST, createTaskSaga),
    takeEvery(UPDATE_TASK_REQUEST, updateTaskSaga),
    takeEvery(DELETE_TASK_REQUEST, deleteTaskSaga),
  ]);
}
