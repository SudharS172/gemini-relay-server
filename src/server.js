import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { config } from 'dotenv';
import http from 'http';

// Load environment variables
config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store client connections
const clients = new Map();

// Handle incoming WebSocket connections from Android clients
wss.on('connection', (clientWs) => {
    console.log('New client connected');
    
    // Create a connection to Gemini
    const geminiWs = new WebSocket(process.env.GEMINI_WS_URL, {
        headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY
        }
    });
    
    // Store the connection pair
    clients.set(clientWs, geminiWs);
    
    // Handle messages from Android client
    clientWs.on('message', (data) => {
        console.log('Received from client:', data.toString());
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(data);
        }
    });
    
    // Handle messages from Gemini
    geminiWs.on('message', (data) => {
        console.log('Received from Gemini:', data.toString());
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
        }
    });
    
    // Handle client disconnection
    clientWs.on('close', () => {
        console.log('Client disconnected');
        const geminiWs = clients.get(clientWs);
        if (geminiWs) {
            geminiWs.close();
            clients.delete(clientWs);
        }
    });
    
    // Handle Gemini disconnection
    geminiWs.on('close', (code, reason) => {
        console.log('Gemini disconnected:', code, reason.toString());
        clientWs.close();
        clients.delete(clientWs);
    });
    
    // Handle errors
    clientWs.on('error', console.error);
    geminiWs.on('error', console.error);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
