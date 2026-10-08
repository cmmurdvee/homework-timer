'use client';

import { useState, useEffect, useMemo } from 'react';
import TaskForm from './components/TaskForm';
import TaskCard from './components/TaskCard';
import TaskFilter from './components/TaskFilter';
import './page.css';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Fetch tasks from /api/get-tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/get-tasks');
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
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
      if (res.ok) {
        setTasks((prev) => [newTask, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
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
      if (res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      }
    } catch (err) {
      console.error('Error starting timer:', err);
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
      if (res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      }
    } catch (err) {
      console.error('Error ending timer:', err);
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
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const getElapsedTime = (task) => {
    const startMs = task.start_time ? new Date(task.start_time).getTime() : 0;
    const endMs = task.end_time ? new Date(task.end_time).getTime() : 0;

    if (task.status === 'completed' && startMs && endMs) {
      return endMs - startMs;
    }
    if (task.status === 'running' && startMs) {
      return Date.now() - startMs;
    }
    return 0;
  };

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
            return getElapsedTime(b) - getElapsedTime(a);
          case 'time-asc':
            return getElapsedTime(a) - getElapsedTime(b);
          case 'newest':
          default:
            return 0;
        }
      });
  }, [tasks, searchQuery, sortOption]);

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <header className="app-header">
          <h1 className="app-title">Homework Timer</h1>
          <p className="app-subtitle">Next.js & Supabase Assignment Tracker</p>
        </header>

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