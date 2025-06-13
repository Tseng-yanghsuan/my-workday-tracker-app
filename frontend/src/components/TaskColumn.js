// frontend/src/components/TaskColumn.js
import React from 'react';
import TodoItem from './TodoItem'; // 引入單個任務項組件
import './TaskColumn.css';

function TaskColumn({ title, status, todos, onUpdateTodo, onDeleteTodo }) {
  // 圓點顏色映射
  const statusColors = {
    'todo': '#95a5a6',  // 灰色
    'doing': '#f1c40f', // 黃色
    'done': '#3498db'   // 藍色
  };

  return (
    <div className="task-column">
      <h3 className="task-column-title">
        <span className="status-dot" style={{ backgroundColor: statusColors[status] }}></span>
        {title}
      </h3>
      <ul className="todo-list">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onUpdateTodo={onUpdateTodo}
            onDeleteTodo={onDeleteTodo}
          />
        ))}
      </ul>
    </div>
  );
}

export default TaskColumn;