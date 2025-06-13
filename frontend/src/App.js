// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css'; // 全域和主要佈局樣式

// 引入組件
import DateCard from './components/DateCard';
import WorkingHoursCard from './components/WorkingHoursCard';
import TimeTrackerCard from './components/TimeTrackerCard';
import TaskBoard from './components/TaskBoard'; // 新的任務看板組件

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000';

function App() {
  const [todos, setTodos] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  // 狀態用於控制新增任務的模態框/表單
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState(''); // YYYY-MM-DD 格式
  const [newTodoSelectedTagIds, setNewTodoSelectedTagIds] = useState([]);

  // --- 數據獲取 ---
  useEffect(() => {
    fetchTodos();
    fetchTags();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // --- 待辦事項操作 ---
  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodoTitle,
          tag_ids: newTodoSelectedTagIds,
          priority: newTodoPriority,
          due_date: newTodoDueDate || null, // 如果為空字串則傳送 null
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await response.json(); // 其實這裡可以取回新 todo，但為了簡化，直接重新獲取
      fetchTodos(); // 重新獲取所有待辦事項以更新 UI
      // 清空表單並關閉模態框
      setNewTodoTitle('');
      setNewTodoPriority('medium');
      setNewTodoDueDate('');
      setNewTodoSelectedTagIds([]);
      setIsAddingTodo(false);
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('新增待辦事項失敗！請檢查後端是否運行及網路。');
    }
  };

  // 處理任務更新的通用函數 (用於狀態、標題、優先級、截止日期等)
  const handleUpdateTodo = async (todoId, updatedFields) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      fetchTodos(); // 重新獲取所有待辦事項以更新 UI
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('更新待辦事項失敗！');
    }
  };

  // 處理任務刪除
  const handleDeleteTodo = async (todoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setTodos(todos.filter((todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('刪除待辦事項失敗！');
    }
  };

  // --- 標籤操作 ---
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });
      if (response.ok) {
        await response.json();
        fetchTags(); // 重新獲取所有標籤
        setNewTagName('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '新增標籤失敗！');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('新增標籤失敗！請檢查後端是否運行及網路。');
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setTags(tags.filter((tag) => tag.id !== tagId));
      // 同時更新所有任務中如果包含此標籤，則移除它 (前端顯示更新)
      setTodos(prevTodos => prevTodos.map(todo => ({
        ...todo,
        tags: todo.tags.filter(t => t.id !== tagId)
      })));
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('刪除標籤失敗！');
    }
  };

  // 處理新增任務表單中的標籤選擇
  const handleNewTodoTagSelection = (tagId) => {
    setNewTodoSelectedTagIds((prevSelected) =>
      prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId]
    );
  };

  // 輔助函數：根據 status 分組 todos
  const getTodosByStatus = (status) => {
    return todos.filter(todo => todo.status === status);
  };

  return (
    <div className="App">
      <h1 className="main-title">Workday Tracker</h1>

      <div className="top-cards-container">
        <DateCard />
        <WorkingHoursCard />
        <TimeTrackerCard />
      </div>

      {/* 任務看板組件，傳遞必要的 props */}
      <TaskBoard
        todos={todos}
        onUpdateTodo={handleUpdateTodo} // 傳遞更新任務的函數
        onDeleteTodo={handleDeleteTodo} // 傳遞刪除任務的函數
        onAddTodoClick={() => setIsAddingTodo(true)} // 點擊新增按鈕打開模態框
        getTodosByStatus={getTodosByStatus} // 傳遞分組函數
      />

      {/* 新增任務模態框/表單 */}
      {isAddingTodo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>新增待辦事項</h2>
            <input
              type="text"
              placeholder="任務標題..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="modal-input"
            />
            <div className="modal-select-group">
              <label htmlFor="priority-select">優先級:</label>
              <select
                id="priority-select"
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value)}
                className="modal-select"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div className="modal-select-group">
              <label htmlFor="due-date-input">截止日期:</label>
              <input
                id="due-date-input"
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="modal-tag-selection">
              <span>選擇標籤:</span>
              <div className="tag-buttons-container">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={newTodoSelectedTagIds.includes(tag.id) ? 'selected-tag' : ''}
                    onClick={() => handleNewTodoTagSelection(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleAddTodo} className="modal-button primary">新增</button>
              <button onClick={() => setIsAddingTodo(false)} className="modal-button secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 底部標籤管理區塊 */}
      <div className="manage-section">
        <h2>管理標籤</h2>
        <div className="add-tag">
          <input
            type="text"
            placeholder="新增標籤名稱..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="input-field"
          />
          <button onClick={handleAddTag} className="button primary">新增標籤</button>
        </div>

        <ul className="tag-list">
          {tags.map((tag) => (
            <li key={tag.id}>
              {tag.name}
              <button className="delete-button" onClick={() => handleDeleteTag(tag.id)}>刪除</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;