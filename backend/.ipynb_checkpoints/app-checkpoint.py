from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS # 處理跨域請求

app = Flask(__name__)
CORS(app) # 允許所有來源的跨域請求，實際應用中應限制來源

# 資料庫配置
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db' # 使用 SQLite 資料庫
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- 資料庫模型定義 ---
class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    # 與 Tag 建立多對多關係
    tags = db.relationship('Tag', secondary='todo_tags', backref=db.backref('todos', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'completed': self.completed,
            'tags': [tag.to_dict() for tag in self.tags]
        }

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# 定義多對多關係的輔助表
todo_tags = db.Table('todo_tags',
    db.Column('todo_id', db.Integer, db.ForeignKey('todo.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

# 在應用啟動時建立資料庫 (只在首次執行時需要)
with app.app_context():
    db.create_all()

# --- API 路由定義 ---

# 待辦事項相關 API
@app.route('/todos', methods=['GET'])
def get_todos():
    todos = Todo.query.all()
    return jsonify([todo.to_dict() for todo in todos])

@app.route('/todos', methods=['POST'])
def add_todo():
    data = request.get_json()
    new_todo = Todo(title=data['title'])
    db.session.add(new_todo)
    db.session.commit()
    return jsonify(new_todo.to_dict()), 201

@app.route('/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json()
    todo.title = data.get('title', todo.title)
    todo.completed = data.get('completed', todo.completed)

    # 處理標籤更新
    if 'tag_ids' in data:
        todo.tags.clear() # 清除現有標籤
        for tag_id in data['tag_ids']:
            tag = Tag.query.get(tag_id)
            if tag:
                todo.tags.append(tag)

    db.session.commit()
    return jsonify(todo.to_dict())

@app.route('/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return '', 204

# 標籤相關 API
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

    existing_tag = Tag.query.filter_by(name=name).first()
    if existing_tag:
        return jsonify({'error': 'Tag already exists'}), 409 # Conflict

    new_tag = Tag(name=name)
    db.session.add(new_tag)
    db.session.commit()
    return jsonify(new_tag.to_dict()), 201

@app.route('/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    tag = Tag.query.get_or_404(tag_id)
    db.session.delete(tag)
    db.session.commit()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000) # 在開發模式下運行，端口 5000