"""
FastAPI server for Vue Notes with Yjs CRDT synchronization

This server provides:
- WebSocket endpoint for real-time Yjs sync
- REST API for document persistence
- Multi-room support for different documents
- Cross-platform compatibility
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from typing import Dict, Set, Optional
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vue Notes Collaboration Server",
    description="CRDT-based collaborative note editing server",
    version="1.0.0"
)

# CORS configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active documents and connections
# In production, use Redis or a proper database
class DocumentRoom:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.connections: Set[WebSocket] = set()
        self.state = bytearray()  # Yjs document state
        self.last_updated = datetime.now()
        
    async def broadcast(self, message: bytes, exclude: Optional[WebSocket] = None):
        """Broadcast message to all connections except the sender"""
        disconnected = set()
        for connection in self.connections:
            if connection != exclude:
                try:
                    await connection.send_bytes(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to connection: {e}")
                    disconnected.add(connection)
        
        # Clean up disconnected clients
        self.connections -= disconnected

# Global room manager
rooms: Dict[str, DocumentRoom] = {}

def get_or_create_room(room_id: str) -> DocumentRoom:
    """Get existing room or create new one"""
    if room_id not in rooms:
        rooms[room_id] = DocumentRoom(room_id)
        logger.info(f"Created new room: {room_id}")
    return rooms[room_id]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Vue Notes Collaboration Server",
        "active_rooms": len(rooms),
        "version": "1.0.0"
    }

@app.get("/api/rooms")
async def list_rooms():
    """List all active rooms"""
    return {
        "rooms": [
            {
                "id": room_id,
                "connections": len(room.connections),
                "last_updated": room.last_updated.isoformat()
            }
            for room_id, room in rooms.items()
        ]
    }

@app.websocket("/api/sync/{room_id}")
async def websocket_sync(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for Yjs synchronization
    
    Protocol:
    - Client connects and receives current document state
    - Clients send updates as binary messages
    - Server broadcasts updates to all other clients in the room
    """
    await websocket.accept()
    room = get_or_create_room(room_id)
    room.connections.add(websocket)
    
    logger.info(f"Client connected to room {room_id}. Total connections: {len(room.connections)}")
    
    try:
        # Send current state to new client if it exists
        if room.state:
            await websocket.send_bytes(bytes(room.state))
        
        # Listen for updates from this client
        while True:
            # Receive binary Yjs update
            data = await websocket.receive_bytes()
            
            # Update room state (merge updates)
            room.state.extend(data)
            room.last_updated = datetime.now()
            
            # Broadcast to all other clients
            await room.broadcast(data, exclude=websocket)
            
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"WebSocket error in room {room_id}: {e}")
    finally:
        room.connections.remove(websocket)
        
        # Clean up empty rooms
        if not room.connections:
            logger.info(f"Room {room_id} is empty, cleaning up")
            # In production, persist to database here
            del rooms[room_id]

@app.post("/api/documents/{doc_id}/save")
async def save_document(doc_id: str, content: dict):
    """Save document to persistent storage"""
    # In production: save to database
    doc_path = Path(f"./data/documents/{doc_id}.json")
    doc_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(doc_path, 'w') as f:
        json.dump({
            "id": doc_id,
            "content": content,
            "updated_at": datetime.now().isoformat()
        }, f)
    
    return {"status": "saved", "doc_id": doc_id}

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: str):
    """Load document from persistent storage"""
    doc_path = Path(f"./data/documents/{doc_id}.json")
    
    if not doc_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    
    with open(doc_path, 'r') as f:
        return json.load(f)

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete document"""
    doc_path = Path(f"./data/documents/{doc_id}.json")
    
    if doc_path.exists():
        doc_path.unlink()
        return {"status": "deleted", "doc_id": doc_id}
    
    raise HTTPException(status_code=404, detail="Document not found")

# Serve Vue app in production
if os.path.exists("../dist"):
    app.mount("/assets", StaticFiles(directory="../dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the Vue SPA"""
        # Serve static files directly
        if full_path.startswith(("pwa-", "favicon", "manifest")):
            file_path = Path(f"../dist/{full_path}")
            if file_path.exists():
                return FileResponse(file_path)
        
        # Otherwise serve index.html for client-side routing
        return FileResponse("../dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
