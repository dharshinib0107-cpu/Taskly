import { useEffect, useState } from 'react';
import axios from 'axios';
import './Calendar.css';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(
        new Date()
    );

    const [tasks, setTasks] = useState([]);

    const token = localStorage.getItem('token');

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                'https://taskly-nzgu.onrender.com/api/tasks',
                authConfig
            );

            setTasks(response.data);
        } catch (error) {
            console.error(
                'Error fetching calendar tasks:',
                error
            );
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString(
        'default',
        {
            month: 'long'
        }
    );

    const firstDay = new Date(
        year,
        month,
        1
    ).getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const previousMonth = () => {
        setCurrentDate(
            new Date(year, month - 1, 1)
        );
    };

    const nextMonth = () => {
        setCurrentDate(
            new Date(year, month + 1, 1)
        );
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getTasksForDate = (day) => {
        const date = `${year}-${String(
            month + 1
        ).padStart(2, '0')}-${String(day).padStart(
            2,
            '0'
        )}`;

        return tasks.filter(
            (task) => task.dueDate === date
        );
    };

    const calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const today = new Date();

    return (
        <div className="calendar-page">

            <div className="calendar-header">

                <div>
                    <p className="calendar-eyebrow">
                        YOUR SCHEDULE
                    </p>

                    <h1>Calendar</h1>

                    <p className="calendar-subtitle">
                        Keep track of what's coming up.
                    </p>
                </div>

                <button
                    className="today-button"
                    onClick={goToToday}
                >
                    Today
                </button>

            </div>


            <div className="calendar-card">

                <div className="calendar-navigation">

                    <button
                        className="month-arrow"
                        onClick={previousMonth}
                    >
                        ‹
                    </button>

                    <h2>
                        {monthName} {year}
                    </h2>

                    <button
                        className="month-arrow"
                        onClick={nextMonth}
                    >
                        ›
                    </button>

                </div>


                <div className="weekdays">

                    {[
                        'Sun',
                        'Mon',
                        'Tue',
                        'Wed',
                        'Thu',
                        'Fri',
                        'Sat'
                    ].map((day) => (
                        <div
                            className="weekday"
                            key={day}
                        >
                            {day}
                        </div>
                    ))}

                </div>


                <div className="calendar-grid">

                    {calendarDays.map(
                        (day, index) => {

                            if (day === null) {
                                return (
                                    <div
                                        className="calendar-day empty"
                                        key={`empty-${index}`}
                                    />
                                );
                            }

                            const dayTasks =
                                getTasksForDate(day);

                            const isToday =
                                day === today.getDate() &&
                                month === today.getMonth() &&
                                year === today.getFullYear();

                            return (
                                <div
                                    className={`calendar-day ${isToday ? 'today' : ''
                                        }`}
                                    key={day}
                                >

                                    <div className="day-number">
                                        {day}
                                    </div>

                                    <div className="day-tasks">

                                        {dayTasks
                                            .slice(0, 3)
                                            .map((task) => (
                                                <div
                                                    className={`calendar-task ${task.completed
                                                        ? 'completed'
                                                        : ''
                                                        }`}
                                                    key={task._id}
                                                >
                                                    {task.title}
                                                </div>
                                            ))}

                                        {dayTasks.length > 3 && (
                                            <div className="more-tasks">
                                                +{dayTasks.length - 3} more
                                            </div>
                                        )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            </div>

        </div>
    );
}

export default Calendar;