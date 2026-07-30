import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Plus, Trash2, CheckCircle2, Circle,
  User, Shield, Key, Eye, EyeOff, ClipboardList, Clock,
  Sparkles, CheckSquare, AlertCircle
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const Dashboard = () => {
  const { user, token, logout, getAuthHeaders } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTasks = async () => {
      setLoadingTasks(true);
      setTaskError('');
      try {
        const res = await fetch(`${API_BASE}/api/tasks`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            logout();
            return;
          }
          throw new Error('Could not retrieve tasks from protected API.');
        }

        const data = await res.json();
        if (isMounted) setTasks(data);
      } catch (err) {
        if (isMounted) setTaskError(err.message || 'Error occurred while loading tasks.');
      } finally {
        if (isMounted) setLoadingTasks(false);
      }
    };

    loadTasks();
    return () => { isMounted = false; };
  }, [logout, getAuthHeaders]);

  // Add a task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ title: newTaskTitle }),
      });

      if (!res.ok) {
        throw new Error('Failed to create secure task.');
      }

      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
    } catch (err) {
      setTaskError(err.message || 'Error occurred while saving task.');
    }
  };

  // Toggle task completion
  const handleToggleTask = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update task status.');
      }

      const updatedTask = await res.json();
      setTasks(tasks.map(t => t._id === id ? updatedTask : t));
    } catch (err) {
      setTaskError(err.message || 'Error updating task.');
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete task.');
      }

      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      setTaskError(err.message || 'Error deleting task.');
    }
  };

  // Decoded token representation for security visualization dashboard
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const decodedToken = token ? parseJwt(token) : null;
  const tokenParts = token ? token.split('.') : ['', '', ''];

  return (
    <div className="dashboard-container">
      {/* Navbar header */}
      <header className="dashboard-header glass-panel">
        <div className="header-brand">
          <Sparkles className="brand-logo" />
          <span className="brand-name">AuthFlow</span>

        </div>
        <div className="header-actions">
          <div className="user-profile">
            <div className="avatar">
              <User className="avatar-icon" />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Loading...'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button onClick={logout} className="btn-logout" title="Sign Out Securely">
            <LogOut className="logout-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Left Column: Security & JWT Details */}
        <section className="dashboard-card glass-panel security-panel animate-fade-in">
          <div className="card-header">
            <Shield className="card-icon text-indigo" />
            <h2>Security Diagnostics</h2>
          </div>
          <p className="card-subtitle">Inspect your cryptographically</p>

          <div className="token-viewer">
            <div className="token-viewer-header">
              <span className="token-label">
                <Key className="inline-icon" /> active_token.jwt
              </span>
              <button
              
                onClick={() => setShowToken(!showToken)}
                className="btn-toggle-token"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showToken ? 'Mask Token' : 'Reveal Token'}</span>
              </button>
            </div>

            <div className="token-string-box">
              {showToken ? (
                <p className="token-string font-mono">
                  <span className="token-header">{tokenParts[0]}</span>.
                  <span className="token-payload">{tokenParts[1]}</span>.
                  <span className="token-signature">{tokenParts[2]}</span>
                </p>
              ) : (
                <p className="token-string font-mono masked">
                  ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                </p>
              )}
            </div>

            <div className="token-legend">
              <span className="legend-item"><span className="legend-dot header-dot"></span> Header</span>
              <span className="legend-item"><span className="legend-dot payload-dot"></span> Payload</span>
              <span className="legend-item"><span className="legend-dot signature-dot"></span> Signature</span>
            </div>
          </div>

          <div className="decoded-data">
            <h3>Parsed Payload</h3>
            {decodedToken ? (
              <pre className="json-box font-mono">
                {JSON.stringify(decodedToken, null, 2)}
              </pre>
            ) : (
              <p className="error-text">Unable to decode token.</p>
            )}
          </div>

          <div className="security-tips">
            <div className="tip-box">
              <Clock className="tip-icon" />
              <div>
                <h4>Token Lifespan</h4>
                <p>Issued at {decodedToken?.iat ? new Date(decodedToken.iat * 1000).toLocaleString() : 'N/A'}. Valid for 7 days.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Interactive task list connected to protected endpoint */}
        <section className="dashboard-card glass-panel tasks-panel animate-fade-in delay-100">
          <div className="card-header">
            <ClipboardList className="card-icon text-pink" />
            <h2>Protected Tasks Database</h2>
          </div>
          <p className="card-subtitle">CRUD operations here verify JWT validation middleware headers</p>

          {taskError && (
            <div className="alert alert-danger">
              <AlertCircle className="alert-icon" />
              <span>{taskError}</span>
            </div>
          )}

          {/* New Task Form */}
          <form onSubmit={handleAddTask} className="task-form">
            <input
              type="text"
              placeholder="Create a new protected task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="task-input"
              maxLength={100}
            />
            <button type="submit" className="btn-add-task">
              <Plus size={18} />
              <span>Add</span>
            </button>
          </form>

          {/* Tasks list */}
          <div className="tasks-list-container">
            {loadingTasks ? (
              <div className="tasks-loading">
                <div className="spinner-mini"></div>
                <p>Retrieving tasks from secure pipeline...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="tasks-empty">
                <CheckSquare size={48} className="empty-icon" />
                <h3>No tasks found</h3>
                <p>All clear! Create a task to save it securely to your account database.</p>
              </div>
            ) : (
              <ul className="tasks-list">
                {tasks.map((task) => (
                  <li key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <button
                      onClick={() => handleToggleTask(task._id, task.completed)}
                      className="task-toggle"
                      title={task.completed ? 'Mark Incomplete' : 'Mark Completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="toggle-icon checked" />
                      ) : (
                        <Circle className="toggle-icon" />
                      )}
                    </button>
                    <span className="task-title">{task.title}</span>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="task-delete"
                      title="Delete Secure Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="tasks-count-bar">
            <span>
              Total: <strong>{tasks.length}</strong> tasks
            </span>
            <span>
              Completed: <strong>{tasks.filter(t => t.completed).length}</strong>
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
