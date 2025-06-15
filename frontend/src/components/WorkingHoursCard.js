// frontend/src/components/WorkingHoursCard.js
import React from 'react';
import './WorkingHoursCard.css'; // 引入其專屬 CSS

function WorkingHoursCard() {
  // 這是一個靜態卡片，目前沒有實際的工時追蹤邏輯
  const totalHours = 0.0; // 假設總工時
  const completedHours = 0.0; // 假設已完成工時
  const percentage = (completedHours / totalHours) * 100; // 目前為0

  // 設置圓環進度條的樣式
  const progressStyle = {
    background: `conic-gradient(#4CAF50 ${percentage}%, #eee ${percentage}% 100%)`,
  };

  return (
    <div className="card working-hours-card">
      <h2>Working Hours</h2>
      <p className="hours-display">{totalHours.toFixed(1)} Hours</p>
      <div className="progress-circle" style={progressStyle}>
        {percentage.toFixed(0)}%
      </div>
      <p>Completed {completedHours.toFixed(1)} Hours</p>
    </div>
  );
}

export default WorkingHoursCard;