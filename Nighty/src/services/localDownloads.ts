import { Platform } from 'react-native';
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

const isWeb = Platform.OS === 'web';
const downloadsDirectory = !isWeb && Paths?.document ? new Directory(Paths.document, 'downloads') : null;
const metadataFile = !isWeb && Paths?.document ? new File(Paths.document, 'downloads-metadata.json') : null;

const readDownloads = async (): Promise<Record<string, LocalDownload>> => {
  if (isWeb || !metadataFile || !metadataFile.exists) {
    return {};
  }

  try {
    return JSON.parse(await metadataFile.text()) as Record<string, LocalDownload>;
  } catch {
    return {};
  }
};

const writeDownloads = (downloads: Record<string, LocalDownload>) => {
  if (isWeb || !metadataFile) return;
  metadataFile.create({ overwrite: true });
  metadataFile.write(JSON.stringify(downloads));
};

export const loadLocalDownloads = async (): Promise<Record<string, LocalDownload>> => {
  if (isWeb) return {};
  const downloads = await readDownloads();
  const validDownloads = Object.fromEntries(
    Object.entries(downloads).filter(([, download]) => {
      try {
        return new File(download.localUri).exists;
      } catch {
        return false;
      }
    }),
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
  if (isWeb || !downloadsDirectory) {
    throw new Error('Local downloads are not supported on web.');
  }

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
  if (isWeb) return;
  const downloads = await readDownloads();
  const download = downloads[songId];
  if (download) {
    try {
      const file = new File(download.localUri);
      if (file.exists) {
        file.delete();
      }
    } catch {
      // ignore
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
  if (!isWeb && localUri) {
    try {
      if (new File(localUri).exists) {
        return localUri;
      }
    } catch {
      // ignore
    }
  }
  return song.audioUrl ?? null;
};
