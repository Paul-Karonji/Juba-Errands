// In middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // For now, just pass through - implement JWT later
  next();
  
  /* Uncomment when implementing JWT
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
  */
};

module.exports = auth;