import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchProjectsRequest,
  fetchTasksRequest,
  fetchUsersRequest,
  updateTaskRequest,
} from '../store/actions/taskActions';
import { closeTaskForm, openTaskForm, setFilters } from '../store/actions/uiActions';
import {
  selectErrors,
  selectFilteredTasks,
  selectFilters,
  selectProjects,
  selectTaskById,
  selectTaskForm,
  selectTaskStats,
  selectUsers,
} from '../store/selectors';
import FilterBar from './FilterBar';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const TaskDashboard = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(selectFilteredTasks);
  const allTasks = useSelector((state) => state.entities.tasks.allIds);
  const users = useSelector(selectUsers);
  const projects = useSelector(selectProjects);
  const filters = useSelector(selectFilters);
  const form = useSelector(selectTaskForm);
  const loading = useSelector((state) => state.ui.loading);
  const errors = useSelector(selectErrors);
  const stats = useSelector(selectTaskStats);
  const initialData = useSelector((state) => selectTaskById(state, form.taskId));
  const optimistic = useSelector((state) => state.optimistic);

  useEffect(() => {
    dispatch(fetchTasksRequest());
    dispatch(fetchUsersRequest());
    dispatch(fetchProjectsRequest());
    try {
      if (window.localStorage.getItem('workboard-task-draft')) dispatch(openTaskForm('create'));
    } catch {
      return;
    }
  }, [dispatch]);

  const handleFiltersChange = (nextFilters) => {
    dispatch(setFilters(nextFilters));
    dispatch(fetchTasksRequest(nextFilters));
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Delete this task? This action cannot be undone.')) {
      dispatch(deleteTaskRequest(taskId));
    }
  };

  const handleFormSubmit = (taskData, draftKey) => {
    if (form.mode === 'edit') {
      dispatch(updateTaskRequest(form.taskId, taskData, draftKey));
      return;
    }
    dispatch(createTaskRequest(taskData, draftKey));
  };

  const openCreateForm = () => dispatch(openTaskForm('create'));
  const openEditForm = (taskId) => dispatch(openTaskForm('edit', taskId));

  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <a className="brand-mark" href="#dashboard" aria-label="Workboard home"><span className="brand-symbol">W</span><span>workboard</span></a>
        <p className="sidebar-section-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          <a className="nav-item active" href="#tasks"><span className="nav-indicator" />Tasks<span className="nav-count">{allTasks.length}</span></a>
          <a className="nav-item" href="#projects"><span className="nav-indicator" />Projects</a>
          <a className="nav-item" href="#team"><span className="nav-indicator" />Team</a>
        </nav>
        <div className="sidebar-bottom"><span className="avatar avatar-lime">RA</span><span><strong>Riley Adams</strong><small>Product team</small></span><span className="sidebar-menu-mark" aria-hidden="true">•••</span></div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Tasks</strong></div><div className="topbar-meta"><span className="sync-status"><span />All changes synced</span><span className="avatar avatar-coral">RA</span></div></header>

        <section className="page-heading" id="tasks">
          <div><p className="eyebrow">PROJECT OPERATIONS <span>·</span> {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()}</p><h1>Task board<span className="heading-period">.</span></h1><p className="page-subtitle">A clear view of what is moving, what is next, and what needs attention.</p></div>
          <button className="primary-button" type="button" onClick={openCreateForm}><span aria-hidden="true">+</span> New task</button>
        </section>

        <section className="stats-row" aria-label="Task overview">
          <div className="stat-item"><span className="stat-label">All tasks</span><strong>{stats.total.toString().padStart(2, '0')}</strong><span className="stat-note">in this workspace</span></div>
          <div className="stat-item"><span className="stat-label">In progress</span><strong>{stats.active.toString().padStart(2, '0')}</strong><span className="stat-note">currently moving</span></div>
          <div className="stat-item"><span className="stat-label">In review</span><strong>{stats.review.toString().padStart(2, '0')}</strong><span className="stat-note">awaiting feedback</span></div>
          <div className="stat-item"><span className="stat-label">Completed</span><strong>{stats.done.toString().padStart(2, '0')}</strong><span className="stat-note">across all projects</span></div>
        </section>

        {(errors.tasks || errors.users || errors.projects) && <div className="notice notice-error" role="alert"><span>{errors.tasks || errors.users || errors.projects}</span><button type="button" onClick={() => { dispatch(fetchTasksRequest(filters)); dispatch(fetchUsersRequest()); dispatch(fetchProjectsRequest()); }}>Retry loading</button></div>}
        {errors.form && <div className="notice notice-error" role="alert">{errors.form}</div>}

        <FilterBar filters={filters} projects={projects} users={users} onFiltersChange={handleFiltersChange} />

        <section className="board-section" aria-label="Tasks">
          <div className="board-heading"><div><p className="eyebrow">CURRENT WORK</p><h2>Tasks <span>{tasks.length}</span></h2></div><div className="board-legend"><span><i className="legend-dot dot-high" />High priority</span><span><i className="legend-dot dot-done" />Completed</span></div></div>
          <TaskList
            tasks={tasks}
            users={users}
            projects={projects}
            loading={loading.tasks}
            pendingCreates={optimistic.pendingCreates}
            pendingUpdates={optimistic.pendingUpdates}
            onEditTask={openEditForm}
            onDeleteTask={handleDeleteTask}
            onStatusChange={(taskId, status) => dispatch(updateTaskRequest(taskId, { status }))}
            onCreateTask={openCreateForm}
          />
        </section>
      </main>

      <TaskForm
        isOpen={form.isOpen}
        mode={form.mode}
        initialData={initialData || null}
        users={users}
        projects={projects}
        loading={loading.saving}
        error={errors.form}
        onSubmit={handleFormSubmit}
        onClose={() => dispatch(closeTaskForm())}
      />
    </div>
  );
};

export default TaskDashboard;
