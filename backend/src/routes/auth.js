import { Router } from 'express';
import { pool } from '../db/pg.js';
import { hashPassword, comparePassword } from '../middleware/auth.js';

const router = Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    try {
      const { rows: existingUsers } = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create new user
      const hashedPassword = hashPassword(password);
      const { rows } = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, is_admin',
        [email, hashedPassword, name]
      );

      const user = rows[0];

      // Set session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;
      req.session.isAdmin = user.is_admin;

      res.json({
        success: true,
        message: 'User registered successfully',
        user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check for admin login first
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    
    if (email === adminUser && password === adminPass) {
      // Admin login
      req.session.userId = 'admin';
      req.session.userEmail = adminUser;
      req.session.userName = 'Administrator';
      req.session.isAdmin = true;

      return res.json({ 
        success: true, 
        message: 'Admin login successful',
        user: { id: 'admin', email: adminUser, name: 'Administrator', isAdmin: true }
      });
    }

    try {
      // Find user by email in database
      const { rows: users } = await pool.query(
        'SELECT id, email, password_hash, name, is_admin FROM users WHERE email = $1',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      
      // Verify password
      if (!comparePassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;
      req.session.isAdmin = Boolean(user.is_admin);

      res.json({
        success: true,
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, isAdmin: Boolean(user.is_admin) }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ 
      success: true, 
      user: { 
        id: req.session.userId, 
        email: req.session.userEmail, 
        name: req.session.userName,
        isAdmin: Boolean(req.session.isAdmin)
      }
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
