export const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Other'];

export const CATEGORY_COLORS = {
  Housing: '#0F766E',
  Food: '#F4A31B',
  Transport: '#3B6FB6',
  Shopping: '#E4572E',
  Bills: '#7A5AA6',
  Health: '#4FA37A',
  Entertainment: '#C2477D',
  Education: '#8A9A5B',
  Other: '#6B7C85',
};
export const colorFor = (c) => CATEGORY_COLORS[c] || '#6B7C85';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (n) => inr.format(n || 0);

export const compact = (n) => {
  const v = Math.abs(n || 0);
  const sign = n < 0 ? '-' : '';
  if (v >= 10000000) return `${sign}₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `${sign}₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${sign}₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `${sign}₹${v}`;
};

export const thisMonth = () => new Date().toISOString().slice(0, 7);

export const monthLabel = (m, long = false) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-IN', {
    month: long ? 'long' : 'short',
    year: long ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
};

export const shiftMonth = (m, delta) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1 + delta, 1)).toISOString().slice(0, 7);
};

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
