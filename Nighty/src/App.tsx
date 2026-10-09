import React, { useEffect, useMemo, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LoginScreen } from './components/LoginScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { clearSession, fetchLibraries, fetchSongsForLibrary, getStoredToken, markSongPlayed, mobileLogin } from './services/api';
import { ApiLibrary, ApiSong, LibraryItem, SongItem } from './types/api';
import { buildFallbackImage, buildYoutubeThumbnail, normalizeImageUrl } from './utils/format';

const palette = ['#8b5cf6', '#38bdf8', '#f59e0b', '#34d399', '#f472b6'];

const mapLibrary = (library: ApiLibrary, index: number): LibraryItem => ({
  _id: library._id,
  name: library.name,
  description: library.description ?? 'Your personal listening space',
  accent: palette[index % palette.length],
  songCount: library.songCount,
});

const mapSong = (song: ApiSong, index: number): SongItem => ({
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

export default function App() {
  const [email, setEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [songsByLibrary, setSongsByLibrary] = useState<Record<string, SongItem[]>>({});
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [audioSourceUrl, setAudioSourceUrl] = useState<string | null>(null);
  const audio = useAudioPlayer(null, { updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audio);

  const selectedLibrary = libraries.find((library) => library._id === selectedLibraryId) ?? null;
  const selectedSongs = useMemo(
    () => (selectedLibraryId ? songsByLibrary[selectedLibraryId] ?? [] : []),
    [selectedLibraryId, songsByLibrary],
  );
  const activeTrack = useMemo(
    () => selectedSongs.find((song) => song._id === activeSongId) ?? selectedSongs[0] ?? null,
    [activeSongId, selectedSongs],
  );
  const currentTime = audioStatus.currentTime ?? 0;
  const totalDuration = audioStatus.duration > 0 ? audioStatus.duration : activeTrack?.duration ?? 0;
  const trackNumber = Math.max(0, selectedSongs.findIndex((song) => song._id === activeTrack?._id) + 1);

  const loadSongsForLibrary = async (libraryId: string): Promise<SongItem[]> => {
    const songs = await fetchSongsForLibrary(libraryId);
    const mapped = songs.map(mapSong);
    setSongsByLibrary((current) => ({ ...current, [libraryId]: mapped }));
    return mapped;
  };

  const loadLibraries = async (preferredLibraryId?: string | null) => {
    try {
      setIsLoading(true);
      setError('');
      const apiLibraries = await fetchLibraries();
      const mappedLibraries = apiLibraries.map(mapLibrary);
      setLibraries(mappedLibraries);

      if (mappedLibraries.length > 0) {
        const libraryToSelect =
          mappedLibraries.find((library) => library._id === preferredLibraryId) ?? mappedLibraries[0];
        setSelectedLibraryId(libraryToSelect._id);
        const songs = await loadSongsForLibrary(libraryToSelect._id);
        setActiveSongId(songs[0]?._id ?? null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your libraries.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const cleanedKey = secretKey.replace(/\D/g, '');
    if (!email.trim() || cleanedKey.length !== 8) {
      setError('Enter a valid email and your exact 8-digit mobile key.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const session = await mobileLogin(email, cleanedKey);
      if (!session?.accessToken) {
        throw new Error('Mobile login failed.');
      }
      setIsAuthenticated(true);
      await loadLibraries();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Mobile login failed.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSession = async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      await loadLibraries();
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    void restoreSession();
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).catch((audioError) => {
      setError(audioError instanceof Error ? `Audio setup failed: ${audioError.message}` : 'Audio setup failed.');
    });
  }, []);

  useEffect(() => {
    setIsPlaying(audioStatus.playing);
    if (audioStatus.didJustFinish) {
      setIsPlaying(false);
    }
  }, [audioStatus.playing, audioStatus.didJustFinish]);

  const handleLibraryChange = async (libraryId: string) => {
    if (libraryId === selectedLibraryId) {
      return;
    }

    audio.pause();
    setAudioSourceUrl(null);
    setSelectedLibraryId(libraryId);
    setActiveSongId(null);
    setIsPlaying(false);
    setError('');

    try {
      const songs = await loadSongsForLibrary(libraryId);
      setActiveSongId(songs[0]?._id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load tracks.');
    }
  };

  const playTrack = async (track: SongItem) => {
    if (!track.audioUrl) {
      setIsPlaying(false);
      setError('This song is not ready for playback yet.');
      return;
    }

    try {
      setError('');
      audio.replace(track.audioUrl);
      audio.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
        artworkUrl: track.thumbnail,
      });
      setAudioSourceUrl(track.audioUrl);
      audio.play();
      setIsPlaying(true);
    } catch (playbackError) {
      setIsPlaying(false);
      setError(playbackError instanceof Error ? `Playback failed: ${playbackError.message}` : 'Playback failed.');
    }
  };

  const handleSongPress = async (songId: string) => {
    if (!selectedLibraryId) {
      return;
    }

    setActiveSongId(songId);
    const selectedSong = selectedSongs.find((song) => song._id === songId);
    if (selectedSong) {
      await playTrack(selectedSong);
    }

    try {
      await markSongPlayed(selectedLibraryId, songId);
      setSongsByLibrary((current) => ({
        ...current,
        [selectedLibraryId]: (current[selectedLibraryId] ?? []).map((song) =>
          song._id === songId ? { ...song, playCount: (song.playCount ?? 0) + 1 } : song,
        ),
      }));
    } catch (playError) {
      setError(playError instanceof Error ? playError.message : 'Play count update failed.');
    }
  };

  const handleTrackChange = async (direction: 1 | -1) => {
    if (!activeTrack || selectedSongs.length < 2) {
      return;
    }

    const currentIndex = selectedSongs.findIndex((song) => song._id === activeTrack._id);
    const nextIndex = (currentIndex + direction + selectedSongs.length) % selectedSongs.length;
    await handleSongPress(selectedSongs[nextIndex]._id);
  };

  useEffect(() => {
    if (audioStatus.didJustFinish) {
      void handleTrackChange(1);
    }
  }, [audioStatus.didJustFinish]);

  const handleLogout = async () => {
    audio.pause();
    audio.setActiveForLockScreen(false);
    setAudioSourceUrl(null);
    await clearSession();
    setLibraries([]);
    setSongsByLibrary({});
    setSelectedLibraryId(null);
    setActiveSongId(null);
    setIsAuthenticated(false);
    setError('');
  };

  const handleRefresh = async () => {
    console.warn('[NightWrapUp] Pull-to-refresh started');
    await loadLibraries(selectedLibraryId);
    console.warn('[NightWrapUp] Pull-to-refresh finished');
  };

  const handleTogglePlay = async () => {
    if (!activeTrack?.audioUrl) {
      if (activeTrack) {
        await playTrack(activeTrack);
      }
      return;
    }

    try {
      if (audioSourceUrl !== activeTrack.audioUrl || !audioStatus.isLoaded) {
        await playTrack(activeTrack);
        return;
      }
      if (audioStatus.playing) {
        audio.pause();
      } else {
        audio.play();
      }
    } catch (playbackError) {
      setError(playbackError instanceof Error ? `Playback failed: ${playbackError.message}` : 'Playback failed.');
      setIsPlaying(false);
    }
  };

  const handleSeek = async (seconds: number) => {
    try {
      await audio.seekTo(Math.max(0, seconds));
    } catch (seekError) {
      setError(seekError instanceof Error ? `Unable to seek: ${seekError.message}` : 'Unable to seek.');
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        email={email}
        secretKey={secretKey}
        error={error}
        isLoading={isLoading}
        onEmailChange={setEmail}
        onSecretKeyChange={setSecretKey}
        onLogin={() => void handleLogin()}
      />
    );
  }

  return (
    <LibraryScreen
      libraries={libraries}
      selectedLibraryId={selectedLibraryId}
      selectedSongs={selectedSongs}
      activeTrack={activeTrack}
      isLoading={isLoading}
      error={error}
      onLibraryChange={(id) => void handleLibraryChange(id)}
      onSongPress={(id) => void handleSongPress(id)}
      onPrevious={() => void handleTrackChange(-1)}
      onNext={() => void handleTrackChange(1)}
      currentTime={currentTime}
      totalDuration={totalDuration}
      trackNumber={trackNumber}
      trackCount={selectedSongs.length}
      onSeek={(seconds) => void handleSeek(seconds)}
      onLogout={() => void handleLogout()}
      onTogglePlay={() => void handleTogglePlay()}
      onRefresh={() => void handleRefresh()}
      isPlaying={isPlaying}
    />
  );
}
