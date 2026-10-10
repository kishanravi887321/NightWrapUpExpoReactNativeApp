import { Directory, File, Paths } from 'expo-file-system';
import { SongItem } from '../types/api';

export type LocalDownload = {
  songId: string;
  libraryId: string;
  libraryName: string;
  localUri: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  downloadedAt: string;
  size?: number;
};

const downloadsDirectory = new Directory(Paths.document, 'downloads');
const metadataFile = new File(Paths.document, 'downloads-metadata.json');

const readDownloads = async (): Promise<Record<string, LocalDownload>> => {
  if (!metadataFile.exists) {
    return {};
  }

  try {
    return JSON.parse(await metadataFile.text()) as Record<string, LocalDownload>;
  } catch {
    return {};
  }
};

const writeDownloads = (downloads: Record<string, LocalDownload>) => {
  metadataFile.create({ overwrite: true });
  metadataFile.write(JSON.stringify(downloads));
};

export const loadLocalDownloads = async (): Promise<Record<string, LocalDownload>> => {
  const downloads = await readDownloads();
  const validDownloads = Object.fromEntries(
    Object.entries(downloads).filter(([, download]) => new File(download.localUri).exists),
  );
  if (Object.keys(validDownloads).length !== Object.keys(downloads).length) {
    writeDownloads(validDownloads);
  }
  return validDownloads;
};

export const downloadSongLocally = async (
  song: SongItem,
  libraryId: string,
  libraryName: string,
  onProgress?: (progress: number) => void,
): Promise<LocalDownload> => {
  if (!song.audioUrl) {
    throw new Error('This song is not ready to download yet.');
  }

  downloadsDirectory.create({ idempotent: true });
  const destination = new File(downloadsDirectory, `${song._id}.mp3`);
  const downloadedFile = await File.downloadFileAsync(song.audioUrl, destination, {
    idempotent: true,
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) {
        onProgress?.(bytesWritten / totalBytes);
      }
    },
  });

  const download: LocalDownload = {
    songId: song._id,
    libraryId,
    libraryName,
    localUri: downloadedFile.uri,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
    duration: song.duration,
    downloadedAt: new Date().toISOString(),
    size: downloadedFile.size,
  };
  const downloads = await readDownloads();
  downloads[song._id] = download;
  writeDownloads(downloads);
  return download;
};

export const removeLocalDownload = async (songId: string) => {
  const downloads = await readDownloads();
  const download = downloads[songId];
  if (download) {
    const file = new File(download.localUri);
    if (file.exists) {
      file.delete();
    }
  }
  delete downloads[songId];
  writeDownloads(downloads);
};

export const getPlayableUri = (
  song: SongItem,
  downloads: Record<string, LocalDownload>,
): string | null => {
  const localUri = downloads[song._id]?.localUri;
  if (localUri && new File(localUri).exists) {
    return localUri;
  }
  return song.audioUrl ?? null;
};
