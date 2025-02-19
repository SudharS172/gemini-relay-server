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
wss.on('connection', (clientWs, req) => {
    console.log(`[${new Date().toISOString()}] New client connected from ${req.socket.remoteAddress}`);
    
    // Create a connection to Gemini
    console.log(`[${new Date().toISOString()}] Connecting to Gemini API...`);
    const geminiWs = new WebSocket(process.env.GEMINI_WS_URL, {
        headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY
        }
    });
    
    // Store the connection pair
    clients.set(clientWs, geminiWs);
    
    // Handle successful Gemini connection
    geminiWs.on('open', () => {
        console.log(`[${new Date().toISOString()}] Connected to Gemini API`);
    });
    
    // Handle messages from Android client
    clientWs.on('message', (data) => {
        const message = data.toString();
        console.log(`[${new Date().toISOString()}] Client → Gemini:`, message);
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(data);
        } else {
            console.log(`[${new Date().toISOString()}] Warning: Gemini connection not ready (state: ${geminiWs.readyState})`);
        }
    });
    
    // Handle messages from Gemini
    geminiWs.on('message', (data) => {
        const message = data.toString();
        console.log(`[${new Date().toISOString()}] Gemini → Client:`, message);
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
        }
    });
    
    // Handle client disconnection
    clientWs.on('close', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected`);
        const geminiWs = clients.get(clientWs);
        if (geminiWs) {
            geminiWs.close();
            clients.delete(clientWs);
        }
    });
    
    // Handle Gemini disconnection
    geminiWs.on('close', (code, reason) => {
        console.log(`[${new Date().toISOString()}] Gemini disconnected:`, code, reason.toString());
        clientWs.close();
        clients.delete(clientWs);
    });
    
    // Handle Gemini errors
    geminiWs.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Gemini WebSocket error:`, error);
        clientWs.send(JSON.stringify({
            error: {
                message: 'Error connecting to Gemini API',
                details: error.message
            }
        }));
    });
    
    // Handle client errors
    clientWs.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Client WebSocket error:`, error);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
});
