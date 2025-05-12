import User from '../models/user.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token saknas eller ogiltigt format' });
    }

    const accessToken = authHeader.split(' ')[1];
    const user = await User.findOne({ accessToken });

    if (!user) {
      return res.status(401).json({ message: 'Ogiltigt access token' });
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
    };

    next();
  } catch (error) {
    res.status(500).json({ message: 'Något gick fel med autentisering' });
  }
};
