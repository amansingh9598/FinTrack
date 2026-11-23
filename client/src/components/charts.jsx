import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { colorFor, compact, money, monthLabel } from '../utils';

const AXIS = { fontSize: 12, fill: '#6B7C85' };
const TIP = { borderRadius: 10, border: '1px solid #E2E8E6', boxShadow: 'none', fontSize: 13 };
const fmt = (v) => money(v);

export function TrendChart({ data, height = 280 }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} barGap={4} margin={{ left: -8, right: 4, top: 8 }}>
        <CartesianGrid stroke="#E9EFED" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
        <Tooltip contentStyle={TIP} formatter={fmt} cursor={{ fill: 'rgba(15,118,110,.06)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="income" name="Income" fill="#0F766E" radius={[5, 5, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Expenses" fill="#F4A31B" radius={[5, 5, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data, height = 260 }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="category" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((d) => <Cell key={d.category} fill={colorFor(d.category)} />)}
            </Pie>
            <Tooltip contentStyle={TIP} formatter={fmt} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <span>Spent</span>
          <strong>{compact(total)}</strong>
        </div>
      </div>
      <ul className="legend-list">
        {data.map((d) => (
          <li key={d.category}>
            <i style={{ background: colorFor(d.category) }} />
            <span>{d.category}</span>
            <b>{total ? Math.round((d.total / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BudgetBars({ rows, height = 300 }) {
  const data = rows.filter((r) => r.budget || r.actual);
  return (
    <ResponsiveContainer width="100%" height={Math.max(height, data.length * 20 + 80)}>
      <BarChart data={data} margin={{ left: -8, right: 4, top: 8 }}>
        <CartesianGrid stroke="#E9EFED" vertical={false} />
        <XAxis dataKey="category" tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={56} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
        <Tooltip contentStyle={TIP} formatter={fmt} cursor={{ fill: 'rgba(15,118,110,.06)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="budget" name="Budget" fill="#B9D8D3" radius={[5, 5, 0, 0]} maxBarSize={26} />
        <Bar dataKey="actual" name="Actual" radius={[5, 5, 0, 0]} maxBarSize={26}>
          {data.map((r) => <Cell key={r.category} fill={r.status === 'over' ? '#E4572E' : '#0F766E'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ForecastChart({ history, forecast, height = 280 }) {
  const rows = [
    ...history.map((h) => ({ label: monthLabel(h.month), actual: h.savings })),
    ...forecast.map((f) => ({ label: monthLabel(f.month), predicted: f.savings })),
  ];
  // connect the dashed forecast line to the last actual point
  const lastActual = history.length - 1;
  if (forecast.length && rows[lastActual]) rows[lastActual].predicted = rows[lastActual].actual;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ left: -8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E9EFED" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
        <Tooltip contentStyle={TIP} formatter={fmt} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        {forecast[0] && <ReferenceLine x={monthLabel(forecast[0].month)} stroke="#C9D5D1" strokeDasharray="3 3" />}
        <Area type="monotone" dataKey="actual" name="Saved" stroke="#0F766E" strokeWidth={2.5} fill="url(#gActual)" dot={{ r: 3 }} connectNulls />
        <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#F4A31B" strokeWidth={2.5} strokeDasharray="6 5" fill="none" dot={{ r: 3 }} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DailyChart({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <CartesianGrid stroke="#E9EFED" vertical={false} />
        <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
        <Tooltip contentStyle={TIP} formatter={fmt} labelFormatter={(d) => `Day ${d}`} />
        <Line type="monotone" dataKey="cumulative" name="Spent so far" stroke="#E4572E" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
