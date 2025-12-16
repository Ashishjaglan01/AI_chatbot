import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_ai(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an educational assistant. "
                        "When generating quizzes, format the output strictly in HTML. "
                        "Use <div class='quiz'>, <div class='question'>, "
                        "<ul class='options'><li> for options, and <hr> between questions. "
                        "Do NOT use markdown."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        # Never crash Flask
        return f"⚠️ AI Error: {str(e)}"
