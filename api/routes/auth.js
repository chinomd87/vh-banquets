const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  authenticateToken, 
  requireRole, 
  createUser, 
  authenticateUser, 
  refreshAccessToken,
  createSigningSession,
  verifySigningSession,
  completeSignature,
  getContractSignatures,
  validateSignatureIntegrity
} = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signatureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 signature attempts per hour
  message: {
    error: 'Too many signature attempts, please try again later',
    code: 'SIGNATURE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Routes

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, organization } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        required: ['email', 'password', 'firstName', 'lastName']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    const user = await createUser({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role || 'client',
      phone: phone?.trim(),
      organization: organization?.trim()
    });

    res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User already exists') {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const result = await authenticateUser(email.toLowerCase().trim(), password);

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken
    });

  } catch (error) {
    console.error('Login error:', error);
    
    res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    const result = refreshAccessToken(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      user: result.user,
      accessToken: result.accessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken');
    
    res.status(401).json({
      error: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and clear tokens
 */
router.post('/logout', authenticateToken, (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  // In a real implementation, you'd also blacklist the JWT token
  // For now, just rely on token expiration
  
  res.json({
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// E-Signature Routes

/**
 * POST /api/signatures/create-session
 * Create a new signing session for a contract
 */
router.post('/create-session', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { contractId, signerEmail, contractData } = req.body;

    if (!contractId || !signerEmail || !contractData) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        required: ['contractId', 'signerEmail', 'contractData']
      });
    }

    const session = createSigningSession(contractId, signerEmail.toLowerCase().trim(), contractData);

    res.status(201).json({
      message: 'Signing session created successfully',
      session: {
        id: session.id,
        contractId: session.contractId,
        signerEmail: session.signerEmail,
        status: session.status,
        expiresAt: session.expiresAt,
        signingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/sign/${session.id}`
      }
    });

  } catch (error) {
    console.error('Create signing session error:', error);
    
    res.status(500).json({
      error: 'Failed to create signing session',
      code: 'SESSION_CREATION_ERROR'
    });
  }
});

/**
 * GET /api/signatures/session/:sessionId
 * Get signing session details
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = verifySigningSession(sessionId);

    res.json({
      session: {
        id: session.id,
        contractId: session.contractId,
        contractData: session.contractData,
        signerEmail: session.signerEmail,
        status: session.status,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('Get signing session error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Signing session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (error.message.includes('expired')) {
      return res.status(410).json({
        error: 'Signing session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    res.status(400).json({
      error: error.message,
      code: 'SESSION_ERROR'
    });
  }
});

/**
 * POST /api/signatures/complete/:sessionId
 * Complete signature for a session
 */
router.post('/complete/:sessionId', signatureLimiter, (req, res) => {
  try {
    const { sessionId } = req.params;
    const { signatureData } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!signatureData) {
      return res.status(400).json({
        error: 'Signature data is required',
        code: 'MISSING_SIGNATURE'
      });
    }

    const signature = completeSignature(sessionId, signatureData, ipAddress, userAgent);

    res.json({
      message: 'Signature completed successfully',
      signature: {
        id: signature.id,
        contractId: signature.contractId,
        timestamp: signature.timestamp,
        signerEmail: signature.signerEmail
      }
    });

  } catch (error) {
    console.error('Complete signature error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Signing session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (error.message.includes('expired')) {
      return res.status(410).json({
        error: 'Signing session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    if (error.message.includes('completed')) {
      return res.status(409).json({
        error: 'Signature already completed',
        code: 'ALREADY_COMPLETED'
      });
    }

    res.status(400).json({
      error: error.message,
      code: 'SIGNATURE_ERROR'
    });
  }
});

/**
 * GET /api/signatures/contract/:contractId
 * Get all signatures for a contract
 */
router.get('/contract/:contractId', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { contractId } = req.params;
    const signatures = getContractSignatures(contractId);

    res.json({
      contractId,
      signatures: signatures.map(sig => ({
        id: sig.id,
        signerEmail: sig.signerEmail,
        timestamp: sig.timestamp,
        ipAddress: sig.ipAddress,
        userAgent: sig.userAgent
      }))
    });

  } catch (error) {
    console.error('Get contract signatures error:', error);
    
    res.status(500).json({
      error: 'Failed to retrieve signatures',
      code: 'SIGNATURES_RETRIEVAL_ERROR'
    });
  }
});

/**
 * GET /api/signatures/validate/:signatureId
 * Validate signature integrity
 */
router.get('/validate/:signatureId', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { signatureId } = req.params;
    const validation = validateSignatureIntegrity(signatureId);

    res.json({
      signatureId,
      valid: validation.valid,
      signature: validation.signature ? {
        id: validation.signature.id,
        contractId: validation.signature.contractId,
        signerEmail: validation.signature.signerEmail,
        timestamp: validation.signature.timestamp
      } : null,
      error: validation.error
    });

  } catch (error) {
    console.error('Validate signature error:', error);
    
    res.status(500).json({
      error: 'Signature validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
});

module.exports = router;
