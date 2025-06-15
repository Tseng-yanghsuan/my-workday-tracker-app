// frontend/src/components/DateCard.js
import React from 'react';
import './DateCard.css'; // 引入其專屬 CSS

function DateCard() {
  const currentDate = new Date();
  const month = currentDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = currentDate.getDate();

  return (
    <div className="card date-card">
      <h2>{month}</h2>
      <p className="date-number">{day}</p>
    </div>
  );
}

export default DateCard;