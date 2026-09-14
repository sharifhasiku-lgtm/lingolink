from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://lingo:lingopass@postgres:5432/lingolink_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AudioRecord(Base):
    __tablename__ = "audio_records"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    transcript = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class TranslationRecord(Base):
    __tablename__ = "translation_records"
    id = Column(Integer, primary_key=True, index=True)
    source_lang = Column(String)
    target_lang = Column(String)
    source_text = Column(Text)
    translated_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()