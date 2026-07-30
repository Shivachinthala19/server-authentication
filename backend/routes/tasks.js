const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes in this router
router.use(auth);

// @route   GET /api/tasks
// @desc    Get all tasks of the logged-in user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error. Failed to retrieve tasks.' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task for the logged-in user
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const newTask = new Task({
      title,
      userId: req.user.userId,
    });

    const task = await newTask.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error. Failed to create task.' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task (toggle complete or rename)
router.put('/:id', async (req, res) => {
  try {
    const { title, completed } = req.body;

    // Find task
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Make sure task belongs to user
    if (task.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify this task.' });
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error. Failed to update task.' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Make sure task belongs to user
    if (task.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this task.' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error. Failed to delete task.' });
  }
});

module.exports = router;
