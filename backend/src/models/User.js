const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'reception', 'host'],
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: function() {
      return `https://i.pravatar.cc/150?u=${this.email}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  invitationStatus: {
    type: String,
    enum: ['registered', 'pending', 'none'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform to JSON (exclude password)
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  userObject._id = userObject._id.toString();
  return userObject;
};

module.exports = mongoose.model('User', userSchema);