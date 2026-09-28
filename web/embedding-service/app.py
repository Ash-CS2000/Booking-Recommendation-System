"""
Turns text into the same kind of vector stored in the Databricks Vector
Search index — nothing else. Node.js has no way to run this model itself,
so it calls this tiny HTTP service instead.

Must stay in sync with analysis/databricks/embed_to_vector_search.ipynb:
same model, same prefix convention, same normalization. If any of those
three drift out of sync between this file and the notebook, search results
silently get worse instead of erroring — there's no exception to catch,
the vectors just stop lining up with what's in the index.
"""

from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

MODEL_NAME = "intfloat/multilingual-e5-small"
EMBEDDING_DIM = 384

app = Flask(__name__)

print(f"Loading {MODEL_NAME} ...")
model = SentenceTransformer(MODEL_NAME)
model.max_seq_length = 512
assert model.get_sentence_embedding_dimension() == EMBEDDING_DIM
print("Model ready.")


@app.get("/health")
def health():
    return jsonify(status="ok", model=MODEL_NAME, dim=EMBEDDING_DIM)


@app.post("/embed")
def embed():
    """
    Body: {"text": "quiet studio near MRT", "kind": "query" | "passage"}

    "kind" picks the e5 prefix. Use "query" for anything a user types into
    search — that's the only case this project needs, but "passage" is
    included for completeness / testing against the notebook's own output.
    """
    body = request.get_json(silent=True) or {}
    text = body.get("text")
    kind = body.get("kind", "query")

    if not text or not isinstance(text, str):
        return jsonify(error='"text" is required and must be a string'), 400
    if kind not in ("query", "passage"):
        return jsonify(error='"kind" must be "query" or "passage"'), 400

    vector = model.encode([f"{kind}: {text}"], normalize_embeddings=True)[0]
    return jsonify(embedding=vector.tolist(), dim=len(vector))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
