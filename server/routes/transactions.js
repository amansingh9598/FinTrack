const router = require('express').Router();
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');
const { monthRange } = require('../utils/dates');

router.use(protect);

// GET /api/transactions?month=2026-11&type=expense&category=Food&search=rent&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const { month, type, category, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const filter = { user: req.user.id };
    if (month) {
      const { start, end } = monthRange(month);
      filter.date = { $gte: start, $lt: end };
    }
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) filter.note = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const [items, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Transaction.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { type, category, amount, date, note } = req.body;
    const tx = await Transaction.create({ user: req.user.id, type, category, amount, date, note });
    res.status(201).json(tx);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: 'Please check the amount, category and date' });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { type, category, amount, date, note } = req.body;
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { type, category, amount, date, note },
      { new: true, runValidators: true }
    );
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
