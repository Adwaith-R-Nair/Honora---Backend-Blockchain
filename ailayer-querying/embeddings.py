from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
VECTOR_SIZE = 384

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_text(text: str) -> List[float]:
    model = get_model()
    vector = model.encode(text, convert_to_numpy=True)
    return vector.tolist()


def embed_batch(texts: List[str]) -> List[List[float]]:
    model = get_model()
    vectors = model.encode(texts, convert_to_numpy=True, batch_size=32)
    return vectors.tolist()
