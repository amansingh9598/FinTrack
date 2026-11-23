const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { currentMonth, shiftMonth } = require('./dates');

const DEMO = { name: 'Demo User', email: 'demo@fintrack.com', password: 'demo1234' };

const rnd = (min, max) => Math.round(min + Math.random() * (max - min));

async function seedDemoUser() {
  let user = await User.findOne({ email: DEMO.email });
  if (user) return user;

  user = await User.create(DEMO);
  const now = currentMonth();
  const txs = [];
  const budgets = [];

  const budgetPlan = {
    Housing: 18000, Food: 9000, Transport: 4000, Shopping: 6000,
    Bills: 4500, Health: 2500, Entertainment: 3000, Education: 3500,
  };

  for (let i = 5; i >= 0; i--) {
    const month = shiftMonth(now, -i);
    const d = (day) => new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00.000Z`);

    txs.push({ user: user._id, type: 'income', category: 'Salary', amount: 65000 + (5 - i) * 800, date: d(1), note: 'Monthly salary' });
    if (i % 2 === 0) txs.push({ user: user._id, type: 'income', category: 'Freelance', amount: rnd(6000, 14000), date: d(14), note: 'Side project' });

    txs.push({ user: user._id, type: 'expense', category: 'Housing', amount: 17500, date: d(2), note: 'Rent' });
    txs.push({ user: user._id, type: 'expense', category: 'Bills', amount: rnd(3800, 4800), date: d(6), note: 'Electricity, internet, phone' });
    txs.push({ user: user._id, type: 'expense', category: 'Education', amount: rnd(1500, 3500), date: d(9), note: 'Online courses' });
    for (let w = 0; w < 4; w++) {
      txs.push({ user: user._id, type: 'expense', category: 'Food', amount: rnd(1600, 2800), date: d(4 + w * 7), note: 'Groceries & dining' });
      txs.push({ user: user._id, type: 'expense', category: 'Transport', amount: rnd(500, 1200), date: d(5 + w * 7), note: 'Fuel / metro' });
    }
    txs.push({ user: user._id, type: 'expense', category: 'Shopping', amount: rnd(2000, 7500), date: d(16), note: 'Clothes & gadgets' });
    txs.push({ user: user._id, type: 'expense', category: 'Entertainment', amount: rnd(1200, 3500), date: d(20), note: 'Movies & subscriptions' });
    txs.push({ user: user._id, type: 'expense', category: 'Health', amount: rnd(500, 2800), date: d(22), note: 'Pharmacy / checkup' });

    for (const [category, limit] of Object.entries(budgetPlan)) {
      budgets.push({ user: user._id, category, limit, month });
    }
  }

  // Skip transactions dated in the future (rest of the current month)
  const today = new Date();
  await Transaction.insertMany(txs.filter((t) => t.date <= today));
  await Budget.insertMany(budgets);
  return user;
}

module.exports = { seedDemoUser, DEMO };
