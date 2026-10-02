import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { BUG_SEVERITIES, PRIORITIES, TASK_TYPES } from '../api/mockApi';

const createDraftKey = 'workboard-task-draft';
const toFieldArray = (values) => values?.length ? values.map((value) => ({ value: typeof value === 'string' ? value : value.value || '' })) : [{ value: '' }];
const formValues = (task = {}) => ({
  ...task,
  title: task.title || '',
  description: task.description || '',
  taskType: task.taskType || 'Bug',
  priority: task.priority || 'Medium',
  status: task.status || 'Todo',
  dueDate: task.dueDate || '',
  projectId: task.projectId || '',
  assigneeId: task.assigneeId || '',
  severity: task.severity || 'Medium',
  stepsToReproduce: task.stepsToReproduce || '',
  businessValue: task.businessValue || '',
  acceptanceCriteria: toFieldArray(task.acceptanceCriteria),
  currentBehavior: task.currentBehavior || '',
  proposedBehavior: task.proposedBehavior || '',
  researchQuestions: toFieldArray(task.researchQuestions),
  expectedOutcomes: task.expectedOutcomes || '',
  attachments: task.attachments || [],
  subtasks: (task.subtasks || []).map((subtask) => ({ completed: false, ...subtask })),
});

const readDraft = (key) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const TaskForm = ({ isOpen, mode, initialData, onSubmit, onClose, users, projects, loading, error }) => {
  const draftKey = mode === 'edit' && initialData ? `${createDraftKey}-${initialData.id}` : createDraftKey;
  const { register, handleSubmit, control, reset, watch, getValues, setValue, formState: { errors, isValid, isDirty } } = useForm({ mode: 'onChange', defaultValues: formValues() });
  const criteria = useFieldArray({ control, name: 'acceptanceCriteria', keyName: 'fieldKey' });
  const questions = useFieldArray({ control, name: 'researchQuestions', keyName: 'fieldKey' });
  const subtasks = useFieldArray({ control, name: 'subtasks', keyName: 'fieldKey' });
  const taskType = watch('taskType');
  const projectId = watch('projectId');
  const attachments = watch('attachments') || [];
  const project = projects.find((item) => item.id === projectId);
  const availableUsers = project ? users.filter((user) => project.userIds.includes(user.id)) : users;

  useEffect(() => {
    if (!isOpen) return;
    reset(formValues(mode === 'create' ? readDraft(draftKey) || {} : initialData || {}));
  }, [draftKey, initialData, isOpen, mode, reset]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setInterval(() => {
      if (!isDirty) return;
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(getValues()));
      } catch {
        return;
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [draftKey, getValues, isDirty, isOpen]);

  useEffect(() => {
    if (!projectId) return;
    const currentAssignee = getValues('assigneeId');
    if (currentAssignee && !availableUsers.some((user) => user.id === currentAssignee)) {
      setValue('assigneeId', '', { shouldValidate: true });
    }
  }, [availableUsers, getValues, projectId, setValue]);

  const submitForm = (values) => {
    const payload = {
      ...values,
      dueDate: values.dueDate || null,
      projectId: values.projectId || null,
      assigneeId: values.assigneeId || null,
      acceptanceCriteria: values.acceptanceCriteria.map((item) => item.value.trim()).filter(Boolean),
      researchQuestions: values.researchQuestions.map((item) => item.value.trim()).filter(Boolean),
      subtasks: values.subtasks.filter((item) => item.title.trim()).map((item) => ({
        id: item.id || `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: item.title.trim(),
        completed: Boolean(item.completed),
      })),
    };
    if (values.taskType !== 'Bug') {
      delete payload.severity;
      delete payload.stepsToReproduce;
    }
    if (values.taskType !== 'Feature') {
      delete payload.businessValue;
      delete payload.acceptanceCriteria;
    }
    if (values.taskType !== 'Enhancement') {
      delete payload.currentBehavior;
      delete payload.proposedBehavior;
    }
    if (values.taskType !== 'Research') {
      delete payload.researchQuestions;
      delete payload.expectedOutcomes;
    }
    onSubmit(payload, draftKey);
  };

  if (!isOpen) return null;

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <header className="modal-header"><div><p className="eyebrow">{mode === 'create' ? 'ADD TO THE BOARD' : 'TASK DETAILS'}</p><h2 id="form-title">{mode === 'create' ? 'Create a task' : 'Edit task'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close task form">Close</button></header>
      <form className="task-form" onSubmit={handleSubmit(submitForm)} noValidate>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <section className="form-section"><div className="form-section-heading"><span>01</span><h3>Task details</h3></div>
          <div className="form-field"><label htmlFor="task-title">Title <span>Required</span></label><input id="task-title" autoFocus {...register('title', { required: 'Add a title.', minLength: { value: 3, message: 'Use at least 3 characters.' } })} placeholder="What needs to get done?" aria-invalid={Boolean(errors.title)} />{errors.title && <p className="field-error">{errors.title.message}</p>}</div>
          <div className="form-field"><label htmlFor="task-description">Description <span>Optional</span></label><textarea id="task-description" rows="3" maxLength={500} {...register('description', { maxLength: { value: 500, message: 'Keep the description under 500 characters.' } })} placeholder="Add context, links, or notes" />{errors.description && <p className="field-error">{errors.description.message}</p>}<span className="field-hint">Up to 500 characters</span></div>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="task-type">Task type</label><select id="task-type" {...register('taskType', { required: true })}>{TASK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
            <div className="form-field"><label htmlFor="task-priority">Priority</label><select id="task-priority" {...register('priority', { required: true })}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></div>
            <div className="form-field"><label htmlFor="task-due-date">Due date <span>Optional</span></label><input id="task-due-date" type="date" {...register('dueDate')} /></div>
          </div>
        </section>

        <section className="form-section"><div className="form-section-heading"><span>02</span><h3>{taskType} details</h3></div>
          {taskType === 'Bug' && <><div className="form-field"><label htmlFor="task-severity">Severity</label><select id="task-severity" {...register('severity')}>{BUG_SEVERITIES.map((severity) => <option key={severity}>{severity}</option>)}</select></div><div className="form-field"><label htmlFor="task-steps">Steps to reproduce</label><textarea id="task-steps" rows="3" {...register('stepsToReproduce')} placeholder={'1. First step\n2. Next step'} /></div></>}
          {taskType === 'Feature' && <><div className="form-field"><label htmlFor="business-value">Business value</label><textarea id="business-value" rows="3" {...register('businessValue')} placeholder="What value will this deliver?" /></div><div className="form-field"><div className="array-heading"><label>Acceptance criteria</label><button className="small-action" type="button" onClick={() => criteria.append({ value: '' })}>Add criterion</button></div>{criteria.fields.map((field, index) => <div className="array-row" key={field.fieldKey}><input aria-label={`Acceptance criterion ${index + 1}`} {...register(`acceptanceCriteria.${index}.value`)} placeholder={`Criterion ${index + 1}`} /><button className="remove-action" type="button" onClick={() => criteria.remove(index)} aria-label={`Remove criterion ${index + 1}`}>Remove</button></div>)}</div></>}
          {taskType === 'Enhancement' && <><div className="form-field"><label htmlFor="current-behavior">Current behavior</label><textarea id="current-behavior" rows="3" {...register('currentBehavior')} placeholder="What happens today?" /></div><div className="form-field"><label htmlFor="proposed-behavior">Proposed behavior</label><textarea id="proposed-behavior" rows="3" {...register('proposedBehavior')} placeholder="What should happen instead?" /></div></>}
          {taskType === 'Research' && <><div className="form-field"><div className="array-heading"><label>Research questions</label><button className="small-action" type="button" onClick={() => questions.append({ value: '' })}>Add question</button></div>{questions.fields.map((field, index) => <div className="array-row" key={field.fieldKey}><input aria-label={`Research question ${index + 1}`} {...register(`researchQuestions.${index}.value`)} placeholder={`Question ${index + 1}`} /><button className="remove-action" type="button" onClick={() => questions.remove(index)} aria-label={`Remove question ${index + 1}`}>Remove</button></div>)}</div><div className="form-field"><label htmlFor="expected-outcomes">Expected outcomes</label><textarea id="expected-outcomes" rows="3" {...register('expectedOutcomes')} placeholder="What should this research clarify?" /></div></>}
        </section>

        <section className="form-section"><div className="form-section-heading"><span>03</span><h3>People & project</h3></div><div className="form-grid">
          <div className="form-field"><label htmlFor="task-project">Project</label><select id="task-project" {...register('projectId')}><option value="">No project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="form-field"><label htmlFor="task-assignee">Assignee</label><select id="task-assignee" {...register('assigneeId')}><option value="">Unassigned</option>{availableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select><span className="field-hint">{project ? `People on ${project.name}` : 'Choose a project to narrow the list'}</span></div>
        </div></section>

        <section className="form-section"><div className="form-section-heading"><span>04</span><h3>Attachments & subtasks</h3></div>
          <div className="form-field"><label htmlFor="task-files">Attachments <span>File names only</span></label><input id="task-files" type="file" multiple onChange={(event) => { const names = Array.from(event.target.files || []).map((file) => file.name); setValue('attachments', [...attachments, ...names], { shouldDirty: true }); event.target.value = ''; }} />{attachments.length > 0 && <div className="attachment-list">{attachments.map((name, index) => <span className="attachment-chip" key={`${name}-${index}`}>{name}<button type="button" aria-label={`Remove ${name}`} onClick={() => setValue('attachments', attachments.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true })}>×</button></span>)}</div>}</div>
          <div className="form-field"><div className="array-heading"><label>Subtasks</label><button className="small-action" type="button" onClick={() => subtasks.append({ title: '', completed: false })}>Add subtask</button></div>{subtasks.fields.length === 0 && <p className="field-hint">Break the task into smaller steps.</p>}{subtasks.fields.map((field, index) => <div className="subtask-row" key={field.fieldKey}><input type="checkbox" aria-label={`Complete subtask ${index + 1}`} {...register(`subtasks.${index}.completed`)} /><input aria-label={`Subtask ${index + 1}`} {...register(`subtasks.${index}.title`)} placeholder={`Subtask ${index + 1}`} /><button className="remove-action" type="button" onClick={() => subtasks.remove(index)} aria-label={`Remove subtask ${index + 1}`}>Remove</button></div>)}</div>
        </section>
        <footer className="modal-actions"><span>Draft saves on this device</span><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className={`primary-button form-submit${loading ? ' is-saving' : ''}`} type="submit" disabled={loading || !isValid} aria-busy={loading}>{mode === 'create' ? 'Create task' : 'Save changes'}{loading && <span className="button-spinner" role="status" aria-label="Saving changes" />}</button></footer>
      </form>
    </section>
  </div>;
};

export default TaskForm;
