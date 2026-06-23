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
} from '@fluentui/react-icons';

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

// --- DEFAULT PLAYLIST ---
const defaultPlaylist: Track[] = [
  {
    id: 'dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    cover: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    url: '',
    service: 'youtube',
  },
  {
    id: '1',
    title: 'Sin un peso',
    artist: 'Nafta',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
    url: '',
    service: 'spotify',
  },
];

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
        "🎵 [Verso 1]",
        "Caminando por la ciudad de noche",
        "Buscando un lugar para pertenecer",
        "Cada farola es una guía",
        "Llevándome a donde pertenezco",
        "",
        "🎶 [Coro]",
        "Esta es nuestra canción, nuestra melodía",
        "Tocando en la clave de la vida",
        "Juntos podemos hacer que todo salga bien",
        "Este es nuestro momento, nuestra noche",
        "",
        "🎵 [Verso 2]",
        "Mirando el océano",
        "Esperando el amanecer",
        "Todo parece nuevo y esperanzador",
        "Bajo los cielos estrellados",
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoAnimating, setLogoAnimating] = useState(false);
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
    initPlayer();
  }, [currentTrack]);

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

  const playFromSearch = (result: any) => {
    if (activeService === 'spotify') {
      const newTrack: Track = {
        id: result.id,
        title: result.title,
        artist: result.artist,
        cover: result.cover,
        url: result.url,
        service: 'spotify',
      };
      playTrack(newTrack);
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

  const addTrackToQueue = (result: any) => {
    if (activeService === 'spotify') {
      const newTrack: Track = {
        id: result.id,
        title: result.title,
        artist: result.artist,
        cover: result.cover,
        url: result.url,
        service: 'spotify',
      };
      addToQueue(newTrack);
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
    <div className="spotify-root">
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
      {/* --- LEFT SIDEBAR --- */}
      <div className="spotify-sidebar">
        {/* --- NEX MUSIC BRANDING --- */}
        <div className="nex-branding">
          <div 
            className={`nex-logo ${logoAnimating ? 'nex-logo-animate' : ''} ${isPlaying ? 'nex-logo-pulse' : ''}`}
            onClick={handleLogoClick}
          >
            <div className="nex-logo-ring nex-logo-ring-1"></div>
            <div className="nex-logo-ring nex-logo-ring-2"></div>
            <div className="nex-logo-ring nex-logo-ring-3"></div>
            <span className="nex-logo-text">NXM</span>
          </div>
          <h1 className="nex-title">NEX MUSIC</h1>
          <span className="power-by">Created by Salvador Juarez</span>
        </div>
        {/* --- TOP MENU --- */}
        <div className="spotify-sidebar-top">
          <div className="spotify-nav-item active">
            <Home24Filled />
            <span>Inicio</span>
          </div>
          <div className="spotify-nav-item" onClick={() => setActiveTab('search')}>
            <Search24Regular />
            <span>Buscar</span>
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
              className={`spotify-nav-tab ${activeTab === 'playlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('playlist')}
            >
              <List24Regular />
            </button>
            <button 
              className={`spotify-nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <Star24Regular />
            </button>
            <button 
              className={`spotify-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History24Regular />
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
              placeholder="¿Qué quieres escuchar? (ej: Tiësto, KSHMR, Afrojack, Tujamo, Don Diablo, Nicky Romero | Spinnin' Records Classic Hits Mix)"
              className="spotify-search-input"
            />
            <button
              className="spotify-search-button"
              onClick={() => runSearch(query)}
              disabled={!query.trim() || loading}
            >
              Buscar
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
                  <p>Escribe algo en la barra de búsqueda y haz clic en "Buscar" para empezar</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Ejemplo: Tiësto, KSHMR, Afrojack, Tujamo, Don Diablo, Nicky Romero | Spinnin' Records Classic Hits Mix</p>
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
                        className={`spotify-heart-btn ${currentTrack && isFavorite(currentTrack.id) ? 'active' : ''}`}
                        onClick={() => currentTrack && toggleFavorite(currentTrack)}
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

              <div className="spotify-track-list-header">
                <span className="spotify-track-num">#</span>
                <span className="spotify-track-name">Título</span>
                <span className="spotify-track-album">Artista</span>
                <span className="spotify-track-time">
                  <List24Regular />
                </span>
              </div>

              <div className="spotify-track-list">
                {defaultPlaylist.map((track, index) => (
                  <div 
                    key={track.id} 
                    className={`spotify-track-row ${currentTrack?.id === track.id ? 'active' : ''}`} 
                    onClick={() => playTrack(track)}
                  >
                    <div className="spotify-track-num">{index + 1}</div>
                    <div className="spotify-track-cover">
                      <img src={track.cover} alt={track.title} />
                      {currentTrack?.id === track.id && isPlaying ? (
                        <div className="spotify-play-indicator">
                          <span></span><span></span><span></span>
                        </div>
                      ) : (
                        <Play24Filled className="spotify-track-play-icon" />
                      )}
                    </div>
                    <div className="spotify-track-main">
                      <div className="spotify-track-title">{track.title}</div>
                      <div className="spotify-track-artist">{track.artist}</div>
                    </div>
                    <div className="spotify-track-album">{track.service === 'spotify' ? 'Spotify' : 'YouTube'}</div>
                    <div className="spotify-track-time">
                      <button 
                        className="spotify-heart-small"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
                      >
                        {isFavorite(track.id) ? <Heart24Filled /> : <Heart24Regular />}
                      </button>
                    </div>
                  </div>
                ))}
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
                    <div className="spotify-track-num">{index + 1}</div>
                    <div className="spotify-track-cover">
                      <img src={track.cover} alt={track.title} />
                    </div>
                    <div className="spotify-track-main">
                      <div className="spotify-track-title">{track.title}</div>
                      <div className="spotify-track-artist">{track.artist}</div>
                    </div>
                    <button 
                      className="spotify-heart-small"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
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
                    <div className="spotify-track-num">{index + 1}</div>
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
              className="spotify-player-heart"
              onClick={() => toggleFavorite(currentTrack)}
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
              <div className="spotify-progress-bar" onClick={handleSeek}>
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
          background: #000000;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #fff;
          overflow: hidden;
          position: relative;
        }

        /* RGB Ambient Glow Background */
        .spotify-root::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 20% 80%, rgba(255, 0, 128, 0.08) 0%, transparent 40%),
                      radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.08) 0%, transparent 40%),
                      radial-gradient(circle at 40% 40%, rgba(128, 255, 0, 0.05) 0%, transparent 50%);
          z-index: 0;
          pointer-events: none;
          animation: rgb-glow 8s ease-in-out infinite;
        }

        @keyframes rgb-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
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

        /* --- NEX MUSIC BRANDING --- */
        .nex-branding {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 12px;
          background: rgba(10, 10, 10, 0.9);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .nex-branding::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(135deg, #ff0080, #00ffff, #80ff00, #ff00ff);
          z-index: -1;
          border-radius: 13px;
          opacity: 0.3;
          animation: border-glow 3s linear infinite;
        }

        @keyframes border-glow {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(180deg); }
        }

        .nex-logo {
          position: relative;
          width: 90px;
          height: 90px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .nex-logo-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
          animation: nex-ring-rotate 8s linear infinite;
        }

        .nex-logo-ring-1 {
          width: 90px;
          height: 90px;
          border-top-color: #ff0080;
          border-right-color: #00ffff;
          border-bottom-color: #80ff00;
          border-left-color: #ff00ff;
          box-shadow: 0 0 15px rgba(255, 0, 128, 0.4);
        }

        .nex-logo-ring-2 {
          width: 70px;
          height: 70px;
          border-top-color: #00ff80;
          border-right-color: #ff8000;
          border-bottom-color: #8000ff;
          border-left-color: #0080ff;
          animation-direction: reverse;
          animation-duration: 6s;
          box-shadow: 0 0 12px rgba(0, 255, 128, 0.3);
        }

        .nex-logo-ring-3 {
          width: 50px;
          height: 50px;
          border-top-color: #ff0000;
          border-right-color: #00ff00;
          border-bottom-color: #0000ff;
          border-left-color: #ffff00;
          animation-duration: 4s;
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
        }

        .nex-logo-text {
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(90deg, #ff0080, #00ffff, #80ff00, #ff00ff, #ff0080);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 3px;
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
          animation: nex-pulse 2s ease-in-out infinite;
        }

        @keyframes nex-ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes nex-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }

        @keyframes nex-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .nex-title {
          font-size: 28px;
          font-weight: 900;
          margin: 0 0 8px 0;
          background: linear-gradient(90deg, #ff0080, #00ffff, #80ff00, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 4px;
          background-size: 200% 100%;
          animation: text-rgb 5s linear infinite;
        }

        .power-by {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 2px;
          margin-top: 4px;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* --- SIDEBAR --- */
        .spotify-sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: #050505;
          height: calc(100% - 90px);
          width: 420px;
          position: fixed;
          left: 0;
          top: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.03);
          z-index: 1;
        }

        .spotify-sidebar-top {
          background: rgba(15, 15, 15, 0.8);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .spotify-nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 12px 16px;
          border-radius: 12px;
        }

        .spotify-nav-item:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.03);
        }

        .spotify-nav-item.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(255,0,128,0.15), rgba(0,255,255,0.1), rgba(128,255,0,0.15));
          box-shadow: 0 0 20px rgba(255,0,128,0.1);
        }

        .spotify-library {
          background: rgba(15, 15, 15, 0.8);
          border-radius: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
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
          color: rgba(255,255,255,0.6);
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: color 0.3s;
        }

        .spotify-library-title:hover {
          color: rgba(255,255,255,0.9);
        }

        .spotify-btn-icon {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 10px;
          border-radius: 10px;
          transition: all 0.3s;
        }

        .spotify-btn-icon:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.05);
        }

        .spotify-nav-tabs {
          display: flex;
          gap: 10px;
          padding: 0 20px 10px;
        }

        .spotify-nav-tab {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          color: rgba(255,255,255,0.7);
          padding: 10px 18px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .spotify-nav-tab:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }

        .spotify-nav-tab.active {
          background: linear-gradient(135deg, rgba(255,0,128,0.3), rgba(0,255,255,0.25));
          color: #fff;
          border-color: rgba(255,0,128,0.4);
          box-shadow: 0 4px 20px rgba(255,0,128,0.25);
        }

        .spotify-library-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .spotify-playlist-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }

        .spotify-playlist-item:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.05);
          transform: translateX(4px);
        }

        .spotify-playlist-cover {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .spotify-playlist-cover::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 13px;
          background: linear-gradient(135deg, #ff0080, #00ffff, #80ff00);
          z-index: -1;
          opacity: 0.5;
        }

        .spotify-cover-liked::before {
          background: linear-gradient(135deg, #8000ff, #ff00ff, #ff0080);
        }

        .spotify-cover-history::before {
          background: linear-gradient(135deg, #00ffff, #00ff80, #80ff00);
        }

        .spotify-playlist-info {
          flex: 1;
          min-width: 0;
        }

        .spotify-playlist-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 3px;
        }

        .spotify-playlist-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        /* --- MAIN CONTENT --- */
        .spotify-main {
          margin-left: 436px;
          height: calc(100% - 90px);
          background: rgba(5,5,5,0.8);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 16px;
          margin-right: 12px;
          margin-top: 12px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          z-index: 1;
          backdrop-filter: blur(20px);
        }

        .spotify-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 32px;
          background: rgba(10,10,10,0.6);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .spotify-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(20,20,20,0.9);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50px;
          padding: 12px 20px;
          flex: 1;
          max-width: 450px;
          transition: all 0.3s;
        }

        .spotify-search-bar:focus-within {
          border-color: rgba(255,0,128,0.4);
          box-shadow: 0 0 20px rgba(255,0,128,0.15);
        }

        .spotify-search-icon {
          color: rgba(255,255,255,0.5);
        }

        .spotify-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .spotify-search-input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        .spotify-search-button {
          background: linear-gradient(135deg, #ff0080, #00ffff);
          border: none;
          border-radius: 50px;
          color: #000;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .spotify-search-button:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(255,0,128,0.4);
        }

        .spotify-search-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spotify-services {
          display: flex;
          gap: 10px;
        }

        .spotify-service-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          color: rgba(255,255,255,0.7);
          padding: 10px 24px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .spotify-service-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.15);
        }

        .spotify-service-btn.active {
          background: linear-gradient(135deg, rgba(255,0,128,0.3), rgba(0,255,255,0.25));
          color: #fff;
          border-color: rgba(255,0,128,0.4);
          box-shadow: 0 4px 20px rgba(255,0,128,0.25);
        }

        .spotify-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        /* --- SEARCH RESULTS --- */
        .spotify-search-results h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          background: linear-gradient(90deg, #ff0080, #00ffff, #80ff00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .spotify-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px;
          color: rgba(255,255,255,0.5);
        }

        .spotify-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #ff0080;
          border-right-color: #00ffff;
          border-bottom-color: #80ff00;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spotify-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 24px;
        }

        .spotify-card {
          background: rgba(20,20,20,0.6);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .spotify-card:hover {
          background: rgba(30,30,30,0.8);
          border-color: rgba(255,0,128,0.2);
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(255,0,128,0.1);
        }

        .spotify-card-image {
          position: relative;
          margin-bottom: 16px;
          border-radius: 10px;
          overflow: hidden;
        }

        .spotify-card-image img {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 10px;
          object-fit: cover;
        }

        .spotify-play-btn {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff0080, #00ffff);
          border: none;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(10px) scale(0.9);
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 8px 25px rgba(255,0,128,0.4);
        }

        .spotify-card:hover .spotify-play-btn {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .spotify-card-info {
          margin-bottom: 4px;
        }

        .spotify-card-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .spotify-card-artist {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
        }

        .spotify-add-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 6px;
          opacity: 0;
          transition: all 0.3s;
        }

        .spotify-card:hover .spotify-add-btn {
          opacity: 1;
        }

        .spotify-add-btn:hover {
          color: white;
          transform: scale(1.2);
        }

        /* --- LIST VIEW --- */
        .spotify-list-view {
          width: 100%;
        }

        .spotify-list-header {
          margin-bottom: 24px;
        }

        .spotify-list-header h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .spotify-list-header p {
          color: #b3b3b3;
          font-size: 14px;
        }

        .spotify-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 80px;
          color: #b3b3b3;
        }

        .spotify-empty svg {
          font-size: 48px;
          opacity: 0.5;
        }

        /* --- PLAYLIST HEADER --- */
        .spotify-playlist-header {
          display: flex;
          gap: 24px;
          padding: 48px 0 32px;
          background: linear-gradient(180deg, rgba(83, 83, 83, 0.5) 0%, transparent 100%);
          margin: 0 -32px;
          padding-left: 32px;
          padding-right: 32px;
        }

        .spotify-playlist-hero-cover {
          width: 232px;
          height: 232px;
          flex-shrink: 0;
        }

        .spotify-iframe {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }

        .spotify-hero-image {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          object-fit: cover;
        }

        .spotify-playlist-hero-info {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .spotify-playlist-hero-type {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .spotify-playlist-hero-title {
          font-size: 96px;
          font-weight: 900;
          margin: 0 0 8px;
          line-height: 1;
        }

        .spotify-playlist-hero-desc {
          color: #b3b3b3;
          margin-bottom: 24px;
        }

        .spotify-playlist-hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .spotify-play-hero-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #1fdf64;
          border: none;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .spotify-play-hero-btn:hover {
          transform: scale(1.06);
        }

        .spotify-heart-btn,
        .spotify-lyrics-btn {
          background: transparent;
          border: none;
          color: #b3b3b3;
          cursor: pointer;
          padding: 8px;
          font-size: 32px;
          transition: all 0.2s;
        }

        .spotify-heart-btn:hover,
        .spotify-lyrics-btn:hover,
        .spotify-heart-btn.active,
        .spotify-lyrics-btn.active {
          color: #1fdf64;
        }

        /* --- LYRICS --- */
        .lyrics-container {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .lyrics-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #1fdf64;
        }

        .lyrics-content {
          max-height: 400px;
          overflow-y: auto;
        }

        .lyrics-section {
          font-size: 16px;
          color: #b3b3b3;
          margin: 16px 0 8px;
          font-weight: 700;
        }

        .lyrics-line {
          font-size: 15px;
          color: #fff;
          margin: 4px 0;
        }

        /* --- TRACK LIST --- */
        .spotify-track-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spotify-track-list-header {
          display: grid;
          grid-template-columns: 40px 1fr 200px 80px;
          gap: 16px;
          padding: 0 16px;
          margin-bottom: 8px;
          color: #b3b3b3;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .spotify-track-row {
          display: grid;
          grid-template-columns: 40px 1fr 200px 80px;
          gap: 16px;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
          align-items: center;
        }

        .spotify-track-row:hover {
          background: rgba(255,255,255,0.05);
        }

        .spotify-track-row.active {
          background: rgba(255,255,255,0.08);
        }

        .spotify-track-num {
          color: #b3b3b3;
          font-weight: 600;
          text-align: center;
        }

        .spotify-track-cover {
          width: 40px;
          height: 40px;
          border-radius: 4px;
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
          color: #fff;
          opacity: 0;
          transition: opacity 0.2s;
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
          gap: 2px;
          align-items: flex-end;
          height: 16px;
        }

        .spotify-play-indicator span {
          width: 3px;
          background: #1fdf64;
          animation: playing 0.5s ease-in-out infinite;
          animation-iteration-count: infinite;
        }

        .spotify-play-indicator span:nth-child(1) { animation-delay: 0s; height: 6px; }
        .spotify-play-indicator span:nth-child(2) { animation-delay: 0.15s; height: 12px; }
        .spotify-play-indicator span:nth-child(3) { animation-delay: 0.3s; height: 8px; }

        @keyframes playing {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }

        .spotify-track-main {
          min-width: 0;
        }

        .spotify-track-title {
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-track-artist {
          font-size: 14px;
          color: #b3b3b3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-track-album {
          font-size: 14px;
          color: #b3b3b3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-track-time {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .spotify-track-btn,
        .spotify-heart-small {
          background: transparent;
          border: none;
          color: #b3b3b3;
          cursor: pointer;
          padding: 8px;
          font-size: 20px;
          transition: all 0.2s;
        }

        .spotify-track-btn:hover,
        .spotify-heart-small:hover {
          color: #fff;
        }

        /* --- PLAYER BAR --- */
        .spotify-player {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(18, 18, 18, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          padding: 16px 24px;
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 16px;
          align-items: center;
          z-index: 100;
        }

        .spotify-player-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .spotify-player-cover {
          width: 56px;
          height: 56px;
          border-radius: 4px;
          object-fit: cover;
        }

        .spotify-player-info {
          min-width: 0;
        }

        .spotify-player-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-player-artist {
          font-size: 12px;
          color: #b3b3b3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotify-player-heart {
          background: transparent;
          border: none;
          color: #b3b3b3;
          cursor: pointer;
          padding: 8px;
          font-size: 24px;
          transition: all 0.2s;
        }

        .spotify-player-heart:hover {
          color: #1fdf64;
          transform: scale(1.1);
        }

        .spotify-player-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .spotify-player-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .spotify-player-btn {
          background: transparent;
          border: none;
          color: #b3b3b3;
          cursor: pointer;
          padding: 8px;
          font-size: 24px;
          transition: all 0.2s;
        }

        .spotify-player-btn:hover {
          color: #fff;
          transform: scale(1.05);
        }

        .spotify-player-play {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #fff;
          border: none;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .spotify-player-play:hover {
          transform: scale(1.06);
          background: #f0f0f0;
        }

        .spotify-player-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 700px;
        }

        .spotify-time {
          font-size: 12px;
          color: #b3b3b3;
          min-width: 40px;
          text-align: center;
        }

        .spotify-progress-bar {
          flex: 1;
          height: 4px;
          background: #535353;
          border-radius: 2px;
          cursor: pointer;
          position: relative;
        }

        .spotify-progress-fill {
          height: 100%;
          background: #fff;
          border-radius: 2px;
          position: relative;
          transition: width 0.1s linear;
        }

        .spotify-progress-bar:hover .spotify-progress-fill {
          background: #1fdf64;
        }

        .spotify-player-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
        }

        .spotify-volume {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 120px;
        }

        .spotify-volume-slider {
          width: 100%;
          accent-color: #fff;
          cursor: pointer;
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
