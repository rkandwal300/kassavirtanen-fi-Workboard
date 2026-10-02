import { useEffect, useState } from 'react';
import { STATUSES, TASK_TYPES } from '../api/mockApi';

const FilterBar = ({ filters, projects, users, onFiltersChange }) => {
  const [search, setSearch] = useState(filters.search || '');

  useEffect(() => setSearch(filters.search || ''), [filters.search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== filters.search) onFiltersChange({ ...filters, search });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters, onFiltersChange, search]);

  const handleChange = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const project = projects.find((item) => item.id === filters.projectId);
  const visibleUsers = project ? users.filter((user) => project.userIds.includes(user.id)) : users;
  const activeCount = [filters.projectId, filters.assigneeId, filters.status !== 'all', filters.taskType !== 'all', filters.search].filter(Boolean).length;
  const clearAll = () => {
    setSearch('');
    onFiltersChange({ projectId: null, assigneeId: null, status: 'all', taskType: 'all', search: '' });
  };

  return <section className="filter-panel" aria-label="Task filters">
    <div className="filter-topline"><span className="filter-caption">FILTER & FIND</span><button className="clear-button" type="button" onClick={clearAll} disabled={!activeCount}>Clear all{activeCount > 0 && <span>{activeCount}</span>}</button></div>
    <div className="filter-controls">
      <label className="search-control"><span className="sr-only">Search tasks</span><span className="search-glyph" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or details" /></label>
      <label className="filter-control"><span>Project</span><select value={filters.projectId || ''} onChange={(event) => handleChange('projectId', event.target.value || null)}><option value="">All projects</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="filter-control"><span>Assignee</span><select value={filters.assigneeId || ''} onChange={(event) => handleChange('assigneeId', event.target.value || null)}><option value="">Anyone</option>{visibleUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
      <label className="filter-control"><span>Status</span><select value={filters.status || 'all'} onChange={(event) => handleChange('status', event.target.value)}><option value="all">Any status</option>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label className="filter-control"><span>Type</span><select value={filters.taskType || 'all'} onChange={(event) => handleChange('taskType', event.target.value)}><option value="all">Any type</option>{TASK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
    </div>
  </section>;
};

export default FilterBar;
