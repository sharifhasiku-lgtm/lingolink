from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://lingo:lingopass@postgres:5432/lingolink_db')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class AudioRecord(Base):
    __tablename__ = 'audio_records'
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    transcript = Column(String)
    created_at = Column(DateTime, server_default='now()')

class TranslationRecord(Base):
    __tablename__ = 'translation_records'
    id = Column(Integer, primary_key=True, index=True)
    source_lang = Column(String)
    target_lang = Column(String)
    source_text = Column(String)
    translated_text = Column(String)
    created_at = Column(DateTime, server_default='now()')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()