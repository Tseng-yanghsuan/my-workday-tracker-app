// frontend/src/components/TaskBoard.js
import React from 'react';
import './TaskBoard.css'; // 引入其專屬 CSS

function TaskBoard({ todos, onUpdateTodo, onDeleteTodo, onAddTodoClick, getTodosByStatus }) {
  const statuses = ['to-do', 'doing', 'done']; // 定義任務狀態

  const handleStatusChange = (todoId, newStatus) => {
    onUpdateTodo(todoId, { status: newStatus });
  };

  return (
    <div className="task-board">
      {statuses.map((status) => (
        <div key={status} className="task-column">
          <div className="task-column-header">
            <h3 className={`status-${status}`}>
              <span className={`status-dot ${status}`}></span>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </h3>
            {status === 'to-do' && (
              <button onClick={onAddTodoClick} className="add-todo-button">
                + To-Do
              </button>
            )}
          </div>
          <ul className="task-list">
            {getTodosByStatus(status).map((todo) => (
              <li key={todo.id} className="todo-item">
                <div className="todo-title">{todo.title}</div>
                <div className="todo-details">
                    {todo.priority && <span className="todo-detail-item priority">{todo.priority}</span>}
                    {todo.due_date && <span className="todo-detail-item due-date">截止: {new Date(todo.due_date).toLocaleDateString()}</span>}
                </div>
                {todo.tags && todo.tags.length > 0 && (
                  <div className="todo-tags">
                    {todo.tags.map(tag => (
                      <span key={tag.id} className="todo-tag">{tag.name}</span>
                    ))}
                  </div>
                )}
                <div className="todo-actions">
                  <select
                    className="status-dropdown"
                    value={todo.status}
                    onChange={(e) => handleStatusChange(todo.id, e.target.value)}
                  >
                    <option value="to-do">To-Do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => onDeleteTodo(todo.id)} className="button delete-button">
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default TaskBoard;