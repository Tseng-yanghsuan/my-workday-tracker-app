# backend/init_db.py

from app import app, db

with app.app_context():
    db.create_all()
    print("Database tables created or already exist.")

    # 可選：在這裡添加初始數據，只在資料庫為空時添加
    # 這裡假設您想確保至少有一些標籤存在，如果它們不存在的話
    from app import Tag # 確保導入 Tag 模型
    if not Tag.query.first():
        print("Adding initial tags...")
        db.session.add(Tag(name='工作'))
        db.session.add(Tag(name='個人'))
        db.session.add(Tag(name='緊急'))
        db.session.commit()
        print("Initial tags added.")
    else:
        print("Tags already exist, skipping initial data creation.")