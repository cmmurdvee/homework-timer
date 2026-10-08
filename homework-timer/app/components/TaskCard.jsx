'use client';

import { useEffect, useState } from 'react';
import './TaskCard.css';

const formatDuration = (ms) => {
    if (ms < 0 || isNaN(ms)) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
};

const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

export default function TaskCard({ task, onStart, onEnd, onDelete }) {
    const [now, setNow] = useState(0);

    const startMs = task.start_time ? new Date(task.start_time).getTime() : null;
    const endMs = task.end_time ? new Date(task.end_time).getTime() : null;
    const isRunning = task.status === 'running' && startMs;

    useEffect(() => {
        if (!isRunning) return;

        const tick = () => setNow(Date.now());
        const first = setTimeout(tick, 0);
        const interval = setInterval(tick, 1000);

        return () => {
            clearTimeout(first);
            clearInterval(interval);
        };
    }, [isRunning]);

    let elapsed = 0;
    if (isRunning && now) {
        elapsed = now - startMs;
    } else if (task.status === 'completed' && startMs && endMs) {
        elapsed = endMs - startMs;
    }

    return (
        <div className="task-card">
            <div>
                <div className="task-card-header">
                    <h3 className="task-card-title">{task.title}</h3>
                    <button onClick={() => onDelete(task.id)} className="delete-btn" title="Delete Task">
                        ✕
                    </button>
                </div>

                {task.description && <p className="task-card-desc">{task.description}</p>}
            </div>

            <div className="task-card-footer">
                <div className="timing-grid">
                    <div>
                        <span className="timing-label">Start Time</span>
                        <span>{formatTime(task.start_time)}</span>
                    </div>
                    <div>
                        <span className="timing-label">End Time</span>
                        <span>{formatTime(task.end_time)}</span>
                    </div>
                </div>

                <div className="elapsed-box">
                    <span className="elapsed-label">Time Elapsed:</span>
                    <span className="elapsed-value">{formatDuration(elapsed)}</span>
                </div>

                {task.status === 'idle' && (
                    <button onClick={() => onStart(task.id)} className="action-btn action-btn-start">
                        Start Timer
                    </button>
                )}

                {task.status === 'running' && (
                    <button onClick={() => onEnd(task.id)} className="action-btn action-btn-end">
                        End Timer & Calculate
                    </button>
                )}

                {task.status === 'completed' && (
                    <div className="completed-badge">✓ Completed</div>
                )}
            </div>
        </div>
    );
}