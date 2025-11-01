import express from 'express';
import Election from '../models/Election.js';

const router = express.Router();

// Get public election data
router.get('/public', async (req, res) => {
  try {
    const elections = await Election.find({ status: 'active' })
      .select('name description startTime endTime candidates');
    res.json(elections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching elections' });
  }
});

export default router;