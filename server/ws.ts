/**
 * Standalone WebSocket server for real-time market updates
 * Run with: npx tsx server/ws.ts
 */

import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const WS_PORT = parseInt(process.env.WS_PORT || "3001");
const HTTP_PORT = parseInt(process.env.WS_HTTP_PORT || "3002");

interface Client {
  ws: WebSocket;
  subscribedMarkets: Set<string>;
  userId?: string;
}

const clients = new Set<Client>();
const marketRooms = new Map<string, Set<Client>>();

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[WS] WebSocket server running on port ${WS_PORT}`);

wss.on("connection", (ws) => {
  const client: Client = { ws, subscribedMarkets: new Set() };
  clients.add(client);

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(client, msg);
    } catch (e) {
      console.error("[WS] Invalid message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(client);
    client.subscribedMarkets.forEach((marketId) => {
      marketRooms.get(marketId)?.delete(client);
    });
  });

  ws.on("error", (err) => {
    console.error("[WS] Client error:", err);
  });

  send(client, { type: "connected", timestamp: new Date().toISOString() });
});

function handleMessage(client: Client, msg: { type: string; marketId?: string; userId?: string }) {
  switch (msg.type) {
    case "subscribe":
      if (msg.marketId) {
        client.subscribedMarkets.add(msg.marketId);
        if (!marketRooms.has(msg.marketId)) {
          marketRooms.set(msg.marketId, new Set());
        }
        marketRooms.get(msg.marketId)!.add(client);
      }
      break;

    case "unsubscribe":
      if (msg.marketId) {
        client.subscribedMarkets.delete(msg.marketId);
        marketRooms.get(msg.marketId)?.delete(client);
      }
      break;

    case "identify":
      client.userId = msg.userId;
      break;
  }
}

function send(client: Client, data: unknown) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

/** Broadcast to all clients subscribed to a market */
function broadcastToMarket(marketId: string, event: unknown) {
  const room = marketRooms.get(marketId);
  if (room) {
    room.forEach((client) => send(client, event));
  }
}

/** Broadcast to all connected clients */
function broadcastAll(event: unknown) {
  clients.forEach((client) => send(client, event));
}

/** Broadcast to a specific user */
function broadcastToUser(userId: string, event: unknown) {
  clients.forEach((client) => {
    if (client.userId === userId) send(client, event);
  });
}

// HTTP API for Next.js to trigger broadcasts
const httpServer = createServer((req, res) => {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Verify internal API key
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.WS_INTERNAL_KEY || "ws-internal-key";
  if (authHeader !== `Bearer ${expectedKey}`) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { type, marketId, userId, event } = JSON.parse(body);

      switch (type) {
        case "market":
          if (marketId && event) broadcastToMarket(marketId, event);
          break;
        case "user":
          if (userId && event) broadcastToUser(userId, event);
          break;
        case "all":
          if (event) broadcastAll(event);
          break;
        default:
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid type" }));
          return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`[WS] HTTP broadcast API running on port ${HTTP_PORT}`);
});

// Keep-alive heartbeat
setInterval(() => {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.ping();
    }
  });
}, 30000);

export { wss, broadcastToMarket, broadcastAll, broadcastToUser };
