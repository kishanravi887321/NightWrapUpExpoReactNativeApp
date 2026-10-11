import { File, Paths } from 'expo-file-system';
import { LocalDownload } from './localDownloads';
import { SongItem } from '../types/api';

export type QueueMode = 'online' | 'offline' | 'mixed';

export type QueueTrack = {
  songId: string;
  libraryId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  audioUrl?: string;
  localUri?: string;
};

export type LocalQueue = {
  id: string;
  name: string;
  mode: QueueMode;
  tracks: QueueTrack[];
  createdAt: string;
  updatedAt: string;
};

const queuesFile = new File(Paths.document, 'local-queues.json');

const readQueues = async (): Promise<LocalQueue[]> => {
  if (!queuesFile.exists) return [];
  try {
    const value = JSON.parse(await queuesFile.text());
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeQueues = (queues: LocalQueue[]) => {
  queuesFile.create({ overwrite: true });
  queuesFile.write(JSON.stringify(queues));
};

export const loadLocalQueues = readQueues;

export const createLocalQueue = async (
  name: string,
  mode: QueueMode,
  songs: SongItem[],
  libraryBySongId: Record<string, string>,
  downloads: Record<string, LocalDownload>,
): Promise<LocalQueue> => {
  const now = new Date().toISOString();
  const queue: LocalQueue = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    mode,
    tracks: songs.map((song) => ({
      songId: song._id,
      libraryId: libraryBySongId[song._id] ?? downloads[song._id]?.libraryId ?? '',
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
      audioUrl: song.audioUrl,
      localUri: downloads[song._id]?.localUri,
    })),
    createdAt: now,
    updatedAt: now,
  };
  const queues = await readQueues();
  queues.unshift(queue);
  writeQueues(queues);
  return queue;
};

export const deleteLocalQueue = async (queueId: string) => {
  writeQueues((await readQueues()).filter((queue) => queue.id !== queueId));
};

export const updateLocalQueue = async (queue: LocalQueue) => {
  const queues = await readQueues();
  const updatedQueue = { ...queue, updatedAt: new Date().toISOString() };
  writeQueues(queues.map((current) => current.id === queue.id ? updatedQueue : current));
  return updatedQueue;
};

export const clearLocalQueues = async () => {
  writeQueues([]);
};
