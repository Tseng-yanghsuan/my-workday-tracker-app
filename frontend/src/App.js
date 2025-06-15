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

  // --- 數據獲取與初始化 ---
  useEffect(() => {
    // 在組件第一次載入時清空所有數據 (僅為演示目的，會清空所有人的數據！)
    clearAllDataOnLoad();
    // 延遲一點點時間獲取數據，確保清空操作完成
    const timer = setTimeout(() => {
      fetchTodos();
      fetchTags();
    }, 100); // 延遲 100 毫秒

    return () => clearTimeout(timer); // 清理定時器
  }, []);

  const clearAllDataOnLoad = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clear_all_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data.message); // 打印成功訊息
    } catch (error) {
      console.error('Error clearing data on load:', error);
      // 即使清空失敗，也繼續嘗試載入數據
    }
  };


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

  // --- 新增：周結算/歸檔已完成事項的功能 ---
  const handleArchiveCompletedTodos = async () => {
    if (window.confirm('您確定要歸檔所有已完成的任務嗎？此操作不可逆！')) {
      try {
        const response = await fetch(`${API_BASE_URL}/todos/archive_completed`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json(); // 嘗試讀取錯誤訊息
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        alert(data.message);
        fetchTodos(); // 重新獲取所有待辦事項以更新 UI
      } catch (error) {
        console.error('Error archiving completed todos:', error);
        alert('歸檔已完成任務失敗！請檢查後端是否運行。');
      }
    }
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

        {/* 新增：周結算按鈕 */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <h3>周結算</h3>
          <button onClick={handleArchiveCompletedTodos} className="button secondary">
            歸檔所有已完成任務
          </button>
          <p style={{ fontSize: '0.8em', color: '#666' }}>
            點擊此按鈕將從列表中永久刪除所有狀態為「已完成」的任務。
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;