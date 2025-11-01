import express from 'express';
import Voter from '../models/Voter.js';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import OTPService from '../services/otpService.js';

const router = express.Router();

// Step 1: Voter verification and OTP generation
router.post('/verify-and-send-otp', async (req, res) => {
  try {
    const { aadhaarNumber, age, phone, email } = req.body;
    console.log('Voter verification request:', { aadhaarNumber, age });

    // Validate input
    if (!aadhaarNumber || !age) {
      return res.status(400).json({ message: 'Aadhaar number and age are required' });
    }

    if (aadhaarNumber.length !== 12 || !/^\d+$/.test(aadhaarNumber)) {
      return res.status(400).json({ message: 'Aadhaar number must be 12 digits' });
    }

    if (age < 18) {
      return res.status(400).json({ message: 'You must be 18 or older to vote' });
    }

    // Check if voter exists or create new
    let voter = await Voter.findOne({ aadhaarNumber });
    
    if (!voter) {
      // Create new voter
      voter = new Voter({
        aadhaarNumber,
        age,
        name: `Voter-${aadhaarNumber.slice(8)}`,
        phone: phone || '',
        email: email || ''
      });
    } else {
      // Update existing voter details
      if (phone) voter.phone = phone;
      if (email) voter.email = email;
      voter.age = age;
    }

    // Generate and send OTP
    const otp = voter.generateOTP();
    await voter.save();

    console.log(`Generated OTP for ${aadhaarNumber}: ${otp}`);

    // Send OTP via SMS if phone provided
    if (voter.phone) {
      await OTPService.sendSMS(voter.phone, otp);
    }

    // Send OTP via Email if email provided
    if (voter.email) {
      await OTPService.sendEmail(voter.email, otp);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      voterId: voter._id,
      verificationMethod: voter.phone ? 'SMS' : voter.email ? 'Email' : 'Manual',
      // In development, return OTP for testing
      debugOTP: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('Voter verification error:', error);
    res.status(500).json({ message: 'Verification failed: ' + error.message });
  }
});

// Step 2: OTP Verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { voterId, otp } = req.body;
    console.log('OTP verification request:', { voterId, otp });

    if (!voterId || !otp) {
      return res.status(400).json({ message: 'Voter ID and OTP are required' });
    }

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    // Verify OTP
    const isValidOTP = voter.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark voter as verified and clear OTP
    voter.isVerified = true;
    voter.lastLogin = new Date();
    voter.clearOTP();
    await voter.save();

    console.log(`Voter ${voter.aadhaarNumber} verified successfully`);

    res.json({
      verified: true,
      voter: {
        id: voter._id,
        aadhaarNumber: voter.aadhaarNumber,
        name: voter.name,
        age: voter.age,
        phone: voter.phone,
        email: voter.email
      },
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed: ' + error.message });
  }
});

// Step 3: Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { voterId } = req.body;

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    // Generate new OTP
    const otp = voter.generateOTP();
    await voter.save();

    console.log(`Resent OTP for ${voter.aadhaarNumber}: ${otp}`);

    // Resend OTP
    if (voter.phone) {
      await OTPService.sendSMS(voter.phone, otp);
    }
    if (voter.email) {
      await OTPService.sendEmail(voter.email, otp);
    }

    res.json({
      success: true,
      message: 'OTP resent successfully',
      debugOTP: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP: ' + error.message });
  }
});

// Get active elections (protected - requires verified voter)
router.get('/elections/active', async (req, res) => {
  try {
    const currentTime = new Date();
    
    const elections = await Election.find({
      status: 'active',
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime }
    }).select('name description startTime endTime electionType constituency candidates status');

    const transformedElections = elections.map(election => ({
      _id: election._id,
      name: election.name,
      description: election.description,
      startTime: election.startTime,
      endTime: election.endTime,
      electionType: election.electionType,
      constituency: election.constituency,
      status: election.status,
      candidates: election.candidates.map(candidate => ({
        _id: candidate._id,
        name: candidate.name,
        party: candidate.party,
        votes: candidate.votes || 0
      }))
    }));

    res.json(transformedElections);
  } catch (error) {
    console.error('Error fetching active elections:', error);
    res.status(500).json({ message: 'Error fetching elections' });
  }
});

// Cast vote (with additional verification)
router.post('/vote', async (req, res) => {
  try {
    const { electionId, candidateId, voterId } = req.body;

    // Validate input
    if (!electionId || !candidateId || !voterId) {
      return res.status(400).json({ message: 'Election ID, candidate ID, and voter ID are required' });
    }

    // Check if voter exists and is verified
    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    if (!voter.isVerified) {
      return res.status(403).json({ message: 'Voter not verified. Please complete OTP verification.' });
    }

    // Check if election exists and is active
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const currentTime = new Date();
    if (currentTime < election.startTime || currentTime > election.endTime) {
      return res.status(400).json({ message: 'This election is not currently active' });
    }

    // Check if candidate exists in this election
    const candidate = election.candidates.id(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found in this election' });
    }

    // Check if voter has already voted in this election
    const existingVote = await Vote.findOne({
      election: electionId,
      voter: voterId
    });

    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Create vote record
    const vote = new Vote({
      election: electionId,
      voter: voterId,
      candidate: candidateId,
      votedAt: new Date()
    });

    await vote.save();

    // Update candidate vote count
    candidate.votes = (candidate.votes || 0) + 1;
    await election.save();

    // Update voter record
    voter.votedIn.push(electionId);
    await voter.save();

    console.log(`Vote cast by ${voter.aadhaarNumber} for ${candidate.name} in ${election.name}`);

    res.json({ 
      message: 'Vote cast successfully',
      vote: {
        id: vote._id,
        election: election.name,
        candidate: candidate.name,
        party: candidate.party,
        votedAt: vote.votedAt
      }
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    res.status(500).json({ message: 'Error casting vote' });
  }
});

// Get voter profile
router.get('/profile/:voterId', async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.voterId)
      .select('-otp')
      .populate('votedIn', 'name electionType');

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    res.json(voter);
  } catch (error) {
    console.error('Error fetching voter profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

export default router;