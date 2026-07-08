import jwt from 'jsonwebtoken';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing authentication'));
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, decoded) => {
    if (err) {
      return next(new AuthenticationError('Invalid access token'));
    }

    req.auth = { credentials: decoded };
    next();
  });
};

export default authenticate;