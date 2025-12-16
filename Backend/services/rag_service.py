import faiss
import numpy as np
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def split_text(text, chunk_size=500):
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i+chunk_size]))

    return chunks


def create_embeddings(chunks):
    embeddings = []

    for chunk in chunks:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunk
        )
        embeddings.append(response.data[0].embedding)

    return np.array(embeddings).astype("float32")


def store_embeddings(embeddings):
    index = faiss.IndexFlatL2(len(embeddings[0]))
    index.add(embeddings)
    return index


def retrieve_context(question, chunks, index):
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=question
    ).data[0].embedding

    D, I = index.search(
        np.array([query_embedding]).astype("float32"),
        k=3
    )

    return " ".join([chunks[i] for i in I[0]])
