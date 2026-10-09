import { ApiLibrary, ApiSong, LibraryItem, SongItem } from '../types/api';
import { buildFallbackImage, buildYoutubeThumbnail, normalizeImageUrl } from './format';

const palette = ['#8b5cf6', '#38bdf8', '#f59e0b', '#34d399', '#f472b6'];

export const mapLibrary = (library: ApiLibrary, index: number): LibraryItem => ({
  _id: library._id,
  name: library.name,
  description: library.description ?? 'Your personal listening space',
  accent: palette[index % palette.length],
  songCount: library.songCount,
});

export const mapSong = (song: ApiSong, index: number): SongItem => ({
  _id: song._id,
  title: song.title,
  artist: song.channelName ?? 'NightWrapUp',
  duration: Number(song.audio?.duration ?? 180 + index * 12),
  thumbnail:
    normalizeImageUrl(song.thumbnail) ??
    buildYoutubeThumbnail(song.youtubeVideoId, song.youtubeUrl) ??
    buildFallbackImage(index),
  fallbackThumbnail:
    buildYoutubeThumbnail(song.youtubeVideoId, song.youtubeUrl) ?? buildFallbackImage(index),
  audioUrl: song.audio?.url,
  tag: song.audio?.status === 'ready' ? 'stream ready' : 'queued',
  mood: song.playCount && song.playCount > 0 ? 'popular' : 'new',
  audioReady: Boolean(song.audio?.url && song.audio?.status === 'ready'),
  playCount: song.playCount ?? 0,
});
