import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth, thisMonth } from '../utils';

export default function MonthPicker({ month, onChange }) {
  const isCurrent = month >= thisMonth();
  return (
    <div className="month-picker" role="group" aria-label="Choose month">
      <button className="icon-btn" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <span className="month-label">{monthLabel(month, true)}</span>
      <button className="icon-btn" onClick={() => onChange(shiftMonth(month, 1))} disabled={isCurrent} aria-label="Next month">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
