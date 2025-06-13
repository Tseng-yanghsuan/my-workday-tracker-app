// frontend/src/components/TimeTrackerCard.js
import React from 'react';
import './TimeTrackerCard.css';

function TimeTrackerCard() {
  const handleLogTime = () => {
    alert('Log Time clicked! (Implement actual time tracking here)');
    // 這裡會處理記錄時間的邏輯，可能打開一個模態框來選擇任務並開始計時
  };

  return (
    <div className="card time-tracker-card">
      <div className="card-title">Time Tracker</div>
      <button className="log-time-button" onClick={handleLogTime}>Log Time</button>
    </div>
  );
}

export default TimeTrackerCard;