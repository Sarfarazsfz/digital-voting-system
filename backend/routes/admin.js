import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Election from '../models/Election.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Admin login - UPDATE THIS PART
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Admin login attempt for:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    console.log('📋 Admin found:', admin ? 'Yes' : 'No');

    if (admin && (await admin.matchPassword(password))) {
      // Use fallback secret if environment variable is not set
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
      
      const token = jwt.sign(
        { id: admin._id, username: admin.username },
        jwtSecret,
        { expiresIn: '7d' }
      );

      console.log('✅ Admin login successful:', admin.username);

      res.json({
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email
        }
      });
    } else {
      console.log('❌ Invalid credentials for:', username);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('💥 Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Create election (protected)
router.post('/elections', auth, async (req, res) => {
  try {
    const { name, description, startTime, endTime, electionType, constituency, candidates } = req.body;

    // Validate required fields
    if (!name || !description || !startTime || !endTime || !electionType) {
      return res.status(400).json({ 
        message: 'Name, description, start time, end time, and election type are required' 
      });
    }

    // Validate candidates array
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ 
        message: 'At least one candidate is required' 
      });
    }

    // Validate each candidate
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate.name || !candidate.party) {
        return res.status(400).json({ 
          message: `Candidate ${i + 1} must have both name and party` 
        });
      }
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    if (end <= now) {
      return res.status(400).json({ message: 'End time must be in the future' });
    }

    // Determine election status based on current time
    let status = 'upcoming';
    if (start <= now && end >= now) {
      status = 'active';
    } else if (end < now) {
      status = 'completed';
    }

    // Create election
    const election = new Election({
      name,
      description,
      startTime: start,
      endTime: end,
      electionType,
      constituency: constituency || '',
      candidates,
      status,
      createdBy: req.admin.id
    });

    await election.save();
    
    // Populate the createdBy field for the response
    await election.populate('createdBy', 'username email');
    
    res.status(201).json({
      message: 'Election created successfully',
      election
    });
  } catch (error) {
    console.error('Error creating election:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Election with this name already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating election: ' + error.message 
    });
  }
});

// Get all elections
router.get('/elections', auth, async (req, res) => {
  try {
    const elections = await Election.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.json(elections);
  } catch (error) {
    console.error('Error fetching elections:', error);
    res.status(500).json({ 
      message: 'Error fetching elections: ' + error.message 
    });
  }
});

// Get single election
router.get('/elections/:id', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    res.json(election);
  } catch (error) {
    console.error('Error fetching election:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid election ID' });
    }
    
    res.status(500).json({ 
      message: 'Error fetching election: ' + error.message 
    });
  }
});

// Get election results
router.get('/elections/:id/results', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Calculate total votes
    const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

    // Sort candidates by votes (descending)
    const sortedCandidates = [...election.candidates].sort((a, b) => b.votes - a.votes);

    res.json({
      election: {
        id: election._id,
        name: election.name,
        description: election.description,
        status: election.status,
        totalVotes,
        candidates: sortedCandidates.map(candidate => ({
          id: candidate._id,
          name: candidate.name,
          party: candidate.party,
          votes: candidate.votes,
          percentage: totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(2) : 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid election ID' });
    }
    
    res.status(500).json({
      message: 'Error fetching results: ' + error.message 
    });
  }
});

// Update election status
router.put('/elections/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['upcoming', 'active', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: upcoming, active, or completed' 
      });
    }

    const election = await Election.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    res.json({
      message: `Election status updated to ${status}`,
      election
    });
  } catch (error) {
    console.error('Error updating election status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid election ID' });
    }
    
    res.status(500).json({
      message: 'Error updating election status: ' + error.message 
    });
  }
});

// Update election details
router.put('/elections/:id', auth, async (req, res) => {
  try {
    const { name, description, startTime, endTime, electionType, constituency, candidates } = req.body;

    const updateData = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (electionType) updateData.electionType = electionType;
    if (constituency !== undefined) updateData.constituency = constituency;
    if (candidates) updateData.candidates = candidates;

    // Validate dates if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
    }

    const election = await Election.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    res.json({
      message: 'Election updated successfully',
      election
    });
  } catch (error) {
    console.error('Error updating election:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid election ID' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error updating election: ' + error.message 
    });
  }
});

// Delete election
router.delete('/elections/:id', auth, async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    res.json({
      message: 'Election deleted successfully',
      election: {
        id: election._id,
        name: election.name
      }
    });
  } catch (error) {
    console.error('Error deleting election:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid election ID' });
    }
    
    res.status(500).json({
      message: 'Error deleting election: ' + error.message 
    });
  }
});

// Get election statistics
router.get('/elections-stats', auth, async (req, res) => {
  try {
    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: 'active' });
    const upcomingElections = await Election.countDocuments({ status: 'upcoming' });
    const completedElections = await Election.countDocuments({ status: 'completed' });

    // Get elections by type
    const electionsByType = await Election.aggregate([
      {
        $group: {
          _id: '$electionType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent elections
    const recentElections = await Election.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status createdAt');

    res.json({
      totalElections,
      activeElections,
      upcomingElections,
      completedElections,
      electionsByType,
      recentElections
    });
  } catch (error) {
    console.error('Error fetching election stats:', error);
    res.status(500).json({
      message: 'Error fetching election statistics: ' + error.message 
    });
  }
});

export default router;