from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

chats_collection = db["chats"]
quiz_collection = db["quizzes"]
