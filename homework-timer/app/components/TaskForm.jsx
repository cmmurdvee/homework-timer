'use client';

import { useState } from 'react';
import './TaskForm.css';

export default function TaskForm({ onAddTask }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    await onAddTask(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="task-form-container">
      <h2 className="task-form-title">Create New Task</h2>

      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Title <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          placeholder="e.g. Physics Homework Chapter 3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description <span className="optional-text">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={2}
          placeholder="e.g. Solve problems 10 through 25"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-textarea"
        />
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Saving...' : 'Add Task'}
      </button>
    </form>
  );
}