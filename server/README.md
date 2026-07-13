# NEX Music — local DSP stream server
#
# Required for real Sonido Potencia (EQ / compressor / 8D stereo).
# Without this, the PWA falls back to YouTube iframe (loudness only).

## 1. Install

```bash
cd server
npm install
```

`youtube-dl-exec` bundles a yt-dlp binary. Alternatively install system-wide:

- Windows: `winget install yt-dlp.yt-dlp`
- Or set `YT_DLP_PATH` to the binary.

## 2. Run

```bash
npm run music:server
# → http://localhost:4000
# GET /health  → { stream: true, ytDlp: { ok, version } }
# GET /stream/:videoId → { url: ".../audio", source: "yt-dlp" }
```

## 3. Point the PWA at it

Create `.env.local` in the repo root:

```
VITE_MUSIC_SERVER_URL=http://localhost:4000
```

Restart Vite / rebuild. For a hosted music server (Railway, VPS):

```
VITE_MUSIC_SERVER_URL=https://your-music-server.example
MUSIC_PUBLIC_URL=https://your-music-server.example
```

`MUSIC_PUBLIC_URL` must match the public URL browsers use (proxy links in `/stream/:id`).

## 4. Verify DSP

1. Open NEX Music, play a track.
2. Sonido Potencia pill should say **DSP en vivo**.
3. Toggle 8D / EQ — stereo pan and tone should change for real.
