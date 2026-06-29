import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  ChatMessage,
  DjModeState,
  DjVoteEntry,
  LiveReaction,
  PlaybackSyncState,
  RoomUser,
  Track,
} from '../types/music';

const SERVER_URL = import.meta.env.VITE_MUSIC_SERVER_URL ?? '';

interface JoinResult {
  code?: string;
  isHost?: boolean;
  playback?: PlaybackSyncState | null;
  queue?: Track[];
  djMode?: DjModeState;
  djPool?: DjVoteEntry[];
  error?: string;
}

const DEFAULT_DJ_MODE: DjModeState = { enabled: false, autoPlay: true };

export function useMusicSync() {
  const socketRef = useRef<Socket | null>(null);
  const onRemotePlaybackRef = useRef<((state: PlaybackSyncState) => void) | null>(null);
  const onRemoteQueueRef = useRef<((queue: Track[]) => void) | null>(null);
  const onDjPlayWinnerRef = useRef<((track: Track) => void) | null>(null);

  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [djMode, setDjMode] = useState<DjModeState>(DEFAULT_DJ_MODE);
  const [djPool, setDjPool] = useState<DjVoteEntry[]>([]);

  useEffect(() => {
    const socket = io(SERVER_URL || undefined, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 8,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id ?? null);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnectionError('No se pudo conectar al servidor en vivo. Ejecutá: npm run music:server');
    });

    socket.on('room:users', (users: RoomUser[]) => {
      setRoomUsers(users);
      const me = users.find((u) => u.id === socket.id);
      setIsHost(!!me?.isHost);
    });

    socket.on('room:host-changed', () => {
      /* room:users follows */
    });

    socket.on('playback:sync', (state: PlaybackSyncState) => {
      onRemotePlaybackRef.current?.(state);
    });

    socket.on('queue:sync', (queue: Track[]) => {
      onRemoteQueueRef.current?.(queue);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-99), msg]);
    });

    socket.on('reaction', (payload: { emoji: string; user: string }) => {
      setReactions((prev) => [
        ...prev.slice(-20),
        { key: Date.now() + Math.random(), emoji: payload.emoji, user: payload.user },
      ]);
    });

    socket.on('dj:state', (state: DjModeState) => {
      setDjMode(state);
    });

    socket.on('dj:pool', (pool: DjVoteEntry[]) => {
      setDjPool(pool);
    });

    socket.on('dj:play-winner', ({ track }: { track: Track }) => {
      if (track) onDjPlayWinnerRef.current?.(track);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const applyJoinResult = useCallback((res: JoinResult) => {
    if (res.error) {
      setConnectionError(res.error);
      return false;
    }
    setRoomCode(res.code ?? null);
    setIsHost(!!res.isHost);
    setDjMode(res.djMode ?? DEFAULT_DJ_MODE);
    setDjPool(res.djPool ?? []);
    setChatMessages([]);
    setReactions([]);
    if (res.playback) onRemotePlaybackRef.current?.(res.playback);
    if (res.queue) onRemoteQueueRef.current?.(res.queue);
    return true;
  }, []);

  const createRoom = useCallback((username: string, enableDj = false) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit(
      'room:create',
      { username: username.trim() || 'Host', enableDj },
      (res: JoinResult) => {
        applyJoinResult(res);
      },
    );
  }, [applyJoinResult]);

  const joinRoom = useCallback((code: string, username: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit(
      'room:join',
      { code: code.trim().toUpperCase(), username: username.trim() || 'Invitado' },
      (res: JoinResult) => {
        applyJoinResult(res);
      },
    );
  }, [applyJoinResult]);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket && roomCode) {
      socket.emit('room:leave');
    }
    setRoomCode(null);
    setIsHost(false);
    setRoomUsers([]);
    setChatMessages([]);
    setReactions([]);
    setDjMode(DEFAULT_DJ_MODE);
    setDjPool([]);
  }, [roomCode]);

  const broadcastPlayback = useCallback(
    (state: Omit<PlaybackSyncState, 'updatedAt'>) => {
      if (!isHost || !roomCode) return;
      socketRef.current?.emit('playback:sync', {
        ...state,
        updatedAt: Date.now(),
      });
    },
    [isHost, roomCode],
  );

  const broadcastQueue = useCallback(
    (queue: Track[]) => {
      if (!isHost || !roomCode) return;
      socketRef.current?.emit('queue:sync', queue);
    },
    [isHost, roomCode],
  );

  const toggleDjMode = useCallback(
    (enabled: boolean) => {
      if (!isHost || !roomCode) return;
      socketRef.current?.emit('dj:toggle', { enabled }, () => {
        setDjMode((prev) => ({ ...prev, enabled }));
      });
    },
    [isHost, roomCode],
  );

  const setDjAutoPlay = useCallback(
    (autoPlay: boolean) => {
      if (!isHost || !roomCode) return;
      socketRef.current?.emit('dj:toggle', { autoPlay }, () => {
        setDjMode((prev) => ({ ...prev, autoPlay }));
      });
    },
    [isHost, roomCode],
  );

  const suggestToDj = useCallback(
    (track: Track) => {
      if (!roomCode || !djMode.enabled) return;
      socketRef.current?.emit('dj:suggest', { track }, (res: { error?: string }) => {
        if (res?.error) setConnectionError(res.error);
      });
    },
    [roomCode, djMode.enabled],
  );

  const voteDjTrack = useCallback(
    (entryId: string) => {
      if (!roomCode || !djMode.enabled) return;
      socketRef.current?.emit('dj:vote', { entryId });
    },
    [roomCode, djMode.enabled],
  );

  const playTopDjTrack = useCallback(() => {
    if (!isHost || !roomCode) return;
    socketRef.current?.emit('dj:play-top', {});
  }, [isHost, roomCode]);

  const clearDjPool = useCallback(() => {
    if (!isHost || !roomCode) return;
    socketRef.current?.emit('dj:clear', {});
  }, [isHost, roomCode]);

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!roomCode || !text.trim()) return;
      socketRef.current?.emit('chat:message', { text: text.trim() });
    },
    [roomCode],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!roomCode) return;
      socketRef.current?.emit('reaction', { emoji });
    },
    [roomCode],
  );

  const onRemotePlayback = useCallback((handler: (state: PlaybackSyncState) => void) => {
    onRemotePlaybackRef.current = handler;
  }, []);

  const onRemoteQueue = useCallback((handler: (queue: Track[]) => void) => {
    onRemoteQueueRef.current = handler;
  }, []);

  const onDjPlayWinner = useCallback((handler: (track: Track) => void) => {
    onDjPlayWinnerRef.current = handler;
  }, []);

  return {
    connected,
    socketId,
    roomCode,
    isHost,
    roomUsers,
    chatMessages,
    reactions,
    connectionError,
    djMode,
    djPool,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastPlayback,
    broadcastQueue,
    toggleDjMode,
    setDjAutoPlay,
    suggestToDj,
    voteDjTrack,
    playTopDjTrack,
    clearDjPool,
    sendChatMessage,
    sendReaction,
    onRemotePlayback,
    onRemoteQueue,
    onDjPlayWinner,
  };
}
