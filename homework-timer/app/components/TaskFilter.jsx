'use client';

import './TaskFilter.css';

export default function TaskFilter({ searchQuery, onSearchChange, sortOption, onSortChange }) {
  return (
    <div className="task-filter-container">
      <div style={{ flex: 1 }}>
        <input
          type="text"
          placeholder="Filter by title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sort-wrapper">
        <label htmlFor="sort" className="sort-label">
          Sort by:
        </label>
        <select
          id="sort"
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="title-asc">Title (A → Z)</option>
          <option value="title-desc">Title (Z → A)</option>
          <option value="time-desc">Time Elapsed (Longest First)</option>
          <option value="time-asc">Time Elapsed (Shortest First)</option>
        </select>
      </div>
    </div>
  );
}