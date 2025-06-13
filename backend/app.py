# backend/app.py

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)

# --- 資料庫配置 ---
# 使用 SQLite 資料庫，儲存在 instance 資料夾中
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # 禁用追蹤物件修改的通知

db = SQLAlchemy(app)
CORS(app) # 允許跨域請求，讓前端 React 應用程式可以訪問

# --- 資料庫模型定義 ---

# 待辦事項和標籤的多對多關係輔助表
todo_tags = db.Table('todo_tags',
    db.Column('todo_id', db.Integer, db.ForeignKey('todo.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # 任務創建時間

    # 新增欄位：
    # status: 任務狀態 ('todo', 'doing', 'done')
    status = db.Column(db.String(20), default='todo', nullable=False)
    # priority: 任務優先級 ('low', 'medium', 'high')
    priority = db.Column(db.String(20), default='medium', nullable=False)
    # due_date: 截止日期 (可以為空)
    due_date = db.Column(db.DateTime, nullable=True)

    # 與 Tag 模型建立多對多關係
    tags = db.relationship('Tag', secondary=todo_tags, lazy='subquery',
                           backref=db.backref('todos', lazy=True))

    def to_dict(self):
        """將 Todo 物件轉換為字典，以便 JSON 序列化"""
        return {
            'id': self.id,
            'title': self.title,
            'completed': self.completed,
            'created_at': self.created_at.isoformat(), # 轉換為 ISO 格式字串
            'status': self.status,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None, # 如果存在則轉換
            'tags': [tag.to_dict() for tag in self.tags] # 包含關聯的標籤列表
        }

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        """將 Tag 物件轉換為字典"""
        return {
            'id': self.id,
            'name': self.name
        }

# --- API 路徑定義 ---

# 獲取所有待辦事項
@app.route('/todos', methods=['GET'])
def get_todos():
    todos = Todo.query.all()
    return jsonify([todo.to_dict() for todo in todos])

# 新增待辦事項
@app.route('/todos', methods=['POST'])
def add_todo():
    data = request.get_json()
    title = data.get('title')
    tag_ids = data.get('tag_ids', []) # 獲取標籤 ID 列表，預設為空列表
    status = data.get('status', 'todo') # 預設為 'todo'
    priority = data.get('priority', 'medium') # 預設為 'medium'
    due_date_str = data.get('due_date') # 獲取日期字串

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    # 處理 due_date
    due_date = None
    if due_date_str:
        try:
            # 假設傳入的日期格式是 ISO 格式 (YYYY-MM-DD 或 YYYY-MM-DDTHH:MM:SS)
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid due_date format. Use ISO format (YYYY-MM-DD).'}), 400

    new_todo = Todo(title=title, status=status, priority=priority, due_date=due_date)

    # 處理標籤
    for tag_id in tag_ids:
        tag = Tag.query.get(tag_id)
        if tag:
            new_todo.tags.append(tag)

    db.session.add(new_todo)
    db.session.commit()
    return jsonify(new_todo.to_dict()), 201

# 獲取單個待辦事項
@app.route('/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    return jsonify(todo.to_dict())

# 更新待辦事項
@app.route('/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json()

    # 允許更新 title
    if 'title' in data:
        todo.title = data['title']
    # 允許更新 completed 狀態
    if 'completed' in data:
        todo.completed = data['completed']
        # 當 completed 狀態改變時，自動調整 status
        if todo.completed:
            todo.status = 'done'
        else:
            # 如果取消完成，則設定為 'todo'，但如果之前是 'doing' 也可以考慮維持 'doing'
            # 這裡簡單地設定為 'todo'
            if todo.status == 'done': # 只有從 done 取消完成才設為 todo
                todo.status = 'todo'
    # 允許更新 status 狀態
    if 'status' in data:
        todo.status = data['status']
        # 如果手動將 status 設為 'done'，也將 completed 設為 True
        if todo.status == 'done':
            todo.completed = True
        elif todo.status == 'todo' or todo.status == 'doing':
            todo.completed = False

    # 允許更新 priority
    if 'priority' in data:
        todo.priority = data['priority']
    # 允許更新 due_date
    if 'due_date' in data:
        due_date_str = data['due_date']
        if due_date_str:
            try:
                todo.due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid due_date format. Use ISO format (YYYY-MM-DD).'}), 400
        else:
            todo.due_date = None # 允許清除截止日期

    # 更新標籤 (這會替換現有標籤，如果需要新增/移除，邏輯會更複雜)
    if 'tag_ids' in data:
        todo.tags.clear() # 清除所有現有標籤
        tag_ids = data.get('tag_ids', [])
        for tag_id in tag_ids:
            tag = Tag.query.get(tag_id)
            if tag:
                todo.tags.append(tag)
            else:
                return jsonify({'error': f'Tag with ID {tag_id} not found'}), 404


    db.session.commit()
    return jsonify(todo.to_dict())

# 刪除待辦事項
@app.route('/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'message': 'Todo deleted successfully'}), 200

# 獲取所有標籤
@app.route('/tags', methods=['GET'])
def get_tags():
    tags = Tag.query.all()
    return jsonify([tag.to_dict() for tag in tags])

# 新增標籤
@app.route('/tags', methods=['POST'])
def add_tag():
    data = request.get_json()
    name = data.get('name')

    if not name:
        return jsonify({'error': 'Tag name is required'}), 400

    # 檢查標籤是否已存在
    existing_tag = Tag.query.filter_by(name=name).first()
    if existing_tag:
        return jsonify({'error': 'Tag with this name already exists'}), 409 # Conflict

    new_tag = Tag(name=name)
    db.session.add(new_tag)
    db.session.commit()
    return jsonify(new_tag.to_dict()), 201

# 刪除標籤
@app.route('/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    tag = Tag.query.get_or_404(tag_id)
    # 在刪除標籤之前，需要解除所有關聯的待辦事項
    # SQLAlchemy 會自動處理多對多關係的解除
    db.session.delete(tag)
    db.session.commit()
    return jsonify({'message': 'Tag deleted successfully'}), 200

# --- 主程式運行 ---
if __name__ == '__main__':
    with app.app_context():
        # 在應用程式啟動時創建所有資料庫表
        db.create_all()

        # 可以在這裡添加一些初始數據 (可選)
        # if not Tag.query.first():
        #     db.session.add(Tag(name='工作'))
        #     db.session.add(Tag(name='個人'))
        #     db.session.add(Tag(name='緊急'))
        #     db.session.commit()
        #     print("Added initial tags.")
    app.run(debug=True) # debug=True 會在程式碼修改時自動重啟伺服器