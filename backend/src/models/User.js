const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    default: 'passenger',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  location: {
    type: Object,
    default: {}
  },
  currentLocation: {
    type: Object,
    default: {}
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 