from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime

app = Flask(__name__)
CORS(app) # 啟用 CORS，允許所有來源

# 配置資料庫
# 從環境變數獲取 DATABASE_URL，如果沒有則使用本地 SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///workday_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ===============================================================
# 資料庫模型定義
# ===============================================================

# 定義 Todo 模型
class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='to-do') # to-do, doing, done
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    priority = db.Column(db.String(50), default='medium') # low, medium, high
    due_date = db.Column(db.Date, nullable=True) # 截止日期

    # 與 Tag 建立多對多關係
    tags = db.relationship('Tag', secondary='todo_tags', backref=db.backref('todos', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'tags': [tag.to_dict() for tag in self.tags]
        }

# 定義 Tag 模型
class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# 定義多對多關係的關聯表
todo_tags = db.Table(
    'todo_tags',
    db.Column('todo_id', db.Integer, db.ForeignKey('todo.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

# ===============================================================
# API 路由
# ===============================================================

# === Todo 相關路由 ===
@app.route('/todos', methods=['GET'])
def get_todos():
    todos = Todo.query.all()
    return jsonify([todo.to_dict() for todo in todos])

@app.route('/todos', methods=['POST'])
def add_todo():
    data = request.get_json()
    title = data.get('title')
    tag_ids = data.get('tag_ids', [])
    priority = data.get('priority', 'medium')
    due_date_str = data.get('due_date')

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.datetime.strptime(due_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid due_date format. Use YYYY-MM-DD.'}), 400

    new_todo = Todo(title=title, priority=priority, due_date=due_date)

    for tag_id in tag_ids:
        tag = Tag.query.get(tag_id)
        if tag:
            new_todo.tags.append(tag)

    db.session.add(new_todo)
    db.session.commit()
    return jsonify(new_todo.to_dict()), 201

@app.route('/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json()

    if 'title' in data:
        todo.title = data['title']
    if 'status' in data:
        if data['status'] in ['to-do', 'doing', 'done']:
            todo.status = data['status']
        else:
            return jsonify({'error': 'Invalid status'}), 400
    if 'priority' in data:
        if data['priority'] in ['low', 'medium', 'high']:
            todo.priority = data['priority']
        else:
            return jsonify({'error': 'Invalid priority'}), 400
    if 'due_date' in data:
        due_date_str = data['due_date']
        if due_date_str:
            try:
                todo.due_date = datetime.datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid due_date format. Use YYYY-MM-DD.'}), 400
        else:
            todo.due_date = None # 允許清空截止日期
    if 'tag_ids' in data:
        todo.tags = [] # 清空現有標籤
        for tag_id in data['tag_ids']:
            tag = Tag.query.get(tag_id)
            if tag:
                todo.tags.append(tag)
            else:
                return jsonify({'error': f'Tag with ID {tag_id} not found'}), 400

    db.session.commit()
    return jsonify(todo.to_dict())

@app.route('/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'message': 'Todo deleted successfully'})

# === Tag 相關路由 ===
@app.route('/tags', methods=['GET'])
def get_tags():
    tags = Tag.query.all()
    return jsonify([tag.to_dict() for tag in tags])

@app.route('/tags', methods=['POST'])
def add_tag():
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Tag name is required'}), 400
    if Tag.query.filter_by(name=name).first():
        return jsonify({'error': 'Tag with this name already exists'}), 409 # 409 Conflict
    new_tag = Tag(name=name)
    db.session.add(new_tag)
    db.session.commit()
    return jsonify(new_tag.to_dict()), 201

@app.route('/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    tag = Tag.query.get_or_404(tag_id)
    # 在刪除標籤之前，斷開所有關聯的 todo_tags 關係
    # SQLAlchemy 會自動處理多對多關係的刪除，但 explicit 處理可以更安全
    # 這裡無需手動操作 todo_tags 表，因為 Todo 模型中設定了 backref
    # db.session.query(todo_tags).filter_by(tag_id=tag_id).delete()
    db.session.delete(tag)
    db.session.commit()
    return jsonify({'message': 'Tag deleted successfully'})

# === 新增功能：清空所有數據 ===
# 警告：此路由會刪除所有 Todo 和 Tag 數據，僅用於開發/演示！
@app.route('/clear_all_data', methods=['POST'])
def clear_all_data():
    try:
        # 刪除 todo_tags 關聯表中的所有記錄
        db.session.query(todo_tags).delete()
        # 刪除所有 Todo 記錄
        db.session.query(Todo).delete()
        # 刪除所有 Tag 記錄
        db.session.query(Tag).delete()
        db.session.commit()
        return jsonify({'message': 'All data cleared successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing data: {e}")
        return jsonify({'error': 'Failed to clear data', 'details': str(e)}), 500

# === 新增功能：歸檔所有已完成的待辦事項 ===
@app.route('/todos/archive_completed', methods=['DELETE'])
def archive_completed_todos():
    try:
        # 找到所有 status 為 'done' 的 Todo 項目
        completed_todos = Todo.query.filter_by(status='done').all()
        if not completed_todos:
            return jsonify({'message': '