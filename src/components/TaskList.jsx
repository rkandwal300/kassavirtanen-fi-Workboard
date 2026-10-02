import { useMemo, useState } from 'react';
import TaskCard from './TaskCard';

const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const TaskList = ({ tasks, users, projects, loading, pendingCreates, pendingUpdates, onEditTask, onDeleteTask, onStatusChange, onCreateTask }) => {
  const [sortBy, setSortBy] = useState('priority');
  const sortedTasks = useMemo(() => [...tasks].sort((left, right) => {
    if (sortBy === 'priority') return priorityRank[left.priority] - priorityRank[right.priority];
    if (sortBy === 'dueDate') return (left.dueDate || '9999').localeCompare(right.dueDate || '9999');
    if (sortBy === 'title') return left.title.localeCompare(right.title);
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  }), [sortBy, tasks]);

  if (loading) return <div className="loading-state" role="status"><span className="loading-mark" />Loading tasks</div>;

  if (!tasks.length) {
    return <div className="empty-state"><span className="empty-mark">0</span><h3>No tasks match this view</h3><p>Adjust your filters or create a task to get the board moving.</p><button className="text-button" type="button" onClick={onCreateTask}>Create a task <span aria-hidden="true">→</span></button></div>;
  }

  return <>
    <div className="list-tools"><span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} shown</span><label>Sort by <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="priority">Priority</option><option value="dueDate">Due date</option><option value="title">Title</option><option value="createdAt">Recently added</option></select></label></div>
    <div className="task-grid">
      {sortedTasks.map((task) => <TaskCard
        key={task.id}
        task={task}
        users={users}
        projects={projects}
        pending={pendingCreates.includes(task.id) || Boolean(pendingUpdates[task.id])}
        onEdit={() => onEditTask(task.id)}
        onDelete={() => onDeleteTask(task.id)}
        onStatusChange={(status) => onStatusChange(task.id, status)}
      />)}
    </div>
  </>;
};

export default TaskList;
