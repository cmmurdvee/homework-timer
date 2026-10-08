'use client';

import { useState, useEffect, useMemo } from 'react';
import TaskForm from './components/TaskForm';
import TaskCard from './components/TaskCard';
import TaskFilter from './components/TaskFilter';
import './page.css';

const getElapsedTime = (task, now) => {
  const startMs = task.start_time ? new Date(task.start_time).getTime() : 0;
  const endMs = task.end_time ? new Date(task.end_time).getTime() : 0;

  if (task.status === 'completed' && startMs && endMs) {
    return endMs - startMs;
  }
  if (task.status === 'running' && startMs) {
    return now - startMs;
  }
  return 0;
};

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [error, setError] = useState('');
  const [now, setNow] = useState(0);

  // Fetch tasks from /api/get-tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/get-tasks');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Could not load tasks.');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add Task
  const handleAddTask = async (title, description) => {
    try {
      const res = await fetch('/api/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const newTask = await res.json();
      if (!res.ok) throw new Error(newTask.error);
      setTasks((prev) => [newTask, ...prev]);
      setError('');
      return true;
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Could not save the task.');
      return false;
    }
  };

  // Start Timer via /api/start-timer
  const handleStart = async (id) => {
    try {
      const res = await fetch('/api/start-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const updatedTask = await res.json();
      if (!res.ok) throw new Error(updatedTask.error);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      setError('');
    } catch (err) {
      console.error('Error starting timer:', err);
      setError('Could not start the timer.');
    }
  };

  // End Timer via /api/end-timer
  const handleEnd = async (id) => {
    try {
      const res = await fetch('/api/end-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const updatedTask = await res.json();
      if (!res.ok) throw new Error(updatedTask.error);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      setError('');
    } catch (err) {
      console.error('Error ending timer:', err);
      setError('Could not stop the timer.');
    }
  };

  // Delete Task
  const handleDelete = async (id) => {
    try {
      const res = await fetch('/api/delete-task', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError('');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Could not delete the task.');
    }
  };

  // Running timers change every second, so re-sort while sorting by time
  const isTimeSort = sortOption.startsWith('time');
  const hasRunning = tasks.some((t) => t.status === 'running');

  useEffect(() => {
    if (!isTimeSort || !hasRunning) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [isTimeSort, hasRunning]);

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortOption) {
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'time-desc':
            return getElapsedTime(b, now) - getElapsedTime(a, now);
          case 'time-asc':
            return getElapsedTime(a, now) - getElapsedTime(b, now);
          case 'newest':
          default:
            return 0;
        }
      });
  }, [tasks, searchQuery, sortOption, now]);

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <header className="app-header">
          <h1 className="app-title">Homework Timer</h1>
          <p className="app-subtitle">See how long your homework really takes</p>
        </header>

        {error && <p className="error-message">{error}</p>}

        <TaskForm onAddTask={handleAddTask} />

        <TaskFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        {filteredAndSortedTasks.length === 0 ? (
          <div className="empty-state">
            No tasks found. Create one above to get started!
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStart}
                onEnd={handleEnd}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}