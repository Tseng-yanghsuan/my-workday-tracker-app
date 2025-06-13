// frontend/src/components/WorkingHoursCard.js
import React from 'react';
import './WorkingHoursCard.css';

function WorkingHoursCard({ totalHours = 0.0, completedHours = 0.0 }) {
  // 這裡您可以根據實際數據計算進度百分比
  const progress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  return (
    <div className="card working-hours-card">
      <div className="hours-info">
        <div className="card-title">Working Hours</div>
        <div className="hours">{totalHours.toFixed(1)} <span className="hours-unit">Hours</span></div>
        <div className="completed-hours">Completed {completedHours.toFixed(1)} Hours</div>
      </div>
      {/* 這裡可以整合一個真正的圓形進度條庫，例如 react-circular-progressbar */}
      <div className="progress-circle">{progress}%</div>
    </div>
  );
}

export default WorkingHoursCard;