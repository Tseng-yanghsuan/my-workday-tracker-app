// frontend/src/components/DateCard.js
import React from 'react';
import './DateCard.css';

function DateCard() {
  const today = new Date();
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonth = monthNames[today.getMonth()];
  const currentDay = today.getDate();

  return (
    <div className="card date-card">
      <div className="month">{currentMonth}</div>
      <div className="day">{currentDay}</div>
    </div>
  );
}

export default DateCard;