import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play24Filled,
  Pause24Filled,
  Previous24Filled,
  Next24Filled,
  Speaker224Filled,
  MusicNote224Filled,
  Search24Regular,
  ArrowDown16Regular,
  ArrowUp16Regular,
  Heart24Filled,
  Heart24Regular,
  Book24Regular,
  History24Regular,
  List24Regular,
  Star24Regular,
} from '@fluentui/react-icons';
import { useMusicPlayer, type Track } from '../../context/MusicPlayerContext';

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

// --- UTIL ---
function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Hoy';
  if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
  const years = Math.floor(months / 12);
  return `Hace ${years} año${years === 1 ? '' : 's'}`;
}

function buildEmbedUrlFromResult(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
}

// --- LYRICS COMPONENT ---
const LyricsDisplay: React.FC = () => {
  const { currentTrack } = useMusicPlayer();
  const [lyrics, setLyrics] = useState<string[]>([]);

  useEffect(() => {
    if (currentTrack) {
      setLyrics([
        "🎵 [Verse 1]",
        "Walking through the city at night",
        "Looking for a place to belong",
        "Every streetlight is a guide",
        "Leading me to where I belong",
        "",
        "🎶 [Chorus]",
        "This is our song, our melody",
        "Playing in the key of life",
        "Together we can make it right",
        "This is our time, our night",
        "",
        "🎵 [Verse 2]",
        "Looking out over the ocean",
        "Waiting for the sun to rise",
        "Everything feels new and hopeful",
        "Underneath the starlit skies",
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

// --- MAIN APP ---
const SpotifyMini: React.FC = () => {
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
    setCurrentPlaylist,
    setIsPlaying,
    setDuration,
    setProgress,
  } = useMusicPlayer();

  const [activeService, setActiveService] = useState<ServiceType>('youtube');
  const [activeTab, setActiveTab] = useState<'search' | 'playlist' | 'queue' | 'favorites' | 'history'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isYoutubeApiReady = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- DEFAULT PLAYLIST ---
  const defaultPlaylist: Track[] = [
    {
      id: '1',
      title: 'Sin un peso',
      artist: 'Nafta',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
      url: '',
      service: 'spotify',
    },
    {
      id: 'dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      artist: 'Rick Astley',
      cover: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      url: '',
      service: 'youtube',
    },
  ];

  useEffect(() => {
    setCurrentPlaylist(defaultPlaylist);
  }, [setCurrentPlaylist]);

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
    if (isYoutubeApiReady.current) {
      initPlayer();
    }
  }, [currentTrack]);

  const initPlayer = () => {
    if (!currentTrack?.videoId) return;

    if (playerRef.current?.destroy) {
      playerRef.current.destroy();
    }

    if (window.YT) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: currentTrack.videoId,
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            if (playerRef.current.getDuration) {
              setDuration(playerRef.current.getDuration());
            }
            playerRef.current.setVolume(volume);
            if (isPlaying) {
              playerRef.current.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTracking();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopProgressTracking();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              nextTrack();
            }
          },
        },
      });
    } else if (iframeRef.current) {
      setTimeout(initPlayer, 100);
    }
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
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
    const rect = e.currentTarget;
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
      } else {
        playerRef.current.playVideo();
      }
    } else {
      togglePlay();
    }
  };

  // --- SEARCH ---
  const runSearch = useCallback(async (q: string) => {
    if (activeService !== 'youtube' && activeService !== 'youtube-music') {
      const trimmed = q.trim();
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockResults: Track[] = [
        { id: 's1', title: `${trimmed} - Track 1`, artist: 'Artista 1', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', url: '', service: activeService },
        { id: 's2', title: `${trimmed} - Track 2`, artist: 'Artista 2', cover: 'https://images.unsplash.com/photo-1511379938547-c1f6941d86ba?w=300', url: '', service: activeService },
      ];
      setSearchResults(mockResults as any);
      setLoading(false);
      return;
    }

    const trimmed = q.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const fallbackResults: YouTubeResult[] = [
          { id: 'dQw4w9WgXcQ', kind: 'video', title: 'Rick Astley - Never Gonna Give You Up', channelTitle: 'Rick Astley', publishedAt: '2009-10-25T06:57:33Z', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', description: 'Official video' },
          { id: '9bZkp7q19f0', kind: 'video', title: 'PSY - GANGNAM STYLE', channelTitle: 'officialpsy', publishedAt: '2012-07-15T07:46:32Z', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', description: 'PSY' },
          { id: 'kJQP7kiw5Fk', kind: 'video', title: 'Luis Fonsi - Despacito', channelTitle: 'Luis Fonsi', publishedAt: '2017-01-13T05:00:03Z', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', description: 'Despacito' },
        ];
        
        const filtered = fallbackResults.filter(item => 
          item.title.toLowerCase().includes(trimmed.toLowerCase()) || 
          item.channelTitle.toLowerCase().includes(trimmed.toLowerCase())
        );
        
        setSearchResults(filtered.length > 0 ? filtered : fallbackResults);
        return;
      }

      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const fallbackResults: YouTubeResult[] = [
        { id: 'dQw4w9WgXcQ', kind: 'video', title: 'Rick Astley - Never Gonna Give You Up', channelTitle: 'Rick Astley', publishedAt: '2009-10-25T06:57:33Z', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', description: 'The official video' },
      ];
      setSearchResults(fallbackResults);
    } finally {
      setLoading(false);
    }
  }, [activeService]);

  const playFromSearch = (result: YouTubeResult) => {
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
    setIsMinimized(false);
  };

  const addTrackToQueue = (result: YouTubeResult) => {
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
  };

  return (
    <div className="unified-player-root">
      {/* --- LEFT SIDEBAR --- */}
      <div className="left-sidebar">
        <div className="brand">
          <MusicNote224Filled style={{ color: '#1DB954', fontSize: 32 }} />
          <h2>NEX Player</h2>
        </div>

        <div className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search24Regular />
            <span>Buscar</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'playlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlist')}
          >
            <List24Regular />
            <span>Playlist NEX</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <List24Regular />
            <span>Cola ({queue.length})</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Star24Regular />
            <span>Favoritos ({favorites.length})</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History24Regular />
            <span>Historial</span>
          </button>
        </div>

        <div className="services-tabs-premium">
          {(['youtube', 'youtube-music', 'spotify'] as ServiceType[]).map((service) => (
            <button
              key={service}
              className={`service-tab-premium ${activeService === service ? 'active-premium' : ''}`}
              onClick={() => setActiveService(service)}
              style={{ '--service-color': service === 'spotify' ? '#1DB954' : '#FF0000' } as React.CSSProperties}
            >
              {service === 'youtube' ? 'YouTube' : service === 'youtube-music' ? 'YT Music' : 'Spotify'}
            </button>
          ))}
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content-area">
        {/* --- MINIPLAYER --- */}
        {isMinimized && currentTrack && (
          <div className="minimized-bar">
            <img src={currentTrack.cover} alt="" className="mini-cover" />
            <div className="mini-info">
              <p className="mini-title">{currentTrack.title}</p>
              <p className="mini-artist">{currentTrack.artist}</p>
            </div>
            <div className="mini-controls">
              <Previous24Filled className="p-icon" onClick={prevTrack} />
              <button className="mini-play" onClick={handleTogglePlay}>
                {isPlaying ? <Pause24Filled /> : <Play24Filled />}
              </button>
              <Next24Filled className="p-icon" onClick={nextTrack} />
              <button className="expand-btn" onClick={() => setIsMinimized(false)}>
                <ArrowUp16Regular />
              </button>
            </div>
          </div>
        )}

        {/* --- VIDEO / LYRICS --- */}
        {!isMinimized && (
          <div className="visual-area">
            {showLyrics ? (
              <LyricsDisplay />
            ) : (
              <div className="video-or-cover">
                {currentTrack?.videoId ? (
                  <div className="video-wrapper">
                    <iframe
                      id="youtube-player"
                      ref={iframeRef}
                      src={buildEmbedUrlFromResult(currentTrack.videoId)}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentTrack.title}
                    />
                  </div>
                ) : (
                  currentTrack && <img src={currentTrack.cover} alt="" className="large-cover" />
                )}
              </div>
            )}

            {/* --- CURRENT TRACK INFO --- */}
            {currentTrack && (
              <div className="track-details">
                <div className="track-main-info">
                  <h1 className="track-title">{currentTrack.title}</h1>
                  <p className="track-artist">{currentTrack.artist}</p>
                </div>
                <div className="track-actions">
                  <button 
                    className={`fav-btn ${isFavorite(currentTrack.id) ? 'favorited' : ''}`}
                    onClick={() => toggleFavorite(currentTrack)}
                  >
                    {isFavorite(currentTrack.id) ? <Heart24Filled /> : <Heart24Regular />}
                  </button>
                  <button 
            className={`lyrics-btn ${showLyrics ? 'active' : ''}`}
            onClick={() => setShowLyrics(!showLyrics)}
          >
            <Book24Regular />
            <span>Letras</span>
          </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TABS CONTENT --- */}
        <div className="content-tab">
          {activeTab === 'search' && (
            <div className="search-tab">
              <div className="search-bar-container-premium">
                <Search24Regular className="search-icon-premium" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
                  placeholder={`Buscar en ${activeService === 'youtube' ? 'YouTube' : activeService === 'youtube-music' ? 'YT Music' : 'Spotify'}...`}
                  className="search-input-premium"
                />
                <button onClick={() => runSearch(query)} disabled={!query.trim()} className="search-btn-premium">
                  Buscar
                </button>
              </div>

              {loading && (
                <div className="yt-state-premium">
                  <div className="yt-spinner-premium" />
                  <p>Buscando...</p>
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div className="yt-grid-premium">
                  {searchResults.map((result) => (
                    <div key={result.id} className="yt-card-premium">
                      <div className="yt-thumb-wrap-premium">
                        {result.thumbnail && <img src={result.thumbnail} alt={result.title} className="yt-thumb-premium" />}
                        <div className="yt-play-overlay-premium">
                          <button className="yt-play-btn" onClick={() => playFromSearch(result)}>
                            <Play24Filled />
                          </button>
                        </div>
                      </div>
                      <div className="yt-card-info-premium">
                        <p className="yt-card-title-premium">{result.title}</p>
                        <p className="yt-card-meta-premium">
                          {result.channelTitle} · {formatRelativeDate(result.publishedAt)}
                        </p>
                      </div>
                      <button className="add-to-queue-btn" onClick={() => addTrackToQueue(result)}>
                        + Cola
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlist' && (
            <div className="playlist-tab">
              <h3>Playlist NEX</h3>
              <div className="track-list">
                {defaultPlaylist.map((track, index) => (
                  <div key={track.id} className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`} onClick={() => playTrack(track)}>
                    <img src={track.cover} alt="" className="track-thumb" />
                    <div className="track-info">
                      <p className="t-name">{track.title}</p>
                      <p className="t-artist">{track.artist}</p>
                    </div>
                    <span className="service-badge-premium" style={{ background: track.service === 'spotify' ? '#1DB954' : '#FF0000' }}>
                      {track.service === 'spotify' ? 'S' : 'YT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="queue-tab">
              <h3>Cola de reproducción ({queue.length})</h3>
              {queue.length === 0 ? (
                <p className="empty-state">No hay canciones en la cola</p>
              ) : (
                <div className="track-list">
                  {queue.map((track, index) => (
                    <div key={track.id} className="track-item">
                      <img src={track.cover} alt="" className="track-thumb" />
                      <div className="track-info">
                        <p className="t-name">{track.title}</p>
                        <p className="t-artist">{track.artist}</p>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromQueue(track.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="favorites-tab">
              <h3>Tus favoritos ({favorites.length})</h3>
              {favorites.length === 0 ? (
                <p className="empty-state">No tienes favoritos aún</p>
              ) : (
                <div className="track-list">
                  {favorites.map((track) => (
                    <div key={track.id} className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`} onClick={() => playTrack(track)}>
                      <img src={track.cover} alt="" className="track-thumb" />
                      <div className="track-info">
                        <p className="t-name">{track.title}</p>
                        <p className="t-artist">{track.artist}</p>
                      </div>
                      <button className="fav-small" onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}>
                        <Heart24Filled />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab">
              <h3>Historial de reproducción</h3>
              {history.length === 0 ? (
                <p className="empty-state">No hay historial aún</p>
              ) : (
                <div className="track-list">
                  {history.map((track) => (
                    <div key={track.id} className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`} onClick={() => playTrack(track)}>
                      <img src={track.cover} alt="" className="track-thumb" />
                      <div className="track-info">
                        <p className="t-name">{track.title}</p>
                        <p className="t-artist">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- BOTTOM CONTROLS --- */}
        {!isMinimized && currentTrack && (
          <div className="controls-bar-premium">
            <div className="progress-container-premium">
              <div className="progress-bar-premium" onClick={handleSeek}>
                <div className="progress-fill-premium" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="controls-row-premium">
              <div className="volume-control-premium">
                <Speaker224Filled className="icon-premium" />
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="volume-slider-premium" />
              </div>

              <div className="playback-btns-premium">
                <Previous24Filled className="p-icon-premium" onClick={prevTrack} />
                <button className="play-btn-premium" onClick={handleTogglePlay}>
                  {isPlaying ? <Pause24Filled /> : <Play24Filled />}
                </button>
                <Next24Filled className="p-icon-premium" onClick={nextTrack} />
              </div>

              <button className="minimize-btn-right" onClick={() => setIsMinimized(true)}>
                <ArrowDown16Regular />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- GLOBAL STYLES --- */}
      <style>{`
        .unified-player-root {
          display: flex;
          height: 100%;
          background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          overflow: hidden;
          position: relative;
        }

        .left-sidebar {
          width: 260px;
          background: #000;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #1a1a1a;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .brand h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          color: #aaa;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .nav-item.active {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .services-tabs-premium {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .service-tab-premium {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #a0a0a0;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .service-tab-premium:hover {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .service-tab-premium.active-premium {
          background: var(--service-color, #1DB954);
          border-color: var(--service-color, #1DB954);
          color: white;
        }

        .main-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* Minimized bar */
        .minimized-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: rgba(0,0,0,0.8);
          border-bottom: 1px solid #1a1a1a;
        }

        .mini-cover {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
        }

        .mini-info {
          flex: 1;
        }

        .mini-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .mini-artist {
          font-size: 12px;
          color: #888;
          margin: 0;
        }

        .mini-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mini-play {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: white;
          color: black;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .p-icon {
          cursor: pointer;
          color: #aaa;
        }

        .p-icon:hover { color: white; }

        .expand-btn {
          background: transparent;
          border: none;
          color: #aaa;
          cursor: pointer;
        }

        /* Visual area */
        .visual-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          overflow: hidden;
        }

        .video-or-cover {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-wrapper {
          width: 100%;
          height: 100%;
          max-width: 720px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-wrapper iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 16px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
        }

        .large-cover {
          max-width: 400px;
          max-height: 400px;
          border-radius: 16px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5);
          object-fit: cover;
        }

        /* Lyrics */
        .lyrics-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .lyrics-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .lyrics-content {
          flex: 1;
          overflow-y: auto;
        }

        .lyrics-section {
          font-size: 16px;
          color: #888;
          margin: 16px 0 8px;
          font-weight: 600;
        }

        .lyrics-line {
          font-size: 18px;
          color: #ccc;
          margin: 8px 0;
        }

        .track-details {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 24px;
        }

        .track-title {
          font-size: 32px;
          margin: 0 0 4px;
        }

        .track-artist {
          font-size: 18px;
          color: #888;
          margin: 0;
        }

        .track-actions {
          display: flex;
          gap: 12px;
        }

        .fav-btn, .lyrics-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 10px 16px;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .fav-btn:hover, .lyrics-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        .fav-btn.favorited {
          color: #1DB954;
        }

        .lyrics-btn.active {
          background: #1DB954;
        }

        /* Tabs */
        .content-tab {
          flex: 1;
          padding: 0 24px 24px;
          overflow-y: auto;
        }

        .search-tab, .playlist-tab, .queue-tab, .favorites-tab, .history-tab {
          height: 100%;
        }

        .content-tab h3 {
          margin-top: 0;
        }

        .search-bar-container-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 12px 20px;
          margin-bottom: 24px;
        }

        .search-icon-premium { color: #888; }

        .search-input-premium {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: white;
          font-size: 15px;
        }

        .search-btn-premium {
          background: linear-gradient(135deg, #1DB954, #1aa34a);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .search-btn-premium:hover:not(:disabled) {
          opacity: 0.9;
        }

        .yt-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .yt-card-premium {
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .yt-card-premium:hover {
          background: rgba(255,255,255,0.08);
          transform: translateY(-4px);
        }

        .yt-thumb-wrap-premium {
          position: relative;
          aspect-ratio: 16/9;
          background: #222;
        }

        .yt-thumb-premium {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yt-play-overlay-premium {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .yt-card-premium:hover .yt-play-overlay-premium { opacity: 1; }

        .yt-play-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: black;
        }

        .yt-card-info-premium {
          padding: 12px;
        }

        .yt-card-title-premium {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .yt-card-meta-premium {
          font-size: 12px;
          color: #888;
          margin: 0;
        }

        .add-to-queue-btn {
          width: 100%;
          background: transparent;
          border-top: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-to-queue-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .yt-state-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
        }

        .yt-spinner-premium {
          width: 40px;
          height: 40px;
          border: 3px solid #2a2a2a;
          border-top-color: #1DB954;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Track list */
        .track-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .track-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .track-item:hover { background: rgba(255,255,255,0.08); }
        .track-item.active { background: rgba(255,255,255,0.12); }

        .track-thumb {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
        }

        .track-info { flex: 1; }

        .t-name {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 2px;
        }

        .t-artist {
          font-size: 12px;
          color: #888;
          margin: 0;
        }

        .service-badge-premium {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: #ff4444;
          font-size: 24px;
          cursor: pointer;
          padding: 0 8px;
        }

        .fav-small {
          background: transparent;
          border: none;
          color: #1DB954;
          cursor: pointer;
        }

        .empty-state {
          color: #666;
          text-align: center;
          margin-top: 40px;
        }

        /* Controls */
        .controls-bar-premium {
          background: rgba(0,0,0,0.9);
          border-top: 1px solid #1a1a1a;
          padding: 16px 24px 24px;
        }

        .progress-container-premium {
          margin-bottom: 16px;
        }

        .progress-bar-premium {
          height: 4px;
          background: #333;
          border-radius: 2px;
          position: relative;
          cursor: pointer;
        }

        .progress-fill-premium {
          height: 100%;
          background: linear-gradient(90deg, #1DB954, #FF0000);
          border-radius: 2px;
          width: 30%;
        }

        .controls-row-premium {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .volume-control-premium {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .playback-btns-premium {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .play-btn-premium {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: white;
          border: none;
          color: black;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .play-btn-premium:hover {
          transform: scale(1.08);
        }

        .p-icon-premium {
          font-size: 28px;
          cursor: pointer;
          color: #aaa;
        }

        .p-icon-premium:hover {
          color: white;
        }

        .minimize-btn-right {
          background: transparent;
          border: none;
          color: #aaa;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SpotifyMini;
