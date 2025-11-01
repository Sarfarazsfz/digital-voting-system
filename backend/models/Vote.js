import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voter',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate votes
voteSchema.index({ election: 1, voter: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);