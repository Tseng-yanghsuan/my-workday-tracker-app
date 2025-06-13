// frontend/src/components/TodoItem.js
import React, { useState } from 'react';
import './TodoItem.css';

function TodoItem({ todo, onUpdateTodo, onDeleteTodo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);
  const [editedPriority, setEditedPriority] = useState(todo.priority);
  // 將後端日期格式化為 YYYY-MM-DD，以便在 input type="date" 中顯示
  const [editedDueDate, setEditedDueDate] = useState(
    todo.due_date ? todo.due_date.split('T')[0] : ''
  );
  const [editedStatus, setEditedStatus] = useState(todo.status);

  const priorityColors = {
    'low': '#28a745',    // 綠色
    'medium': '#ffc107', // 黃色
    'high': '#dc3545'    // 紅色
  };

  const handleSaveEdit = () => {
    onUpdateTodo(todo.id, {
      title: editedTitle,
      priority: editedPriority,
      due_date: editedDueDate || null, // 空字串傳 null
      status: editedStatus,
      completed: editedStatus === 'done' // 如果狀態是 done，則 completed 為 true
    });
    setIsEditing(false);
  };

  // 處理點擊標題切換完成狀態 (舊行為)
  const handleTitleClick = () => {
    // 點擊標題不再直接切換 completed，而是打開編輯模式
    setIsEditing(true);
  };

  // 處理直接切換狀態的下拉選單
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    onUpdateTodo(todo.id, {
      status: newStatus,
      completed: newStatus === 'done' // 如果狀態是 done，則 completed 為 true
    });
    setEditedStatus(newStatus); // 更新本地狀態
  };

  const getDueDateDisplay = (dateString) => {
    if (!dateString) return '無截止日期';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('zh-TW', options); // 例如: "6月12日"
  };

  return (
    <li className={`todo-item card ${todo.completed ? 'completed' : ''}`}>
      {isEditing ? (
        <div className="edit-mode">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="edit-input"
          />
          <div className="edit-controls">
            <select value={editedPriority} onChange={(e) => setEditedPriority(e.target.value)}>
              <option value="low">低優先級</option>
              <option value="medium">中優先級</option>
              <option value="high">高優先級</option>
            </select>
            <input
              type="date"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
            />
            <button onClick={handleSaveEdit} className="save-button">保存</button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">取消</button>
          </div>
        </div>
      ) : (
        <>
          <div className="todo-header">
            <span className="todo-title" onClick={handleTitleClick}>{todo.title}</span>
            <select className="status-selector" value={todo.status} onChange={handleStatusChange}>
              <option value="todo">To-Do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="todo-details">
            <span className="todo-priority" style={{ backgroundColor: priorityColors[todo.priority] }}>
              {editedPriority === 'low' ? '低' : editedPriority === 'medium' ? '中' : '高'}
            </span>
            <span className="todo-due-date">
              截止：{getDueDateDisplay(todo.due_date)}
            </span>
          </div>
          <div className="todo-tags">
            {todo.tags.map((tag) => (
              <span key={tag.id} className="todo-tag">{tag.name}</span>
            ))}
          </div>
          <button className="delete-button" onClick={() => onDeleteTodo(todo.id)}>刪除</button>
        </>
      )}
    </li>
  );
}

export default TodoItem;