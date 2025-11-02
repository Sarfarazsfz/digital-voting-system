import express from 'express';
import Admin from '../models/Admin.js';

const router = express.Router();

// Create default admin account
router.post('/create-admin', async (req, res) => {
  try {
    console.log('⚙️ Setting up default admin account...');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists');
      return res.json({
        success: true,
        message: 'Default admin already exists!',
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      });
    }

    // Create default admin
    const defaultAdmin = new Admin({
      username: 'admin',
      email: 'admin@springvote.com',
      password: 'admin123'
    });

    await defaultAdmin.save();
    
    console.log('✅ Default admin created successfully');

    res.json({
      success: true,
      message: 'Default admin created successfully!',
      credentials: {
        username: 'admin',
        password: 'admin123'
      },
      note: 'You can now login with username: "admin" and password: "admin123"'
    });
    
  } catch (error) {
    console.error('❌ Setup admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
});

export default router;