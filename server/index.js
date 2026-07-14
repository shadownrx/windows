import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mountStreamRoutes, ytDlpAvailable } from './stream.js';

/** Load KEY=VAL from root/.env.local + server/.env into process.env (no overwrite). */
function loadEnvFiles() {
  const here = dirname(fileURLToPath(import.meta.url));
  const files = [resolve(here, '../.env.local'), resolve(here, '../.env'), resolve(here, '.env')];
  for (const file of files) {
    if (!existsSync(file)) continue;
    try {
      const text = readFileSync(file, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && process.env[key] === undefined) process.env[key] = val;
      }
    } catch {
      /* ignore */
    }
  }
}
loadEnvFiles();

const app = express();
app.use(cors());
app.get('/health', async (_req, res) => {
  const ytdlp = await ytDlpAvailable();
  res.json({
    ok: true,
    service: 'nex-music-server',
    stream: ytdlp.ok,
    ytDlp: ytdlp,
  });
});

const PORT = Number(process.env.PORT || process.env.MUSIC_PORT || 4000);

function resolvePublicBase() {
  if (process.env.MUSIC_PUBLIC_URL) return process.env.MUSIC_PUBLIC_URL.replace(/\/$/, '');
  // Railway provides the public domain without scheme
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN.replace(/\/$/, '')}`;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }
  return `http://localhost:${PORT}`;
}

const PUBLIC_BASE = resolvePublicBase();

mountStreamRoutes(app, { publicBase: PUBLIC_BASE });

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/** @type {Map<string, object>} */
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function publicUsers(room) {
  return room.users.map((u) => ({ id: u.id, name: u.name, isHost: u.isHost }));
}

function serializeDjPool(pool, socketId) {
  return [...pool]
    .map((e) => ({
      entryId: e.entryId,
      track: e.track,
      voteCount: e.votes.length,
      votedByMe: e.votes.includes(socketId),
      suggestedByName: e.suggestedByName,
      addedAt: e.addedAt,
    }))
    .sort((a, b) => b.voteCount - a.voteCount || a.addedAt - b.addedAt);
}

function getTopDjEntry(room) {
  if (!room.djPool.length) return null;
  const sorted = [...room.djPool].sort(
    (a, b) => b.votes.length - a.votes.length || a.addedAt - b.addedAt,
  );
  return sorted[0];
}

function broadcastDjPool(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.in(roomCode).fetchSockets().then((sockets) => {
    for (const s of sockets) {
      s.emit('dj:pool', serializeDjPool(room.djPool, s.id));
    }
  });
}

function broadcastDjState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('dj:state', room.djMode);
}

function createRoomPayload(room, socketId) {
  return {
    code: room.code,
    isHost: room.hostId === socketId,
    playback: room.playback,
    queue: room.queue,
    djMode: room.djMode,
    djPool: serializeDjPool(room.djPool, socketId),
  };
}

io.on('connection', (socket) => {
  /** @type {string | null} */
  let currentRoom = null;
  /** @type {string} */
  let userName = 'Anónimo';

  socket.on('room:create', ({ username, enableDj }, callback) => {
    const code = generateRoomCode();
    userName = username?.trim() || 'Host';

    const room = {
      code,
      hostId: socket.id,
      users: [{ id: socket.id, name: userName, isHost: true }],
      playback: null,
      queue: [],
      chat: [],
      djMode: { enabled: !!enableDj, autoPlay: true },
      djPool: [],
    };

    rooms.set(code, room);
    socket.join(code);
    currentRoom = code;

    callback?.(createRoomPayload(room, socket.id));
    io.to(code).emit('room:users', publicUsers(room));
    if (room.djMode.enabled) {
      broadcastDjState(code);
      broadcastDjPool(code);
    }
  });

  socket.on('room:join', ({ code, username }, callback) => {
    const normalized = code?.trim().toUpperCase();
    const room = normalized ? rooms.get(normalized) : null;

    if (!room) {
      callback?.({ error: 'Sala no encontrada. Verificá el código.' });
      return;
    }

    userName = username?.trim() || 'Invitado';
    if (!room.users.some((u) => u.id === socket.id)) {
      room.users.push({ id: socket.id, name: userName, isHost: false });
    }

    socket.join(normalized);
    currentRoom = normalized;

    callback?.(createRoomPayload(room, socket.id));

    io.to(normalized).emit('room:users', publicUsers(room));
    socket.to(normalized).emit('chat:message', {
      id: Date.now(),
      user: 'Sistema',
      text: `${userName} se unió a la sala`,
      at: Date.now(),
    });
  });

  socket.on('room:leave', () => {
    leaveCurrentRoom();
  });

  socket.on('playback:sync', (state) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.playback = { ...state, updatedAt: Date.now() };
    socket.to(currentRoom).emit('playback:sync', room.playback);
  });

  socket.on('queue:sync', (queue) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.queue = Array.isArray(queue) ? queue : [];
    socket.to(currentRoom).emit('queue:sync', room.queue);
  });

  socket.on('dj:toggle', ({ enabled, autoPlay }, callback) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    if (typeof enabled === 'boolean') room.djMode.enabled = enabled;
    if (typeof autoPlay === 'boolean') room.djMode.autoPlay = autoPlay;

    broadcastDjState(currentRoom);
    broadcastDjPool(currentRoom);

    io.to(currentRoom).emit('chat:message', {
      id: Date.now(),
      user: 'Sistema',
      text: room.djMode.enabled
        ? '🎧 Modo DJ activado — la audiencia puede sugerir y votar canciones'
        : 'Modo DJ desactivado',
      at: Date.now(),
    });

    callback?.({ ok: true, djMode: room.djMode });
  });

  socket.on('dj:suggest', ({ track }, callback) => {
    if (!currentRoom || !track?.id) return;
    const room = rooms.get(currentRoom);
    if (!room?.djMode.enabled) {
      callback?.({ error: 'El modo DJ no está activo' });
      return;
    }

    const duplicate = room.djPool.some((e) => e.track.id === track.id);
    if (duplicate) {
      callback?.({ error: 'Esa canción ya está en la votación' });
      return;
    }

    const entry = {
      entryId: `dj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      track,
      votes: [socket.id],
      suggestedById: socket.id,
      suggestedByName: userName,
      addedAt: Date.now(),
    };

    room.djPool.push(entry);
    broadcastDjPool(currentRoom);

    io.to(currentRoom).emit('chat:message', {
      id: Date.now(),
      user: 'Sistema',
      text: `🎵 ${userName} sugirió: ${track.title}`,
      at: Date.now(),
    });

    callback?.({ ok: true });
  });

  socket.on('dj:vote', ({ entryId }, callback) => {
    if (!currentRoom || !entryId) return;
    const room = rooms.get(currentRoom);
    if (!room?.djMode.enabled) return;

    const entry = room.djPool.find((e) => e.entryId === entryId);
    if (!entry) {
      callback?.({ error: 'Entrada no encontrada' });
      return;
    }

    const alreadyOnThis = entry.votes.includes(socket.id);
    room.djPool.forEach((e) => {
      e.votes = e.votes.filter((v) => v !== socket.id);
    });
    if (!alreadyOnThis) entry.votes.push(socket.id);

    broadcastDjPool(currentRoom);
    callback?.({ ok: true });
  });

  socket.on('dj:play-top', (_payload, callback) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    const winner = getTopDjEntry(room);
    if (!winner) {
      callback?.({ error: 'No hay sugerencias en la votación' });
      return;
    }

    room.djPool = room.djPool.filter((e) => e.entryId !== winner.entryId);

    io.to(currentRoom).emit('dj:play-winner', {
      track: winner.track,
      suggestedByName: winner.suggestedByName,
      voteCount: winner.votes.length,
    });

    broadcastDjPool(currentRoom);

    io.to(currentRoom).emit('chat:message', {
      id: Date.now(),
      user: 'Sistema',
      text: `▶ Reproduciendo ganadora: ${winner.track.title} (${winner.votes.length} votos)`,
      at: Date.now(),
    });

    callback?.({ ok: true, track: winner.track });
  });

  socket.on('dj:clear', (_payload, callback) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.djPool = [];
    broadcastDjPool(currentRoom);
    callback?.({ ok: true });
  });

  socket.on('chat:message', ({ text }) => {
    if (!currentRoom || !text?.trim()) return;

    const room = rooms.get(currentRoom);
    const msg = {
      id: Date.now(),
      user: userName,
      text: text.trim().slice(0, 500),
      at: Date.now(),
    };

    room?.chat.push(msg);
    io.to(currentRoom).emit('chat:message', msg);
  });

  socket.on('reaction', ({ emoji }) => {
    if (!currentRoom || !emoji) return;
    io.to(currentRoom).emit('reaction', { emoji, user: userName });
  });

  function leaveCurrentRoom() {
    if (!currentRoom) return;

    const room = rooms.get(currentRoom);
    if (room) {
      room.users = room.users.filter((u) => u.id !== socket.id);
      room.djPool.forEach((e) => {
        e.votes = e.votes.filter((v) => v !== socket.id);
      });

      if (room.users.length === 0) {
        rooms.delete(currentRoom);
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.users[0].id;
          room.users[0].isHost = true;
          io.to(currentRoom).emit('room:host-changed', { hostId: room.hostId });
          io.to(currentRoom).emit('chat:message', {
            id: Date.now(),
            user: 'Sistema',
            text: `${room.users[0].name} ahora es el anfitrión`,
            at: Date.now(),
          });
        }
        io.to(currentRoom).emit('room:users', publicUsers(room));
        broadcastDjPool(currentRoom);
        socket.to(currentRoom).emit('chat:message', {
          id: Date.now(),
          user: 'Sistema',
          text: `${userName} salió de la sala`,
          at: Date.now(),
        });
      }
    }

    socket.leave(currentRoom);
    currentRoom = null;
  }

  socket.on('disconnect', () => {
    leaveCurrentRoom();
  });
});

httpServer.listen(PORT, async () => {
  const ytdlp = await ytDlpAvailable();
  console.log(`NEX Music Socket.io server → http://localhost:${PORT}`);
  console.log(`Stream public base → ${PUBLIC_BASE}`);
  console.log(
    ytdlp.ok
      ? `yt-dlp OK (${ytdlp.version}) · DSP stream listo`
      : `yt-dlp NO encontrado (${ytdlp.bin}) · instalá yt-dlp o npm i en server/`,
  );
  const c = ytdlp.cookies;
  if (c?.mode === 'none') {
    console.log(
      'Cookies: ninguna · si YouTube dice "not a bot", exportá cookies.txt y poné YT_DLP_COOKIES en .env.local',
    );
  } else {
    console.log(`Cookies: ${c.mode}=${c.value}`);
  }
});
