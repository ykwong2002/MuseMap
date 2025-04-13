import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from neo4j import GraphDatabase
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialise FastAPI app
app = FastAPI(
    title="MuseMap Music Composition Assistant",
    description="A music composition assistant using a music theory knowledge graph",
    version="0.1.0"
)

# Neo4j connection settings
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

# Create Neo4j driver instance
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# Define request model for /generate endpoint
class generaterequest(BaseModel):
    seed: str
    genre: str = None
    mood: str = None
    complexity: int = None

@app.get("/")
def read_root():
    """
    Root endpoint that displays a welcome message.
    """
    return {"message": "Welcome to MuseMap Music Composition Assistant"}

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify if the server is running.
    """
    return {"status": "OK"}

def retrieve_context(seed: str):
    """
    Query Neo4j knowledge graph for node matching the provided seed.
    """
    with driver.session() as session:
        query = "MATCH (n:Chord {name: $seed}) RETURN n LIMIT 1"
        result = session.run(query, seed=seed)
        record = result.single()
        if record:
            node_data = record["n"]
            return {"node": dict(node_data)}
        else:
            return None
    
def generate_music(context: dict, params: dict):
    """
    Placeholder function to generate music.
    In a full implementation, replace this with calls to your generative model,
    e.g., via Hugging Face Transformers and LangChain to incorporate the retrieved context.
    """
    seed = params.get("seed")
    return {
        "generated_sequence": f"Simulated sequence based on seed '{seed}' with context: {context}"
    }

@app.post("/generate")
def generate_endpoint(request: GenerateRequest):
    """
    API endpoint that:
      1. Retrieves context from the knowledge graph based on the seed.
      2. Passes context and parameters to the generative model.
      3. Returns the generated musical sequence or raises an error if the seed isn't found.
    """
    # Retrieve knowledge graph context using the seed
    context = retrieve_context(request.seed)
    if context is None:
        raise HTTPException(status_code=404, detail="Seed not found in the knowledge graph")

    # Generate musical output based on the retrieved context and request parameters
    generated_data = generate_music(context, request.dict())
    return {"success": True, "data": generated_data}


if __name__ == "__main__":
    # Run the server with uvicorn, enabling hot reload (useful during development)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)