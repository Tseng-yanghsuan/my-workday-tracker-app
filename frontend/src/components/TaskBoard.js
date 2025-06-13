// frontend/src/components/TaskBoard.js
import React from 'react';
import TaskColumn from './TaskColumn'; // 引入任務列組件
import './TaskBoard.css';

function TaskBoard({ todos, onUpdateTodo, onDeleteTodo, onAddTodoClick, getTodosByStatus }) {
  return (
    <div className="task-board-container">
      <div className="task-board-header">
        <div className="card-title">Task Board</div>
        <button className="add-todo-board-button" onClick={onAddTodoClick}>
          + To-Do
        </button>
      </div>

      <div className="task-columns">
        {/* To-Do 任務列 */}
        <TaskColumn
          title="To-Do"
          status="todo"
          todos={getTodosByStatus('todo')}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
        />

        {/* Doing 任務列 */}
        <TaskColumn
          title="Doing"
          status="doing"
          todos={getTodosByStatus('doing')}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
        />

        {/* Done 任務列 */}
        <TaskColumn
          title="Done"
          status="done"
          todos={getTodosByStatus('done')}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
        />
      </div>
    </div>
  );
}

export default TaskBoard;