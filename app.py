from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get", methods=["POST"])
def get_bot_response():
    user_message = request.json.get("msg", "").lower()

    
    if "hello" in user_message:
        reply = "Hello 👋, I'm LearnMate! How can I help you today?"
    elif "college" in user_message:
        reply = "Our college offers a wide range of programs — what would you like to know about?"
    elif "fees" in user_message:
        reply = "Fee details depend on your course. Please specify your program name."
    else:
        reply = "I'm still learning 🧠! Could you please clarify your query?"

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True)
