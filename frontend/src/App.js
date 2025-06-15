// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css'; // 全域和主要佈局樣式

// 引入組件 (它們各自引入自己的 CSS 檔案)
import DateCard from './components/DateCard';
import WorkingHoursCard from './components/WorkingHoursCard';
import TimeTrackerCard from './components/TimeTrackerCard';
import TaskBoard from './components/TaskBoard'; // 任務看板組件

// 後端 API 的基本 URL，從環境變數讀取
// 如果在本地開發，會回退到 'http://127.0.0.1:5000'
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000';

function App() {
  // 應用程式的主要狀態
  const [todos, setTodos] = useState([]); // 待辦事項列表
  const [tags, setTags] = useState([]);   // 標籤列表
  const [newTagName, setNewTagName] = useState(''); // 新增標籤的輸入值

  // 用於控制新增任務模態框的狀態和輸入值
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState(''); // 日期格式: YYYY-MM-DD
  const [newTodoSelectedTagIds, setNewTodoSelectedTagIds] = useState([]); // 新任務選取的標籤 ID

  // --- 數據獲取與初始化 ---
  // 在組件首次載入時執行，獲取待辦事項和標籤
  useEffect(() => {
    // 之前用於每次載入清空數據的功能已移除，所以這裡直接獲取數據
    fetchTodos();
    fetchTags();
  }, []); // 空依賴陣列表示只在組件掛載時執行一次

  // 異步函數：從後端獲取所有待辦事項
  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      // 檢查 HTTP 響應是否成功 (status code 2xx)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // 解析 JSON 響應
      setTodos(data); // 更新 todos 狀態
    } catch (error) {
      console.error('Error fetching todos:', error); // 捕獲並打印錯誤
      // 這裡可以添加用戶友好的錯誤提示
    }
  };

  // 異步函數：從後端獲取所有標籤
  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTags(data); // 更新 tags 狀態
    } catch (error) {
      console.error('Error fetching tags:', error);
      // 這裡可以添加用戶友好的錯誤提示
    }
  };

  // --- 待辦事項操作 ---

  // 異步函數：向後端新增一個待辦事項
  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return; // 如果標題為空，則不執行任何操作

    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // 設置請求頭為 JSON
        body: JSON.stringify({ // 將數據轉換為 JSON 字串
          title: newTodoTitle,
          tag_ids: newTodoSelectedTagIds,
          priority: newTodoPriority,
          due_date: newTodoDueDate || null, // 如果日期為空字串，則發送 null
        }),
      });

      if (!response.ok) {
        // 如果 HTTP 響應不成功，嘗試解析後端返回的錯誤訊息
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // 如果成功，重新獲取所有待辦事項以更新 UI
      fetchTodos();
      // 重置表單狀態並關閉模態框
      setNewTodoTitle('');
      setNewTodoPriority('medium');
      setNewTodoDueDate('');
      setNewTodoSelectedTagIds([]);
      setIsAddingTodo(false);
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('新增待辦事項失敗！請檢查後端是否運行及網路。'); // 提示用戶
    }
  };

  // 異步函數：更新指定 ID 的待辦事項
  const handleUpdateTodo = async (todoId, updatedFields) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      fetchTodos(); // 重新獲取所有待辦事項以更新 UI
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('更新待辦事項失敗！');
    }
  };

  // 異步函數：刪除指定 ID 的待辦事項
  const handleDeleteTodo = async (todoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 直接從前端狀態中移除已刪除的待辦事項，避免再次獲取所有數據
      setTodos(todos.filter((todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('刪除待辦事項失敗！');
    }
  };

  // --- 標籤操作 ---

  // 異步函數：向後端新增一個標籤
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });

      if (response.ok) {
        await response.json(); // 解析響應，但這裡不需要其數據
        fetchTags(); // 重新獲取所有標籤以更新 UI
        setNewTagName(''); // 清空輸入欄
      } else {
        // 如果後端返回錯誤（例如標籤已存在），解析錯誤訊息
        const errorData = await response.json();
        alert(errorData.error || '新增標籤失敗！');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('新增標籤失敗！請檢查後端是否運行及網路。');
    }
  };

  // 異步函數：刪除指定 ID 的標籤
  const handleDeleteTag = async (tagId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 從前端狀態中移除已刪除的標籤
      setTags(tags.filter((tag) => tag.id !== tagId));
      // 同時更新所有待辦事項，移除其中包含此標籤的引用
      setTodos(prevTodos => prevTodos.map(todo => ({
        ...todo,
        tags: todo.tags.filter(t => t.id !== tagId)
      })));
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('刪除標籤失敗！');
    }
  };

  // 處理新增任務模態框中的標籤選擇
  const handleNewTodoTagSelection = (tagId) => {
    setNewTodoSelectedTagIds((prevSelected) =>
      prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId) // 如果已選中，則移除
        : [...prevSelected, tagId] // 如果未選中，則添加
    );
  };

  // 輔助函數：根據任務狀態過濾待辦事項
  const getTodosByStatus = (status) => {
    return todos.filter(todo => todo.status === status);
  };

  // --- 周結算 / 歸檔所有已完成的待辦事項的功能 ---

  // 異步函數：向後端發送請求，刪除所有狀態為 'done' 的待辦事項
  const handleArchiveCompletedTodos = async () => {
    // 彈出確認框，讓用戶確認此不可逆操作
    if (window.confirm('您確定要歸檔所有已完成的任務嗎？此操作不可逆！')) {
      try {
        const response = await fetch(`${API_BASE_URL}/todos/archive_completed`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json(); // 嘗試讀取後端返回的錯誤訊息
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // 解析響應數據
        alert(data.message); // 顯示後端返回的成功訊息
        fetchTodos(); // 重新獲取所有待辦事項以更新 UI，顯示已歸檔後的列表
      } catch (error) {
        console.error('Error archiving completed todos:', error);
        alert('歸檔已完成任務失敗！請檢查後端是否運行。');
      }
    }
  };


  return (
    <div className="App">
      <h1 className="main-title">Workday Tracker</h1>

      {/* 頂部卡片區塊 */}
      <div className="top-cards-container">
        <DateCard />
        <WorkingHoursCard />
        <TimeTrackerCard />
      </div>

      {/* 任務看板組件 */}
      <TaskBoard
        todos={todos}
        onUpdateTodo={handleUpdateTodo} // 傳遞更新任務的函數
        onDeleteTodo={handleDeleteTodo} // 傳遞刪除任務的函數
        onAddTodoClick={() => setIsAddingTodo(true)} // 點擊新增按鈕打開模態框
        getTodosByStatus={getTodosByStatus} // 傳遞分組函數
      />

      {/* 新增任務模態框 */}
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
              {/* 刪除標籤按鈕改為紅色叉叉圖標 */}
              <span onClick={() => handleDeleteTag(tag.id)} className="delete-button">
                &times; {/* HTML 實體：叉號 */}
              </span>
            </li>
          ))}
        </ul>

        {/* 周結算按鈕 */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}> {/* 調整邊框顏色 */}
          <h3>周結算</h3>
          <button onClick={handleArchiveCompletedTodos} className="button secondary">
            歸檔所有已完成任務
          </button>
          <p style={{ fontSize: '0.9em', color: '#6c757d', marginTop: '10px' }}> {/* 調整字體大小和顏色 */}
            點擊此按鈕將從列表中永久刪除所有狀態為「已完成」的任務。
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
