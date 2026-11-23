const router = require('express').Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const protect = require('../middleware/auth');
const { currentMonth, monthRange, shiftMonth } = require('../utils/dates');

router.use(protect);

const oid = (id) => new mongoose.Types.ObjectId(id);
const round = (n) => Math.round(n * 100) / 100;

async function categoryTotals(userId, month, type = 'expense') {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), type, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ category: r._id, total: round(r.total), count: r.count }));
}

async function monthlySeries(userId, months) {
  const current = currentMonth();
  const first = shiftMonth(current, -(months - 1));
  const { start } = monthRange(first);
  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), date: { $gte: start } } },
    {
      $group: {
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);
  const map = {};
  rows.forEach((r) => {
    map[r._id.month] = map[r._id.month] || { income: 0, expense: 0 };
    map[r._id.month][r._id.type] = r.total;
  });
  return Array.from({ length: months }, (_, i) => {
    const month = shiftMonth(first, i);
    const { income = 0, expense = 0 } = map[month] || {};
    return { month, income: round(income), expense: round(expense), savings: round(income - expense) };
  });
}

// GET /api/analytics/summary?month=YYYY-MM  -> totals, savings rate, category breakdown
router.get('/summary', async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    const prev = shiftMonth(month, -1);
    const [expenseCats, incomeCats, prevExp, prevInc] = await Promise.all([
      categoryTotals(req.user.id, month, 'expense'),
      categoryTotals(req.user.id, month, 'income'),
      categoryTotals(req.user.id, prev, 'expense'),
      categoryTotals(req.user.id, prev, 'income'),
    ]);
    const sum = (arr) => arr.reduce((s, c) => s + c.total, 0);
    const income = sum(incomeCats);
    const expense = sum(expenseCats);
    const savings = income - expense;
    const pIncome = sum(prevInc);
    const pExpense = sum(prevExp);
    const change = (cur, old) => (old ? round(((cur - old) / old) * 100) : null);

    res.json({
      month,
      income: round(income),
      expense: round(expense),
      savings: round(savings),
      savingsRate: income ? round((savings / income) * 100) : 0,
      change: { income: change(income, pIncome), expense: change(expense, pExpense) },
      expenseByCategory: expenseCats.map((c) => ({ ...c, share: expense ? round((c.total / expense) * 100) : 0 })),
      incomeByCategory: incomeCats,
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/monthly?months=6 -> income / expense / savings per month
router.get('/monthly', async (req, res, next) => {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months) || 6, 2), 24);
    res.json(await monthlySeries(req.user.id, months));
  } catch (err) { next(err); }
});

// GET /api/analytics/daily?month=YYYY-MM -> expense per day
router.get('/daily', async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    const { start, end } = monthRange(month);
    const rows = await Transaction.aggregate([
      { $match: { user: oid(req.user.id), type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } },
    ]);
    const days = Math.round((end - start) / 86400000);
    const byDay = Object.fromEntries(rows.map((r) => [r._id, r.total]));
    let running = 0;
    res.json(
      Array.from({ length: days }, (_, i) => {
        const spent = byDay[i + 1] || 0;
        running += spent;
        return { day: i + 1, spent: round(spent), cumulative: round(running) };
      })
    );
  } catch (err) { next(err); }
});

// GET /api/analytics/budget-vs-actual?month=YYYY-MM
router.get('/budget-vs-actual', async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    const [budgets, spent] = await Promise.all([
      Budget.find({ user: req.user.id, month }),
      categoryTotals(req.user.id, month, 'expense'),
    ]);
    const spentMap = Object.fromEntries(spent.map((s) => [s.category, s.total]));
    const categories = new Set([...budgets.map((b) => b.category), ...Object.keys(spentMap)]);
    const budgetMap = Object.fromEntries(budgets.map((b) => [b.category, b]));

    const rows = [...categories].map((category) => {
      const budget = budgetMap[category]?.limit || 0;
      const actual = spentMap[category] || 0;
      return {
        category,
        budgetId: budgetMap[category]?._id || null,
        budget,
        actual: round(actual),
        remaining: round(budget - actual),
        usedPercent: budget ? Math.round((actual / budget) * 100) : null,
        status: !budget ? 'unbudgeted' : actual > budget ? 'over' : actual > budget * 0.85 ? 'near' : 'ok',
      };
    }).sort((a, b) => b.actual - a.actual);

    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    res.json({ month, rows, totalBudget, totalActual: round(totalActual) });
  } catch (err) { next(err); }
});

// GET /api/analytics/prediction -> linear regression on monthly savings
router.get('/prediction', async (req, res, next) => {
  try {
    const history = await monthlySeries(req.user.id, 6);
    // Use only months that have activity, and leave out the current month if it is still in progress
    const current = currentMonth();
    const usable = history.filter((m) => (m.income || m.expense) && m.month !== current);
    const series = usable.length >= 2 ? usable : history.filter((m) => m.income || m.expense);

    if (series.length < 2) {
      return res.json({ history, forecast: [], enoughData: false });
    }

    const n = series.length;
    const xs = series.map((_, i) => i);
    const ys = series.map((m) => m.savings);
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const mx = mean(xs), my = mean(ys);
    const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    const slope = sxx ? sxy / sxx : 0;
    const intercept = my - slope * mx;
    const ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0);
    const ssRes = ys.reduce((s, y, i) => s + (y - (intercept + slope * xs[i])) ** 2, 0);
    const r2 = ssTot ? Math.max(0, 1 - ssRes / ssTot) : 1;

    const lastMonth = series[n - 1].month;
    const forecast = [1, 2, 3].map((k) => ({
      month: shiftMonth(lastMonth, k),
      savings: Math.max(0, round(intercept + slope * (n - 1 + k))),
    }));

    res.json({
      enoughData: true,
      history,
      forecast,
      averageSavings: round(my),
      trendPerMonth: round(slope),
      next3Months: round(forecast.reduce((s, f) => s + f.savings, 0)),
      confidence: round(r2),
      basedOnMonths: n,
    });
  } catch (err) { next(err); }
});

module.exports = router;
