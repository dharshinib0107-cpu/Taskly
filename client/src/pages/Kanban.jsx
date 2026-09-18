import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Kanban.css';

function Kanban() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

    const token = localStorage.getItem('token');

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };


    /* =========================================
       FETCH TASKS
       ========================================= */

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                'http://localhost:5000/api/tasks',
                authConfig
            );

            setTasks(response.data);

        } catch (error) {
            console.error(
                'Error fetching tasks:',
                error
            );

        } finally {
            setLoading(false);
        }
    };


    /* =========================================
       GET TASK STATUS
       ========================================= */

    const getTaskStatus = (task) => {

        if (task.completed === true) {
            return 'Completed';
        }

        if (task.status === 'In Progress') {
            return 'In Progress';
        }

        if (task.status === 'Completed') {
            return 'Completed';
        }

        return 'To Do';
    };


    /* =========================================
       UPDATE TASK STATUS
       ========================================= */

    const updateTaskStatus = async (
        taskId,
        newStatus
    ) => {

        try {

            const task = tasks.find(
                (item) => item._id === taskId
            );

            if (!task) {
                return;
            }


            const response = await axios.put(
                `http://localhost:5000/api/tasks/${taskId}`,
                {
                    title: task.title,
                    description: task.description,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    category: task.category,

                    completed:
                        newStatus === 'Completed',

                    status: newStatus
                },
                authConfig
            );


            setTasks((previous) =>
                previous.map((item) =>
                    item._id === taskId
                        ? response.data
                        : item
                )
            );

        } catch (error) {

            console.error(
                'Error updating task status:',
                error
            );

        }
    };


    /* =========================================
       DRAG START
       ========================================= */

    const handleDragStart = (
        event,
        task
    ) => {

        event.stopPropagation();

        event.dataTransfer.effectAllowed = 'move';

        event.dataTransfer.setData(
            'text/plain',
            task._id
        );

        setDraggedTask(task);
    };


    /* =========================================
       DRAG END
       ========================================= */

    const handleDragEnd = () => {

        setDraggedTask(null);

        setDragOverColumn(null);
    };


    /* =========================================
       DRAG OVER COLUMN
       ========================================= */

    const handleDragOver = (
        event,
        column
    ) => {

        event.preventDefault();

        event.dataTransfer.dropEffect = 'move';

        setDragOverColumn(column);
    };


    /* =========================================
       DRAG LEAVE
       ========================================= */

    const handleDragLeave = (
        event
    ) => {

        /*
          Only remove the highlight when
          actually leaving the column.
        */

        if (
            event.currentTarget ===
            event.target
        ) {
            setDragOverColumn(null);
        }
    };


    /* =========================================
       DROP
       ========================================= */

    const handleDrop = async (
        event,
        newStatus
    ) => {

        event.preventDefault();

        event.stopPropagation();

        setDragOverColumn(null);


        let taskToMove = draggedTask;


        /*
          Get task ID from browser drag data
          as an extra safety measure.
        */

        const taskId =
            event.dataTransfer.getData(
                'text/plain'
            );


        if (!taskToMove && taskId) {

            taskToMove = tasks.find(
                (task) =>
                    task._id === taskId
            );
        }


        if (!taskToMove) {
            return;
        }


        const currentStatus =
            getTaskStatus(taskToMove);


        /*
          If dropped in the same column,
          do nothing.
        */

        if (
            currentStatus === newStatus
        ) {

            setDraggedTask(null);

            return;
        }


        await updateTaskStatus(
            taskToMove._id,
            newStatus
        );


        setDraggedTask(null);
    };


    /* =========================================
       TASK FILTERING
       ========================================= */

    const todoTasks = tasks.filter(
        (task) =>
            getTaskStatus(task) === 'To Do'
    );


    const inProgressTasks =
        tasks.filter(
            (task) =>
                getTaskStatus(task) ===
                'In Progress'
        );


    const completedTasks =
        tasks.filter(
            (task) =>
                getTaskStatus(task) ===
                'Completed'
        );


    /* =========================================
       TASK CARD
       ========================================= */

    const TaskCard = ({ task }) => {

        const isDragging =
            draggedTask?._id === task._id;


        return (

            <div
                className={`kanban-task-card ${isDragging
                    ? 'dragging'
                    : ''
                    }`}

                draggable={true}

                onDragStart={(event) =>
                    handleDragStart(
                        event,
                        task
                    )
                }

                onDragEnd={handleDragEnd}
            >

                {/* TASK TOP */}

                <div className="kanban-task-top">

                    <span
                        className={`kanban-priority ${task.priority?.toLowerCase()
                            }`}
                    >
                        {task.priority}
                    </span>


                    <span className="kanban-category">
                        {task.category}
                    </span>

                </div>


                {/* TASK TITLE */}

                <h3>
                    {task.title}
                </h3>


                {/* DESCRIPTION */}

                {task.description && (
                    <p>
                        {task.description}
                    </p>
                )}


                {/* DUE DATE */}

                {task.dueDate && (

                    <div className="kanban-due-date">
                        Due {task.dueDate}
                    </div>

                )}


                {/* FOOTER */}

                <div className="kanban-task-footer">

                    <span>
                        {task.subtasks?.length || 0}
                        {' '}
                        subtasks
                    </span>


                    {/* STATUS SELECT */}

                    <select
                        className="kanban-status-select"

                        value={getTaskStatus(task)}

                        onChange={(event) =>
                            updateTaskStatus(
                                task._id,
                                event.target.value
                            )
                        }

                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }

                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <option value="To Do">
                            To Do
                        </option>

                        <option value="In Progress">
                            In Progress
                        </option>

                        <option value="Completed">
                            Completed
                        </option>

                    </select>

                </div>

            </div>
        );
    };


    /* =========================================
       KANBAN COLUMN
       ========================================= */

    const KanbanColumn = ({
        title,
        subtitle,
        tasks: columnTasks,
        status
    }) => {

        const isDropTarget =
            dragOverColumn === status;


        return (

            <div
                className={`kanban-column ${isDropTarget
                    ? 'drag-over'
                    : ''
                    }`}

                onDragOver={(event) =>
                    handleDragOver(
                        event,
                        status
                    )
                }

                onDragLeave={handleDragLeave}

                onDrop={(event) =>
                    handleDrop(
                        event,
                        status
                    )
                }
            >

                {/* COLUMN HEADER */}

                <div className="kanban-column-header">

                    <div>

                        <h2>
                            {title}
                        </h2>

                        <span>
                            {subtitle}
                        </span>

                    </div>


                    <div className="kanban-count">
                        {columnTasks.length}
                    </div>

                </div>


                {/* TASKS */}

                <div className="kanban-column-content">

                    {columnTasks.length > 0 ? (

                        columnTasks.map(
                            (task) => (

                                <TaskCard
                                    key={task._id}
                                    task={task}
                                />

                            )
                        )

                    ) : (

                        <div
                            className={`kanban-empty ${isDropTarget
                                ? 'drop-here'
                                : ''
                                }`}
                        >

                            {isDropTarget
                                ? 'Drop task here'
                                : status === 'To Do'
                                    ? 'Nothing waiting here'
                                    : status ===
                                        'In Progress'
                                        ? 'Nothing in progress'
                                        : 'No completed tasks yet'
                            }

                        </div>

                    )}

                </div>

            </div>
        );
    };


    /* =========================================
       LOADING
       ========================================= */

    if (loading) {

        return (

            <div className="kanban-loading">
                Loading your board...
            </div>

        );
    }


    /* =========================================
       MAIN PAGE
       ========================================= */

    return (

        <div className="kanban-page">

            {/* =====================================
          SIDEBAR
          ===================================== */}

            <aside className="kanban-sidebar">

                <div className="kanban-brand">

                    <span className="brand-sparkle">
                        ✦
                    </span>

                    <span>
                        Taskly
                    </span>

                </div>


                <nav className="kanban-navigation">

                    <button
                        onClick={() =>
                            navigate('/dashboard')
                        }
                    >
                        <span>⌂</span>
                        Dashboard
                    </button>


                    <button
                        onClick={() =>
                            navigate('/dashboard')
                        }
                    >
                        <span>✓</span>
                        My Tasks
                    </button>


                    <button
                        onClick={() =>
                            navigate('/calendar')
                        }
                    >
                        <span>□</span>
                        Calendar
                    </button>


                    <button className="active">

                        <span>▦</span>

                        Kanban

                    </button>

                </nav>

            </aside>


            {/* =====================================
          MAIN
          ===================================== */}

            <main className="kanban-main">


                {/* HEADER */}

                <header className="kanban-header">

                    <div>

                        <p className="kanban-eyebrow">
                            ORGANIZE YOUR WORK
                        </p>


                        <h1>
                            Task Board
                        </h1>


                        <p className="kanban-subtitle">
                            Drag tasks between columns to
                            update their progress.
                        </p>

                    </div>


                    <button
                        className="kanban-back-button"

                        onClick={() =>
                            navigate('/dashboard')
                        }
                    >
                        ← Dashboard
                    </button>

                </header>


                {/* ===================================
            BOARD
            =================================== */}

                <section className="kanban-board">


                    {/* TO DO */}

                    <KanbanColumn
                        title="To Do"
                        subtitle="Things waiting to begin"
                        tasks={todoTasks}
                        status="To Do"
                    />


                    {/* IN PROGRESS */}

                    <KanbanColumn
                        title="In Progress"
                        subtitle="Work currently underway"
                        tasks={inProgressTasks}
                        status="In Progress"
                    />


                    {/* COMPLETED */}

                    <KanbanColumn
                        title="Completed"
                        subtitle="Work you have finished"
                        tasks={completedTasks}
                        status="Completed"
                    />


                </section>

            </main>

        </div>
    );
}

export default Kanban;