import { useEffect, useState } from 'react';
import axios from 'axios';
import './Activity.css';

function Activity() {
    const [activities, setActivities] = useState([]);

    const token = localStorage.getItem('token');

    useEffect(() => {
        axios.get('https://taskly-nzgu.onrender.com/api/tasks/activities', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setActivities(response.data);
            })
            .catch((error) => {
                console.error('Error fetching activities:', error);
            });
    }, []);

    return (
        <div className="activity-page">

            <div className="activity-header">
                <div>
                    <p className="activity-label">YOUR JOURNEY</p>
                    <h1>Activity History</h1>
                    <p className="activity-subtitle">
                        A quiet record of everything you've accomplished.
                    </p>
                </div>

                <div className="activity-count">
                    {activities.length}
                    <span>activities</span>
                </div>
            </div>

            {activities.length === 0 ? (
                <div className="activity-empty">
                    <div className="activity-empty-icon">✦</div>
                    <h2>No activity yet</h2>
                    <p>
                        Your completed actions and task updates will appear here.
                    </p>
                </div>
            ) : (
                <div className="activity-card">

                    {activities.map((activity) => (
                        <div className="activity-item" key={activity._id}>

                            <div className="activity-icon">
                                ✦
                            </div>

                            <div className="activity-content">
                                <h3>{activity.action}</h3>
                                <p>{activity.taskTitle}</p>
                            </div>

                            <div className="activity-date">
                                {new Date(activity.createdAt).toLocaleDateString()}
                            </div>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default Activity;