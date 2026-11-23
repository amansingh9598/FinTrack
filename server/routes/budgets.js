const router = require('express').Router();
const Budget = require('../models/Budget');
const protect = require('../middleware/auth');
const { currentMonth } = require('../utils/dates');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    res.json(await Budget.find({ user: req.user.id, month }).sort({ category: 1 }));
  } catch (err) { next(err); }
});

// Create or update the budget for one category in one month
router.put('/', async (req, res, next) => {
  try {
    const { category, limit, month } = req.body;
    if (!category || limit === undefined || !month) {
      return res.status(400).json({ message: 'Category, limit and month are required' });
    }
    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, category, month },
      { limit },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(budget);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!b) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget removed' });
  } catch (err) { next(err); }
});

module.exports = router;
