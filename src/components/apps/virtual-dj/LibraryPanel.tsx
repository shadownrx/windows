import React, { useState } from 'react';
import { hasMusicServer, searchYoutube, type YoutubeSearchResult } from '../../../utils/youtubeStream';
import type { DjTrackRef } from './types';

type Props = {
  onLoad: (deck: 'A' | 'B', track: DjTrackRef) => void;
};

export const LibraryPanel: React.FC<Props> = ({ onLoad }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<YoutubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      // Same endpoint + response shape as NEX Music (`data.results`)
      const results = await searchYoutube(q);
      setHits(results.filter((r) => r.kind === 'video' && r.id));
    } catch (err) {
      setError((err as Error).message);
      setHits([]);
    } finally {
      setLoading(false);
    }
  };

  const toTrack = (hit: YoutubeSearchResult): DjTrackRef => ({
    videoId: hit.id,
    title: hit.title,
    artist: hit.channelTitle || 'YouTube',
    cover: hit.thumbnail || '',
  });

  return (
    <div className="vdj-lib">
      <div className="vdj-lib-header">
        <span>LIBRARY</span>
        <span className={`vdj-dsp-pill ${hasMusicServer() ? 'ok' : 'warn'}`}>
          {hasMusicServer() ? 'Music server' : 'API YouTube'}
        </span>
      </div>
      <div className="vdj-lib-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void search();
          }}
          placeholder="Buscar en YouTube (NEX Music API)…"
        />
        <button type="button" className="vdj-btn primary" onClick={() => void search()} disabled={loading}>
          {loading ? '…' : 'GO'}
        </button>
      </div>
      <p className="vdj-lib-note">Cargá un tema al platter A o B.</p>
      {error && <p className="vdj-lib-error">{error}</p>}
      <div className="vdj-lib-list">
        {hits.map((hit) => (
          <div key={hit.id} className="vdj-lib-row">
            {hit.thumbnail ? <img src={hit.thumbnail} alt="" /> : <div className="vdj-lib-ph" />}
            <div className="vdj-lib-info">
              <div className="vdj-lib-title">{hit.title}</div>
              <div className="vdj-lib-ch">{hit.channelTitle}</div>
            </div>
            <button type="button" className="vdj-btn slim" onClick={() => onLoad('A', toTrack(hit))}>
              A
            </button>
            <button type="button" className="vdj-btn slim" onClick={() => onLoad('B', toTrack(hit))}>
              B
            </button>
          </div>
        ))}
        {!loading && hits.length === 0 && (
          <div className="vdj-lib-empty">Buscá un tema y cargalo al deck A o B.</div>
        )}
      </div>
    </div>
  );
};

export default LibraryPanel;
