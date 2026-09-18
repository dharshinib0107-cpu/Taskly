import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const socket = io('http://localhost:5000');
function Dashboard() {

  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [showNotifications, setShowNotifications] = useState(false);

  const [expandedTask, setExpandedTask] = useState(null);
  const [subtaskInput, setSubtaskInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    category: 'Personal',
    tags: '',
    recurring: false,
    recurrence: ''
  });

  const token = localStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchTasks();
    socket.on('taskCreated', () => {
      console.log('Received taskCreated event');
      fetchTasks();
    });
    socket.on('taskUpdated', () => {
      console.log('Received taskUpdated event');
      fetchTasks();
    });
    socket.on('taskDeleted', (taskId) => {
      console.log('Received taskDeleted event');

      setTasks((previous) =>
        previous.filter((task) => task._id !== taskId)
      );
    });
    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
      socket.off('subtaskUpdated');
      socket.on('subtaskUpdated', (updatedTask) => {
        console.log('Received subtaskUpdated event');

        setTasks((previous) =>
          previous.map((task) =>
            task._id === updatedTask._id
              ? updatedTask
              : task
          )
        );
      });

    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        'http://localhost:5000/api/tasks',
        authConfig
      );

      setTasks(response.data);

    } catch (error) {
      console.error('Error fetching tasks:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);

    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'Medium',
      category: 'Personal'
    });

    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);

    setFormData({
      title: task.title || '',
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'Medium',
      category: task.category || 'Personal'
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag !== '')
      };

      if (editingTask) {
        const response = await axios.put(
          `http://localhost:5000/api/tasks/${editingTask._id}`,
          dataToSend,
          authConfig
        );

        setTasks((previous) =>
          previous.map((task) =>
            task._id === editingTask._id
              ? response.data
              : task
          )
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/tasks',
          dataToSend,
          authConfig
        );
      }

      closeModal();

    } catch (error) {
      console.error('Error saving task:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };
  const toggleTask = async (task) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        {
          completed: !task.completed
        },
        authConfig
      );

      setTasks((previous) =>
        previous.map((item) =>
          item._id === task._id
            ? response.data
            : item
        )
      );

    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const addSubtask = async (taskId) => {
    if (!subtaskInput.trim()) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${taskId}/subtasks`,
        {
          title: subtaskInput.trim()
        },
        authConfig
      );

      setTasks((previous) =>
        previous.map((task) =>
          task._id === taskId
            ? response.data
            : task
        )
      );

      setSubtaskInput('');

    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/subtasks/${subtaskId}`,
        {},
        authConfig
      );

      setTasks((previous) =>
        previous.map((task) =>
          task._id === taskId
            ? response.data
            : task
        )
      );

    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const deleteSubtask = async (taskId, subtaskId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/tasks/${taskId}/subtasks/${subtaskId}`,
        authConfig
      );

      setTasks((previous) =>
        previous.map((task) =>
          task._id === taskId
            ? response.data
            : task
        )
      );

    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const deleteTask = async (id) => {

    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/${id}`,
        authConfig
      );

      setTasks((previous) =>
        previous.filter((task) => task._id !== id)
      );

    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };


  const archiveTask = async (id) => {

    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${id}/archive`,
        {},
        authConfig
      );

      setTasks((previous) =>
        previous.map((task) =>
          task._id === id ? response.data : task
        )
      );

    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };
  const restoreTask = async (id) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${id}/restore`,
        {},
        authConfig
      );

      setTasks((previous) =>
        previous.map((task) =>
          task._id === id ? response.data : task
        )
      );
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/login';
  };

  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  /* =========================================
     NOTIFICATIONS
     ========================================= */

  const currentDate = new Date();
  const todayString = currentDate.toISOString().split('T')[0];

  const notificationItems = tasks
    .filter((task) => task.dueDate && !task.completed)
    .map((task) => {
      const due = new Date(`${task.dueDate}T00:00:00`);
      const todayDate = new Date(`${todayString}T00:00:00`);
      const difference = Math.ceil(
        (due - todayDate) / (1000 * 60 * 60 * 24)
      );

      if (difference < 0) {
        return {
          id: task._id,
          type: 'overdue',
          title: task.title,
          message: ' - This task is overdue.'
        };
      }

      if (difference === 0) {
        return {
          id: task._id,
          type: 'today',
          title: task.title,
          message: ' - This task is due today.'
        };
      }

      if (difference <= 7) {
        return {
          id: task._id,
          type: ' -upcoming',
          title: task.title,
          message: `Due in ${difference} day${difference === 1 ? '' : 's'}.`
        };
      }

      return null;
    })
    .filter(Boolean);

  const notificationCount = notificationItems.length;

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Pending' && !task.completed) ||
        (statusFilter === 'Completed' && task.completed);

      const matchesCategory =
        categoryFilter === 'All' ||
        task.category === categoryFilter;

      return (
        !task.archived &&
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') {
        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
      }

      if (sortBy === 'Oldest') {
        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        );
      }

      if (sortBy === 'Due date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return (
          new Date(a.dueDate) -
          new Date(b.dueDate)
        );
      }

      if (sortBy === 'Priority') {
        const priorityValue = {
          High: 3,
          Medium: 2,
          Low: 1
        };

        return (
          priorityValue[b.priority] -
          priorityValue[a.priority]
        );
      }

      return 0;
    });
  const archivedTasks = tasks.filter((task) => task.archived);
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks =
    totalTasks - completedTasks;

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round(
        (completedTasks / totalTasks) * 100
      );

  const today = new Date()
    .toISOString()
    .split('T')[0];

  const dueToday = tasks.filter(
    (task) =>
      task.dueDate === today &&
      !task.completed
  ).length;

  /* =========================================
     ANALYTICS
     ========================================= */

  const inProgressAnalytics = tasks.filter(
    (task) =>
      !task.completed &&
      task.status === 'In Progress'
  ).length;

  const todoAnalytics = tasks.filter(
    (task) =>
      !task.completed &&
      task.status !== 'In Progress'
  ).length;

  const personalTasks = tasks.filter(
    (task) => task.category === 'Personal'
  ).length;

  const collegeTasks = tasks.filter(
    (task) => task.category === 'College'
  ).length;

  const projectTasks = tasks.filter(
    (task) => task.category === 'Projects'
  ).length;

  const getProgressWidth = (count) => {
    if (totalTasks === 0) {
      return 0;
    }

    return Math.round(
      (count / totalTasks) * 100
    );
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>

      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">

          <div className="brand-mark">
            <span>✦</span>
          </div>

          <div>
            <h2>Taskly</h2>
            <p>Your calm workspace</p>
          </div>

        </div>


        <nav className="sidebar-nav">

          <button
            className={`nav-item ${statusFilter === 'All' &&
              categoryFilter === 'All'
              ? 'active'
              : ''
              }`}
            onClick={() => {
              setStatusFilter('All');
              setCategoryFilter('All');
            }}
          >
            <span>⌂</span>
            Dashboard
          </button>


          <button
            className={`nav-item ${statusFilter === 'Pending' &&
              categoryFilter === 'All'
              ? 'active'
              : ''
              }`}
            onClick={() => {
              setStatusFilter('Pending');
              setCategoryFilter('All');
              setSearch('');
            }}
          >
            <span>✓</span>
            My Tasks
          </button>


          <button
            className="nav-item"
            onClick={openCreateModal}
          >
            <span>＋</span>
            Add task
          </button>


          <button
            className="nav-item"
            onClick={() => navigate('/calendar')}
          >
            <span>◷</span>
            Calendar
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/activity')}
          >
            <span>◌</span>
            Activity
          </button>
        </nav>



        <div className="sidebar-category-title">
          CATEGORIES
        </div>


        <div className="category-nav">

          <button
            className="category-nav-item"
            onClick={() => {
              setCategoryFilter('Personal');
              setStatusFilter('All');
            }}
          >
            <span className="category-dot personal"></span>
            Personal
          </button>


          <button
            className="category-nav-item"
            onClick={() => {
              setCategoryFilter('College');
              setStatusFilter('All');
            }}
          >
            <span className="category-dot college"></span>
            College
          </button>


          <button
            className="category-nav-item"
            onClick={() => {
              setCategoryFilter('Projects');
              setStatusFilter('All');
            }}
          >
            <span className="category-dot projects"></span>
            Projects
          </button>

        </div>


        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="user-avatar">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : 'U'}
            </div>

            <div>
              <strong>
                {user.name || 'User'}
              </strong>

              <small>
                {user.email || ''}
              </small>
            </div>

          </div>


          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">
              YOUR DAY AT A GLANCE
            </p>

            <h1>
              Good to see you,{' '}
              {user.name
                ? user.name.split(' ')[0]
                : 'there'}.
            </h1>

            <p className="dashboard-subtitle">
              A little progress each day adds up.
            </p>

          </div>


          <div className="dashboard-header-actions">

            <div className="notification-wrapper">

              <button
                className="notification-button"
                onClick={() =>
                  setShowNotifications((previous) => !previous)
                }
                aria-label="Notifications"
              >
                <span className="notification-icon">♧</span>

                {notificationCount > 0 && (
                  <span className="notification-badge">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}

              </button>

              {showNotifications && (
                <div className="notification-panel">

                  <div className="notification-panel-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>
                        {notificationCount === 0
                          ? 'All caught up'
                          : `${notificationCount} item${notificationCount === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  </div>

                  {notificationItems.length === 0 ? (
                    <div className="notification-empty">
                      <span>✓</span>
                      <p>No urgent tasks right now.</p>
                    </div>
                  ) : (
                    <div className="notification-list">

                      {notificationItems.map((item) => (
                        <div
                          className="notification-item"
                          key={item.id}
                        >
                          <span
                            className={`notification-dot ${item.type}`}
                          ></span>

                          <div className="notification-content">
                            <strong>{item.title}</strong>
                            <span>{item.message}</span>
                          </div>
                        </div>
                      ))}

                    </div>
                  )}

                </div>
              )}

            </div>

            <button
              className="add-task-button"
              onClick={openCreateModal}
            >
              <span>＋</span>
              New task
            </button>

          </div>

        </header>


        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">

            <p>Total tasks</p>

            <h2>{totalTasks}</h2>

            <span>
              Everything on your list
            </span>

          </div>


          <div className="stat-card">

            <p>Due today</p>

            <h2>{dueToday}</h2>

            <span>
              Tasks waiting for today
            </span>

          </div>


          <div className="stat-card">

            <p>Completed</p>

            <h2>{completedTasks}</h2>

            <span>
              Tasks you've finished
            </span>

          </div>


          <div className="stat-card progress-stat">

            <div>

              <p>Progress</p>

              <h2>
                {completionPercentage}%
              </h2>

              <span>
                {pendingTasks} tasks remaining
              </span>

            </div>


            <div
              className="progress-circle"
              style={{
                '--progress':
                  `${completionPercentage * 3.6}deg`
              }}
            >
              <span>
                {completionPercentage}%
              </span>
            </div>

          </div>

        </section>


        {/* ANALYTICS */}

        <section className="analytics-section">

          <div className="analytics-header">

            <div>

              <p className="dashboard-eyebrow">
                YOUR PROGRESS
              </p>

              <h2>
                A clearer picture of your work
              </h2>

              <p className="analytics-subtitle">
                See how your tasks are distributed and how much you have completed.
              </p>

            </div>

          </div>


          <div className="analytics-grid">

            <div className="analytics-card">

              <div className="analytics-card-heading">
                <span>Task progress</span>
                <strong>{completionPercentage}%</strong>
              </div>

              <div className="analytics-progress-track">

                <div
                  className="analytics-progress-fill"
                  style={{
                    width: `${completionPercentage}%`
                  }}
                ></div>

              </div>

              <div className="analytics-progress-labels">

                <span>
                  {completedTasks} completed
                </span>

                <span>
                  {pendingTasks} remaining
                </span>

              </div>

            </div>


            <div className="analytics-card">

              <div className="analytics-card-heading">
                <span>Task status</span>
              </div>

              <div className="analytics-status-list">

                <div className="analytics-status-row">

                  <div className="analytics-status-name">
                    <span className="analytics-dot todo"></span>
                    <span>To Do</span>
                  </div>

                  <strong>
                    {todoAnalytics}
                  </strong>

                </div>


                <div className="analytics-status-row">

                  <div className="analytics-status-name">
                    <span className="analytics-dot progress"></span>
                    <span>In Progress</span>
                  </div>

                  <strong>
                    {inProgressAnalytics}
                  </strong>

                </div>


                <div className="analytics-status-row">

                  <div className="analytics-status-name">
                    <span className="analytics-dot completed"></span>
                    <span>Completed</span>
                  </div>

                  <strong>
                    {completedTasks}
                  </strong>

                </div>

              </div>

            </div>


            <div className="analytics-card">

              <div className="analytics-card-heading">
                <span>Categories</span>
              </div>

              <div className="analytics-category-list">

                <div className="analytics-category-row">

                  <div className="analytics-category-name">
                    <span className="analytics-dot personal"></span>
                    <span>Personal</span>
                  </div>

                  <div className="analytics-category-value">

                    <div className="analytics-mini-track">

                      <div
                        className="analytics-mini-fill personal"
                        style={{
                          width: `${getProgressWidth(personalTasks)}%`
                        }}
                      ></div>

                    </div>

                    <strong>
                      {personalTasks}
                    </strong>

                  </div>

                </div>


                <div className="analytics-category-row">

                  <div className="analytics-category-name">
                    <span className="analytics-dot college"></span>
                    <span>College</span>
                  </div>

                  <div className="analytics-category-value">

                    <div className="analytics-mini-track">

                      <div
                        className="analytics-mini-fill college"
                        style={{
                          width: `${getProgressWidth(collegeTasks)}%`
                        }}
                      ></div>

                    </div>

                    <strong>
                      {collegeTasks}
                    </strong>

                  </div>

                </div>


                <div className="analytics-category-row">

                  <div className="analytics-category-name">
                    <span className="analytics-dot projects"></span>
                    <span>Projects</span>
                  </div>

                  <div className="analytics-category-value">

                    <div className="analytics-mini-track">

                      <div
                        className="analytics-mini-fill projects"
                        style={{
                          width: `${getProgressWidth(projectTasks)}%`
                        }}
                      ></div>

                    </div>

                    <strong>
                      {projectTasks}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* TASK SECTION */}

        <section className="tasks-section">

          <div className="tasks-header">

            <div>

              <p className="dashboard-eyebrow">
                YOUR TASKS
              </p>

              <h2>
                Things to get done
              </h2>

            </div>


            <div className="search-box">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>


          {/* FILTERS */}

          <div className="filter-area">

            <div className="filter-group">

              <span className="filter-label">
                Show
              </span>

              <div className="filter-buttons">

                {[
                  'All',
                  'Pending',
                  'Completed'
                ].map((filter) => (

                  <button
                    key={filter}
                    className={
                      statusFilter === filter
                        ? 'filter-button active'
                        : 'filter-button'
                    }
                    onClick={() =>
                      setStatusFilter(filter)
                    }
                  >
                    {filter}
                  </button>

                ))}

              </div>

            </div>


            <div className="filter-group">

              <span className="filter-label">
                Category
              </span>

              <select
                className="filter-select"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value)
                }
              >

                <option value="All">
                  All categories
                </option>

                <option value="Personal">
                  Personal
                </option>

                <option value="College">
                  College
                </option>

                <option value="Projects">
                  Projects
                </option>

              </select>

            </div>


            <div className="filter-group">

              <span className="filter-label">
                Sort
              </span>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >

                <option value="Newest">
                  Newest
                </option>

                <option value="Oldest">
                  Oldest
                </option>

                <option value="Due date">
                  Due date
                </option>

                <option value="Priority">
                  Priority
                </option>

              </select>

            </div>

          </div>


          {/* TASK LIST */}

          {loading ? (

            <div className="empty-state">
              <p>
                Loading your tasks...
              </p>
            </div>

          ) : filteredTasks.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ✦
              </div>

              <h3>
                {search
                  ? 'No tasks found'
                  : 'Nothing here yet'}
              </h3>

              <p>
                {search
                  ? 'Try a different search.'
                  : 'Add a task to this list and start making progress.'}
              </p>

              {!search && (

                <button
                  className="add-task-button"
                  onClick={openCreateModal}
                >
                  ＋ Add a task
                </button>

              )}

            </div>

          ) : (

            <div className="task-list">
              {archivedTasks.length > 0 && (
                <section className="archived-section">
                  <h2>Archived Tasks</h2>

                  <div className="task-list">
                    {archivedTasks.map((task) => (
                      <div className="task-card" key={task._id}>
                        <div className="task-content">
                          <h3>{task.title}</h3>

                          {task.description && (
                            <p>{task.description}</p>
                          )}
                        </div>

                        <div className="task-actions">
                          <button
                            className="task-action"
                            onClick={() => restoreTask(task._id)}
                          >
                            Restore
                          </button>

                          <button
                            className="task-action"
                            onClick={() => deleteTask(task._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {filteredTasks.map((task) => {

                const subtasks = task.subtasks || [];

                const completedSubtasks =
                  subtasks.filter(
                    (subtask) =>
                      subtask.completed
                  ).length;

                const isExpanded =
                  expandedTask === task._id;

                return (

                  <div
                    className={`task-card ${task.completed
                      ? 'completed'
                      : ''
                      }`}
                    key={task._id}
                  >

                    {/* MAIN TASK CHECKBOX */}

                    <button
                      className={`task-checkbox ${task.completed
                        ? 'checked'
                        : ''
                        }`}
                      onClick={() =>
                        toggleTask(task)
                      }
                    >
                      {task.completed
                        ? '✓'
                        : ''}
                    </button>


                    {/* TASK CONTENT */}

                    <div className="task-content">

                      <h3>
                        {task.title}
                      </h3>


                      {task.description && (

                        <p>
                          {task.description}
                        </p>

                      )}


                      <div className="task-meta">

                        <span className="category-tag">
                          {task.category}
                        </span>


                        <span
                          className={`priority-tag ${task.priority.toLowerCase()
                            }`}
                        >
                          {task.priority}
                        </span>


                        {task.dueDate && (

                          <span className="due-date">
                            Due {task.dueDate}
                          </span>

                        )}

                      </div>


                      {/* SUBTASK BUTTON */}

                      <button
                        className="subtask-toggle"
                        onClick={() => {

                          if (isExpanded) {
                            setExpandedTask(null);
                            setSubtaskInput('');
                          } else {
                            setExpandedTask(task._id);
                            setSubtaskInput('');
                          }

                        }}
                      >

                        <span className="subtask-title">
                          Subtasks
                        </span>

                        <span className="subtask-count">
                          {completedSubtasks}/{subtasks.length}
                        </span>

                        <span className="subtask-chevron">
                          {isExpanded ? '' : ''}
                        </span>
                      </button>


                      {/* SUBTASK AREA */}

                      {isExpanded && (

                        <div className="subtask-area">

                          {subtasks.length > 0 ? (

                            <div className="subtask-list">

                              {subtasks.map(
                                (subtask) => (

                                  <div
                                    className="subtask-item"
                                    key={subtask._id}
                                  >

                                    <button
                                      className={`subtask-checkbox ${subtask.completed
                                        ? 'checked'
                                        : ''
                                        }`}
                                      onClick={() =>
                                        toggleSubtask(
                                          task._id,
                                          subtask._id
                                        )
                                      }
                                    >
                                      {subtask.completed
                                        ? '✓'
                                        : ''}
                                    </button>


                                    <span
                                      className={
                                        subtask.completed
                                          ? 'subtask-title completed'
                                          : 'subtask-title'
                                      }
                                    >
                                      {subtask.title}
                                    </span>


                                    <button
                                      className="subtask-delete"
                                      onClick={() =>
                                        deleteSubtask(
                                          task._id,
                                          subtask._id
                                        )
                                      }
                                    >
                                      ×
                                    </button>

                                  </div>

                                )
                              )}

                            </div>

                          ) : (

                            <p className="no-subtasks">
                              No subtasks yet.
                            </p>

                          )}


                          {/* ADD SUBTASK */}

                          <div className="subtask-add">

                            <input
                              type="text"
                              placeholder="Add a subtask..."
                              value={
                                expandedTask === task._id
                                  ? subtaskInput
                                  : ''
                              }
                              onChange={(e) =>
                                setSubtaskInput(
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {

                                if (
                                  e.key === 'Enter'
                                ) {
                                  e.preventDefault();
                                  addSubtask(
                                    task._id
                                  );
                                }

                              }}
                            />


                            <button
                              onClick={() =>
                                addSubtask(
                                  task._id
                                )
                              }
                            >
                              Add
                            </button>

                          </div>

                        </div>

                      )}

                    </div>


                    {/* TASK ACTIONS */}

                    <div className="task-actions">

                      <button
                        onClick={() =>
                          openEditModal(task)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="task-action"
                        onClick={() => {
                          console.log('ARCHIVE BUTTON CLICKED');
                          archiveTask(task._id);
                        }}
                      >
                        Archive
                      </button>

                      <button
                        className="task-action"
                        onClick={() => deleteTask(task._id)}
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </main>


      {/* CREATE / EDIT MODAL */}

      {showModal && (

        <div className="modal-overlay">

          <div className="task-modal">

            <div className="modal-header">

              <div>

                <p className="dashboard-eyebrow">
                  {editingTask
                    ? 'EDIT TASK'
                    : 'NEW TASK'}
                </p>

                <h2>
                  {editingTask
                    ? 'Make a little change.'
                    : 'What needs doing?'}
                </h2>

              </div>


              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <div className="input-group">

                <label>
                  Task title
                </label>

                <input
                  type="text"
                  name="title"
                  placeholder="What do you need to do?"
                  value={formData.title}
                  onChange={handleChange}
                  autoFocus
                />

              </div>


              <div className="input-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  placeholder="Add a little more detail..."
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                />

              </div>


              <div className="form-row">

                <div className="input-group">

                  <label>
                    Due date
                  </label>

                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                  />

                </div>


                <div className="input-group">

                  <label>
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                  </select>

                </div>

              </div>


              <div className="input-group">

                <label>
                  Category
                </label>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value
                    })
                  }
                >
                  <div className="input-group">
                    <label>
                      Tags
                    </label>

                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="e.g. college, coding, urgent"
                    />
                  </div>
                  <div className="recurring-option">

                    <label>
                      <input
                        type="checkbox"
                        checked={formData.recurring}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurring: e.target.checked,
                            recurrence: e.target.checked
                              ? 'Daily'
                              : ''
                          })
                        }
                      />

                      Repeat this task
                    </label>

                    {formData.recurring && (
                      <select
                        value={formData.recurrence}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrence: e.target.value
                          })
                        }
                      >
                        <option value="Daily">Every day</option>
                        <option value="Weekly">Every week</option>
                        <option value="Monthly">Every month</option>
                      </select>
                    )}

                  </div>

                  <option value="Personal">
                    Personal
                  </option>

                  <option value="College">
                    College
                  </option>

                  <option value="Projects">
                    Projects
                  </option>

                </select>
                <div className="recurring-option">

                  <label>
                    <input
                      type="checkbox"
                      checked={formData.recurring}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurring: e.target.checked,
                          recurrence: e.target.checked ? 'Daily' : ''
                        })
                      }
                    />

                    Repeat this task
                  </label>

                  {formData.recurring && (
                    <select
                      value={formData.recurrence}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence: e.target.value
                        })
                      }
                    >
                      <option value="Daily">Every day</option>
                      <option value="Weekly">Every week</option>
                      <option value="Monthly">Every month</option>
                    </select>
                  )}

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-button"
                >
                  {editingTask
                    ? 'Save changes'
                    : 'Create task'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;