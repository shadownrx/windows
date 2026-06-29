export type MusicService = 'youtube' | 'youtube-music' | 'spotify';

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  service: MusicService;
  kind?: 'video' | 'playlist';
  videoId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

export interface RoomUser {
  id: string;
  name: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: number;
  user: string;
  text: string;
  at: number;
}

export interface PlaybackSyncState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  queue: Track[];
  updatedAt: number;
}

export interface LiveReaction {
  key: number;
  emoji: string;
  user: string;
}

export interface DjModeState {
  enabled: boolean;
  autoPlay: boolean;
}

/** Server-side pool entry (votes = socket ids) */
export interface DjPoolEntryRaw {
  entryId: string;
  track: Track;
  votes: string[];
  suggestedByName: string;
  addedAt: number;
}

/** Client view of a votable track in DJ mode */
export interface DjVoteEntry {
  entryId: string;
  track: Track;
  voteCount: number;
  votedByMe: boolean;
  suggestedByName: string;
  addedAt: number;
}
