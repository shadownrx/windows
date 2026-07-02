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
  Home24Filled,
  Library24Filled,
  Add24Filled,
  ArrowRight24Filled,
  Delete24Regular,
  Share24Regular,
  Dismiss24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import { useMusicSync } from '../../hooks/useMusicSync';
import LiveRoomPanel from '../music/LiveRoomPanel';
import type { Track as MusicTrack, ChatMessage, DjEqSettings, LiveReaction, RoomUser, DjModeState, DjVoteEntry } from '../../types/music';

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
type Track = MusicTrack;

interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

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
  playlists: Playlist[];
  activePlaylist: Playlist | null;
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
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  setActivePlaylist: (playlist: Playlist | null) => void;
  sharePlaylist: (playlist: Playlist) => void;
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
}

const SpotifyMiniContext = createContext<SpotifyMiniContextType | undefined>(undefined);

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export const SpotifyMiniStandaloneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try { const s = localStorage.getItem('spotifyMiniFavorites'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [history, setHistory] = useState<Track[]>(() => {
    try { const s = localStorage.getItem('spotifyMiniHistory'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try { const s = localStorage.getItem('nexMusicPlaylists'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showLivePanel, setShowLivePanel] = useState(false);
  const remoteUpdateRef = useRef(false);
  const sync = useMusicSync();

  useEffect(() => { localStorage.setItem('spotifyMiniFavorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('spotifyMiniHistory', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('nexMusicPlaylists', JSON.stringify(playlists)); }, [playlists]);

  useEffect(() => {
    sync.onRemotePlayback((state) => {
      remoteUpdateRef.current = true;
      setCurrentTrack(state.currentTrack);
      setIsPlaying(state.isPlaying);
      setProgress(state.progress);
      setVolume(state.volume);
      if (state.queue) setQueue(state.queue);
      requestAnimationFrame(() => { remoteUpdateRef.current = false; });
    });
    sync.onRemoteQueue((nextQueue) => {
      remoteUpdateRef.current = true;
      setQueue(nextQueue);
      requestAnimationFrame(() => { remoteUpdateRef.current = false; });
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
      requestAnimationFrame(() => { remoteUpdateRef.current = false; });
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

  const togglePlay = useCallback(() => { setIsPlaying(prev => !prev); }, []);

  const tryDjAutoNext = useCallback(() => {
    if (sync.isHost && sync.roomCode && sync.djMode.enabled && sync.djMode.autoPlay && sync.djPool.length > 0) {
      sync.playTopDjTrack();
      return true;
    }
    return false;
  }, [sync]);

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
    if (history.length > 1) playTrack(history[1]);
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

  const seekTo = useCallback((percent: number) => { setProgress(percent); }, []);

  const createPlaylist = useCallback((name: string): Playlist => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Nueva Playlist',
      tracks: [],
      createdAt: Date.now(),
    };
    setPlaylists(prev => [...prev, newPl]);
    return newPl;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    setActivePlaylist(prev => (prev?.id === id ? null : prev));
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId
        ? { ...p, tracks: p.tracks.some(t => t.id === track.id) ? p.tracks : [...p.tracks, track] }
        : p
    ));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p
    ));
  }, []);

  const sharePlaylist = useCallback((playlist: Playlist) => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(playlist))));
      const url = `${window.location.origin}${window.location.pathname}#playlist=${encoded}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => fallbackCopy(url));
      } else {
        fallbackCopy(url);
      }
    } catch (e) {
      console.error('Error sharing playlist:', e);
    }
  }, []);

  return (
    <SpotifyMiniContext.Provider value={{
      currentTrack, isPlaying, volume, progress, duration,
      queue, favorites, history, playlists, activePlaylist, showLyrics,
      playTrack, togglePlay, nextTrack, prevTrack, setVolume, seekTo,
      addToQueue, removeFromQueue, toggleFavorite, isFavorite,
      setShowLyrics, setIsPlaying, setDuration, setProgress,
      createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
      setActivePlaylist, sharePlaylist,
      showLivePanel, setShowLivePanel,
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
    }}>
      {children}
    </SpotifyMiniContext.Provider>
  );
};

const useSpotifyMini = () => {
  const context = useContext(SpotifyMiniContext);
  if (!context) throw new Error('useSpotifyMini must be used within a SpotifyMiniStandaloneProvider');
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
    if (currentTrack) setLyrics(['Proximamente, las letras de la canción estarán disponibles aquí.']);
  }, [currentTrack]);
  return (
    <div className="lyrics-container">
      <div className="lyrics-header"><Book24Regular /><span>Letras de {currentTrack?.title}</span></div>
      <div className="lyrics-content">
        {lyrics.map((line, i) => (
          <p key={i} className={line.includes('🎵') || line.includes('🎶') ? 'lyrics-section' : 'lyrics-line'}>{line}</p>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const SpotifyMiniStandalone: React.FC = () => {
  const {
    currentTrack, isPlaying, volume, progress, duration,
    queue, favorites, history, playlists, activePlaylist, showLyrics,
    playTrack, togglePlay, nextTrack, prevTrack, setVolume, seekTo,
    addToQueue, removeFromQueue, toggleFavorite, isFavorite,
    setShowLyrics, setIsPlaying, setDuration, setProgress,
    createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
    setActivePlaylist, sharePlaylist,
    showLivePanel, setShowLivePanel,
    syncConnected, roomCode, isRoomHost, roomUsers, liveChat, liveReactions, syncError,
    createLiveRoom, joinLiveRoom, leaveLiveRoom, sendLiveChat, sendLiveReaction,
    djMode, djPool, djEq, toggleDjMode, setDjAutoPlay, updateDjEq, suggestToDj, voteDjTrack, playTopDjTrack, clearDjPool,
  } = useSpotifyMini();

  const [activeService, setActiveService] = useState<ServiceType>('youtube');
  const [activeTab, setActiveTab] = useState<'search' | 'playlist' | 'queue' | 'favorites' | 'history'>('search');
  const [query, setQuery] = useState('');
  const pcnMode = query.trim().toUpperCase() === 'PCN';
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoAnimating, setLogoAnimating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bumpHeartId, setBumpHeartId] = useState<string | null>(null);
  const [serviceFade, setServiceFade] = useState(true);

  // Playlist UI state
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
  const [pendingTrackForPlaylist, setPendingTrackForPlaylist] = useState<Track | null>(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [noShortsFilter, setNoShortsFilter] = useState(true);
  const [searchControlsVisible, setSearchControlsVisible] = useState(true);

  useEffect(() => {
    const updateSearchControls = () => {
      setSearchControlsVisible(window.innerWidth > 768);
    };
    updateSearchControls();
    window.addEventListener('resize', updateSearchControls);
    return () => window.removeEventListener('resize', updateSearchControls);
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isYoutubeApiReady = useRef(false);
  const progressIntervalRef = useRef<number | null>(null);

  // Refs for stale-closure fix in YouTube event handler
  const activePlaylistRef = useRef<Playlist | null>(activePlaylist);
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const playTrackRef = useRef<(track: Track) => void>(playTrack);
  const nextTrackRef = useRef<() => void>(nextTrack);

  useEffect(() => { activePlaylistRef.current = activePlaylist; }, [activePlaylist]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { playTrackRef.current = playTrack; }, [playTrack]);
  useEffect(() => { nextTrackRef.current = nextTrack; }, [nextTrack]);

  // Keep viewingPlaylist in sync with playlists state
  useEffect(() => {
    if (viewingPlaylist) {
      const updated = playlists.find(p => p.id === viewingPlaylist.id);
      if (updated) setViewingPlaylist({ ...updated });
      else setViewingPlaylist(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlists]);

  // --- TOAST HELPER ---
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // --- YOUTUBE API ---
  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      isYoutubeApiReady.current = true;
      initPlayer();
    };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else if (window.YT) {
      isYoutubeApiReady.current = true;
    }
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentTrack?.videoId) initPlayer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  useEffect(() => {
    if (playerRef.current?.setVolume) playerRef.current.setVolume(volume);
  }, [volume]);

  const initPlayer = () => {
    if (!currentTrack?.videoId) return;
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(currentTrack.videoId);
      setIsPlaying(true);
      return;
    }
    if (window.YT && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: currentTrack.videoId,
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            if (playerRef.current.getDuration) setDuration(playerRef.current.getDuration());
            playerRef.current.setVolume(volume);
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
              stopProgressTracking();
              // Autoplay: check active playlist first
              const ap = activePlaylistRef.current;
              const ct = currentTrackRef.current;
              if (ap && ct) {
                const idx = ap.tracks.findIndex(t => t.id === ct.id);
                if (idx >= 0 && idx < ap.tracks.length - 1) {
                  playTrackRef.current(ap.tracks[idx + 1]);
                  return;
                }
              }
              nextTrackRef.current();
            }
          },
        },
      });
    } else {
      setTimeout(initPlayer, 100);
    }
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
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
      playerRef.current.seekTo((percent / 100) * duration, true);
    }
  };

  const handleTogglePlay = () => {
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

  // --- SHORTS FILTER ---
  const filterShorts = (results: YouTubeResult[]): YouTubeResult[] => {
    if (!noShortsFilter) return results;
    return results.filter(r => {
      const text = (r.title + ' ' + (r.description || '')).toLowerCase();
      return !(
        text.includes('#shorts') ||
        text.includes('#short') ||
        r.title.toLowerCase().endsWith(' shorts') ||
        r.title.toLowerCase().startsWith('shorts:') ||
        r.title.toLowerCase().startsWith('short:') ||
        /\byoutube short(s)?\b/i.test(r.title)
      );
    });
  };

  // --- SEARCH ---
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      if (activeService === 'spotify') {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Spotify search failed');
        const data = await res.json();
        setSearchResults(data.results.map((item: any): SpotifyResult => ({
          id: item.id, title: item.title, artist: item.artist,
          cover: item.thumbnail, url: item.uri, service: 'spotify',
        })));
      } else {
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (!res.ok) throw new Error('YouTube search failed');
        const data = await res.json();
        setSearchResults(filterShorts(data.results || []));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (activeService === 'spotify') {
        setSearchResults([
          { id: 's1', title: 'Sin un peso', artist: 'Nafta', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', url: '', service: 'spotify' },
          { id: 's2', title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1511379938547-c1f6941d86ba?w=300', url: '', service: 'spotify' },
        ]);
      } else {
        setSearchResults(filterShorts([
          { id: 'dQw4w9WgXcQ', kind: 'video', title: 'Rick Astley - Never Gonna Give You Up', channelTitle: 'Rick Astley', publishedAt: '2009-10-25T06:57:33Z', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', description: 'Official video' },
          { id: '9bZkp7q19f0', kind: 'video', title: 'PSY - GANGNAM STYLE', channelTitle: 'officialpsy', publishedAt: '2012-07-15T07:46:32Z', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', description: 'PSY' },
        ]));
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeService, noShortsFilter]);

  // --- HELPERS ---
  const resultToTrack = (result: any, service: ServiceType): Track => ({
    id: result.id,
    title: result.title,
    artist: result.channelTitle || result.artist || '',
    cover: result.thumbnail || result.cover || '',
    url: '',
    service,
    kind: result.kind,
    videoId: result.id,
  });

  const resolveSpotifyAsYouTube = async (result: SpotifyResult): Promise<Track> => {
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(`${result.title} ${result.artist}`)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) return resultToTrack(data.results[0], 'youtube');
      }
    } catch { /* fallthrough */ }
    return { id: result.id, title: result.title, artist: result.artist, cover: result.cover, url: '', service: 'spotify' };
  };

  const playFromSearch = async (result: any) => {
    if ('service' in result && result.service === 'spotify') {
      playTrack(await resolveSpotifyAsYouTube(result as SpotifyResult));
    } else {
      playTrack(resultToTrack(result, activeService));
    }
  };

  const addTrackToQueue = async (result: any) => {
    if ('service' in result && result.service === 'spotify') {
      addToQueue(await resolveSpotifyAsYouTube(result as SpotifyResult));
    } else {
      addToQueue(resultToTrack(result, activeService));
    }
  };

  const suggestFromSearch = async (result: any) => {
    if ('service' in result && result.service === 'spotify') {
      suggestToDj(await resolveSpotifyAsYouTube(result as SpotifyResult));
    } else {
      suggestToDj(resultToTrack(result, activeService));
    }
  };

  const showDjSuggest = !!roomCode && djMode.enabled;

  useEffect(() => {
    setServiceFade(false);
    const timer = window.setTimeout(() => setServiceFade(true), 20);
    return () => window.clearTimeout(timer);
  }, [activeService]);

  const getServiceButtonIcon = (service: ServiceType) => {
    if (service === 'youtube') return <Play24Filled style={{ width: 16, height: 16 }} />;
    if (service === 'youtube-music') return <MusicNote224Filled style={{ width: 16, height: 16 }} />;
    return <Library24Filled style={{ width: 16, height: 16 }} />;
  };

  const handleOpenAddToPlaylist = async (result: any) => {
    let track: Track;
    if ('service' in result && result.service === 'spotify') {
      track = await resolveSpotifyAsYouTube(result as SpotifyResult);
    } else {
      track = resultToTrack(result, activeService);
    }
    setPendingTrackForPlaylist(track);
    setShowAddToPlaylistModal(true);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) return;
    setActivePlaylist(playlist);
    playTrack(playlist.tracks[0]);
    if (playlist.tracks.length > 1) {
      playlist.tracks.slice(1).forEach(t => addToQueue(t));
    }
  };

  const handleSharePlaylist = (playlist: Playlist) => {
    sharePlaylist(playlist);
    showToast('🔗 Link copiado al portapapeles');
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // ==================== JSX ====================
  return (
    <div className={`spotify-root ${pcnMode ? 'pcn-theme' : ''}`}>

      {/* --- PERMANENT YOUTUBE IFRAME (always in DOM, hidden) --- */}
      {currentTrack?.videoId && (
        <iframe
          id="youtube-player"
          ref={iframeRef}
          src={buildEmbedUrlFromResult(currentTrack.videoId)}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={currentTrack.title}
          className="spotify-iframe-permanent"
        />
      )}

      {/* --- HAMBURGER --- */}
      <button
        className={`hamburger-btn ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <span></span><span></span><span></span>
      </button>

      {/* --- SIDEBAR OVERLAY --- */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ==================== SIDEBAR ==================== */}
      <div className={`spotify-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* NEX BRANDING */}
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
          <span className="power-by">Created by Salvador Juarez</span>
        </div>

        {/* TOP MENU */}
        <div className="spotify-sidebar-top">
          <div className={`spotify-nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <Search24Regular /><span>Buscar</span>
          </div>
          <div
            className={`spotify-nav-item ${activeTab === 'playlist' ? 'active' : ''}`}
            onClick={() => { setViewingPlaylist(null); setActiveTab('playlist'); setSidebarOpen(false); }}
          >
            <Home24Filled /><span>Playlists</span>
          </div>
        </div>

        {/* LIBRARY */}
        <div className="spotify-library">
          <div className="spotify-library-header">
            <div className="spotify-library-title"><Library24Filled /><span>Tu biblioteca</span></div>
            <div className="spotify-library-actions">
              <button className="spotify-btn-icon" title="Nueva playlist" onClick={() => setShowCreatePlaylistModal(true)}>
                <Add24Filled />
              </button>
            </div>
          </div>

          <div className="spotify-nav-tabs">
            <button className={`spotify-nav-tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')} title="Me gusta">
              <Heart24Filled />
            </button>
            <button className={`spotify-nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} title="Historial">
              <History24Regular />
            </button>
            <button className={`spotify-nav-tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')} title="Cola">
              <List24Regular />
            </button>
          </div>

          <div className="spotify-library-content">
            {/* User playlists */}
            {playlists.map(pl => (
              <div
                key={pl.id}
                className={`spotify-playlist-item ${viewingPlaylist?.id === pl.id ? 'active-pl' : ''}`}
                onClick={() => { setViewingPlaylist(pl); setActiveTab('playlist'); setSidebarOpen(false); }}
              >
                <div className="spotify-playlist-cover">
                  {pl.tracks[0]?.cover
                    ? <img src={pl.tracks[0].cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                    : <MusicNote224Filled />}
                </div>
                <div className="spotify-playlist-info">
                  <div className="spotify-playlist-name">{pl.name}</div>
                  <div className="spotify-playlist-desc">Playlist · {pl.tracks.length} {pl.tracks.length === 1 ? 'canción' : 'canciones'}</div>
                </div>
              </div>
            ))}

            <div className="spotify-playlist-item" onClick={() => setActiveTab('favorites')}>
              <div className="spotify-playlist-cover spotify-cover-liked"><Heart24Filled /></div>
              <div className="spotify-playlist-info">
                <div className="spotify-playlist-name">Me gusta</div>
                <div className="spotify-playlist-desc">Playlist · {favorites.length} canciones</div>
              </div>
            </div>

            <div className="spotify-playlist-item" onClick={() => setActiveTab('history')}>
              <div className="spotify-playlist-cover spotify-cover-history"><History24Regular /></div>
              <div className="spotify-playlist-info">
                <div className="spotify-playlist-name">Historial</div>
                <div className="spotify-playlist-desc">Reproducido recientemente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="spotify-main">
        {/* HEADER */}
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
            <button className="spotify-search-button" onClick={() => runSearch(query)} disabled={!query.trim() || loading}>
              <ArrowRight24Filled />
            </button>
            <button
              type="button"
              className={`spotify-search-toggle-btn ${searchControlsVisible ? 'open' : ''}`}
              onClick={() => setSearchControlsVisible((visible) => !visible)}
              aria-expanded={searchControlsVisible}
              aria-label={searchControlsVisible ? 'Ocultar controles de búsqueda' : 'Mostrar controles de búsqueda'}
            >
              <span className="spotify-search-toggle-icon">{searchControlsVisible ? '▴' : '▾'}</span>
            </button>
          </div>
          <div className={`spotify-services ${searchControlsVisible ? '' : 'collapsed'}`}>
            <button
              type="button"
              className={`spotify-service-btn live-btn ${roomCode ? 'active live-active' : ''}`}
              onClick={() => setShowLivePanel(true)}
              title="Salas en vivo (Socket.io)"
            >
              <People24Regular style={{ width: 16, height: 16 }} />
              <span>{roomCode ? `En vivo · ${roomCode}${djMode.enabled ? ' · DJ' : ''}` : 'En vivo'}</span>
            </button>
            {(['youtube', 'youtube-music', 'spotify'] as ServiceType[]).map((service) => (
              <button
                key={service}
                className={`spotify-service-btn ${activeService === service ? 'active' : ''}`}
                onClick={() => setActiveService(service)}
              >
                {getServiceButtonIcon(service)}
                <span>{service === 'youtube' ? 'YouTube' : service === 'youtube-music' ? 'YT Music' : 'Spotify'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="spotify-content">

          {/* ---- SEARCH TAB ---- */}
          {activeTab === 'search' && (
            <div className="spotify-search-results">
              <div className="spotify-results-header">
                <h2>Resultados de búsqueda</h2>
                {(activeService === 'youtube' || activeService === 'youtube-music') && (
                  <button
                    className={`shorts-filter-btn ${noShortsFilter ? 'active' : ''}`}
                    onClick={() => setNoShortsFilter(!noShortsFilter)}
                    title={noShortsFilter ? 'Reels/Shorts ocultos — click para mostrar' : 'Mostrando Reels/Shorts — click para ocultar'}
                  >
                    {noShortsFilter ? '🚫 Sin Reels' : '📱 Con Reels'}
                  </button>
                )}
              </div>

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
                      const sr = result as SpotifyResult;
                      return (
                        <div key={sr.id} className="spotify-card">
                          <div className="spotify-card-image">
                            <img src={sr.cover} alt={sr.title} />
                            <button className="spotify-play-btn" onClick={() => playFromSearch(sr)}><Play24Filled /></button>
                          </div>
                          <div className="spotify-card-info">
                            <div className="spotify-card-title">{sr.title}</div>
                            <div className="spotify-card-artist">{sr.artist}</div>
                          </div>
                          <button className="spotify-add-btn" onClick={() => addTrackToQueue(sr)} title="Añadir a la cola"><Add24Filled /></button>
                          {showDjSuggest && (
                            <button className="spotify-dj-btn" onClick={() => suggestFromSearch(sr)} title="Sugerir al DJ">🎧</button>
                          )}
                          <button className="spotify-playlist-add-btn" onClick={() => handleOpenAddToPlaylist(sr)} title="Añadir a playlist"><List24Regular /></button>
                        </div>
                      );
                    }
                    const yr = result as YouTubeResult;
                    return (
                      <div key={yr.id} className="spotify-card">
                        <div className="spotify-card-image">
                          <img src={yr.thumbnail} alt={yr.title} />
                          <button className="spotify-play-btn" onClick={() => playFromSearch(yr)}><Play24Filled /></button>
                        </div>
                        <div className="spotify-card-info">
                          <div className="spotify-card-title">{yr.title}</div>
                          <div className="spotify-card-artist">{yr.channelTitle}</div>
                        </div>
                        <button className="spotify-add-btn" onClick={() => addTrackToQueue(yr)} title="Añadir a la cola"><Add24Filled /></button>
                        {showDjSuggest && (
                          <button className="spotify-dj-btn" onClick={() => suggestFromSearch(yr)} title="Sugerir al DJ">🎧</button>
                        )}
                        <button className="spotify-playlist-add-btn" onClick={() => handleOpenAddToPlaylist(yr)} title="Añadir a playlist"><List24Regular /></button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && query.trim() && searchResults.length === 0 && (
                <div className="spotify-empty">
                  <Search24Regular />
                  <p>No se encontraron resultados para "{query}"</p>
                </div>
              )}
            </div>
          )}

          {/* ---- QUEUE TAB ---- */}
          {activeTab === 'queue' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header"><h2>Cola de reproducción</h2></div>
              {queue.length === 0 ? (
                <div className="spotify-empty"><List24Regular /><p>No hay canciones en la cola</p></div>
              ) : (
                <div className="spotify-track-list">
                  {queue.map((track) => (
                    <div key={track.id} className="spotify-track-row" onClick={() => playTrack(track)}>
                      <div className="spotify-track-cover"><img src={track.cover} alt={track.title} /></div>
                      <div className="spotify-track-main">
                        <div className="spotify-track-title">{track.title}</div>
                        <div className="spotify-track-artist">{track.artist}</div>
                      </div>
                      <button className="spotify-track-btn" onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- PLAYLIST TAB ---- */}
          {activeTab === 'playlist' && (
            <div className="spotify-list-view">
              {/* Playlist Detail */}
              {viewingPlaylist ? (
                <>
                  <div className="spotify-playlist-header">
                    <div className="spotify-playlist-hero-cover">
                      {viewingPlaylist.tracks[0]?.cover
                        ? <img src={viewingPlaylist.tracks[0].cover} alt="" className="spotify-hero-image" />
                        : <div className="pl-empty-cover"><MusicNote224Filled /></div>}
                    </div>
                    <div className="spotify-playlist-hero-info">
                      <div className="spotify-playlist-hero-type">Playlist</div>
                      <h1 className="spotify-playlist-hero-title">{viewingPlaylist.name}</h1>
                      <p className="spotify-playlist-hero-desc">
                        {viewingPlaylist.tracks.length} {viewingPlaylist.tracks.length === 1 ? 'canción' : 'canciones'}
                      </p>
                      <div className="spotify-playlist-hero-actions">
                        <button
                          className="spotify-play-hero-btn"
                          onClick={() => handlePlayPlaylist(viewingPlaylist)}
                          disabled={viewingPlaylist.tracks.length === 0}
                          title="Reproducir playlist"
                        >
                          <Play24Filled />
                        </button>
                        <button className="spotify-hero-action-btn" onClick={() => handleSharePlaylist(viewingPlaylist)} title="Compartir playlist">
                          <Share24Regular />
                        </button>
                        <button
                          className="spotify-hero-action-btn danger"
                          onClick={() => { if (window.confirm(`¿Eliminar la playlist "${viewingPlaylist.name}"?`)) { deletePlaylist(viewingPlaylist.id); setViewingPlaylist(null); } }}
                          title="Eliminar playlist"
                        >
                          <Delete24Regular />
                        </button>
                        <button className="spotify-back-btn" onClick={() => setViewingPlaylist(null)}>
                          ← Volver
                        </button>
                      </div>
                    </div>
                  </div>

                  {showLyrics && currentTrack && <LyricsDisplay />}

                  {viewingPlaylist.tracks.length === 0 ? (
                    <div className="spotify-empty">
                      <MusicNote224Filled />
                      <p>Esta playlist está vacía. Buscá canciones y agrégalas con el botón <List24Regular />.</p>
                      <button className="spotify-create-btn" onClick={() => setActiveTab('search')}>Buscar canciones</button>
                    </div>
                  ) : (
                    <div className="spotify-track-list">
                      {viewingPlaylist.tracks.map((track, index) => (
                        <div
                          key={track.id}
                          className={`spotify-track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                          onClick={() => { setActivePlaylist(viewingPlaylist); playTrack(track); }}
                        >
                          <div className="spotify-track-num">{currentTrack?.id === track.id && isPlaying ? '▶' : index + 1}</div>
                          <div className="spotify-track-cover"><img src={track.cover} alt={track.title} /></div>
                          <div className="spotify-track-main">
                            <div className="spotify-track-title">{track.title}</div>
                            <div className="spotify-track-artist">{track.artist}</div>
                          </div>
                          <button
                            className="spotify-track-btn"
                            onClick={(e) => { e.stopPropagation(); removeTrackFromPlaylist(viewingPlaylist.id, track.id); }}
                            title="Quitar de playlist"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Playlists Grid */
                <>
                  <div className="spotify-list-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Mis Playlists</h2>
                      <button className="spotify-create-btn" onClick={() => setShowCreatePlaylistModal(true)}>
                        <Add24Filled /> Nueva
                      </button>
                    </div>
                    <p>{playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}</p>
                  </div>

                  {playlists.length === 0 ? (
                    <div className="spotify-empty">
                      <MusicNote224Filled />
                      <p>No tienes playlists. ¡Crea una!</p>
                      <button className="spotify-create-btn" style={{ marginTop: 8 }} onClick={() => setShowCreatePlaylistModal(true)}>
                        <Add24Filled /> Crear playlist
                      </button>
                    </div>
                  ) : (
                    <div className="spotify-playlists-grid">
                      {playlists.map(pl => (
                        <div key={pl.id} className="spotify-playlist-card" onClick={() => setViewingPlaylist(pl)}>
                          <div className="spotify-playlist-card-cover">
                            {pl.tracks[0]?.cover
                              ? <img src={pl.tracks[0].cover} alt="" />
                              : <div className="pl-empty-cover"><MusicNote224Filled /></div>}
                            <button
                              className="spotify-playlist-card-play"
                              onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(pl); }}
                              title="Reproducir"
                            >
                              <Play24Filled />
                            </button>
                          </div>
                          <div className="spotify-playlist-card-info">
                            <div className="spotify-playlist-card-name">{pl.name}</div>
                            <div className="spotify-playlist-card-count">{pl.tracks.length} {pl.tracks.length === 1 ? 'canción' : 'canciones'}</div>
                          </div>
                          <div className="spotify-playlist-card-actions">
                            <button onClick={(e) => { e.stopPropagation(); handleSharePlaylist(pl); }} title="Compartir">
                              <Share24Regular />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`¿Eliminar "${pl.name}"?`)) deletePlaylist(pl.id); }} title="Eliminar">
                              <Delete24Regular />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ---- FAVORITES TAB ---- */}
          {activeTab === 'favorites' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header"><h2>Me gusta</h2><p>{favorites.length} canciones</p></div>
              {favorites.length === 0 ? (
                <div className="spotify-empty"><Heart24Filled /><p>No tienes favoritos aún</p></div>
              ) : (
                <div className="spotify-track-list">
                  {favorites.map((track) => (
                    <div key={track.id} className={`spotify-track-row ${currentTrack?.id === track.id ? 'active' : ''}`} onClick={() => playTrack(track)}>
                      <div className="spotify-track-cover"><img src={track.cover} alt={track.title} /></div>
                      <div className="spotify-track-main">
                        <div className="spotify-track-title">{track.title}</div>
                        <div className="spotify-track-artist">{track.artist}</div>
                      </div>
                      <button className={`spotify-heart-small ${bumpHeartId === track.id ? 'heart-bump' : ''}`} onClick={(e) => { e.stopPropagation(); handleHeartClick(track); }}>
                        <Heart24Filled />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- HISTORY TAB ---- */}
          {activeTab === 'history' && (
            <div className="spotify-list-view">
              <div className="spotify-list-header"><h2>Historial</h2><p>Reproducido recientemente</p></div>
              {history.length === 0 ? (
                <div className="spotify-empty"><History24Regular /><p>No hay historial aún</p></div>
              ) : (
                <div className="spotify-track-list">
                  {history.map((track) => (
                    <div key={track.id} className={`spotify-track-row ${currentTrack?.id === track.id ? 'active' : ''}`} onClick={() => playTrack(track)}>
                      <div className="spotify-track-cover"><img src={track.cover} alt={track.title} /></div>
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

      {/* ==================== PLAYER BAR ==================== */}
      {currentTrack && (
        <div className="spotify-player">
          <div className="spotify-player-left">
            <img src={currentTrack.cover} alt="" className="spotify-player-cover" />
            <div className="spotify-player-info">
              <div className="spotify-player-title">{currentTrack.title}</div>
              <div className="spotify-player-artist">{currentTrack.artist}</div>
            </div>
            <button className={`spotify-player-heart ${bumpHeartId === currentTrack.id ? 'heart-bump' : ''}`} onClick={() => handleHeartClick(currentTrack)}>
              {isFavorite(currentTrack.id) ? <Heart24Filled /> : <Heart24Regular />}
            </button>
            {activePlaylist && (
              <div className="spotify-autoplay-badge" title={`Autoplay: ${activePlaylist.name}`}>
                ▶ {activePlaylist.name}
              </div>
            )}
          </div>

          <div className="spotify-player-center">
            <div className="spotify-player-controls">
              <button className="spotify-player-btn" onClick={prevTrack}><Previous24Filled /></button>
              <button className="spotify-player-play" onClick={handleTogglePlay}>
                {isPlaying ? <Pause24Filled /> : <Play24Filled />}
              </button>
              <button className="spotify-player-btn" onClick={nextTrack}><Next24Filled /></button>
            </div>
            <div className="spotify-player-progress">
              <span className="spotify-time">{formatTime((progress / 100) * duration)}</span>
              <div className="spotify-progress-bar" onClick={handleSeek} style={{ '--progress': `${progress}%` } as React.CSSProperties}>
                <div className="spotify-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="spotify-time">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="spotify-player-right">
            <button className={`spotify-player-btn ${showLyrics ? 'active' : ''}`} onClick={() => setShowLyrics(!showLyrics)}>
              <Book24Regular />
            </button>
            <div className="spotify-volume">
              <Speaker224Filled />
              <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="spotify-volume-slider" />
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE PLAYLIST MODAL ==================== */}
      {showCreatePlaylistModal && (
        <div className="nex-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreatePlaylistModal(false); }}>
          <div className="nex-modal">
            <div className="nex-modal-header">
              <h3>Nueva Playlist</h3>
              <button className="nex-modal-close" onClick={() => { setShowCreatePlaylistModal(false); setNewPlaylistName(''); }}>
                <Dismiss24Regular />
              </button>
            </div>
            <div className="nex-modal-body">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Dale un nombre a tu playlist..."
                className="nex-modal-input"
                autoFocus
                maxLength={60}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPlaylistName.trim()) {
                    createPlaylist(newPlaylistName);
                    setNewPlaylistName('');
                    setShowCreatePlaylistModal(false);
                    setViewingPlaylist(null);
                    setActiveTab('playlist');
                    showToast('✅ Playlist creada');
                  }
                }}
              />
            </div>
            <div className="nex-modal-footer">
              <button className="nex-modal-cancel" onClick={() => { setShowCreatePlaylistModal(false); setNewPlaylistName(''); }}>Cancelar</button>
              <button
                className="nex-modal-save"
                disabled={!newPlaylistName.trim()}
                onClick={() => {
                  if (newPlaylistName.trim()) {
                    createPlaylist(newPlaylistName);
                    setNewPlaylistName('');
                    setShowCreatePlaylistModal(false);
                    setViewingPlaylist(null);
                    setActiveTab('playlist');
                    showToast('✅ Playlist creada');
                  }
                }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD TO PLAYLIST MODAL ==================== */}
      {showAddToPlaylistModal && pendingTrackForPlaylist && (
        <div className="nex-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddToPlaylistModal(false); setPendingTrackForPlaylist(null); } }}>
          <div className="nex-modal nex-modal--wide">
            <div className="nex-modal-header">
              <h3>Agregar a Playlist</h3>
              <button className="nex-modal-close" onClick={() => { setShowAddToPlaylistModal(false); setPendingTrackForPlaylist(null); }}>
                <Dismiss24Regular />
              </button>
            </div>
            <div className="nex-modal-body">
              <div className="nex-modal-track-preview">
                {pendingTrackForPlaylist.cover && <img src={pendingTrackForPlaylist.cover} alt="" />}
                <div>
                  <div className="nex-modal-track-title">{pendingTrackForPlaylist.title}</div>
                  <div className="nex-modal-track-artist">{pendingTrackForPlaylist.artist}</div>
                </div>
              </div>

              {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.55)' }}>
                  <p style={{ marginBottom: 16 }}>No tienes playlists todavía.</p>
                  <button className="nex-modal-save" onClick={() => {
                    setShowAddToPlaylistModal(false);
                    setPendingTrackForPlaylist(null);
                    setShowCreatePlaylistModal(true);
                  }}>
                    <Add24Filled /> Crear una playlist
                  </button>
                </div>
              ) : (
                <div className="nex-modal-playlist-list">
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      className="nex-modal-playlist-item"
                      onClick={() => {
                        addTrackToPlaylist(pl.id, pendingTrackForPlaylist!);
                        setShowAddToPlaylistModal(false);
                        setPendingTrackForPlaylist(null);
                        showToast(`✅ Agregado a "${pl.name}"`);
                      }}
                    >
                      <div className="nex-modal-pl-cover">
                        {pl.tracks[0]?.cover ? <img src={pl.tracks[0].cover} alt="" /> : <MusicNote224Filled />}
                      </div>
                      <div className="nex-modal-pl-info">
                        <div className="nex-modal-pl-name">{pl.name}</div>
                        <div className="nex-modal-pl-count">{pl.tracks.length} canciones</div>
                      </div>
                      <Add24Filled style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST ==================== */}
      {toast && <div className="nex-toast">{toast}</div>}

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

      {/* ==================== GLOBAL STYLES ==================== */}
      <style>{`
        * { box-sizing: border-box; }

        .spotify-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
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

        /* --- HAMBURGER --- */
        .hamburger-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1000;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.12);
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
        .hamburger-btn:hover { background: #1e1e1e; border-color: rgba(255,255,255,0.25); }
        .hamburger-btn span { width: 20px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); transform-origin: center; }
        .hamburger-btn.open span:nth-child(1) { transform: rotate(45deg) translateY(7px); }
        .hamburger-btn.open span:nth-child(2) { opacity: 0; }
        .hamburger-btn.open span:nth-child(3) { transform: rotate(-45deg) translateY(-7px); }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 49;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

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
          transition: left 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 4px 0 24px rgba(0,0,0,0.6);
        }
        .spotify-sidebar.sidebar-open { left: 0; }

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
        .spotify-nav-item:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .spotify-nav-item.active { color: #000; background: #fff; }

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
        .spotify-library-title:hover { color: #fff; }

        .spotify-btn-icon {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 10px;
          border-radius: 10px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
        }
        .spotify-btn-icon:hover { color: #000; background: #fff; }

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
          display: flex;
          align-items: center;
        }
        .spotify-nav-tab:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .spotify-nav-tab.active { background: #fff; color: #000; border-color: #fff; }

        .spotify-library-content { flex: 1; overflow-y: auto; padding: 8px 12px; }

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
        .spotify-playlist-item:hover { background: rgba(255,255,255,0.06); }
        .spotify-playlist-item.active-pl { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.1); }

        .spotify-playlist-cover {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          overflow: hidden;
        }
        .spotify-cover-liked { background: #1a1a1a; color: #fff; }
        .spotify-cover-history { background: #1a1a1a; color: rgba(255,255,255,0.7); }

        .spotify-playlist-info { flex: 1; min-width: 0; }
        .spotify-playlist-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spotify-playlist-desc { font-size: 12px; color: rgba(255,255,255,0.5); }

        /* --- MAIN CONTENT --- */
        .spotify-main {
          margin: 0;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
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
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px;
          padding: 12px 20px;
          flex: 1;
          max-width: 480px;
          min-width: 0;
          transition: border-color 0.15s ease;
          flex-wrap: wrap;
        }
        .spotify-search-bar:focus-within { border-color: rgba(255,255,255,0.4); }
        .spotify-search-icon { color: rgba(255,255,255,0.5); flex-shrink: 0; }
        .spotify-search-input { flex: 1; border: none; outline: none; background: transparent; color: #fff; font-size: 15px; font-weight: 500; min-width: 0; }
        .spotify-search-input::placeholder { color: rgba(255,255,255,0.45); }

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
        .spotify-search-button:hover:not(:disabled) { transform: scale(1.06); }
        .spotify-search-button:disabled { opacity: 0.3; cursor: not-allowed; }

        .spotify-search-toggle-btn {
          display: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          color: rgba(255,255,255,0.7);
          width: 36px;
          height: 36px;
          padding: 0;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          min-width: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .spotify-search-toggle-btn:hover { border-color: rgba(255,255,255,0.16); color: #fff; }
        .spotify-search-toggle-btn.open { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }
        .spotify-search-toggle-icon { display: inline-flex; font-size: 16px; }
        .spotify-search-toggle-btn:hover { border-color: rgba(255,255,255,0.16); color: #fff; }
        .spotify-search-toggle-btn.open { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }

        .spotify-services { display: flex; gap: 10px; align-items: center; min-width: 0; }
        .spotify-services.collapsed { display: none !important; }

        .spotify-service-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
        .spotify-service-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .spotify-service-btn.active { background: #fff; color: #000; border-color: #fff; }
        .spotify-service-btn.live-btn { display: inline-flex; align-items: center; }
        .spotify-service-btn.live-active { background: rgba(29,185,84,0.2); color: #1db954; border-color: #1db954; }
        .spotify-service-btn span { margin-left: 8px; }

        .spotify-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          padding-bottom: 140px;
          transition: opacity 180ms ease, transform 180ms ease;
        }
        .spotify-content.fade-out { opacity: 0.75; transform: translateY(6px); }
        .spotify-content.fade-in { opacity: 1; transform: translateY(0); }
          transition: opacity 180ms ease, transform 180ms ease;
        }
        .spotify-content.fade-out { opacity: 0.7; transform: translateY(6px); }
        .spotify-content.fade-in { opacity: 1; transform: translateY(0); }

        /* --- SEARCH RESULTS --- */
        .spotify-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .spotify-results-header h2 { font-size: 24px; font-weight: 800; color: #fff; margin: 0; }

        .shorts-filter-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          color: rgba(255,255,255,0.7);
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .shorts-filter-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
        .shorts-filter-btn.active { background: rgba(255,60,60,0.18); border-color: rgba(255,60,60,0.4); color: #ff6b6b; }

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
        .spotify-card:hover { background: #161616; border-color: rgba(255,255,255,0.12); }

        .spotify-card-image {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
          max-height: 180px;
        }
        .spotify-card-image img {
          width: 100%;
          height: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .spotify-card:hover .spotify-card-image img { transform: scale(1.05); }

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
        .spotify-card:hover .spotify-play-btn { opacity: 1; transform: translateY(0) scale(1); }
        .spotify-play-btn:hover { transform: scale(1.08); }

        .spotify-card-info { min-height: 64px; }
        .spotify-card-title { font-size: 15px; font-weight: 700; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .spotify-card-artist { font-size: 13px; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
        .spotify-card:hover .spotify-add-btn { opacity: 1; }
        .spotify-add-btn:hover { background: #fff; color: #000; border-color: #fff; }
        .spotify-dj-btn {
          position: absolute; top: 22px; right: 66px; width: 38px; height: 38px; border-radius: 50%;
          background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.45);
          display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0;
          transition: all 0.2s ease; font-size: 16px;
        }
        .spotify-card:hover .spotify-dj-btn { opacity: 1; }
        .spotify-dj-btn:hover { background: #fbbf24; border-color: #fbbf24; transform: scale(1.08); }

        .spotify-playlist-add-btn {
          position: absolute;
          top: 22px;
          right: 66px;
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
        .spotify-card:hover .spotify-playlist-add-btn { opacity: 1; }
        .spotify-playlist-add-btn:hover { background: #fff; color: #000; border-color: #fff; }

        /* --- STATES --- */
        .spotify-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          gap: 16px;
          color: rgba(255,255,255,0.5);
        }
        .spotify-empty svg { font-size: 56px; opacity: 0.4; }
        .spotify-empty p { font-size: 16px; text-align: center; }

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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* --- TRACK LISTS --- */
        .spotify-list-view { display: flex; flex-direction: column; gap: 24px; }

        .spotify-list-header { display: flex; flex-direction: column; gap: 6px; }
        .spotify-list-header h2 { font-size: 24px; font-weight: 800; color: #fff; }
        .spotify-list-header p { color: rgba(255,255,255,0.55); font-size: 14px; }

        .spotify-track-list { display: flex; flex-direction: column; gap: 4px; }

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
        .spotify-track-row:hover { background: rgba(255,255,255,0.07); }
        .spotify-track-row.active { background: rgba(255,255,255,0.12); }
        .spotify-track-row.active .spotify-track-title { color: #fff; }

        .spotify-track-num {
          width: 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          flex-shrink: 0;
          font-weight: 600;
        }
        .spotify-track-row.active .spotify-track-num { color: #fff; }

        .spotify-track-cover { width: 52px; height: 52px; border-radius: 8px; flex-shrink: 0; overflow: hidden; }
        .spotify-track-cover img { width: 100%; height: 100%; object-fit: cover; }

        .spotify-track-main { flex: 1; min-width: 0; }
        .spotify-track-title { font-size: 15px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .spotify-track-artist { font-size: 13px; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .spotify-track-btn { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 22px; padding: 6px; transition: color 0.15s; border-radius: 8px; }
        .spotify-track-btn:hover { color: #fff; }

        .spotify-heart-small { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 6px; font-size: 18px; transition: all 0.15s; }
        .spotify-heart-small:hover { color: #fff; transform: scale(1.1); }

        .heart-bump { animation: heart-bump-anim 0.32s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes heart-bump-anim { 0% { transform: scale(1); } 35% { transform: scale(1.45); } 60% { transform: scale(0.9); } 100% { transform: scale(1); } }

        /* --- PLAYLIST DETAIL HEADER --- */
        .spotify-playlist-header { display: flex; gap: 32px; margin-bottom: 32px; }

        .spotify-playlist-hero-cover {
          width: 220px;
          height: 220px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 16px 50px rgba(0,0,0,0.6);
        }
        .spotify-hero-image { width: 100%; height: 100%; object-fit: cover; }

        .pl-empty-cover {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: rgba(255,255,255,0.3);
        }

        .spotify-playlist-hero-info { display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; }
        .spotify-playlist-hero-type { color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
        .spotify-playlist-hero-title { font-size: 44px; font-weight: 900; margin: 0; color: #fff; }
        .spotify-playlist-hero-desc { color: rgba(255,255,255,0.6); font-size: 15px; }

        .spotify-playlist-hero-actions { display: flex; gap: 14px; margin-top: 20px; align-items: center; flex-wrap: wrap; }

        .spotify-play-hero-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
          color: #000;
        }
        .spotify-play-hero-btn:hover { transform: scale(1.08); }
        .spotify-play-hero-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .spotify-hero-action-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #fff;
        }
        .spotify-hero-action-btn:hover { border-color: #fff; background: rgba(255,255,255,0.1); }
        .spotify-hero-action-btn.danger:hover { border-color: #ff6b6b; color: #ff6b6b; background: rgba(255,60,60,0.12); }

        .spotify-back-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          color: rgba(255,255,255,0.7);
          padding: 10px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .spotify-back-btn:hover { color: #fff; border-color: rgba(255,255,255,0.5); }

        .spotify-create-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: none;
          border-radius: 20px;
          color: #000;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s;
        }
        .spotify-create-btn:hover { transform: scale(1.04); }

        /* --- PLAYLISTS GRID --- */
        .spotify-playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .spotify-playlist-card {
          background: #0d0d0d;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
        }
        .spotify-playlist-card:hover { background: #161616; border-color: rgba(255,255,255,0.12); }

        .spotify-playlist-card-cover {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
          aspect-ratio: 1;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spotify-playlist-card-cover img { width: 100%; height: 100%; object-fit: cover; }

        .spotify-playlist-card-play {
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
        .spotify-playlist-card:hover .spotify-playlist-card-play { opacity: 1; transform: translateY(0); }
        .spotify-playlist-card-play:hover { transform: scale(1.08) !important; }

        .spotify-playlist-card-info { margin-bottom: 12px; }
        .spotify-playlist-card-name { font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .spotify-playlist-card-count { font-size: 13px; color: rgba(255,255,255,0.5); }

        .spotify-playlist-card-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .spotify-playlist-card:hover .spotify-playlist-card-actions { opacity: 1; }
        .spotify-playlist-card-actions button {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: rgba(255,255,255,0.6);
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
        }
        .spotify-playlist-card-actions button:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .spotify-playlist-card-actions button:last-child:hover { background: rgba(255,60,60,0.2); color: #ff6b6b; border-color: rgba(255,60,60,0.3); }

        /* --- AUTOPLAY BADGE --- */
        .spotify-autoplay-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
          animation: badge-pulse 2s ease-in-out infinite;
        }
        @keyframes badge-pulse { 0%, 100% { border-color: rgba(255,255,255,0.15); } 50% { border-color: rgba(255,255,255,0.4); } }

        /* --- NEX BRANDING --- */
        .nex-branding {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 16px 16px;
          background: #0d0d0d;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .nex-logo {
          position: relative;
          width: 84px;
          height: 84px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .nex-logo-ring {
          position: absolute;
          border-radius: 50%;
          border: 3px solid transparent;
          animation: nex-ring-rotate 8s linear infinite;
        }
        .nex-logo-ring-1 { width: 84px; height: 84px; border-top-color: #ff0080; border-right-color: #00ffff; border-bottom-color: #80ff00; border-left-color: #ff00ff; box-shadow: 0 0 20px rgba(255,0,128,0.5); }
        .nex-logo-ring-2 { width: 66px; height: 66px; border-top-color: #00ff80; border-right-color: #ff8000; border-bottom-color: #8000ff; border-left-color: #0080ff; animation-direction: reverse; animation-duration: 6s; box-shadow: 0 0 16px rgba(0,255,128,0.4); }
        .nex-logo-ring-3 { width: 48px; height: 48px; border-top-color: #ff0000; border-right-color: #00ff00; border-bottom-color: #0000ff; border-left-color: #ffff00; animation-duration: 4s; box-shadow: 0 0 12px rgba(255,255,0,0.4); }

        .nex-logo-text {
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(90deg, #ff0080, #00ffff, #80ff00, #ff00ff, #ff0080);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 2px;
          z-index: 10;
          background-size: 200% 100%;
          animation: text-rgb 4s linear infinite;
        }
        @keyframes text-rgb { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }

        .nex-logo-animate { animation: nex-bounce 0.6s ease-in-out; }
        .nex-logo-pulse { animation: nex-pulse 0.6s ease-in-out infinite; }
        .nex-logo-pulse .nex-logo-ring-1 { animation: nex-ring-rotate 2s linear infinite, nex-ring-color-1 0.6s ease-in-out infinite alternate; }
        .nex-logo-pulse .nex-logo-ring-2 { animation: nex-ring-rotate-reverse 1.5s linear infinite, nex-ring-color-2 0.6s ease-in-out infinite alternate; }
        .nex-logo-pulse .nex-logo-ring-3 { animation: nex-ring-rotate 1s linear infinite, nex-ring-color-3 0.6s ease-in-out infinite alternate; }

        @keyframes nex-ring-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nex-ring-rotate-reverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes nex-ring-color-1 { 0% { border-top-color: #ff0080; border-right-color: #00ffff; border-bottom-color: #80ff00; border-left-color: #ff00ff; box-shadow: 0 0 20px rgba(255,0,128,0.5); } 100% { border-top-color: #00ffff; border-right-color: #80ff00; border-bottom-color: #ff00ff; border-left-color: #ff0080; box-shadow: 0 0 40px rgba(0,255,255,0.8); } }
        @keyframes nex-ring-color-2 { 0% { border-top-color: #00ff80; border-right-color: #ff8000; border-bottom-color: #8000ff; border-left-color: #0080ff; box-shadow: 0 0 16px rgba(0,255,128,0.4); } 100% { border-top-color: #ff8000; border-right-color: #8000ff; border-bottom-color: #0080ff; border-left-color: #00ff80; box-shadow: 0 0 32px rgba(255,128,0,0.7); } }
        @keyframes nex-ring-color-3 { 0% { border-top-color: #ff0000; border-right-color: #00ff00; border-bottom-color: #0000ff; border-left-color: #ffff00; box-shadow: 0 0 12px rgba(255,255,0,0.4); } 100% { border-top-color: #00ff00; border-right-color: #0000ff; border-bottom-color: #ffff00; border-left-color: #ff0000; box-shadow: 0 0 24px rgba(0,255,0,0.6); } }
        @keyframes nex-bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
        @keyframes nex-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }

        .nex-title {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 6px 0;
          background: linear-gradient(90deg, #ff0080, #00ffff, #80ff00, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 3px;
          background-size: 200% 100%;
          animation: text-rgb 5s linear infinite;
        }
        .power-by { font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; }

        /* --- LYRICS --- */
        .lyrics-container { background: #0d0d0d; border-radius: 14px; padding: 28px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.08); }
        .lyrics-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; font-weight: 700; font-size: 16px; color: #fff; }
        .lyrics-content { display: flex; flex-direction: column; gap: 8px; }
        .lyrics-section { color: rgba(255,255,255,0.75); font-weight: 700; font-size: 14px; margin-top: 14px; }
        .lyrics-line { color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.6; }

        /* --- PLAYER BAR --- */
        .spotify-player {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #000;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          z-index: 999;
        }

        .spotify-player-left { display: flex; align-items: center; gap: 16px; min-width: 240px; flex-wrap: wrap; }
        .spotify-player-cover { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .spotify-player-info { min-width: 0; }
        .spotify-player-title { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spotify-player-artist { font-size: 12px; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spotify-player-heart { background: transparent; border: none; color: rgba(255,255,255,0.55); cursor: pointer; padding: 8px; font-size: 22px; transition: all 0.15s; border-radius: 50%; }
        .spotify-player-heart:hover { color: #fff; transform: scale(1.1); }

        .spotify-player-center { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; max-width: 720px; }
        .spotify-player-controls { display: flex; align-items: center; gap: 20px; }

        .spotify-player-btn { background: transparent; border: none; color: rgba(255,255,255,0.6); cursor: pointer; padding: 8px; font-size: 24px; transition: all 0.15s; border-radius: 50%; }
        .spotify-player-btn:hover { color: #fff; transform: scale(1.08); }
        .spotify-player-btn.active { color: #fff; }

        .spotify-player-play { width: 38px; height: 38px; border-radius: 50%; background: #fff; border: none; color: #000; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease; }
        .spotify-player-play:hover { transform: scale(1.06); }

        .spotify-player-progress { display: flex; align-items: center; gap: 14px; width: 100%; }
        .spotify-time { font-size: 12px; color: rgba(255,255,255,0.5); min-width: 40px; text-align: center; font-weight: 600; }

        .spotify-progress-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer; position: relative; overflow: visible; transition: height 0.15s; }
        .spotify-progress-bar:hover { height: 8px; }
        .spotify-progress-fill { height: 100%; background: #fff; border-radius: 4px; position: relative; transition: width 0.1s linear; }
        .spotify-progress-bar::after { content: ''; position: absolute; left: calc(var(--progress, 0) - 6px); top: 50%; transform: translateY(-50%) scale(0); width: 13px; height: 13px; background: #fff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.5); transition: transform 0.15s ease; }
        .spotify-progress-bar:hover::after { transform: translateY(-50%) scale(1); }

        .spotify-player-right { display: flex; align-items: center; justify-content: flex-end; gap: 18px; min-width: 240px; }
        .spotify-volume { display: flex; align-items: center; gap: 12px; width: 130px; color: rgba(255,255,255,0.6); }
        .spotify-volume-slider { width: 100%; accent-color: #fff; cursor: pointer; height: 6px; }

        /* ==================== MODALS ==================== */
        .nex-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(12px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.15s ease-out;
        }

        .nex-modal {
          background: #111;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8);
          animation: modal-slide-up 0.2s cubic-bezier(0.34,1.56,0.64,1);
          overflow: hidden;
        }
        .nex-modal--wide { max-width: 500px; }

        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .nex-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0;
        }
        .nex-modal-header h3 { font-size: 20px; font-weight: 800; color: #fff; margin: 0; }

        .nex-modal-close {
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          transition: all 0.15s;
        }
        .nex-modal-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

        .nex-modal-body { padding: 20px 24px; }

        .nex-modal-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 14px 18px;
          color: #fff;
          font-size: 16px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.15s;
        }
        .nex-modal-input:focus { border-color: rgba(255,255,255,0.4); }
        .nex-modal-input::placeholder { color: rgba(255,255,255,0.35); }

        .nex-modal-footer {
          display: flex;
          gap: 12px;
          padding: 0 24px 24px;
          justify-content: flex-end;
        }

        .nex-modal-cancel {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: rgba(255,255,255,0.7);
          padding: 12px 24px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .nex-modal-cancel:hover { background: rgba(255,255,255,0.14); color: #fff; }

        .nex-modal-save {
          background: #fff;
          border: none;
          border-radius: 10px;
          color: #000;
          padding: 12px 28px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .nex-modal-save:hover:not(:disabled) { transform: scale(1.04); }
        .nex-modal-save:disabled { opacity: 0.35; cursor: not-allowed; }

        .nex-modal-track-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #1a1a1a;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .nex-modal-track-preview img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .nex-modal-track-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nex-modal-track-artist { font-size: 13px; color: rgba(255,255,255,0.55); }

        .nex-modal-playlist-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }

        .nex-modal-playlist-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          text-align: left;
        }
        .nex-modal-playlist-item:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }

        .nex-modal-pl-cover { width: 46px; height: 46px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #1a1a1a; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); }
        .nex-modal-pl-cover img { width: 100%; height: 100%; object-fit: cover; }

        .nex-modal-pl-info { flex: 1; min-width: 0; }
        .nex-modal-pl-name { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nex-modal-pl-count { font-size: 12px; color: rgba(255,255,255,0.5); }

        /* ==================== TOAST ==================== */
        .nex-toast {
          position: fixed;
          bottom: 110px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          color: #000;
          padding: 14px 28px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 700;
          z-index: 3000;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1), toast-out 0.3s ease-in 2.2s forwards;
          white-space: nowrap;
        }
        @keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes toast-out { from { opacity: 1; } to { opacity: 0; } }

        /* --- RESPONSIVE --- */
        @media (max-width: 768px) {
          .spotify-sidebar {
            width: min(100%, 340px);
          }
          .spotify-main { margin: 0; min-height: 100vh; height: auto; border-radius: 0; }
          .spotify-header { padding: 84px 16px 20px; flex-direction: column; align-items: stretch; gap: 14px; }
          .spotify-search-bar { max-width: 100%; width: 100%; padding: 12px 14px; gap: 10px; min-width: 0; }
          .spotify-search-input { font-size: 15px; }
          .spotify-search-button { width: 52px; min-width: 52px; }
          .spotify-search-toggle-btn { display: inline-flex; }
          .spotify-services { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: 100%; min-width: 0; }
          .spotify-service-btn { flex: none; width: 100%; min-width: 0; justify-content: center; }
          .spotify-service-btn.live-btn { justify-content: center; }
          .spotify-content { padding: 24px 16px; padding-bottom: 220px; }
          .spotify-grid { grid-template-columns: 1fr; gap: 16px; }
          .spotify-playlists-grid { grid-template-columns: 1fr; gap: 16px; }
          .spotify-results-header { flex-direction: column; align-items: stretch; }
          .spotify-player { padding: 12px 16px; }
          .spotify-player-left { min-width: auto; }
          .spotify-player-cover { width: 48px; height: 48px; }
          .spotify-player-controls { gap: 14px; }
          .spotify-player-btn { font-size: 22px; padding: 6px; }
          .spotify-player-play { width: 40px; height: 40px; }
          .spotify-player-right { min-width: auto; justify-content: space-between; flex-wrap: wrap; }
          .spotify-volume { width: 90px; }
          .spotify-playlist-header { flex-direction: column; align-items: center; text-align: center; }
          .spotify-playlist-hero-cover { width: 140px; height: 140px; }
          .spotify-playlist-hero-title { font-size: 32px; }
          .spotify-autoplay-badge { display: none; }
        }

        @media (max-width: 640px) {
          .spotify-grid { grid-template-columns: 1fr; }
          .spotify-playlists-grid { grid-template-columns: 1fr; }
          .spotify-services { gap: 8px; }
          .spotify-service-btn { width: 100%; }
        }

        @media (max-width: 480px) {
          .spotify-content { padding: 20px 14px; padding-bottom: 220px; }
          .spotify-search-button { padding: 10px 14px; font-size: 12px; }
          .spotify-search-bar { padding: 12px 14px; }
          .spotify-search-input { font-size: 14px; }
          .spotify-results-header { gap: 10px; }
          .spotify-player-progress { gap: 8px; }
          .spotify-time { min-width: 34px; font-size: 11px; }
          .spotify-volume { width: 70px; }
          .spotify-player-info { display: none; }
          .spotify-card-image { max-height: 140px; }
          .spotify-card-image img { aspect-ratio: 16 / 9; }
          .spotify-playlist-hero-cover { width: 120px; height: 120px; }
          .hamburger-btn { top: 14px; left: 14px; }
        }

        /* --- PCN THEME (Easter Egg) --- */
        .pcn-theme { background: #18293e; }
        .pcn-theme .spotify-main,
        .pcn-theme .spotify-sidebar,
        .pcn-theme .spotify-header,
        .pcn-theme .spotify-player,
        .pcn-theme .spotify-sidebar-top,
        .pcn-theme .spotify-library,
        .pcn-theme .spotify-card,
        .pcn-theme .spotify-playlist-card,
        .pcn-theme .lyrics-container,
        .pcn-theme .nex-branding { background: #18293e; }

        .pcn-theme .spotify-search-bar,
        .pcn-theme .spotify-card,
        .pcn-theme .spotify-nav-tab,
        .pcn-theme .spotify-service-btn,
        .pcn-theme .spotify-hero-action-btn,
        .pcn-theme .spotify-sidebar,
        .pcn-theme .spotify-library { border-color: rgba(80,56,189,0.35); }

        .pcn-theme .hamburger-btn { background: #18293e; border-color: rgba(4,244,190,0.35); }

        .pcn-theme .spotify-search-button,
        .pcn-theme .spotify-play-btn,
        .pcn-theme .spotify-play-hero-btn,
        .pcn-theme .spotify-playlist-card-play,
        .pcn-theme .spotify-player-play,
        .pcn-theme .spotify-nav-item.active,
        .pcn-theme .spotify-nav-tab.active,
        .pcn-theme .spotify-service-btn.active,
        .pcn-theme .spotify-btn-icon:hover,
        .pcn-theme .spotify-add-btn:hover,
        .pcn-theme .spotify-playlist-add-btn:hover,
        .pcn-theme .spotify-create-btn,
        .pcn-theme .nex-modal-save { background: #04f4be; color: #18293e; border-color: #04f4be; }

        .pcn-theme .spotify-track-row.active { background: rgba(4,244,190,0.16); }
        .pcn-theme .spotify-track-row:hover { background: rgba(80,56,189,0.18); }
        .pcn-theme .spotify-progress-fill { background: #04f4be; }
        .pcn-theme .spotify-progress-bar::after { background: #04f4be; }
        .pcn-theme .spotify-volume-slider { accent-color: #04f4be; }
        .pcn-theme .spotify-heart-small:hover,
        .pcn-theme .spotify-player-heart:hover,
        .pcn-theme .spotify-player-btn:hover,
        .pcn-theme .spotify-player-btn.active,
        .pcn-theme .spotify-track-btn:hover { color: #04f4be; }
        .pcn-theme .spotify-search-bar:focus-within { border-color: #5038BD; }
        .pcn-theme .spotify-service-btn:hover { border-color: #5038BD; color: #fff; }
        .pcn-theme .spotify-nav-item:hover { background: rgba(80,56,189,0.2); }
        .pcn-theme .spotify-playlist-item:hover { background: rgba(80,56,189,0.15); }
        .pcn-theme .nex-toast { background: #04f4be; color: #18293e; }
        .pcn-theme .shorts-filter-btn.active { background: rgba(4,244,190,0.15); border-color: rgba(4,244,190,0.4); color: #04f4be; }

        .pcn-theme .nex-logo-ring-1 { border-top-color: #04f4be; border-right-color: #5038BD; border-bottom-color: #04f4be; border-left-color: #5038BD; box-shadow: 0 0 20px rgba(4,244,190,0.5); }
        .pcn-theme .nex-logo-ring-2 { border-top-color: #5038BD; border-right-color: #04f4be; border-bottom-color: #5038BD; border-left-color: #04f4be; box-shadow: 0 0 16px rgba(80,56,189,0.5); }
        .pcn-theme .nex-logo-ring-3 { border-top-color: #04f4be; border-right-color: #04f4be; border-bottom-color: #5038BD; border-left-color: #5038BD; box-shadow: 0 0 12px rgba(4,244,190,0.4); }
        .pcn-theme .nex-logo-text, .pcn-theme .nex-title { background: linear-gradient(90deg, #04f4be, #5038BD, #04f4be); -webkit-background-clip: text; background-clip: text; text-shadow: 0 0 30px rgba(4,244,190,0.5); }
      `}</style>
    </div>
  );
};

// --- EXPORT STANDALONE COMPONENT ---
const SpotifyMiniStandaloneWrapper = () => (
  <SpotifyMiniStandaloneProvider>
    <SpotifyMiniStandalone />
  </SpotifyMiniStandaloneProvider>
);

export { SpotifyMiniStandaloneWrapper as SpotifyMiniStandalone };
export { useSpotifyMini };
export default SpotifyMiniStandaloneWrapper;