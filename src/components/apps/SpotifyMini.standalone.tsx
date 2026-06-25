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
  ArrowRight24Filled
} from '@fluentui/react-icons';

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
interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  service: 'youtube' | 'youtube-music' | 'spotify';
  kind?: 'video' | 'playlist';
  videoId?: string;
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
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    localStorage.setItem('spotifyMiniFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('spotifyMiniHistory', JSON.stringify(history));
  }, [history]);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      if (currentTrack) addToQueue(currentTrack);
      playTrack(next);
    }
  }, [queue, currentTrack, playTrack]);

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
        "Proximamente, las letras de la canción estarán disponibles aquí."
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
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isYoutubeApiReady = useRef(false);
  const progressIntervalRef = useRef<number | null>(null);

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
              nextTrack();
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

  const playFromSearch = async (result: any) => {
    if ('service' in result && result.service === 'spotify') {
      // Search YouTube for this song
      try {
        const searchQuery = `${result.title} ${result.artist}`;
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const firstResult = data.results[0];
            const newTrack: Track = {
              id: firstResult.id,
              title: firstResult.title,
              artist: firstResult.channelTitle,
              cover: firstResult.thumbnail,
              url: '',
              service: 'youtube',
              kind: firstResult.kind,
              videoId: firstResult.id,
            };
            playTrack(newTrack);
            return;
          }
        }
      } catch (err) {
        console.error('Error searching YouTube for Spotify track:', err);
      }
    } else {
      const newTrack: Track = {
        id: result.id,
        title: result.title,
        artist: result.channelTitle,
        cover: result.thumbnail,
        url: '',
        service: activeService,
        kind: result.kind,
        videoId: result.id,
      };
      playTrack(newTrack);
    }
  };

  const addTrackToQueue = async (result: any) => {
    if ('service' in result && result.service === 'spotify') {
      // Search YouTube for this song to add to queue
      try {
        const searchQuery = `${result.title} ${result.artist}`;
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const firstResult = data.results[0];
            const newTrack: Track = {
              id: firstResult.id,
              title: firstResult.title,
              artist: firstResult.channelTitle,
              cover: firstResult.thumbnail,
              url: '',
              service: 'youtube',
              kind: firstResult.kind,
              videoId: firstResult.id,
            };
            addToQueue(newTrack);
            return;
          }
        }
      } catch (err) {
        console.error('Error searching YouTube for Spotify track:', err);
      }
    } else {
      const newTrack: Track = {
        id: result.id,
        title: result.title,
        artist: result.channelTitle,
        cover: result.thumbnail,
        url: '',
        service: activeService,
        kind: result.kind,
        videoId: result.id,
      };
      addToQueue(newTrack);
    }
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
          <span className="power-by">Created by Salvador Juarez</span>
        </div>
        {/* --- TOP MENU --- */}
        <div className="spotify-sidebar-top">
          <div className={`spotify-nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <Search24Regular />
            <span>Buscar</span>
          </div>
          <div className={`spotify-nav-item ${activeTab === 'playlist' ? 'active' : ''}`} onClick={() => setActiveTab('playlist')}>
            <Home24Filled />
            <span>Playlist</span>
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
              <button className="spotify-btn-icon" title="Crear">
                <Add24Filled />
              </button>
            </div>
          </div>

          {/* --- NAV TABS --- */}
          <div className="spotify-nav-tabs">
            <button 
              className={`spotify-nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <Heart24Filled />
            </button>
            <button 
              className={`spotify-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History24Regular />
            </button>
            <button 
              className={`spotify-nav-tab ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              <List24Regular />
            </button>
          </div>

          {/* --- LIBRARY CONTENT --- */}
          <div className="spotify-library-content">
            {/* --- PLAYLIST ITEMS --- */}
            <div className="spotify-playlist-item" onClick={() => setActiveTab('playlist')}>
              <div className="spotify-playlist-cover">
                <MusicNote224Filled />
              </div>
              <div className="spotify-playlist-info">
                <div className="spotify-playlist-name">Playlist NEX</div>
                <div className="spotify-playlist-desc">Playlist · Tú</div>
              </div>
            </div>

            <div className="spotify-playlist-item" onClick={() => setActiveTab('favorites')}>
              <div className="spotify-playlist-cover spotify-cover-liked">
                <Heart24Filled />
              </div>
              <div className="spotify-playlist-info">
                <div className="spotify-playlist-name">Me gusta</div>
                <div className="spotify-playlist-desc">Playlist · {favorites.length} canciones</div>
              </div>
            </div>

            {/* --- HISTORY ITEM --- */}
            <div className="spotify-playlist-item" onClick={() => setActiveTab('history')}>
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

          {/* --- PLAYLIST TAB --- */}
          {activeTab === 'playlist' && (
            <div className="spotify-list-view">
              {currentTrack && (
                <div className="spotify-playlist-header">
                  <div className="spotify-playlist-hero-cover">
                    <img src={currentTrack.cover} alt="" className="spotify-hero-image" />
                  </div>
                  <div className="spotify-playlist-hero-info">
                    <div className="spotify-playlist-hero-type">Playlist</div>
                    <h1 className="spotify-playlist-hero-title">Playlist NEX</h1>
                    <p className="spotify-playlist-hero-desc">Tu música favorita</p>
                    <div className="spotify-playlist-hero-actions">
                      <button 
                        className="spotify-play-hero-btn"
                        onClick={handleTogglePlay}
                      >
                        {isPlaying ? <Pause24Filled /> : <Play24Filled />}
                      </button>
                      <button 
                        className={`spotify-heart-btn ${currentTrack && isFavorite(currentTrack.id) ? 'active' : ''} ${currentTrack && bumpHeartId === currentTrack.id ? 'heart-bump' : ''}`}
                        onClick={() => currentTrack && handleHeartClick(currentTrack)}
                      >
                        {currentTrack && isFavorite(currentTrack.id) ? <Heart24Filled /> : <Heart24Regular />}
                      </button>
                      <button 
                        className={`spotify-lyrics-btn ${showLyrics ? 'active' : ''}`}
                        onClick={() => setShowLyrics(!showLyrics)}
                      >
                        <Book24Regular />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- LYRICS DISPLAY --- */}
              {showLyrics && currentTrack && <LyricsDisplay />}

              <div className="spotify-track-list">
                {!currentTrack && (
                  <div className="spotify-empty">
                    <MusicNote224Filled />
                    <p>Tu playlist está vacía. Buscá una canción y dale play para empezar.</p>
                  </div>
                )}
              </div>
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
            >
              {isFavorite(currentTrack.id) ? <Heart24Filled /> : <Heart24Regular />}
            </button>
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

      {/* --- GLOBAL STYLES --- */}
      <style>{`
        * {
          box-sizing: border-box;
        }

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
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .hamburger-btn:hover {
          background: #1e1e1e;
          border-color: rgba(255, 255, 255, 0.25);
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
          background: rgba(0, 0, 0, 0.7);
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
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 50;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.6);
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
          border: 1px solid rgba(255, 255, 255, 0.06);
          margin-top: 76px;
        }

        .spotify-nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 12px 14px;
          border-radius: 8px;
        }

        .spotify-nav-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
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
          border: 1px solid rgba(255, 255, 255, 0.06);
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

        /* --- MAIN CONTENT --- */
        .spotify-main {
          margin-left: 0;
          margin-right: 0;
          margin-top: 0;
          margin-bottom: 0;
          height: 100vh;
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
          border-color: rgba(255, 255, 255, 0.4);
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

        .spotify-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          padding-bottom: 140px;
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
          transform: translateY(0) scale(1);
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
        }

        .spotify-list-header p {
          color: rgba(255,255,255,0.55);
          font-size: 14px;
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
          color: #fff;
        }

        .spotify-track-artist {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-track-time {
          display: flex;
          align-items: center;
          gap: 16px;
          color: rgba(255,255,255,0.55);
          font-size: 14px;
        }

        .spotify-track-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 22px;
          padding: 6px;
          transition: color 0.15s;
          border-radius: 8px;
        }

        .spotify-track-btn:hover {
          color: #fff;
        }

        .spotify-heart-small {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 6px;
          font-size: 18px;
          transition: all 0.15s;
        }

        .spotify-heart-small:hover {
          color: #fff;
          transform: scale(1.1);
        }

        .heart-bump {
          animation: heart-bump-anim 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes heart-bump-anim {
          0% { transform: scale(1); }
          35% { transform: scale(1.45); }
          60% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        .spotify-playlist-header {
          display: flex;
          gap: 32px;
          margin-bottom: 32px;
        }

        .spotify-playlist-hero-cover {
          width: 220px;
          height: 220px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 16px 50px rgba(0,0,0,0.6);
        }

        .spotify-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .spotify-playlist-hero-info {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 8px;
        }

        .spotify-playlist-hero-type {
          color: rgba(255,255,255,0.6);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .spotify-playlist-hero-title {
          font-size: 44px;
          font-weight: 900;
          margin: 0;
          color: #fff;
        }

        .spotify-playlist-hero-desc {
          color: rgba(255,255,255,0.6);
          font-size: 15px;
        }

        .spotify-playlist-hero-actions {
          display: flex;
          gap: 14px;
          margin-top: 20px;
          align-items: center;
        }

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

        .spotify-play-hero-btn:hover {
          transform: scale(1.08);
        }

        .spotify-heart-btn,
        .spotify-lyrics-btn {
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

        .spotify-heart-btn:hover,
        .spotify-lyrics-btn:hover {
          border-color: #fff;
        }

        .spotify-heart-btn.active {
          background: #fff;
          color: #000;
        }

        .spotify-lyrics-btn.active {
          background: #fff;
          color: #000;
        }

        .lyrics-container {
          background: #0d0d0d;
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 32px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .lyrics-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-weight: 700;
          font-size: 16px;
          color: #fff;
        }

        .lyrics-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lyrics-section {
          color: rgba(255,255,255,0.75);
          font-weight: 700;
          font-size: 14px;
          margin-top: 14px;
        }

        .lyrics-line {
          color: rgba(255,255,255,0.55);
          font-size: 15px;
          line-height: 1.6;
        }

        /* --- NEX MUSIC BRANDING (colorful, by design) --- */
        .nex-branding {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 16px 16px;
          background: #0d0d0d;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
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

        .nex-logo-ring-1 {
          width: 84px;
          height: 84px;
          border-top-color: #ff0080;
          border-right-color: #00ffff;
          border-bottom-color: #80ff00;
          border-left-color: #ff00ff;
          box-shadow: 0 0 20px rgba(255, 0, 128, 0.5);
        }

        .nex-logo-ring-2 {
          width: 66px;
          height: 66px;
          border-top-color: #00ff80;
          border-right-color: #ff8000;
          border-bottom-color: #8000ff;
          border-left-color: #0080ff;
          animation-direction: reverse;
          animation-duration: 6s;
          box-shadow: 0 0 16px rgba(0, 255, 128, 0.4);
        }

        .nex-logo-ring-3 {
          width: 48px;
          height: 48px;
          border-top-color: #ff0000;
          border-right-color: #00ff00;
          border-bottom-color: #0000ff;
          border-left-color: #ffff00;
          animation-duration: 4s;
          box-shadow: 0 0 12px rgba(255, 255, 0, 0.4);
        }

        .nex-logo-text {
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(90deg, #ff0080, #00ffff, #80ff00, #ff00ff, #ff0080);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 2px;
          z-index: 10;
          text-shadow: 0 0 30px rgba(255, 0, 128, 0.6);
          background-size: 200% 100%;
          animation: text-rgb 4s linear infinite;
        }

        @keyframes text-rgb {
          from { background-position: 0% 50%; }
          to { background-position: 200% 50%; }
        }

        .nex-logo-animate {
          animation: nex-bounce 0.6s ease-in-out;
        }

        .nex-logo-pulse {
          animation: nex-pulse 0.6s ease-in-out infinite;
        }

        .nex-logo-pulse .nex-logo-ring-1 {
          animation: nex-ring-rotate 2s linear infinite, nex-ring-color-1 0.6s ease-in-out infinite alternate;
        }

        .nex-logo-pulse .nex-logo-ring-2 {
          animation: nex-ring-rotate-reverse 1.5s linear infinite, nex-ring-color-2 0.6s ease-in-out infinite alternate;
        }

        .nex-logo-pulse .nex-logo-ring-3 {
          animation: nex-ring-rotate 1s linear infinite, nex-ring-color-3 0.6s ease-in-out infinite alternate;
        }

        @keyframes nex-ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes nex-ring-rotate-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes nex-ring-color-1 {
          0% {
            border-top-color: #ff0080;
            border-right-color: #00ffff;
            border-bottom-color: #80ff00;
            border-left-color: #ff00ff;
            box-shadow: 0 0 20px rgba(255, 0, 128, 0.5);
          }
          100% {
            border-top-color: #00ffff;
            border-right-color: #80ff00;
            border-bottom-color: #ff00ff;
            border-left-color: #ff0080;
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.8);
          }
        }

        @keyframes nex-ring-color-2 {
          0% {
            border-top-color: #00ff80;
            border-right-color: #ff8000;
            border-bottom-color: #8000ff;
            border-left-color: #0080ff;
            box-shadow: 0 0 16px rgba(0, 255, 128, 0.4);
          }
          100% {
            border-top-color: #ff8000;
            border-right-color: #8000ff;
            border-bottom-color: #0080ff;
            border-left-color: #00ff80;
            box-shadow: 0 0 32px rgba(255, 128, 0, 0.7);
          }
        }

        @keyframes nex-ring-color-3 {
          0% {
            border-top-color: #ff0000;
            border-right-color: #00ff00;
            border-bottom-color: #0000ff;
            border-left-color: #ffff00;
            box-shadow: 0 0 12px rgba(255, 255, 0, 0.4);
          }
          100% {
            border-top-color: #00ff00;
            border-right-color: #0000ff;
            border-bottom-color: #ffff00;
            border-left-color: #ff0000;
            box-shadow: 0 0 24px rgba(0, 255, 0, 0.6);
          }
        }

        @keyframes nex-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }

        @keyframes nex-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

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

        .power-by {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 600;
        }

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

        .spotify-player-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 240px;
        }

        .spotify-player-cover {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .spotify-player-info {
          min-width: 0;
        }

        .spotify-player-title {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-player-artist {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-player-heart {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          padding: 8px;
          font-size: 22px;
          transition: all 0.15s;
          border-radius: 50%;
        }

        .spotify-player-heart:hover {
          color: #fff;
          transform: scale(1.1);
        }

        .spotify-player-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          flex: 1;
          max-width: 720px;
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
          font-size: 24px;
          transition: all 0.15s;
          border-radius: 50%;
        }

        .spotify-player-btn:hover {
          color: #fff;
          transform: scale(1.08);
        }

        .spotify-player-btn.active {
          color: #fff;
        }

        .spotify-player-play {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #fff;
          border: none;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .spotify-player-play:hover {
          transform: scale(1.06);
        }

        .spotify-player-progress {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
        }

        .spotify-time {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          min-width: 40px;
          text-align: center;
          font-weight: 600;
        }

        .spotify-progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          overflow: visible;
          transition: height 0.15s;
        }

        .spotify-progress-bar:hover {
          height: 8px;
        }

        .spotify-progress-fill {
          height: 100%;
          background: #fff;
          border-radius: 4px;
          position: relative;
          transition: width 0.1s linear;
        }

        .spotify-progress-bar::after {
          content: '';
          position: absolute;
          left: calc(var(--progress, 0) - 6px);
          top: 50%;
          transform: translateY(-50%) scale(0);
          width: 13px;
          height: 13px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          transition: transform 0.15s ease;
        }

        .spotify-progress-bar:hover::after {
          transform: translateY(-50%) scale(1);
        }

        .spotify-player-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 18px;
          min-width: 240px;
        }

        .spotify-volume {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 130px;
          color: rgba(255,255,255,0.6);
        }

        .spotify-volume-slider {
          width: 100%;
          accent-color: #fff;
          cursor: pointer;
          height: 6px;
        }

        /* --- RESPONSIVE STYLES --- */
        @media (max-width: 768px) {
          .spotify-main {
            margin: 0;
            height: 100vh;
            border-radius: 0;
          }

          .spotify-header {
            padding: 84px 20px 20px;
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }

          .spotify-search-bar {
            max-width: 100%;
          }

          .spotify-services {
            justify-content: flex-start;
          }

          .spotify-content {
            padding: 24px 20px;
            padding-bottom: 180px;
          }

          .spotify-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .spotify-player {
            padding: 12px 16px;
          }

          .spotify-player-left {
            min-width: auto;
          }

          .spotify-player-cover {
            width: 48px;
            height: 48px;
          }

          .spotify-player-controls {
            gap: 14px;
          }

          .spotify-player-btn {
            font-size: 22px;
            padding: 6px;
          }

          .spotify-player-play {
            width: 40px;
            height: 40px;
          }

          .spotify-player-right {
            min-width: auto;
          }

          .spotify-volume {
            width: 90px;
          }

          .spotify-playlist-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .spotify-playlist-hero-cover {
            width: 180px;
            height: 180px;
          }

          .spotify-playlist-hero-title {
            font-size: 32px;
          }
        }

        @media (max-width: 480px) {
          .spotify-grid {
            grid-template-columns: 1fr;
          }

          .spotify-search-button {
            padding: 10px 14px;
            font-size: 12px;
          }

          .spotify-player-progress {
            gap: 8px;
          }

          .spotify-time {
            min-width: 34px;
            font-size: 11px;
          }

          .spotify-volume {
            width: 70px;
          }

          .spotify-player-info {
            display: none;
          }

          .hamburger-btn {
            top: 16px;
            left: 16px;
          }
        }

        /* --- PCN THEME (easter egg: type "PCN" in the search bar) --- */
        .pcn-theme {
          background: #18293e;
        }

        .pcn-theme .spotify-main,
        .pcn-theme .spotify-sidebar,
        .pcn-theme .spotify-header,
        .pcn-theme .spotify-player,
        .pcn-theme .spotify-sidebar-top,
        .pcn-theme .spotify-library,
        .pcn-theme .spotify-card,
        .pcn-theme .lyrics-container,
        .pcn-theme .nex-branding {
          background: #18293e;
        }

        .pcn-theme .spotify-search-bar,
        .pcn-theme .spotify-card,
        .pcn-theme .spotify-nav-tab,
        .pcn-theme .spotify-service-btn,
        .pcn-theme .spotify-heart-btn,
        .pcn-theme .spotify-lyrics-btn,
        .pcn-theme .spotify-sidebar,
        .pcn-theme .spotify-library,
        .pcn-theme .spotify-library-header ~ .spotify-nav-tabs .spotify-nav-tab {
          border-color: rgba(80, 56, 189, 0.35);
        }

        .pcn-theme .hamburger-btn {
          background: #18293e;
          border-color: rgba(4, 244, 190, 0.35);
        }

        .pcn-theme .spotify-search-button,
        .pcn-theme .spotify-play-btn,
        .pcn-theme .spotify-play-hero-btn,
        .pcn-theme .spotify-player-play,
        .pcn-theme .spotify-nav-item.active,
        .pcn-theme .spotify-nav-tab.active,
        .pcn-theme .spotify-service-btn.active,
        .pcn-theme .spotify-heart-btn.active,
        .pcn-theme .spotify-lyrics-btn.active,
        .pcn-theme .spotify-btn-icon:hover,
        .pcn-theme .spotify-add-btn:hover {
          background: #04f4be;
          color: #18293e;
          border-color: #04f4be;
        }

        .pcn-theme .spotify-track-row.active {
          background: rgba(4, 244, 190, 0.16);
        }

        .pcn-theme .spotify-track-row:hover {
          background: rgba(80, 56, 189, 0.18);
        }

        .pcn-theme .spotify-progress-fill {
          background: #04f4be;
        }

        .pcn-theme .spotify-progress-bar::after {
          background: #04f4be;
        }

        .pcn-theme .spotify-volume-slider {
          accent-color: #04f4be;
        }

        .pcn-theme .spotify-heart-small:hover,
        .pcn-theme .spotify-player-heart:hover,
        .pcn-theme .spotify-player-btn:hover,
        .pcn-theme .spotify-player-btn.active,
        .pcn-theme .spotify-track-btn:hover {
          color: #04f4be;
        }

        .pcn-theme .spotify-search-bar:focus-within {
          border-color: #5038BD;
        }

        .pcn-theme .spotify-service-btn:hover {
          border-color: #5038BD;
          color: #fff;
        }

        .pcn-theme .spotify-nav-item:hover {
          background: rgba(80, 56, 189, 0.2);
        }

        .pcn-theme .spotify-playlist-item:hover {
          background: rgba(80, 56, 189, 0.15);
        }

        .pcn-theme .nex-logo-ring-1 {
          border-top-color: #04f4be;
          border-right-color: #5038BD;
          border-bottom-color: #04f4be;
          border-left-color: #5038BD;
          box-shadow: 0 0 20px rgba(4, 244, 190, 0.5);
        }

        .pcn-theme .nex-logo-ring-2 {
          border-top-color: #5038BD;
          border-right-color: #04f4be;
          border-bottom-color: #5038BD;
          border-left-color: #04f4be;
          box-shadow: 0 0 16px rgba(80, 56, 189, 0.5);
        }

        .pcn-theme .nex-logo-ring-3 {
          border-top-color: #04f4be;
          border-right-color: #04f4be;
          border-bottom-color: #5038BD;
          border-left-color: #5038BD;
          box-shadow: 0 0 12px rgba(4, 244, 190, 0.4);
        }

        .pcn-theme .nex-logo-text,
        .pcn-theme .nex-title {
          background: linear-gradient(90deg, #04f4be, #5038BD, #04f4be);
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow: 0 0 30px rgba(4, 244, 190, 0.5);
        }
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