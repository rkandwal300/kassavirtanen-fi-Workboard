import { STATUSES } from '../api/mockApi';

const priorityClass = (priority) => `priority-${(priority || 'low').toLowerCase()}`;
const initialsFor = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2);
const dueLabel = (date) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`));

const TaskCard = ({ task, users, projects, pending, onEdit, onDelete, onStatusChange }) => {
  const assignee = users.find((user) => user.id === task.assigneeId);
  const project = projects.find((item) => item.id === task.projectId);
  const overdue = task.dueDate && new Date(`${task.dueDate}T23:59:59`) < new Date() && task.status !== 'Done';
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((item) => item.completed).length || 0;
  let detail = '';
  if (task.taskType === 'Bug' && task.severity) detail = `Severity: ${task.severity}`;
  if (task.taskType === 'Feature' && task.acceptanceCriteria?.length) detail = `${task.acceptanceCriteria.length} acceptance criteria`;
  if (task.taskType === 'Enhancement') detail = task.proposedBehavior || '';
  if (task.taskType === 'Research') detail = task.expectedOutcomes || '';

  return <article className={`task-card ${task.taskType?.toLowerCase()} ${pending ? 'is-pending' : ''}`}>
    {pending && <span className="pending-label" role="status" aria-label="Saving task" title="Saving task" />}
    <div className="task-card-header">
      <div className="task-tags"><span className={`type-tag type-${task.taskType?.toLowerCase()}`}>{task.taskType}</span><span className={`priority-tag ${priorityClass(task.priority)}`}>{task.priority}</span></div>
      <div className="task-actions"><button className="quiet-action" type="button" onClick={onEdit} aria-label={`Edit ${task.title}`}>Edit</button><button className="quiet-action danger-action" type="button" onClick={onDelete} aria-label={`Delete ${task.title}`}>Delete</button></div>
    </div>
    <div className="task-content"><h3 className="task-title">{task.title}</h3>{task.description && <p className="task-description">{task.description}</p>}{detail && <p className="task-detail">{detail}</p>}</div>
    {subtaskCount > 0 && <div className="subtask-progress"><div className="subtask-track"><span style={{ width: `${(completedSubtasks / subtaskCount) * 100}%` }} /></div><span>{completedSubtasks}/{subtaskCount} subtasks</span></div>}
    {task.attachments?.length > 0 && <div className="attachment-count">{task.attachments.length} attachment{task.attachments.length === 1 ? '' : 's'}</div>}
    <footer className="task-footer">
      <div className="task-owner"><span className={`avatar ${assignee ? 'avatar-coral' : 'avatar-empty'}`}>{assignee ? initialsFor(assignee.name) : '?'}</span><span>{assignee?.name || 'Unassigned'}<small>{project?.name || 'No project'}</small></span></div>
      <div className="task-card-meta">{task.dueDate && <time className={overdue ? 'due-overdue' : ''} dateTime={task.dueDate}>{overdue ? 'Overdue · ' : 'Due '}{dueLabel(task.dueDate)}</time>}<label className="status-select-label"><span className="sr-only">Status for {task.title}</span><select value={task.status || 'Todo'} onChange={(event) => onStatusChange(event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
    </footer>
  </article>;
};

export default TaskCard;
