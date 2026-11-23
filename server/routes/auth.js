const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth');
const { seedDemoUser, DEMO } = require('../utils/seed');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const payload = (u) => ({ id: u._id, name: u.name, email: u.email });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: sign(user._id), user: payload(user) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password || ''))) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    res.json({ token: sign(user._id), user: payload(user) });
  } catch (err) { next(err); }
});

// One-click demo account with six months of sample data
router.post('/demo', async (req, res, next) => {
  try {
    const user = await seedDemoUser();
    res.json({ token: sign(user._id), user: payload(user), demo: DEMO.email });
  } catch (err) { next(err); }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Account not found' });
    res.json({ user: payload(user) });
  } catch (err) { next(err); }
});

module.exports = router;
