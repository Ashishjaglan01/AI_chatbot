from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import sqlite3
import uuid
import os
from fpdf import FPDF
from werkzeug.utils import secure_filename

app = Flask(__name__, static_url_path="/static")
CORS(app)

# Paths
NOTES_DIR = os.path.join(app.static_folder, "notes")
EXPORT_DIR = "exports"
os.makedirs(EXPORT_DIR, exist_ok=True)

DB = "chat_history.db"


# DATABASE INITIALIZATION
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            session_id TEXT PRIMARY KEY,
            title TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            sender TEXT,
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


init_db()



# FRONTEND
@app.route("/")
def index():
    return render_template("index.html")


# CREATE NEW CHAT
@app.route("/new_chat", methods=["POST"])
def new_chat():
    try:
        session_id = str(uuid.uuid4())
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("INSERT INTO chats (session_id, title) VALUES (?, ?)", (session_id, "New Chat"))
        conn.commit()
        conn.close()
        return jsonify({"session_id": session_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# SAVE MESSAGE
@app.route("/save_message", methods=["POST"])
def save_message():
    try:
        data = request.json
        session_id = data["session_id"]
        sender = data["sender"]
        message = data["message"].strip()

        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute("INSERT INTO messages (session_id, sender, message) VALUES (?, ?, ?)",
                  (session_id, sender, message))

        # Auto-title using the first user message only
        if sender == "user":
            c.execute("""
                SELECT message FROM messages
                WHERE session_id=? AND sender='user'
                ORDER BY id ASC LIMIT 1
            """, (session_id,))
            first = c.fetchone()

            if first:
                # make a short, safe title
                clean_title = first[0].replace("<br>", " ").replace("\n", " ").strip()[:35]
                if not clean_title:
                    clean_title = "New Chat"
                c.execute("UPDATE chats SET title=? WHERE session_id=?", (clean_title, session_id))

        conn.commit()
        conn.close()
        return jsonify({"status": "saved"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET CHAT LIST
@app.route("/get_chats")
def get_chats():
    try:
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("SELECT session_id, title FROM chats ORDER BY rowid DESC")
        rows = c.fetchall()
        conn.close()

        return jsonify([
            {"session_id": row[0], "title": row[1]}
            for row in rows
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET MESSAGES OF A CHAT
@app.route("/get_messages/<session_id>")
def get_messages(session_id):
    try:
        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute("""
            SELECT sender, message FROM messages
            WHERE session_id=?
            ORDER BY id ASC
        """, (session_id,))

        rows = c.fetchall()
        conn.close()

        return jsonify([
            {"sender": row[0], "message": row[1]}
            for row in rows
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# BOT RESPONSE LOGIC
@app.route("/get", methods=["POST"])
def get_bot_response():
    try:
        data = request.json
        user_input = data.get("msg", "").lower()

        responses = {
            "hello": "Hello! 👋 I'm LearnMate. How can I help you today?",
            "hi": "Hi! 👋 Ask me anything about college, notes, exams, etc.",
            "notes": "Sure! 📘 Which subject notes do you want? (DSA / DBMS / AI)",
            "college timing": "Our college runs from 9 AM to 4 PM, Monday–Friday.",
            "hod of cse": "Dr. Meena Sharma is the HOD of Computer Science.",
            "exam schedule": "The exam schedule will be updated soon on the ERP portal.",
            "admission": "Visit the Admission Cell or mail at helpdesk@college.edu.",
            "thanks": "Glad to help! 😊",
            "thank you": "You're welcome! 😊",
        }

        note_links = {
            "dsa": "/download/dsa",
            "data structures": "/download/dsa",
            "dbms": "/download/dbms",
            "ai": "/download/ai",
        }

        # Notes
        for key in note_links:
            if key in user_input:
                return jsonify({
                    "reply": f"""
                    Here are your <b>{key.upper()}</b> notes! 📘<br>
                    <a href="{note_links[key]}" target="_blank" class="download-link">Click to Download</a>
                    """
                })

        # Basic responses
        for key in responses:
            if key in user_input:
                return jsonify({"reply": responses[key]})

        return jsonify({
            "reply": "I'm still learning! 🤖 Try asking about notes, timings, or exams."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# NOTES DOWNLOAD
@app.route("/download/<subject>")
def download_notes(subject):
    try:
        files = {
            "dsa": "DSA_Notes.pdf",
            "dbms": "DBMS_Notes.pdf",
            "ai": "AI_Notes.pdf",
        }

        if subject in files:
            filename = files[subject]
            if not os.path.exists(os.path.join(NOTES_DIR, filename)):
                return "Notes file missing on server.", 404
            return send_from_directory(NOTES_DIR, filename, as_attachment=True)

        return "Notes not found!", 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# DELETE CHAT
@app.route("/delete_chat/<session_id>", methods=["DELETE"])
def delete_chat(session_id):
    try:
        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
        c.execute("DELETE FROM chats WHERE session_id=?", (session_id,))

        conn.commit()
        conn.close()

        return jsonify({"status": "deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# RENAME CHAT
@app.route("/rename_chat", methods=["POST"])
def rename_chat():
    try:
        data = request.json
        session_id = data["session_id"]
        title = (data.get("title") or "").strip() or "Untitled Chat"

        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("UPDATE chats SET title=? WHERE session_id=?", (title, session_id))

        conn.commit()
        conn.close()
        return jsonify({"status": "renamed"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# EXPORT CHAT AS PDF
@app.route("/export_pdf/<session_id>")
def export_pdf(session_id):
    try:
        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute("""
            SELECT sender, message FROM messages
            WHERE session_id=?
            ORDER BY id ASC
        """, (session_id,))
        rows = c.fetchall()
        conn.close()

        if not rows:
            return jsonify({"error": "No messages found for this session."}), 404

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=12)

        pdf.set_font("Arial", style="B", size=14)
        pdf.cell(0, 10, "LearnMate - Chat Export", ln=True)
        pdf.ln(6)

        pdf.set_font("Arial", size=12)
        for sender, msg in rows:
            # Label (User / Bot)
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(0, 8, f"{sender.capitalize()}:", ln=True)

            # Message body, convert simple HTML <br> to newlines
            pdf.set_font("Arial", size=11)
            clean_msg = (msg or "").replace("<br>", "\n")
            # If message is long, use multi_cell so it wraps
            pdf.multi_cell(0, 8, clean_msg)
            pdf.ln(2)

        # secure filename
        safe_name = secure_filename(f"{session_id}.pdf")
        filename = os.path.join(EXPORT_DIR, safe_name)
        pdf.output(filename)

        # return a full URL path for frontend to download
        download_url = url_for('serve_export', filename=safe_name)
        return jsonify({"file": download_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# SERVE EXPORTED PDF FILES
@app.route("/exports/<path:filename>")
def serve_export(filename):
    return send_from_directory(EXPORT_DIR, filename, as_attachment=True)



# RUN APP
if __name__ == "__main__":
    app.run(debug=True)
