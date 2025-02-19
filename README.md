# Gemini Relay Server

This is a WebSocket relay server that acts as an intermediary between Android clients and the Gemini Multimodal Live API. It handles the secure API key management and WebSocket connections.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env` and set your Gemini API key
- Adjust the PORT if needed (default: 3000)

3. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## How it works

1. The server creates a WebSocket server that Android clients can connect to
2. When a client connects, the server:
   - Creates a new WebSocket connection to Gemini
   - Forwards messages between the client and Gemini
   - Handles connection cleanup on disconnection
3. The server manages the API key securely, never exposing it to clients

## WebSocket URL

Connect your Android client to:
```
ws://localhost:3000
```

For production, replace localhost with your server's domain.
