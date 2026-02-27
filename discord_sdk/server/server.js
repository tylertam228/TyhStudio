import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

if (!process.env.DISCORD_CLIENT_ID) {
  dotenv.config();
}

console.log("[ENV] Loading from:", envPath);
console.log("[ENV] CLIENT_ID:", process.env.VITE_DISCORD_CLIENT_ID ? "SET" : "NOT SET");
console.log("[ENV] CLIENT_SECRET:", process.env.DISCORD_CLIENT_SECRET ? "SET" : "NOT SET");

import * as ActivityLogger from "./services/activityLogger.js";
import iqRoutes from "./routes/iq.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",
      "https://activity.tyhstudio.com",
      /\.discordsays\.com$/,
      /\.discord\.com$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

const port = process.env.ACTIVITY_PORT || 3001;

app.use(cors());
app.use(express.json());

// Share io with routes
app.locals.io = io;

// IQ Rank System API
app.use("/api/iq", iqRoutes);

// ========================================
// 房間狀態管理
// ========================================

const GameState = {
  LOBBY: "LOBBY",
};

const rooms = new Map();

function getOrCreateRoom(channelId, guildId = null) {
  if (!rooms.has(channelId)) {
    rooms.set(channelId, {
      channelId,
      guildId,
      state: GameState.LOBBY,
      hostId: null,
      players: new Map(),
      createdAt: Date.now(),
      isNewRoom: true
    });
  }
  return rooms.get(channelId);
}

function getRoomPublicState(room) {
  const players = [];
  room.players.forEach((player, socketId) => {
    players.push({
      odId: socketId,
      oduserId: player.userId,
      username: player.username,
      odavatar: player.avatar,
      odisHost: socketId === room.hostId
    });
  });

  return {
    channelId: room.channelId,
    state: room.state,
    hostId: room.hostId,
    players,
    availableGames: []
  };
}

// ========================================
// Discord OAuth Token Exchange
// ========================================

app.post("/api/token", async (req, res) => {
  const clientId = process.env.VITE_DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const code = req.body.code;

  if (!clientId || !clientSecret) {
    console.error("[Token] Missing credentials - CLIENT_ID:", !!clientId, "SECRET:", !!clientSecret);
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!code) {
    console.error("[Token] No authorization code provided");
    return res.status(400).json({ error: "No authorization code provided" });
  }

  console.log("[Token] Exchanging code for token...");

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("[Token] Exchange error:", data.error, data.error_description);
      return res.status(400).json({ error: data.error, description: data.error_description });
    }

    if (!data.access_token) {
      console.error("[Token] No access token in response:", data);
      return res.status(400).json({ error: "No access token received" });
    }

    console.log("[Token] Exchange successful");
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Token exchange failed:", error);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    rooms: rooms.size,
    uptime: process.uptime(),
    activeSessions: ActivityLogger.getActiveSessions()
  });
});

app.get("/api/stats", async (req, res) => {
  const { guildId, days } = req.query;
  const stats = await ActivityLogger.getStats(guildId, parseInt(days) || 30);
  res.json(stats);
});

app.get("/api/logs", (req, res) => {
  const { limit } = req.query;
  const logs = ActivityLogger.getLocalLogs(parseInt(limit) || 100);
  res.json(logs);
});

// ========================================
// Socket.io 連線處理
// ========================================

io.on("connection", (socket) => {
  console.log(`[Socket] 新連線: ${socket.id}`);
  
  let currentChannelId = null;
  let currentGuildId = null;
  let currentUserId = null;
  let currentUsername = null;

  socket.on("join_room", async (data) => {
    const { channelId, guildId, userId, username, avatar } = data;
    
    if (!channelId || !userId) {
      socket.emit("error", { message: "缺少必要資訊 (channelId, userId)" });
      return;
    }

    currentChannelId = channelId;
    currentGuildId = guildId;
    currentUserId = userId;
    currentUsername = username;

    const room = getOrCreateRoom(channelId, guildId);
    const isFirstPlayer = room.players.size === 0;

    room.players.set(socket.id, {
      userId,
      username: username || "未知玩家",
      avatar,
      joinedAt: Date.now()
    });

    if (!room.hostId) {
      room.hostId = socket.id;
      console.log(`[Room ${channelId}] 新房主: ${username} (${socket.id})`);
    }

    socket.join(channelId);

    console.log(`[Room ${channelId}] ${username} 加入房間，目前人數: ${room.players.size}`);

    if (isFirstPlayer && room.isNewRoom) {
      await ActivityLogger.logSessionStart(channelId, guildId, userId, username);
      room.isNewRoom = false;
    } else {
      await ActivityLogger.logPlayerJoin(channelId, userId, username);
    }

    io.to(channelId).emit("room_update", getRoomPublicState(room));
    socket.emit("host_status", { isHost: socket.id === room.hostId });
  });

  // ========================================
  // IQ Discussion Board - Real-time Events
  // ========================================
  socket.on("iq_join_challenge", (data) => {
    const { challengeId } = data;
    if (challengeId) {
      socket.join(`challenge_${challengeId}`);
    }
  });

  socket.on("iq_leave_challenge", (data) => {
    const { challengeId } = data;
    if (challengeId) {
      socket.leave(`challenge_${challengeId}`);
    }
  });

  socket.on("iq_new_comment", (data) => {
    const { challengeId, comment } = data;
    if (challengeId) {
      io.to(`challenge_${challengeId}`).emit("iq_comment_added", comment);
    }
  });

  socket.on("iq_vote_update", (data) => {
    const { challengeId, agreeCount, disagreeCount } = data;
    if (challengeId) {
      io.to(`challenge_${challengeId}`).emit("iq_vote_changed", { agreeCount, disagreeCount });
    }
  });

  socket.on("disconnect", async () => {
    console.log(`[Socket] 斷線: ${socket.id}`);

    if (!currentChannelId) return;

    const room = rooms.get(currentChannelId);
    if (!room) return;

    const disconnectedPlayer = room.players.get(socket.id);
    room.players.delete(socket.id);

    const playerName = disconnectedPlayer?.username || currentUsername || "未知";
    const playerId = disconnectedPlayer?.userId || currentUserId;

    console.log(`[Room ${currentChannelId}] ${playerName} 離開房間，剩餘人數: ${room.players.size}`);

    await ActivityLogger.logPlayerLeave(currentChannelId, playerId, playerName);

    if (room.players.size === 0) {
      await ActivityLogger.logSessionEnd(currentChannelId);
      rooms.delete(currentChannelId);
      console.log(`[Room ${currentChannelId}] 房間已清空並刪除`);
      return;
    }

    if (socket.id === room.hostId) {
      const newHostId = room.players.keys().next().value;
      room.hostId = newHostId;
      const newHost = room.players.get(newHostId);
      console.log(`[Room ${currentChannelId}] 新房主: ${newHost?.username}`);
      io.to(newHostId).emit("host_status", { isHost: true });
    }

    io.to(currentChannelId).emit("room_update", getRoomPublicState(room));
  });
});

// ========================================
// Production: serve Vite built files
// ========================================

const clientDistPath = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ========================================
// 啟動伺服器
// ========================================

httpServer.listen(port, () => {
  console.log(`🚀 伺服器運行於 http://localhost:${port}`);
  console.log(`📡 Socket.io 已啟用`);
  console.log(`📊 Activity Logger 已啟用`);
});
