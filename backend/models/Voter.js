import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const voterSchema = new mongoose.Schema({
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{12}$/, 'Aadhaar number must be 12 digits']
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  email: {
    type: String,
    lowercase: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  lastLogin: Date,
  votedIn: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  }]
}, {
  timestamps: true
});

// Generate OTP
voterSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Verify OTP
voterSchema.methods.verifyOTP = function(enteredOTP) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  const now = new Date();
  if (now > this.otp.expiresAt) {
    return false; // OTP expired
  }
  
  return this.otp.code === enteredOTP;
};

// Clear OTP after successful verification
voterSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

export default mongoose.model('Voter', voterSchema);