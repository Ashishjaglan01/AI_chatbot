from flask import Blueprint, request, jsonify
from services.ai_services import ask_ai
from database.db import chats_collection, quiz_collection
from datetime import datetime

chatbot = Blueprint("chatbot", __name__)


# 🔹 1. Student Query API
@chatbot.route("/ask", methods=["POST"])
def ask_question():
    question = request.json.get("question")

    prompt = f"Answer the student query in simple language:\n{question}"
    answer = ask_ai(prompt)

    chats_collection.insert_one({
        "question": question,
        "answer": answer,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"answer": answer})


# 🔹 2. Notes Generator API
@chatbot.route("/notes", methods=["POST"])
def generate_notes():
    topic = request.json.get("topic")

    prompt = f"""
    Create detailed study notes for students on "{topic}".
    Use simple language, examples, and bullet points.
    """

    notes = ask_ai(prompt)
    return jsonify({"notes": notes})


# 🔹 3. Quiz Generator API
@chatbot.route("/quiz", methods=["POST"])
def generate_quiz():
    topic = request.json.get("topic")

    prompt = f"""
    Generate 5 MCQs from "{topic}".
    Each question must have 4 options and the correct answer.
    """

    quiz = ask_ai(prompt)

    quiz_collection.insert_one({
        "topic": topic,
        "quiz": quiz,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"quiz": quiz})
