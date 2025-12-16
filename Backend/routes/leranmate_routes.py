from flask import Blueprint, request, jsonify
from services.ai_services import ask_ai
from services.pdf_service import extract_text_from_pdf
from services.rag_service import split_text, create_embeddings, store_embeddings, retrieve_context
from database.db import chats_collection, quiz_collection
from datetime import datetime
import os

chatbot = Blueprint("chatbot", __name__)

# ================= PDF CONTEXT (SESSION LEVEL) =================
PDF_CONTEXT = {
    "active": False,
    "chunks": None,
    "index": None,
    "filename": None
}

# ================= 1️⃣ PDF UPLOAD =================
@chatbot.route("/upload", methods=["POST"])
def upload_pdf():
    file = request.files.get("pdf")

    if not file:
        return jsonify({"message": "No PDF file uploaded"}), 400

    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{file.filename}"
    file.save(path)

    text = extract_text_from_pdf(path)
    chunks = split_text(text)
    embeddings = create_embeddings(chunks)
    index = store_embeddings(embeddings)

    PDF_CONTEXT["active"] = True
    PDF_CONTEXT["chunks"] = chunks
    PDF_CONTEXT["index"] = index
    PDF_CONTEXT["filename"] = file.filename

    return jsonify({
        "message": f"PDF '{file.filename}' uploaded successfully. I can now answer questions from this document."
    })


# ================= 2️⃣ SMART CHATBOT (PDF + NORMAL) =================
@chatbot.route("/ask", methods=["POST"])
def ask_question():
    question = request.json.get("question", "").strip()

    if not question:
        return jsonify({"answer": "Please ask a valid question."})

    question_lower = question.lower()

    # 🔹 Detect quiz intent clearly
    is_quiz = any(word in question_lower for word in [
        "quiz", "mcq", "test", "questions", "multiple choice"
    ])

    # 🔹 CASE 1: PDF is active → USE PDF
    if PDF_CONTEXT["active"]:
        context = retrieve_context(
            question,
            PDF_CONTEXT["chunks"],
            PDF_CONTEXT["index"]
        )

        if is_quiz:
            prompt = f"""
            You are an educational assistant.

            Generate a quiz STRICTLY from the following document content.
            Do NOT use outside knowledge.

            Format the quiz in HTML using:
            <div class='quiz'>
              <div class='question'>Question</div>
              <ul class='options'>
                <li>A</li><li>B</li><li>C</li><li>D</li>
              </ul>
              <p><b>Correct Answer:</b> ...</p>
              <hr>
            </div>

            Document Content:
            {context}

            Task:
            Generate 5 MCQs based ONLY on the document.
            """
        else:
            prompt = f"""
            You are an educational assistant.

            Answer the question using ONLY the document content below.
            Use simple language.

            Document Content:
            {context}

            Question:
            {question}
            """

    # 🔹 CASE 2: NO PDF → NORMAL AI
    else:
        if is_quiz:
            prompt = f"""
            Generate a quiz in HTML format with 5 MCQs on the topic below.
            Each question must have 4 options and the correct answer.

            Topic:
            {question}
            """
        else:
            prompt = f"""
            Answer the student query in simple language:

            {question}
            """

    answer = ask_ai(prompt)

    chats_collection.insert_one({
        "question": question,
        "answer": answer,
        "pdf_used": PDF_CONTEXT["filename"] if PDF_CONTEXT["active"] else None,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"answer": answer})



# ================= 3️⃣ RESET PDF CONTEXT (OPTIONAL) =================
@chatbot.route("/reset-pdf", methods=["POST"])
def reset_pdf():
    PDF_CONTEXT["active"] = False
    PDF_CONTEXT["chunks"] = None
    PDF_CONTEXT["index"] = None
    PDF_CONTEXT["filename"] = None

    return jsonify({"message": "PDF context cleared. Back to normal chatbot mode."})
