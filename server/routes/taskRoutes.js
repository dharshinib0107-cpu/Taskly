const express = require('express');
const Task = require('../models/task');
const authMiddleware = require('../middleware/authMiddleware');
const Activity = require('../models/Activity');

const router = express.Router();

router.use(authMiddleware);


// GET ALL TASKS
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.userId
    }).sort({
      createdAt: -1
    });

    res.status(200).json(tasks);

  } catch (error) {
    console.error('Error fetching tasks:', error);

    res.status(500).json({
      message: 'Failed to fetch tasks'
    });
  }
});


// CREATE TASK
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      category,
      tags
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    const task = new Task({
      user: req.userId,
      title: title.trim(),
      description: description || '',
      dueDate: dueDate || '',
      priority: priority || 'Medium',
      category: category || 'Personal',
      tags: tags || [],
      completed: false
    });

    const savedTask = await task.save();

    const io = req.app.get('io');

    io.emit('taskCreated', savedTask);
    console.log('Socket event sent: taskCreated');
    await Activity.create({
      user: req.userId,
      taskTitle: savedTask.title,
      action: 'Task created'
    });

    res.status(201).json(savedTask);

  } catch (error) {
    console.error('Error creating task:', error);

    res.status(500).json({
      message: 'Failed to create task'
    });
  }
});


// ARCHIVE TASK
console.log("ARCHIVE ROUTE REGISTERED");
router.put('/:id/archive', async (req, res) => {
  console.log("🔥 ARCHIVE BACKEND HIT");
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId
      },
      {
        archived: true
      },
      {
        new: true
      }
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    await Activity.create({
      user: req.userId,
      taskTitle: task.title,
      action: 'Task archived'
    });

    res.status(200).json(task);

  } catch (error) {
    console.error('Error archiving task:', error);

    res.status(500).json({
      message: 'Failed to archive task'
    });
  }
});

// RESTORE TASK
router.put('/:id/restore', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId
      },
      {
        archived: false
      },
      {
        new: true
      }
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    await Activity.create({
      user: req.userId,
      taskTitle: task.title,
      action: 'Task restored'
    });

    res.status(200).json(task);

  } catch (error) {
    console.error('Error restoring task:', error);

    res.status(500).json({
      message: 'Failed to restore task'
    });
  }
});
// UPDATE TASK
router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const io = req.app.get('io');
    io.emit('taskUpdated', updatedTask);
    console.log('Socket event sent: taskUpdated');
    // CREATE NEXT RECURRING TASK
    if (
      req.body.completed === true &&
      updatedTask.recurring === true &&
      updatedTask.dueDate
    ) {
      const currentDate = new Date(
        updatedTask.dueDate
      );

      if (updatedTask.recurrence === 'Daily') {
        currentDate.setDate(
          currentDate.getDate() + 1
        );
      }

      if (updatedTask.recurrence === 'Weekly') {
        currentDate.setDate(
          currentDate.getDate() + 7
        );
      }

      if (updatedTask.recurrence === 'Monthly') {
        currentDate.setMonth(
          currentDate.getMonth() + 1
        );
      }

      const nextTask = new Task({
        user: req.userId,
        title: updatedTask.title,
        description: updatedTask.description,
        dueDate: currentDate
          .toISOString()
          .split('T')[0],
        priority: updatedTask.priority,
        category: updatedTask.category,
        completed: false,
        status: 'To Do',
        recurring: true,
        recurrence: updatedTask.recurrence
      });

      await nextTask.save();

      await Activity.create({
        user: req.userId,
        taskTitle: nextTask.title,
        action: 'Recurring task created'
      });
    }
    res.status(200).json(updatedTask);

  } catch (error) {
    console.error('Error updating task:', error);

    res.status(500).json({
      message: 'Failed to update task'
    });
  }
});


// DELETE TASK
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!deletedTask) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    const io = req.app.get('io');

    io.emit('taskDeleted', deletedTask._id);

    console.log('Socket event sent: taskDeleted');
    res.status(200).json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting task:', error);

    res.status(500).json({
      message: 'Failed to delete task'
    });
  }
});

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
// ADD SUBTASK
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Subtask title is required'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    task.subtasks.push({
      title: title.trim(),
      completed: false
    });

    const updatedTask = await task.save();

    const io = req.app.get('io');

    io.emit('subtaskUpdated', updatedTask);

    console.log('Socket event sent: subtaskUpdated');

    res.status(201).json(updatedTask);

  } catch (error) {
    console.error('Error adding subtask:', error);

    res.status(500).json({
      message: 'Failed to add subtask'
    });
  }
});


// TOGGLE SUBTASK
router.put('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(
      req.params.subtaskId
    );

    if (!subtask) {
      return res.status(404).json({
        message: 'Subtask not found'
      });
    }

    subtask.completed = !subtask.completed;

    const updatedTask = await task.save();

    const io = req.app.get('io');

    io.emit('subtaskUpdated', updatedTask);

    console.log('Socket event sent: subtaskUpdated');

    res.status(200).json(updatedTask);

  } catch (error) {
    console.error('Error updating subtask:', error);

    res.status(500).json({
      message: 'Failed to update subtask'
    });
  }
});


// DELETE SUBTASK
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(
      req.params.subtaskId
    );

    if (!subtask) {
      return res.status(404).json({
        message: 'Subtask not found'
      });
    }

    subtask.deleteOne();

    const updatedTask = await task.save();

    const io = req.app.get('io');

    io.emit('subtaskUpdated', updatedTask);

    console.log('Socket event sent: subtaskUpdated');

    res.status(200).json(updatedTask);

  } catch (error) {
    console.error('Error deleting subtask:', error);

    res.status(500).json({
      message: 'Failed to delete subtask'
    });
  }
});


// ACTIVITY HISTORY
router.get('/activities', async (req, res) => {
  try {
    const activities = await Activity.find({
      user: req.userId
    })
      .sort({
        createdAt: -1
      })
      .limit(50);

    res.status(200).json(activities);

  } catch (error) {
    console.error('Error fetching activities:', error);

    res.status(500).json({
      message: 'Failed to fetch activities'
    });
  }
});


module.exports = router;