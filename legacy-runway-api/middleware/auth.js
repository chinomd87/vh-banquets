const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// In-memory storage for demo (replace with database in production)
const users = new Map();
const refreshTokens = new Map();
const signingSessions = new Map();
const contractSignatures = new Map();

/**
 * Hash password with bcrypt
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify password with bcrypt
 */
const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Authentication middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_REQUIRED'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Create user account
 */
const createUser = async (userData) => {
  const { email, password, firstName, lastName, role = 'client', phone, organization } = userData;
  
  if (users.has(email)) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const userId = uuidv4();
  
  const user = {
    id: userId,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role,
    phone,
    organization,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    isActive: true,
    mfaEnabled: false,
    identityVerified: false
  };

  users.set(email, user);
  
  // Return user without password
  // eslint-disable-next-line no-unused-vars
  const { password: userPassword, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Authenticate user
 */
const authenticateUser = async (email, password) => {
  const user = users.get(email);
  
  if (!user?.isActive) {
    throw new Error('Invalid credentials or account disabled');
  }

  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  users.set(email, user);

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };

  const accessToken = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token
  refreshTokens.set(refreshToken, {
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  });

  // eslint-disable-next-line no-unused-vars
  const { password: userPassword2, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  };
};

/**
 * Refresh access token
 */
const refreshAccessToken = (refreshToken) => {
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData || new Date() > new Date(tokenData.expiresAt)) {
    refreshTokens.delete(refreshToken);
    throw new Error('Invalid or expired refresh token');
  }

  const user = Array.from(users.values()).find(u => u.id === tokenData.userId);
  
  if (!user?.isActive) {
    refreshTokens.delete(refreshToken);
    throw new Error('User not found or inactive');
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  };

  const newAccessToken = generateToken(tokenPayload);
  
  return {
    accessToken: newAccessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  };
};

/**
 * Create signing session for contract
 */
const createSigningSession = (contractId, signerEmail, contractData) => {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const session = {
    id: sessionId,
    contractId,
    signerEmail,
    contractData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    ipAddress: null,
    userAgent: null,
    identityVerified: false,
    signatureData: null,
    completedAt: null
  };

  signingSessions.set(sessionId, session);
  return session;
};

/**
 * Verify signing session
 */
const verifySigningSession = (sessionId) => {
  const session = signingSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Signing session not found');
  }

  if (new Date() > new Date(session.expiresAt)) {
    signingSessions.delete(sessionId);
    throw new Error('Signing session expired');
  }

  if (session.status !== 'pending') {
    throw new Error('Signing session already completed or cancelled');
  }

  return session;
};

/**
 * Complete contract signature
 */
const completeSignature = (sessionId, signatureData, ipAddress, userAgent) => {
  const session = verifySigningSession(sessionId);
  
  // Create signature record
  const signatureId = uuidv4();
  const timestamp = new Date().toISOString();
  
  const signature = {
    id: signatureId,
    sessionId,
    contractId: session.contractId,
    signerEmail: session.signerEmail,
    signatureData,
    timestamp,
    ipAddress,
    userAgent,
    hashIntegrity: crypto.createHash('sha256')
      .update(JSON.stringify({
        contractId: session.contractId,
        signerEmail: session.signerEmail,
        signatureData,
        timestamp
      }))
      .digest('hex')
  };

  // Update session
  session.status = 'completed';
  session.signatureData = signatureData;
  session.completedAt = timestamp;
  session.ipAddress = ipAddress;
  session.userAgent = userAgent;

  signingSessions.set(sessionId, session);
  contractSignatures.set(signatureId, signature);

  return signature;
};

/**
 * Get contract signatures
 */
const getContractSignatures = (contractId) => {
  return Array.from(contractSignatures.values())
    .filter(sig => sig.contractId === contractId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

/**
 * Validate signature integrity
 */
const validateSignatureIntegrity = (signatureId) => {
  const signature = contractSignatures.get(signatureId);
  
  if (!signature) {
    return { valid: false, error: 'Signature not found' };
  }

  const expectedHash = crypto.createHash('sha256')
    .update(JSON.stringify({
      contractId: signature.contractId,
      signerEmail: signature.signerEmail,
      signatureData: signature.signatureData,
      timestamp: signature.timestamp
    }))
    .digest('hex');

  const valid = expectedHash === signature.hashIntegrity;
  
  return { 
    valid, 
    signature,
    expectedHash,
    actualHash: signature.hashIntegrity
  };
};

module.exports = {
  // Authentication
  authenticateToken,
  requireRole,
  createUser,
  authenticateUser,
  refreshAccessToken,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  
  // E-signature
  createSigningSession,
  verifySigningSession,
  completeSignature,
  getContractSignatures,
  validateSignatureIntegrity,
  
  // Data access (for demo - replace with database)
  users,
  refreshTokens,
  signingSessions,
  contractSignatures
};
