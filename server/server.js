const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', "https://voice.zenxai.io/"],
  credentials: true
}));
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./auth.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables if they don't exist
function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      isVerified BOOLEAN DEFAULT 0,
      verificationToken TEXT,
      resetPasswordToken TEXT,
      resetPasswordExpires INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready');
    }
  });
}

// Email configuration (using Gmail as example)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Validation middleware
const validateSignup = [
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const validateSignin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
];

const validateForgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

// Helper function to generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper function to send emails
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@voiceassistant.com',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Authentication server is running' });
});

// Sign Up
app.post('/auth/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred'
        });
      }

      if (row) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      try {
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Insert new user
        const insertUser = `
          INSERT INTO users (firstName, lastName, email, phone, password, verificationToken)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(insertUser, [firstName, lastName, email, phone, hashedPassword, verificationToken], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to create user account'
            });
          }

          const userId = this.lastID;
          const token = generateToken(userId);

          // Send verification email (optional - for now we'll auto-verify)
          db.run('UPDATE users SET isVerified = 1 WHERE id = ?', [userId], (err) => {
            if (err) {
              console.error('Error verifying user:', err);
            }
          });

          res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
              user: {
                id: userId,
                firstName,
                lastName,
                email,
                phone,
                isVerified: true
              },
              token
            }
          });
        });
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        res.status(500).json({
          success: false,
          message: 'Failed to process password'
        });
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sign In
app.post('/auth/signin', validateSignin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      try {
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }

        // Generate token
        const token = generateToken(user.id);

        // Update last login
        db.run('UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        res.json({
          success: true,
          message: 'Sign in successful',
          data: {
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              isVerified: user.isVerified
            },
            token
          }
        });
      } catch (compareError) {
        console.error('Password comparison error:', compareError);
        res.status(500).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot Password
app.post('/auth/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    db.get('SELECT id, firstName, lastName FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred'
        });
      }

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = Date.now() + 3600000; // 1 hour from now

      // Save reset token
      db.run(
        'UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
        [resetToken, resetExpires, user.id],
        async (err) => {
          if (err) {
            console.error('Error saving reset token:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to process password reset request'
            });
          }

          // Send reset email
          const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Hello ${user.firstName},</p>
              <p>You requested a password reset for your Voice Assistant Dashboard account.</p>
              <p>Click the link below to reset your password:</p>
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
          `;

          const emailSent = await sendEmail(email, 'Password Reset Request', emailHtml);
          
          if (!emailSent) {
            console.error('Failed to send reset email');
          }

          res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
          });
        }
      );
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify JWT token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.userId = decoded.userId;
    next();
  });
}

// Get user profile (protected route)
app.get('/auth/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, firstName, lastName, email, phone, isVerified, createdAt FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    }
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Authentication server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
