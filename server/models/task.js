const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ''
    },

    dueDate: {
      type: String,
      default: ''
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },

    category: {
      type: String,
      enum: ['Personal', 'College', 'Projects'],
      default: 'Personal'
    },

    completed: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    },
    recurring: {
      type: Boolean,
      default: false
    },

    recurrence: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', ''],
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },

    subtasks: [
      {
        title: {
          type: String,
          required: true,
          trim: true
        },

        completed: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Task', taskSchema);