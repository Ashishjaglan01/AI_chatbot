import os
from openai import OpenAI

# Create OpenAI client (NEW API)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_ai(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful AI study assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=700
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        # Prevent Flask from crashing
        return f"⚠️ AI Error: {str(e)}"
