// frontend/src/components/TimeTrackerCard.js
import React from 'react';
import './TimeTrackerCard.css'; // 引入其專屬 CSS

function TimeTrackerCard() {
  return (
    <div className="card time-tracker-card">
      <h2>Time Tracker</h2>
      <button className="button">Log Time</button>
    </div>
  );
}

export default TimeTrackerCard;