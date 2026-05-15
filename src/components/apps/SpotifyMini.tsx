import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number; // seconds
  src?: string;
}

const PLAYLIST: Track[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',
    duration: 354,
  },
  {
    id: '2',
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
    duration: 391,
  },
  {
    id: '3',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
    duration: 482,
  },
  {
    id: '4',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://images.unsplash.com/photo-1571974599782-87624638275e?w=300',
    duration: 200,
  },
  {
    id: '5',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
    duration: 234,
  },
  {
    id: '6',
    title: 'Lose Yourself',
    artist: 'Eminem',
    album: '8 Mile Soundtrack',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300',
    duration: 326,
  },
  {
    id: '7',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300',
    duration: 203,
  },
  {
    id: '8',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    cover: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=300',
    duration: 294,
  },
];

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function SpotifyMini() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'all' | 'one'>('none');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<Track[]>(PLAYLIST);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = queue[currentIdx] ?? PLAYLIST[0];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= current.duration) {
            handleNext();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentIdx, current.duration]);

  const handleNext = () => {
    setProgress(0);
    if (shuffle) {
      setCurrentIdx(Math.floor(Math.random() * queue.length));
    } else if (repeat === 'one') {
      setProgress(0);
    } else {
      setCurrentIdx(i => (i + 1) % queue.length);
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (progress > 5) { setProgress(0); return; }
    setCurrentIdx(i => (i - 1 + queue.length) % queue.length);
  };

  const toggleLike = (id: string) => {
    setLiked(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const cycleRepeat = () => {
    setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none');
  };

  const progressPct = (progress / (current.duration || 1)) * 100;

  return (
    <div style={{ display: 'flex', height: '100%', background: '#121212', color: 'white', fontFamily: 'Segoe UI, sans-serif', fontSize: 14 }}>
      {/* Left: Playlist */}
      <div style={{ width: 280, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎵</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1db954' }}>Spotify</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Tu biblioteca</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {queue.map((track, idx) => (
            <div
              key={track.id}
              onClick={() => { setCurrentIdx(idx); setProgress(0); setIsPlaying(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer',
                background: currentIdx === idx ? 'rgba(29,185,84,0.15)' : 'transparent',
                borderLeft: currentIdx === idx ? '3px solid #1db954' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (currentIdx !== idx) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (currentIdx !== idx) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={track.cover} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                {currentIdx === idx && isPlaying && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 3, background: '#1db954', borderRadius: 1, animation: `equalize${i} 0.8s ease-in-out infinite alternate`, height: `${[8, 14, 6][i - 1]}px` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: currentIdx === idx ? 600 : 400, color: currentIdx === idx ? '#1db954' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.artist}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} style={{ background: 'none', border: 'none', color: liked.has(track.id) ? '#1db954' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
                {liked.has(track.id) ? '♥' : '♡'}
              </button>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{fmt(track.duration)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Player */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 32 }}>
        {/* Album art */}
        <motion.div key={current.id} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          style={{ width: 200, height: 200, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', flexShrink: 0 }}>
          <img src={current.cover} alt={current.title} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: isPlaying ? 'albumSpin 20s linear infinite' : 'none' }} />
        </motion.div>

        {/* Track info */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{current.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{current.artist} · {current.album}</div>
        </div>

        {/* Like & add */}
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => toggleLike(current.id)} style={{ background: 'none', border: 'none', color: liked.has(current.id) ? '#1db954' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 22 }}>
            {liked.has(current.id) ? '♥' : '♡'}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, cursor: 'pointer' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              setProgress(Math.round(ratio * current.duration));
            }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: '#1db954', borderRadius: 2, transition: 'width 0.5s linear', position: 'relative' }}>
              <div style={{ position: 'absolute', right: -6, top: -4, width: 12, height: 12, background: 'white', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <span>{fmt(progress)}</span>
            <span>{fmt(current.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => setShuffle(s => !s)} style={{ ...ctrlBtn, color: shuffle ? '#1db954' : 'rgba(255,255,255,0.5)', fontSize: 20 }}>🔀</button>
          <button onClick={handlePrev} style={{ ...ctrlBtn, fontSize: 28 }}>⏮</button>
          <button onClick={() => setIsPlaying(p => !p)}
            style={{ width: 54, height: 54, borderRadius: '50%', background: '#1db954', border: 'none', cursor: 'pointer', color: 'black', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(29,185,84,0.4)', transition: 'all 0.2s' }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={handleNext} style={{ ...ctrlBtn, fontSize: 28 }}>⏭</button>
          <button onClick={cycleRepeat} style={{ ...ctrlBtn, color: repeat !== 'none' ? '#1db954' : 'rgba(255,255,255,0.5)', fontSize: 20 }}>
            {repeat === 'one' ? '🔂' : '🔁'}
          </button>
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 220 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>{volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}</span>
          <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(+e.target.value)}
            style={{ flex: 1, accentColor: '#1db954' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, width: 28, textAlign: 'right' }}>{volume}</span>
        </div>
      </div>

      <style>{`
        @keyframes albumSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes equalize1 { from { height: 4px; } to { height: 14px; } }
        @keyframes equalize2 { from { height: 8px; } to { height: 6px; } }
        @keyframes equalize3 { from { height: 12px; } to { height: 4px; } }
      `}</style>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' };
