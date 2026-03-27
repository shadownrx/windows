import React, { useState } from 'react';

interface CalendarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarMenu: React.FC<CalendarMenuProps> = ({ isOpen, onClose }) => {
  const [date, setDate] = useState(new Date());

  if (!isOpen) return null;

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const calendarDays = [];

  for (let i = 0; i < ((firstDay + 6) % 7); i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear();

    calendarDays.push(
      <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
        {day}
      </div>
    );
  }

  const getMonthName = (d: Date) =>
    d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-menu mica premium-shadow" onClick={(e) => e.stopPropagation()}>
      <div className="calendar-header">
        <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}>&lt;</button>
        <span>{getMonthName(date)}</span>
        <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}>&gt;</button>
        <button className="calendar-close" onClick={onClose}>✕</button>
      </div>
      <div className="calendar-grid">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        {calendarDays}
      </div>

      <style>{`
        .calendar-menu {
          position: fixed;
          bottom: calc(var(--taskbar-height) + 12px);
          right: 12px;
          width: 340px;
          border-radius: var(--win-radius);
          z-index: 1101;
          color: white;
          background: rgba(22,22,22,0.95);
          border: 1px solid rgba(255,255,255,0.16);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          font-size: 13px;
        }

        .calendar-header button {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.16);
          color: white;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          cursor: pointer;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          padding: 10px;
        }

        .calendar-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .calendar-close:hover {
          background: rgba(255,255,255,0.14);
        }

        .calendar-weekday,
        .calendar-day {
          text-align: center;
          font-size: 12px;
        }

        .calendar-day {
          line-height: 1.8;
          border-radius: 6px;
          cursor: pointer;
        }

        .calendar-day:hover {
          background: rgba(255,255,255,0.1);
        }

        .calendar-day.today {
          background: #0078d4;
          color: white;
          font-weight: 600;
        }

        .calendar-day.empty {
          visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default CalendarMenu;
