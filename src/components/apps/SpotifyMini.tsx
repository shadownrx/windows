import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import {
  Play24Filled,
  Pause24Filled,
  Previous24Filled,
  Next24Filled,
  Speaker224Filled,
  MusicNote224Filled,
  Search24Regular,
  Heart24Filled,
  Heart24Regular,
  Book24Regular,
  History24Regular,
  List24Regular,
  Star24Regular,
  Home24Filled,
  Library24Filled,
  Add24Filled,
  ArrowRight24Filled,
  People24Regular,
  Share24Regular,
  Edit24Regular,
  LockClosedRegular,
  Globe24Regular,
  Star24Filled,
  Delete24Regular,
} from '@fluentui/react-icons';
import { useMusicSync } from '../../hooks/useMusicSync';
import LiveRoomPanel from '../music/LiveRoomPanel';
import type { Track, ChatMessage, LiveReaction, RoomUser, DjEqSettings, DjModeState, DjVoteEntry, Playlist } from '../../types/music';

// --- SPOTIFY SDK GLOBAL TYPES ---
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (elementId: string, options: any) => any;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
  }
}

// --- TYPES ---
type ServiceType = 'youtube' | 'youtube-music' | 'spotify';

interface YouTubeResult {
  id: string;
  kind: 'video' | 'playlist';
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
}

interface SpotifyResult {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  service: 'spotify';
}

type SearchResult = YouTubeResult | SpotifyResult;

// --- STANDALONE CONTEXT ---
interface SpotifyMiniContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  queue: Track[];
  favorites: Track[];
  history: Track[];
  showLyrics: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  seekTo: (percent: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  setShowLyrics: (show: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (dur: number) => void;
  setProgress: (prog: number) => void;
  // Live room (Socket.io)
  showLivePanel: boolean;
  setShowLivePanel: (show: boolean) => void;
  syncConnected: boolean;
  roomCode: string | null;
  isRoomHost: boolean;
  roomUsers: RoomUser[];
  liveChat: ChatMessage[];
  liveReactions: LiveReaction[];
  syncError: string | null;
  djMode: DjModeState;
  djPool: DjVoteEntry[];
  djEq: DjEqSettings;
  createLiveRoom: (username: string, enableDj?: boolean) => void;
  joinLiveRoom: (code: string, username: string) => void;
  leaveLiveRoom: () => void;
  sendLiveChat: (text: string) => void;
  sendLiveReaction: (emoji: string) => void;
  toggleDjMode: (enabled: boolean) => void;
  setDjAutoPlay: (autoPlay: boolean) => void;
  updateDjEq: (eq: DjEqSettings) => void;
  suggestToDj: (track: Track) => void;
  voteDjTrack: (entryId: string) => void;
  playTopDjTrack: () => void;
  clearDjPool: () => void;
  // New features for playlists
  nickname: string;
  setNickname: (name: string) => void;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  addPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  togglePlaylistPrivacy: (id: string) => void;
  renamePlaylist: (id: string, newName: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  voteForPlaylist: (playlistId: string) => void;
  unvoteForPlaylist: (playlistId: string) => void;
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
}

const SpotifyMiniContext = createContext<SpotifyMiniContextType | undefined>(undefined);

// (no default tracks — the playlist starts empty)

export const SpotifyMiniStandaloneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [showLivePanel, setShowLivePanel] = useState(false);
  const remoteUpdateRef = useRef(false);

  const sync = useMusicSync();

  const [nickname, setNickname] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('spotifyMiniNickname');
      return saved || '';
    } catch {
      return '';
    }
  });

  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('spotifyMiniFavorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('spotifyMiniHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('spotifyMiniPlaylists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);

  // Save nickname and playlists to localStorage
  useEffect(() => {
    localStorage.setItem('spotifyMiniNickname', nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('spotifyMiniPlaylists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('spotifyMiniFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('spotifyMiniHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    sync.onRemotePlayback((state) => {
      remoteUpdateRef.current = true;
      setCurrentTrack(state.currentTrack);
      setIsPlaying(state.isPlaying);
      setProgress(state.progress);
      setVolume(state.volume);
      if (state.queue) setQueue(state.queue);
      requestAnimationFrame(() => {
        remoteUpdateRef.current = false;
      });
    });
    sync.onRemoteQueue((nextQueue) => {
      remoteUpdateRef.current = true;
      setQueue(nextQueue);
      requestAnimationFrame(() => {
        remoteUpdateRef.current = false;
      });
    });
    sync.onDjPlayWinner((track) => {
      remoteUpdateRef.current = true;
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      setHistory((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered].slice(0, 50);
      });
      requestAnimationFrame(() => {
        remoteUpdateRef.current = false;
      });
    });
  }, [sync.onRemotePlayback, sync.onRemoteQueue, sync.onDjPlayWinner]);

  useEffect(() => {
    if (remoteUpdateRef.current || !sync.isHost || !sync.roomCode) return;
    sync.broadcastPlayback({ currentTrack, isPlaying, progress, volume });
  }, [currentTrack, isPlaying, progress, volume, sync.isHost, sync.roomCode, sync.broadcastPlayback]);

  useEffect(() => {
    if (remoteUpdateRef.current || !sync.isHost || !sync.roomCode) return;
    sync.broadcastQueue(queue);
  }, [queue, sync.isHost, sync.roomCode, sync.broadcastQueue]);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });
  }, []);

  const tryDjAutoNext = useCallback(() => {
    if (
      sync.isHost &&
      sync.roomCode &&
      sync.djMode.enabled &&
      sync.djMode.autoPlay &&
      sync.djPool.length > 0
    ) {
      sync.playTopDjTrack();
      return true;
    }
    return false;
  }, [sync]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(next);
      return;
    }
    tryDjAutoNext();
  }, [queue, playTrack, tryDjAutoNext]);

  const prevTrack = useCallback(() => {
    if (history.length > 1) {
      const prev = history[1];
      playTrack(prev);
    }
  }, [history, playTrack]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const isFavorite = useCallback((trackId: string) => {
    return favorites.some(t => t.id === trackId);
  }, [favorites]);

  const toggleFavorite = useCallback((track: Track) => {
    if (isFavorite(track.id)) {
      setFavorites(prev => prev.filter(t => t.id !== track.id));
    } else {
      setFavorites(prev => [track, ...prev]);
    }
  }, [isFavorite]);

  const seekTo = useCallback((percent: number) => {
    setProgress(percent);
  }, []);

  // Playlist functions
  const addPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: Date.now(),
      isPrivate: false,
      ownerName: nickname || 'Anonymous',
      votes: [],
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setActivePlaylistId(newPlaylist.id);
  }, [nickname]);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (activePlaylistId === id) {
      setActivePlaylistId(null);
    }
  }, [activePlaylistId]);

  const updatePlaylist = useCallback((id: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p));
  }, []);

  const togglePlaylistPrivacy = useCallback((id: string) => {
    setPlaylists(prev => prev.map(p => 
      p.id === id ? { ...p, isPrivate: !p.isPrivate } : p));
  }, []);

  const renamePlaylist = useCallback((id: string, newName: string) => {
    setPlaylists(prev => prev.map(p => 
      p.id === id ? { ...p, name: newName } : p));
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId ? 
        { ...p, tracks: [...p.tracks, track] } : p));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId ? 
        { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p));
  }, []);

  const voteForPlaylist = useCallback((playlistId: string) => {
    if (!nickname) return;
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.votes.includes(nickname)) {
        return { ...p, votes: [...p.votes, nickname] };
      }
      return p;
    }));
  }, [nickname]);

  const unvoteForPlaylist = useCallback((playlistId: string) => {
    if (!nickname) return;
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, votes: p.votes.filter(v => v !== nickname) };
      }
      return p;
    }));
  }, [nickname]);

  return (
    <SpotifyMiniContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        queue,
        favorites,
        history,
        showLyrics,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        setVolume,
        seekTo,
        addToQueue,
        removeFromQueue,
        toggleFavorite,
        isFavorite,
        setShowLyrics,
        setIsPlaying,
        setDuration,
        setProgress,
        showLivePanel,
        setShowLivePanel,
        syncConnected: sync.connected,
        roomCode: sync.roomCode,
        isRoomHost: sync.isHost,
        roomUsers: sync.roomUsers,
        liveChat: sync.chatMessages,
        liveReactions: sync.reactions,
        syncError: sync.connectionError,
        djMode: sync.djMode,
        djPool: sync.djPool,
        djEq: sync.djEq,
        createLiveRoom: sync.createRoom,
        joinLiveRoom: sync.joinRoom,
        leaveLiveRoom: sync.leaveRoom,
        sendLiveChat: sync.sendChatMessage,
        sendLiveReaction: sync.sendReaction,
        toggleDjMode: sync.toggleDjMode,
        setDjAutoPlay: sync.setDjAutoPlay,
        updateDjEq: sync.sendDjEqSettings,
        suggestToDj: sync.suggestToDj,
        voteDjTrack: sync.voteDjTrack,
        playTopDjTrack: sync.playTopDjTrack,
        clearDjPool: sync.clearDjPool,
        // New features
        nickname,
        setNickname,
        playlists,
        setPlaylists,
        addPlaylist,
        deletePlaylist,
        updatePlaylist,
        togglePlaylistPrivacy,
        renamePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        voteForPlaylist,
        unvoteForPlaylist,
        activePlaylistId,
        setActivePlaylistId,
      }}
    >
      {children}
    </SpotifyMiniContext.Provider>
  );
};

const useSpotifyMini = () => {
  const context = useContext(SpotifyMiniContext);
  if (!context) {
    throw new Error("useSpotifyMini must be used within a SpotifyMiniStandaloneProvider");
  }
  return context;
};

// --- UTIL ---
function buildEmbedUrlFromResult(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
}

// --- LYRICS COMPONENT ---
const LyricsDisplay: React.FC = () => {
  const { currentTrack } = useSpotifyMini();
  const [lyrics, setLyrics] = useState<string[]>([]);

  useEffect(() => {
    if (currentTrack) {
      setLyrics([
        "Proximamente, las letras de la canción estarán disponibles aquí.",
      ]);
    }
  }, [currentTrack]);

  return (
    <div className="lyrics-container">
      <div className="lyrics-header">
        <Book24Regular />
        <span>Letras de {currentTrack?.title}</span>
      </div>
      <div className="lyrics-content">
        {lyrics.map((line, i) => (
          <p key={i} className={line.includes('🎵') || line.includes('🎶') ? 'lyrics-section' : 'lyrics-line'}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};

// --- NICKNAME MODAL COMPONENT ---
const NicknameModal: React.FC<{
  isOpen: boolean;
  onClose: () => void }> = ({ isOpen, onClose }) => {
  const { nickname, setNickname } = useSpotifyMini();
  const [input, setInput] = useState(nickname);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setNickname(input.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>¿Cuál es tu nombre?</h2>
        <p>Tu nombre se mostrará en tus listas públicas</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ingresa tu nombre"
            autoFocus
          />
          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary">
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const SpotifyMiniStandalone: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    queue,
    favorites,
    history,
    showLyrics,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    seekTo,
    addToQueue,
    removeFromQueue,
    toggleFavorite,
    isFavorite,
    setShowLyrics,
    setIsPlaying,
    setDuration,
    setProgress,
    showLivePanel,
    setShowLivePanel,
    syncConnected,
    roomCode,
    isRoomHost,
    roomUsers,
    liveChat,
    liveReactions,
    syncError,
    createLiveRoom,
    joinLiveRoom,
    leaveLiveRoom,
    sendLiveChat,
    sendLiveReaction,
    djMode,
    djPool,
    djEq,
    updateDjEq,
    suggestToDj,
    voteDjTrack,
    playTopDjTrack,
    clearDjPool,
    toggleDjMode,
    setDjAutoPlay,
    nickname,
    setNickname,
    playlists,
    setPlaylists,
    addPlaylist,
    deletePlaylist,
    togglePlaylistPrivacy,
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    voteForPlaylist,
    unvoteForPlaylist,
    activePlaylistId,
    setActivePlaylistId,
  } = useSpotifyMini();

  const [activeService, setActiveService] = useState<ServiceType>('youtube');
  const [activeTab, setActiveTab] = useState<'search' | 'my-playlists' | 'global-playlists' | 'queue' | 'favorites' | 'history'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoAnimating, setLogoAnimating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bumpHeartId, setBumpHeartId] = useState<string | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const nextTrackRef = useRef(nextTrack);

  const pcnMode = query.trim().toUpperCase() === 'PCN';

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  useEffect(() => {
    if (!nickname) {
      setShowNicknameModal(true);
    }
  }, [nickname]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentTrack?.videoId) {
      initPlayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Update YouTube player volume whenever volume changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const initPlayer = () => {
    if (!currentTrack?.videoId) return;

    // Case 1: Player exists and is ready - just load new video!
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(currentTrack.videoId);
      setIsPlaying(true);
      return;
    }

    // Case 2: Player doesn't exist but YT API is ready - create new player!
    if (window.YT && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: currentTrack.videoId,
        playerVars: {
          origin: window.location.origin,
          enablejsapi: 1,
          autoplay: 1,
        },
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            if (playerRef.current.getDuration) {
              setDuration(playerRef.current.getDuration());
            }
            playerRef.current.setVolume(volume);
            // When a new track loads, automatically play it!
            setIsPlaying(true);
            playerRef.current.playVideo();
          },
          onStateChange: (event: any) => {
            if (window.YT && event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking();
            } else if (window.YT && event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopProgressTracking();
            } else if (window.YT && event.data === window.YT.PlayerState.ENDED) {
              nextTrackRef.current();
            }
          },
        },
      });
    } else {
      // Case 3: YT API not ready yet - wait and retry!
      setTimeout(initPlayer, 100);
    }
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const currentTime = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        setDuration(dur);
        setProgress((currentTime / dur) * 100);
      }
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(percent);
    if (playerRef.current && duration > 0) {
      const seekTime = (percent / 100) * duration;
      playerRef.current.seekTo(seekTime, true);
    }
  };

  const handleTogglePlay = () => {
    // --- YOUTUBE ---
    if (currentTrack?.videoId && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
        stopProgressTracking();
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
        startProgressTracking();
      }
    } else {
      togglePlay();
    }
  };

  const handleLogoClick = () => {
    setLogoAnimating(true);
    setTimeout(() => setLogoAnimating(false), 600);
  };

  const handleHeartClick = (track: Track) => {
    toggleFavorite(track);
    setBumpHeartId(track.id);
    setTimeout(() => setBumpHeartId(null), 320);
  };

  // --- SEARCH ---
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    // Check if it's a direct YouTube URL
    const ytIdMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytIdMatch && ytIdMatch[1]) {
      const ytId = ytIdMatch[1];
      setSearchResults([{
        id: ytId,
        kind: 'video',
        title: 'Video por Enlace (Compartido)',
        channelTitle: 'YouTube',
        publishedAt: new Date().toISOString(),
        thumbnail: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        description: 'Enlace directo compartido',
      }]);
      setActiveTab('search');
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      let data;
      if (activeService === 'spotify') {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Spotify search failed');
        data = await res.json();
        setSearchResults(data.results.map((item: any): SpotifyResult => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          cover: item.thumbnail,
          url: item.uri,
          service: 'spotify',
        })));
      } else {
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('YouTube search failed');
        data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (activeService === 'spotify') {
        const fallbackResults: SpotifyResult[] = [
          { id: 's1', title: 'Sin un peso', artist: 'Nafta', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', url: '', service: 'spotify' },
          { id: 's2', title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1511379938547-c1f6941d86ba?w=300', url: '', service: 'spotify' },
        ];
        setSearchResults(fallbackResults);
      } else {
        const fallbackResults: YouTubeResult[] = [
          { id: 'dQw4w9WgXcQ', kind: 'video', title: 'Rick Astley - Never Gonna Give You Up', channelTitle: 'Rick Astley', publishedAt: '2009-10-25T06:57:33Z', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', description: 'Official video' },
          { id: '9bZkp7q19f0', kind: 'video', title: 'PSY - GANGNAM STYLE', channelTitle: 'officialpsy', publishedAt: '2012-07-15T07:46:32Z', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', description: 'PSY' },
        ];
        setSearchResults(fallbackResults);
      }
    } finally {
      setLoading(false);
    }
  }, [activeService]);

  const resolveSearchToTrack = async (result: SearchResult | SpotifyResult | YouTubeResult): Promise<Track | null> => {
    if ('service' in result && result.service === 'spotify') {
      try {
        const searchQuery = `${result.title} ${result.artist}`;
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results?.length > 0) {
            const firstResult = data.results[0];
            return {
              id: firstResult.id,
              title: firstResult.title,
              artist: firstResult.channelTitle,
              cover: firstResult.thumbnail,
              url: '',
              service: 'youtube',
              kind: firstResult.kind,
              videoId: firstResult.id,
            };
          }
        }
      } catch (err) {
        console.error('Error resolving Spotify track:', err);
      }
      return null;
    }
    const yt = result as YouTubeResult;
    return {
      id: yt.id,
      title: yt.title,
      artist: yt.channelTitle,
      cover: yt.thumbnail,
      url: '',
      service: activeService,
      kind: yt.kind,
      videoId: yt.id,
    };
  };

  const playFromSearch = async (result: SearchResult | SpotifyResult | YouTubeResult) => {
    const track = await resolveSearchToTrack(result);
    if (track) playTrack(track);
  };

  const addTrackToQueue = async (result: SearchResult | SpotifyResult | YouTubeResult) => {
    const track = await resolveSearchToTrack(result);
    if (track) {
      if (!currentTrack) {
        playTrack(track);
      } else {
        addToQueue(track);
      }
    }
  };

  const suggestFromSearch = async (result: SearchResult | SpotifyResult | YouTubeResult) => {
    const track = await resolveSearchToTrack(result);
    if (track) suggestToDj(track);
  };

  const showDjSuggest = !!roomCode && djMode.enabled;

  const getGlobalPlaylists = () => {
    // Filter public playlists and sort by vote count
    return playlists
      .filter(p => !p.isPrivate)
      .sort((a, b) => b.votes.length - a.votes.length);
  };

  // Helper to format time
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`spotify-root ${pcnMode ? 'pcn-theme' : ''}`}>
      {/* --- PERMANENT YOUTUBE IFRAME (always in DOM) --- */}
      <div className="spotify-iframe-permanent">
        <div id="youtube-player" />
      </div>

      {/* --- NICKNAME MODAL --- */}
      <NicknameModal
        isOpen={showNicknameModal} onClose={() => setShowNicknameModal(false)} />

      {/* --- ADD PLAYLIST MODAL --- */}
      {showAddPlaylistModal && (
        <div className="modal-overlay" onClick={() => setShowAddPlaylistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Lista de Reproducción</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPlaylistName.trim()) {
                addPlaylist(newPlaylistName.trim());
                setNewPlaylistName('');
                setShowAddPlaylistModal(false);
              }
            }}>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nombre de la lista"
                autoFocus
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={() => setShowAddPlaylistModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-primary">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HAMBURGER MENU BUTTON --- */}
      <button
        className={`hamburger-btn ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* --- SIDEBAR OVERLAY --- */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* --- LEFT SIDEBAR --- */}
      <div className={`spotify-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* --- NEX MUSIC BRANDING --- */}
        <div className="nex-branding">
          <div
            className={`nex-logo ${logoAnimating ? 'nex-logo-animate' : ''} ${isPlaying ? 'nex-logo-pulse' : ''}`}
            onClick={handleLogoClick}
          >
            <div className="nex-logo-ring nex-logo-ring-1"></div>
            <div className="nex-logo-ring nex-logo-ring-2"></div>
            <div className="nex-logo-ring nex-logo-ring-3"></div>
            <span className="nex-logo-text">{pcnMode ? 'PCN' : 'NXM'}</span>
          </div>
          <h1 className="nex-title">NEX MUSIC</h1>
          <span className="power-by">Creado por Salvador Juarez</span>
          {nickname && <span className="user-nickname">@{nickname}</span>}
        </div>
        {/* --- TOP MENU --- */}
        <div className="spotify-sidebar-top">
          <div className={`spotify-nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => { setActiveTab('search'); setSidebarOpen(false); }}>
            <Search24Regular />
            <span>Buscar</span>
          </div>
          <div className={`spotify-nav-item ${activeTab === 'my-playlists' ? 'active' : ''}`} onClick={() => { setActiveTab('my-playlists'); setSidebarOpen(false); }}>
            <Home24Filled />
            <span>Mis Listas</span>
          </div>
          <div className={`spotify-nav-item ${activeTab === 'global-playlists' ? 'active' : ''}`} onClick={() => { setActiveTab('global-playlists'); setSidebarOpen(false); }}>
            <Globe24Regular />
            <span>Listas Globales</span>
          </div>
        </div>

        {/* --- LIBRARY --- */}
        <div className="spotify-library">
          <div className="spotify-library-header">
          <div className="spotify-library-title">
            <Library24Filled />
            <span>Tu biblioteca</span>
          </div>
          <div className="spotify-library-actions">
            <button className="spotify-btn-icon" title="Crear lista" onClick={() => setShowAddPlaylistModal(true)}>
              <Add24Filled />
            </button>
          </div>
          </div>

          {/* --- NAV TABS --- */}
          <div className="spotify-nav-tabs">
            <button
              className={`spotify-nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }}
            >
              <Heart24Filled />
            </button>
            <button
              className={`spotify-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
            >
              <History24Regular />
            </button>
            <button
              className={`spotify-nav-tab ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => { setActiveTab('queue'); setSidebarOpen(false); }}
            >
              <List24Regular />
            </button>
          </div>

          {/* --- LIBRARY CONTENT --- */}
          <div className="spotify-library-content">
            {/* --- PLAYLIST ITEMS --- */}
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="spotify-playlist-item"
                onClick={() => { setActivePlaylistId(playlist.id); setActiveTab('my-playlists'); setSidebarOpen(false); }}
              >
                <div className="spotify-playlist-cover">
                  <MusicNote224Filled />
                </div>
                <div className="spotify-playlist-info">
                  <div className="spotify-playlist-name">{playlist.name}</div>
                  <div className="spotify-playlist-desc">{playlist.tracks.length} canciones · {playlist.isPrivate ? 'Privada' : 'Pública'}</div>
                </div>
              </div>
            ))}

            <div className="spotify-playlist-item" onClick={() => { setActiveTab('favorites'); setSidebarOpen(false); }}>
              <div className="spotify-playlist-cover spotify-cover-liked">
                <Heart24Filled />
              </div>
              <div className="spotify-playlist-info">
                <div className="spotify-playlist-name">Me gusta</div>
                <div className="spotify-playlist-desc">{favorites.length} canciones</div>
              </div>
            </div>

            {/* --- HISTORY ITEM --- */}
            <div className="spotify-playlist-item" onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}>
              <div className="spotify-playlist-cover spotify-cover-history">
                <History24Regular />
              </div>
              <div className="spotify-playlist-info">
                <div className="spotify-playlist-name">Historial</div>
                <div className="spotify-playlist-desc">Reproducido recientemente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="spotify-main">
        {/* --- HEADER --- */}
        <div className="spotify-header">
          <div className="spotify-search-bar">
            <Search24Regular className="spotify-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
              placeholder="¿Qué quieres escuchar?"
              className="spotify-search-input"
            />
            <button
              className="spotify-search-button"
              onClick={() => runSearch(query)}
              disabled={!query.trim() || loading}
            >
              <ArrowRight24Filled />
            </button>
          </div>
          <div className="spotify-services">
            <button
              type="button"
              className={`spotify-service-btn live-btn ${roomCode ? 'active live-active' : ''}`}
              onClick={() => setShowLivePanel(true)}
              title="Salas en vivo (Socket.io)"
            >
              <People24Regular style={{ width: 16, height: 16, marginRight: 6 }} />
              {roomCode ? `En vivo · ${roomCode}${djMode.enabled ? ' · DJ' : ''}` : 'En vivo'}
            </button>
            {(['youtube', 'youtube-music', 'spotify'] as ServiceType[]).map((service) => (
              <button
                key={service}
                className={`spotify-service-btn ${activeService === service ? 'active' : ''}`}
                onClick={() => setActiveService(service)}
              >
                {service === 'youtube' ? 'YouTube' : service === 'youtube-music' ? 'YT Music' : 'Spotify'}
              </button>
            ))}
          </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="spotify-content">
          {/* --- SEARCH TAB --- */}
          {activeTab === 'search' && (
            <div className="spotify-search-results">
              <h2>Resultados de búsqueda</h2>

              {!query.trim() && !searchResults.length && (
                <div className="spotify-empty">
                  <Search24Regular />
                  <p>Escribe algo en la barra de búsqueda para empezar</p>
                </div>
              )}

              {loading && (
                <div className="spotify-loading">
                  <div className="spotify-spinner" />
                  <p>Buscando...</p>
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div className="spotify-grid">
                  {searchResults.map((result) => {
                    if ('service' in result && result.service === 'spotify') {
                      const spotifyResult = result as SpotifyResult;
                      return (
                        <div key={spotifyResult.id} className="spotify-card">
                          <div className="spotify-card-image">
                            <img src={spotifyResult.cover} alt={spotifyResult.title} />
                            <button
                              className="spotify-play-btn"
                              onClick={() => playFromSearch(spotifyResult)}
                            >
                              <Play24Filled />
                            </button>
                          </div>
                          <div className="spotify-card-info">
                            <div className="spotify-card-title">{spotifyResult.title}</div>
                            <div className="spotify-card-artist">{spotifyResult.artist}</div>
                          </div>
                          <button
                            className="spotify-add-btn"
                            onClick={() => addTrackToQueue(spotifyResult)}
                            title="Añadir a la cola"
                          >
                            <Add24Filled />
                          </button>
                          {showDjSuggest && (
                            <button
                              className="spotify-dj-btn"
                              onClick={() => suggestFromSearch(spotifyResult)}
                              title="Sugerir al DJ"
                            >
                              🎧
                            </button>
                          )}
                          {/* Add to playlist dropdown */}
                          {playlists.length > 0 && (
                            <div className="spotify-add-to-playlist-dropdown">
                              <button
                                className="spotify-add-to-playlist-btn">
                                <List24Regular />
                              </button>
                              <div className="spotify-playlist-dropdown">
                                {playlists.map(p => (
                                  <div
                                    key={p.id} className="spotify-dropdown-item"
                                    onClick={async () => {
                                      const track = await resolveSearchToTrack(result);
                                      if (track) {
                                        addTrackToPlaylist(p.id, track);
                                      }
                                    }}
                                  >
                                    {p.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    const youtubeResult = result as YouTubeResult;
                    return (
                      <div key={youtubeResult.id} className="spotify-card">
                        <div className="spotify-card-image">
                          <img src={youtubeResult.thumbnail} alt={youtubeResult.title} />
                          <button
                            className="spotify-play-btn"
                            onClick={() => playFromSearch(youtubeResult)}
                          >
                            <Play24Filled />
                          </button>
                        </div>
                        <div className="spotify-card-info">
                          <div className="spotify-card-title">{youtubeResult.title}</div>
                          <div className="spotify-card-artist">{youtubeResult.channelTitle}</div>
                        </div>
                        <button
                          className="spotify-add-btn"
                          onClick={() => addTrackToQueue(youtubeResult)}
                          title="Añadir a la cola"
                        >
                          <Add24Filled />
                        </button>
                        {showDjSuggest && (
                          <button
                            className="spotify-dj-btn"
                            onClick={() => suggestFromSearch(youtubeResult)}
                            title="Sugerir al DJ"
                          >
                            🎧
                          </button>
                        )}
                        {/* Add to playlist dropdown */}
                        {playlists.length > 0 && (
                          <div className="spotify-add-to-playlist-dropdown">
                            <button
                              className="spotify-add-to-playlist-btn">
                                <List24Regular />
                              </button>
                              <div className="spotify-playlist-dropdown">
                                {playlists.map(p => (
                                  <div
                                    key={p.id} className="spotify-dropdown-item"
                                    onClick={async () => {
                                      const track = await resolveSearchToTrack(result);
                                      if (track) {
                                        addTrackToPlaylist(p.id, track);
                                      }
                                    }}
                                  >
                                    {p.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && query.trim() && searchResults.length === 0 && !loading && (
                <div className="spotify-empty">
                  <Search24Regular />
                  <p>No se encontraron resultados para "{query}"</p>
                </div>
              )}
            </div>
          )}

          {/* --- MY PLAYLISTS TAB --- */}
          {activeTab === 'my-playlists' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header">
                <h2>Mis Listas de Reproducción</h2>
                <div className="header-actions">
                  <button
                    className="spotify-btn-secondary" onClick={() => {
                      const data = prompt('Pega el código de la lista compartida:');
                      if (data) {
                        try {
                          const p = JSON.parse(decodeURIComponent(atob(data)));
                          p.id = Date.now().toString(); // unique ID
                          setPlaylists([...playlists, p]);
                          alert('Lista importada con éxito!');
                        } catch(e) {
                          alert('Código de lista inválido');
                        }
                      }
                    }}>
                    Importar
                  </button>
                  <button
                    className="spotify-btn-primary" onClick={() => setShowAddPlaylistModal(true)}>
                    <Add24Filled /> Nueva Lista
                  </button>
                </div>
              </div>

              {activePlaylistId ? (
                <>
                  {(() => {
                    const activePlaylist = playlists.find(p => p.id === activePlaylistId);
                    if (!activePlaylist) return null;
                    return (
                      <>
                        <div className="spotify-playlist-header">
                          <div className="spotify-playlist-hero-cover" onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const base64 = e.target?.result as string;
                                  setPlaylists(playlists.map(p => p.id === activePlaylistId ? { ...p, cover: base64 } : p));
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }} style={{cursor: 'pointer', overflow: 'hidden'}} title="Cambiar portada">
                            {activePlaylist.cover ? (
                              <img src={activePlaylist.cover} alt={activePlaylist.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                              <div className="spotify-hero-placeholder">
                                <MusicNote224Filled />
                              </div>
                            )}
                          </div>
                          <div className="spotify-playlist-hero-info">
                            <div className="spotify-playlist-hero-type">Lista de Reproducción</div>
                            {editingPlaylistId === activePlaylistId ? (
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                if (editPlaylistName.trim()) {
                                  renamePlaylist(activePlaylistId, editPlaylistName.trim());
                                  setEditingPlaylistId(null);
                                }
                              }} className="playlist-edit-form">
                                <input
                                  type="text"
                                  value={editPlaylistName}
                                  onChange={(e) => setEditPlaylistName(e.target.value)}
                                  autoFocus
                                />
                                <button type="submit" className="save-edit-btn">
                                  Guardar
                                </button>
                              </form>
                            ) : (
                              <h1 className="spotify-playlist-hero-title">{activePlaylist.name}</h1>
                            )}
                            <p className="spotify-playlist-hero-desc">
                              Por {activePlaylist.ownerName} · {activePlaylist.tracks.length} canciones
                            </p>
                            <div className="spotify-playlist-hero-actions">
                              <button
                                className="spotify-play-hero-btn"
                                onClick={() => {
                                  if (activePlaylist.tracks.length > 0) {
                                    playTrack(activePlaylist.tracks[0]);
                                  }
                                }}
                              >
                                {isPlaying ? <Pause24Filled /> : <Play24Filled />}
                              </button>
                              <button
                                className="spotify-icon-btn"
                                onClick={() => {
                                  togglePlaylistPrivacy(activePlaylistId);
                                }}
                                title={activePlaylist.isPrivate ? 'Hacer pública' : 'Hacer privada'}
                              >
                                {activePlaylist.isPrivate ? <LockClosedRegular /> : <Globe24Regular />}
                              </button>
                              {editingPlaylistId !== activePlaylistId && (
                                <button
                                  className="spotify-icon-btn"
                                  onClick={() => {
                                    setEditingPlaylistId(activePlaylistId);
                                    setEditPlaylistName(activePlaylist.name);
                                  }}
                                  title="Renombrar"
                                >
                                  <Edit24Regular />
                                </button>
                              )}
                              <button
                                className="spotify-icon-btn danger"
                                onClick={() => deletePlaylist(activePlaylistId)}
                                title="Eliminar lista"
                              >
                                <Delete24Regular />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="spotify-track-list">
                          {activePlaylist.tracks.length === 0 ? (
                            <div className="spotify-empty">
                              <MusicNote224Filled />
                              <p>Esta lista está vacía. Busca canciones y añádelas!</p>
                            </div>
                          ) : (
                            activePlaylist.tracks.map((track, index) => (
                            <div key={track.id} className="spotify-track-row" onClick={() => playTrack(track)}>
                              <div className="spotify-track-cover">
                                <img src={track.cover} alt={track.title} />
                              </div>
                              <div className="spotify-track-main">
                                <div className="spotify-track-title">{track.title}</div>
                                <div className="spotify-track-artist">{track.artist}</div>
                              </div>
                              <button
                                className="spotify-track-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrackFromPlaylist(activePlaylistId, track.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="spotify-empty">
                  <Library24Filled />
                  <p>Selecciona una lista de reproducción o crea una nueva!</p>
                </div>
              )}
            </div>
          )}

          {/* --- GLOBAL PLAYLISTS TAB --- */}
          {activeTab === 'global-playlists' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header">
                <h2>Listas Globales</h2>
                <p>Las listas más votadas por la comunidad</p>
              </div>

              {getGlobalPlaylists().length === 0 ? (
                <div className="spotify-empty">
                  <Globe24Regular />
                  <p>No hay listas públicas aún. Crea una y hazla pública!</p>
                </div>
              ) : (
                <div className="spotify-grid">
                  {getGlobalPlaylists().map((playlist) => (
                    <div key={playlist.id} className="spotify-card">
                      <div className="spotify-card-image">
                        <div className="spotify-hero-placeholder">
                          <MusicNote224Filled />
                        </div>
                        <button
                          className="spotify-play-btn"
                          onClick={() => {
                            if (playlist.tracks.length > 0) {
                              playTrack(playlist.tracks[0]);
                            }
                          }}
                        >
                          <Play24Filled />
                        </button>
                      </div>
                      <div className="spotify-card-info">
                        <div className="spotify-card-title">{playlist.name}</div>
                        <div className="spotify-card-artist">
                          Por {playlist.ownerName}
                        </div>
                      </div>
                      <div className="playlist-meta">
                        <div className="playlist-votes">
                          <button
                          onClick={() => {
                            if (nickname) {
                              if (playlist.votes.includes(nickname)) {
                                unvoteForPlaylist(playlist.id);
                              } else {
                                voteForPlaylist(playlist.id);
                              }
                            }
                          }}
                          className={`vote-btn ${playlist.votes.includes(nickname) ? 'voted' : ''}`}
                        >
                            {playlist.votes.includes(nickname) ? <Star24Filled /> : <Star24Regular />}
                            <span>{playlist.votes.length}</span>
                          </button>
                          <span>{playlist.tracks.length} canciones</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- QUEUE TAB --- */}
          {activeTab === 'queue' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header">
                <h2>Cola de reproducción</h2>
              </div>
              {queue.length === 0 ? (
                <div className="spotify-empty">
                  <List24Regular />
                  <p>No hay canciones en la cola</p>
                </div>
              ) : (
                <div className="spotify-track-list">
                  {queue.map((track, index) => (
                  <div key={track.id} className="spotify-track-row" onClick={() => playTrack(track)}>
                    <div className="spotify-track-cover">
                      <img src={track.cover} alt={track.title} />
                    </div>
                    <div className="spotify-track-main">
                      <div className="spotify-track-title">{track.title}</div>
                      <div className="spotify-track-artist">{track.artist}</div>
                    </div>
                    <button
                      className="spotify-track-btn"
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* --- FAVORITES TAB --- */}
          {activeTab === 'favorites' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header">
                <h2>Me gusta</h2>
                <p>{favorites.length} canciones</p>
              </div>
              {favorites.length === 0 ? (
                <div className="spotify-empty">
                  <Heart24Filled />
                  <p>No tienes favoritos aún</p>
                </div>
              ) : (
                <div className="spotify-track-list">
                  {favorites.map((track, index) => (
                  <div
                    key={track.id}
                    className={`spotify-track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                    onClick={() => playTrack(track)}
                  >
                    <div className="spotify-track-cover">
                      <img src={track.cover} alt={track.title} />
                    </div>
                    <div className="spotify-track-main">
                      <div className="spotify-track-title">{track.title}</div>
                      <div className="spotify-track-artist">{track.artist}</div>
                    </div>
                    <button
                      className={`spotify-heart-small ${bumpHeartId === track.id ? 'heart-bump' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleHeartClick(track); }}
                    >
                      <Heart24Filled />
                    </button>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header">
                <h2>Historial</h2>
                <p>Reproducido recientemente</p>
              </div>
              {history.length === 0 ? (
                <div className="spotify-empty">
                  <History24Regular />
                  <p>No hay historial aún</p>
                </div>
              ) : (
                <div className="spotify-track-list">
                  {history.map((track, index) => (
                  <div
                    key={track.id}
                    className={`spotify-track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                    onClick={() => playTrack(track)}
                  >
                    <div className="spotify-track-cover">
                      <img src={track.cover} alt={track.title} />
                    </div>
                    <div className="spotify-track-main">
                      <div className="spotify-track-title">{track.title}</div>
                      <div className="spotify-track-artist">{track.artist}</div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- PLAYER BAR --- */}
      {currentTrack && (
        <div className="spotify-player">
          {/* --- LEFT INFO --- */}
          <div className="spotify-player-left">
            <img src={currentTrack.cover} alt="" className="spotify-player-cover" />
            <div className="spotify-player-info">
              <div className="spotify-player-title">{currentTrack.title}</div>
              <div className="spotify-player-artist">{currentTrack.artist}</div>
            </div>
            <button
              className={`spotify-player-heart ${bumpHeartId === currentTrack.id ? 'heart-bump' : ''}`}
              onClick={() => handleHeartClick(currentTrack)}
              title="Me gusta"
            >
              {isFavorite(currentTrack.id) ? <Heart24Filled /> : <Heart24Regular />}
            </button>
            <button
              className="spotify-player-heart"
              onClick={() => {
                const url = currentTrack.service === 'youtube'
                  ? `https://www.youtube.com/watch?v=${currentTrack.id}`
                  : (currentTrack.url || `https://www.youtube.com/watch?v=${currentTrack.id}`);
                navigator.clipboard.writeText(url).then(() => {
                  const btn = document.getElementById('share-btn');
                  if (btn) {
                    const oldCol = btn.style.color;
                    btn.style.color = '#34d399';
                    setTimeout(() => btn.style.color = oldCol, 1000);
                  }
                });
              }}
              title="Copiar enlace"
              id="share-btn"
            >
              <Share24Regular />
            </button>
            {playlists.length > 0 && (
              <div className="spotify-player-playlist-dropdown">
                <button
                  className="spotify-player-heart"
                  title="Añadir a lista"
                >
                  <List24Regular />
                </button>
                <div className="spotify-player-dropdown-menu">
                  {playlists.map(p => (
                    <div
                      key={p.id}
                      className="spotify-dropdown-item"
                      onClick={() => addTrackToPlaylist(p.id, currentTrack)}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- CENTER CONTROLS --- */}
          <div className="spotify-player-center">
            <div className="spotify-player-controls">
              <button className="spotify-player-btn" onClick={prevTrack}>
                <Previous24Filled />
              </button>
              <button
                className="spotify-player-play"
                onClick={handleTogglePlay}
              >
                {isPlaying ? <Pause24Filled /> : <Play24Filled />}
              </button>
              <button className="spotify-player-btn" onClick={nextTrack}>
                <Next24Filled />
              </button>
            </div>
            <div className="spotify-player-progress">
              <span className="spotify-time">{formatTime((progress / 100) * duration)}</span>
              <div
                className="spotify-progress-bar"
                onClick={handleSeek}
                style={{ '--progress': `${progress}%` } as React.CSSProperties}
              >
                <div
                  className="spotify-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="spotify-time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* --- RIGHT VOLUME --- */}
          <div className="spotify-player-right">
            <button
              className={`spotify-player-btn ${showLyrics ? 'active' : ''}`}
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <Book24Regular />
            </button>
            <div className="spotify-volume">
              <Speaker224Filled />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="spotify-volume-slider"
              />
            </div>
          </div>
        </div>
      )}

      <LiveRoomPanel
        open={showLivePanel}
        onClose={() => setShowLivePanel(false)}
        connected={syncConnected}
        connectionError={syncError}
        roomCode={roomCode}
        isHost={isRoomHost}
        roomUsers={roomUsers}
        chatMessages={liveChat}
        reactions={liveReactions}
        onCreateRoom={createLiveRoom}
        onJoinRoom={joinLiveRoom}
        onLeaveRoom={leaveLiveRoom}
        onSendChat={sendLiveChat}
        onSendReaction={sendLiveReaction}
        djMode={djMode}
        djPool={djPool}
        djEq={djEq}
        onToggleDj={toggleDjMode}
        onToggleDjAutoPlay={setDjAutoPlay}
        onUpdateDjEq={updateDjEq}
        onVoteDj={voteDjTrack}
        onPlayTopDj={playTopDjTrack}
        onClearDj={clearDjPool}
      />

      {/* --- GLOBAL STYLES --- */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        .spotify-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          width: 100%;
          background: #000;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #fff;
          overflow: hidden;
          position: relative;
        }

        .spotify-iframe-permanent {
          position: fixed;
          left: -9999px;
          top: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        /* --- MODALS --- */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-content {
          background: #1a1a1a;
          padding: 32px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          width: 90%;
          max-width: 400px;
        }

        .modal-content h2 {
          margin: 0 0 8px 0;
        }

        .modal-content p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
        }

        .modal-content input {
          width: 100%;
          background: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 8px;
          color: #fff;
          margin-bottom: 20px;
          font-size: 16px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-btn-primary {
          background: #fff;
          color: #000;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-btn-secondary {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .playlist-edit-form {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .playlist-edit-form input {
          flex: 1;
          background: #2a2a2a;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 8px 12px;
          border-radius: 8px;
          color: #fff;
          font-size: 24px;
          font-weight: 800;
        }

        .save-edit-btn {
          background: #1db954;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* --- HAMBURGER MENU --- */
        .hamburger-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1000;
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          width: 52px;
          height: 52px;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }

        .hamburger-btn:hover {
          background: #1e1e1e;
          border-color: rgba(255,255,255,0.25);
        }

        .hamburger-btn span {
          width: 20px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }

        .hamburger-btn.open span:nth-child(1) {
          transform: rotate(45deg) translateY(7px);
        }

        .hamburger-btn.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translateY(-7px);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 49;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* --- SIDEBAR --- */
        .spotify-sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: #000;
          height: 100vh;
          width: 300px;
          position: fixed;
          left: -100%;
          top: 0;
          border-right: 1px solid rgba(255,255,255,0.08);
          z-index: 50;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 24px rgba(0,0,0,0.6);
        }

        .spotify-sidebar.sidebar-open {
          left: 0;
        }

        .spotify-sidebar-top {
          background: #0d0d0d;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border: 1px solid rgba(255,255,255,0.06);
          margin-top: 76px;
        }

        .spotify-nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 15px;
          font-weight: 700;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 12px 14px;
          border-radius: 8px;
        }

        .spotify-nav-item:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }

        .spotify-nav-item.active {
          color: #000;
          background: #fff;
        }

        .spotify-library {
          background: #0d0d0d;
          border-radius: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .spotify-library-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .spotify-library-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.65);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: color 0.15s;
        }

        .spotify-library-title:hover {
          color: #fff;
        }

        .spotify-btn-icon {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 10px;
          border-radius: 10px;
          transition: all 0.15s;
        }

        .spotify-btn-icon:hover {
          color: #000;
          background: #fff;
        }

        .spotify-nav-tabs {
          display: flex;
          gap: 8px;
          padding: 0 20px 14px;
        }

        .spotify-nav-tab {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.75);
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.15s ease;
        }

        .spotify-nav-tab:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .spotify-nav-tab.active {
          background: #fff;
          color: #000;
          border-color: #fff;
        }

        .spotify-library-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px 12px;
        }

        .spotify-playlist-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s ease;
          border: 1px solid transparent;
        }

        .spotify-playlist-item:hover {
          background: rgba(255,255,255,0.06);
        }

        .spotify-playlist-cover {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }

        .spotify-cover-liked {
          background: #1a1a1a;
          color: #fff;
        }

        .spotify-cover-history {
          background: #1a1a1a;
          color: rgba(255,255,255,0.7);
        }

        .spotify-playlist-info {
          flex: 1;
          min-width: 0;
        }

        .spotify-playlist-name {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 3px;
        }

        .spotify-playlist-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        .nex-branding {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .nex-logo {
          width: 80px;
          height: 80px;
          position: relative;
          cursor: pointer;
        }

        .nex-logo-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #1db954;
        }

        .nex-logo-ring-1 {
          animation: nex-pulse 2s ease-out infinite;
        }

        .nex-logo-ring-2 {
          animation: nex-pulse 2s ease-out infinite;
          animation-delay: 0.5s;
        }

        .nex-logo-ring-3 {
          animation: nex-pulse 2s ease-out infinite;
          animation-delay: 1s;
        }

        .nex-logo-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 900;
          font-size: 18px;
          color: #fff;
        }

        @keyframes nex-pulse {
          0% {
          transform: scale(0.5);
          opacity: 1;
        }
          100% {
          transform: scale(1.5);
          opacity: 0;
        }
        }

        .nex-logo-animate .nex-logo-ring {
          animation-play-state: paused;
        }

        .nex-logo-pulse {
          animation: spin 3s linear infinite;
        }

        .nex-title {
          font-size: 24px;
          font-weight: 900;
          margin: 0;
        }

        .power-by {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        .user-nickname {
          font-size: 14px;
          color: #1db954;
          font-weight: 600;
        }

        /* --- MAIN CONTENT --- */
        .spotify-main {
          margin-left: 0;
          margin-right: 0;
          margin-top: 0;
          margin-bottom: 0;
          height: 100%;
          min-height: 0;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 0;
          z-index: 1;
        }

        .spotify-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 28px 20px 96px;
          background: #000;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          gap: 24px;
          flex-wrap: wrap;
        }

        .spotify-search-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50px;
          padding: 12px 20px;
          flex: 1;
          max-width: 480px;
          min-width: 220px;
          transition: border-color 0.15s ease;
        }

        .spotify-search-bar:focus-within {
          border-color: rgba(255,255,255,0.4);
        }

        .spotify-search-icon {
          color: rgba(255,255,255,0.5);
          flex-shrink: 0;
        }

        .spotify-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          min-width: 0;
        }

        .spotify-search-input::placeholder {
          color: rgba(255,255,255,0.45);
        }

        .spotify-search-button {
          background: #fff;
          border: none;
          border-radius: 50px;
          color: #000;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spotify-search-button:hover:not(:disabled) {
          transform: scale(1.06);
        }

        .spotify-search-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .spotify-services {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .spotify-service-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: rgba(255,255,255,0.65);
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.15s ease;
        }

        .spotify-service-btn:hover {
          border-color: rgba(255,255,255,0.4);
          color: #fff;
        }

        .spotify-service-btn.active {
          background: #fff;
          color: #000;
          border-color: #fff;
        }

        .spotify-service-btn.live-btn {
          display: inline-flex;
          align-items: center;
        }

        .spotify-service-btn.live-active {
          background: rgba(29, 185, 84, 0.2);
          color: #1db954;
          border-color: #1db954;
        }

        .spotify-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          padding-bottom: 120px;
        }

        .spotify-search-results h2 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 24px;
          color: #fff;
        }

        .spotify-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .spotify-card {
          background: #0d0d0d;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          position: relative;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .spotify-card:hover {
          background: #161616;
          border-color: rgba(255,255,255,0.12);
        }

        .spotify-card-image {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .spotify-card-image img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .spotify-hero-placeholder {
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 80px;
          color: rgba(255,255,255,0.3);
        }

        .spotify-card:hover .spotify-card-image img {
          transform: scale(1.05);
        }

        .spotify-play-btn {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          color: #000;
        }

        .spotify-card:hover .spotify-play-btn {
          opacity: 1;
          transform: translateY(0);
        }

        .spotify-play-btn:hover {
          transform: scale(1.08);
        }

        .spotify-card-info {
          min-height: 64px;
        }

        .spotify-card-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #fff;
        }

        .spotify-card-artist {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-add-btn {
          position: absolute;
          top: 22px;
          right: 22px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          color: #fff;
          backdrop-filter: blur(8px);
        }

        .spotify-card:hover .spotify-add-btn {
          opacity: 1;
        }

        .spotify-add-btn:hover {
          background: #fff;
          color: #000;
          border-color: #fff;
        }

        .spotify-dj-btn {
          position: absolute;
          top: 22px;
          right: 66px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .spotify-card:hover .spotify-dj-btn {
          opacity: 1;
        }

        .spotify-dj-btn:hover {
          background: #fbbf24;
          border-color: #fbbf24;
          transform: scale(1.08);
        }

        /* Add to playlist dropdown */
        .spotify-add-to-playlist-dropdown {
          position: absolute;
          top: 22px;
          right: 110px;
        }

        .spotify-add-to-playlist-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          color: #fff;
          backdrop-filter: blur(8px);
        }

        .spotify-card:hover .spotify-add-to-playlist-btn {
          opacity: 1;
        }

        .spotify-add-to-playlist-btn:hover {
          background: #fff;
          color: #000;
          border-color: #fff;
        }

        .spotify-playlist-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 0;
          min-width: 160px;
          display: none;
          z-index: 100;
        }

        .spotify-add-to-playlist-dropdown:hover .spotify-playlist-dropdown {
          display: block;
        }

        .spotify-dropdown-item {
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .spotify-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
        }

        .spotify-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          gap: 16px;
          color: rgba(255,255,255,0.5);
        }

        .spotify-empty svg {
          font-size: 56px;
          opacity: 0.4;
        }

        .spotify-empty p {
          font-size: 16px;
          text-align: center;
        }

        .spotify-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          gap: 20px;
        }

        .spotify-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(255,255,255,0.12);
          border-left: 3px solid #fff;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spotify-list-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .spotify-list-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .spotify-list-header h2 {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }

        .spotify-list-header p {
          color: rgba(255,255,255,0.55);
          font-size: 14px;
          margin: 0;
        }

        .spotify-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1db954;
          border: none;
          color: #fff;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .spotify-btn-primary:hover {
          transform: scale(1.02);
        }

        .spotify-track-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spotify-track-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s ease;
          position: relative;
        }

        .spotify-track-row:hover {
          background: rgba(255,255,255,0.07);
        }

        .spotify-track-row.active {
          background: rgba(255,255,255,0.12);
        }

        .spotify-track-row.active .spotify-track-title {
          color: #fff;
        }

        .spotify-track-cover {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
        }

        .spotify-track-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .spotify-track-play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.2s;
          background: rgba(0,0,0,0.65);
          border-radius: 50%;
          padding: 10px;
          color: #fff;
        }

        .spotify-track-row:hover .spotify-track-play-icon {
          opacity: 1;
        }

        .spotify-play-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          gap: 3px;
          align-items: flex-end;
          height: 20px;
          background: rgba(0,0,0,0.5);
          padding: 6px;
          border-radius: 6px;
        }

        .spotify-play-indicator span {
          width: 3px;
          background: #fff;
          border-radius: 2px;
          animation: wave 1s ease-in-out infinite;
        }

        .spotify-play-indicator span:nth-child(1) {
          animation-delay: 0s;
        }

        .spotify-play-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .spotify-play-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes wave {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }

        .spotify-track-main {
          flex: 1;
          min-width: 0;
        }

        .spotify-track-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(255,255,255,0.85);
        }

        .spotify-track-artist {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-track-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .spotify-track-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
        }

        .spotify-heart-small {
          background: transparent;
          border: none;
          color: #1db954;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .spotify-heart-small:hover {
          background: rgba(255,255,255,0.1);
        }

        .heart-bump {
          animation: bump 0.3s ease-out;
        }

        @keyframes bump {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        /* --- PLAYLIST HEADER --- */
        .spotify-playlist-header {
          display: flex;
          gap: 24px;
          margin-bottom: 32px;
        }

        .spotify-playlist-hero-cover {
          width: 200px;
          height: 200px;
          flex-shrink: 0;
        }

        .spotify-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }

        .spotify-playlist-hero-info {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 12px;
        }

        .spotify-playlist-hero-type {
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .spotify-playlist-hero-title {
          font-size: 64px;
          font-weight: 900;
          margin: 0;
          line-height: 1;
        }

        .spotify-playlist-hero-desc {
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          margin: 0;
        }

        .spotify-playlist-hero-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .spotify-play-hero-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #1db954;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
          color: #fff;
        }

        .spotify-play-hero-btn:hover {
          transform: scale(1.06);
        }

        .spotify-heart-btn, .spotify-lyrics-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 12px;
          border-radius: 50%;
          transition: all 0.15s ease;
        }

        .spotify-heart-btn:hover, .spotify-lyrics-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .spotify-heart-btn.active {
          color: #1db954;
        }

        .spotify-lyrics-btn.active {
          color: #fff;
        }

        .spotify-icon-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          cursor: pointer;
          padding: 10px;
          border-radius: 50%;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
        }

        .spotify-icon-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .spotify-icon-btn.danger:hover {
          background: rgba(255,0,0,0.2);
          border-color: rgba(255,0,0,0.3);
        }

        /* --- LYRICS --- */
        .lyrics-container {
          margin-bottom: 32px;
        }

        .lyrics-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 700;
        }

        .lyrics-content {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 24px;
        }

        .lyrics-section {
          font-size: 32px;
          font-weight: 700;
          margin: 24px 0;
        }

        .lyrics-line {
          font-size: 24px;
          margin: 12px 0;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 4px 0;
        }

        .lyrics-line:hover {
          color: #fff;
        }

        /* --- PLAYER --- */
        .spotify-player {
          flex-shrink: 0;
          background: rgba(18, 18, 18, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          padding: 16px 24px;
          gap: 16px;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .spotify-player-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 180px;
          width: 30%;
        }

        .spotify-player-cover {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: transform 0.2s ease;
        }
        
        .spotify-player-cover:hover {
          transform: scale(1.05);
        }

        .spotify-player-info {
          min-width: 0;
        }

        .spotify-player-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #fff;
        }

        .spotify-player-artist {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-player-heart {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spotify-player-heart:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
          transform: scale(1.1);
        }

        .spotify-player-playlist-dropdown {
          position: relative;
        }

        .spotify-player-dropdown-menu {
          position: absolute;
          bottom: calc(100% + 4px);
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 0;
          min-width: 160px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 1000;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.5);
        }

        .spotify-player-dropdown-menu::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          height: 16px;
        }

        .spotify-player-playlist-dropdown:hover .spotify-player-dropdown-menu {
          opacity: 1;
          visibility: visible;
          bottom: calc(100% + 12px);
        }

        .spotify-player-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .spotify-player-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .spotify-player-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spotify-player-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
          transform: scale(1.1);
        }

        .spotify-player-btn.active {
          color: #1db954;
        }

        .spotify-player-play {
          background: #fff;
          border: none;
          color: #000;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .spotify-player-play:hover {
          transform: scale(1.08);
          background: #1db954;
        }

        .spotify-player-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 500px;
        }

        .spotify-time {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          min-width: 44px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .spotify-progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
          transition: height 0.1s ease;
        }
        
        .spotify-progress-bar:hover {
          height: 6px;
        }

        .spotify-progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #fff;
          border-radius: 2px;
          width: var(--progress, 0%);
          transition: background 0.1s ease;
        }
        
        .spotify-progress-bar:hover .spotify-progress-fill {
          background: #1db954;
        }
        
        .spotify-progress-bar::after {
          content: '';
          position: absolute;
          top: 50%;
          left: var(--progress, 0%);
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          transition: transform 0.1s ease, background 0.1s ease;
          pointer-events: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .spotify-progress-bar:hover::after {
          transform: translate(-50%, -50%) scale(1);
        }

        .spotify-player-right {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: flex-end;
          min-width: 180px;
          width: 30%;
        }

        .spotify-volume {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.6);
          transition: color 0.2s ease;
        }
        
        .spotify-volume:hover {
          color: #fff;
        }

        .spotify-volume-slider {
          width: 100%;
          max-width: 100px;
          cursor: pointer;
          accent-color: #fff;
          height: 4px;
          transition: all 0.2s ease;
        }
        
        .spotify-volume-slider:hover {
          accent-color: #1db954;
        }

        /* Playlist meta */
        .playlist-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 8px;
        }

        .playlist-votes {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vote-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .vote-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .vote-btn.voted {
          color: #fbbf24;
        }

        .vote-btn svg {
          width: 18px;
          height: 18px;
        }

        .playlist-meta span {
          color: rgba(255,255,255,0.6);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default SpotifyMiniStandalone;
