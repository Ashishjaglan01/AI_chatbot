from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Path where PDF notes are stored
NOTES_DIR = os.path.join(app.static_folder, "notes")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get", methods=["POST"])
def get_bot_response():
    user_input = request.json.get("msg", "").lower()

    responses = {
        "hello": "Hello! 👋 I'm LearnMate, your smart college assistant. How can I help you today?",
        "hi": "Hey there! 👋 I’m LearnMate — ready to assist you with notes, quizzes, or college info!",
        "notes": "Sure! 📘 Which subject notes do you want? (e.g., DSA, DBMS, AI)",
        "college timing": "Our college operates from 9:00 AM to 4:00 PM, Monday to Friday. 🕘",
        "hod of cse": "The Head of Computer Science Department is Dr. Meena Sharma.",
        "exam schedule": "The exam schedule will be uploaded on the ERP portal soon. Stay tuned!",
        "admission": "For admission inquiries, visit the Admission Cell or contact helpdesk@college.edu.",
        "thank": "You're welcome! 😊",
        "thanks": "You're most welcome! 😊",
    }

    note_links = {
        "data structures": "/download/dsa",
        "dsa": "/download/dsa",
        "dbms": "/download/dbms",
        "ai": "/download/ai",
    }

    # Notes check
    for key in note_links:
        if key in user_input:
            return jsonify({
                "reply": f"Here are your <b>{key.upper()}</b> notes! 📘 <a href='{note_links[key]}' target='_blank' class='download-link'>Click to Download</a>"
            })

    # General response check
    for key in responses:
        if key in user_input:
            return jsonify({"reply": responses[key]})

    # Default
    return jsonify({"reply": "I'm not sure about that yet, but I’m learning! 🤖"})

@app.route("/download/<subject>")
def download_notes(subject):
    filenames = {
        "dsa": "DSA_Notes.pdf",
        "dbms": "DBMS_Notes.pdf",
        "ai": "AI_Notes.pdf"
    }

    if subject in filenames:
        filename = filenames[subject]
        return send_from_directory(NOTES_DIR, filename, as_attachment=True)
    else:
        return "Notes not found!", 404

if __name__ == "__main__":
    app.run(debug=True)
