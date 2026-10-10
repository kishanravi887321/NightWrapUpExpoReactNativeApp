import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useShareIntent } from 'expo-share-intent';
import { BottomNavigation, AppTab } from './components/BottomNavigation';
import { LoginScreen } from './components/LoginScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { OfflineScreen } from './components/OfflineScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { clearSession, createLibrary, fetchLibraries, fetchSongsForLibrary, getStoredToken, mobileLogin, saveSongToLibrary } from './services/api';
import {
  downloadSongLocally,
  getPlayableUri,
  loadLocalDownloads,
  LocalDownload,
  removeLocalDownload,
} from './services/localDownloads';
import { LibraryItem, SongItem } from './types/api';
import { mapLibrary, mapSong } from './utils/mappers';

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
  const [sharedYoutubeUrl, setSharedYoutubeUrl] = useState<string | null>(null);
  const [isSavingSharedSong, setIsSavingSharedSong] = useState(false);
  const [isCreatingLibrary, setIsCreatingLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('libraries');
  const [localDownloads, setLocalDownloads] = useState<Record<string, LocalDownload>>({});
  const [downloadingSongId, setDownloadingSongId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [playingLocalSongId, setPlayingLocalSongId] = useState<string | null>(null);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
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

  const handleDownloadSong = async (
    song: SongItem,
    libraryId: string,
    libraryName: string,
  ) => {
    if (downloadingSongId || localDownloads[song._id]) {
      return;
    }

    try {
      setDownloadingSongId(song._id);
      setDownloadProgress(0);
      setError('');
      const download = await downloadSongLocally(
        song,
        libraryId,
        libraryName,
        setDownloadProgress,
      );
      setLocalDownloads((current) => ({ ...current, [song._id]: download }));
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not download the song.');
    } finally {
      setDownloadingSongId(null);
      setDownloadProgress(0);
    }
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
    void loadLocalDownloads()
      .then(setLocalDownloads)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Could not load offline songs.');
      });
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
    if (!hasShareIntent) {
      return;
    }

    const sharedText = shareIntent.webUrl ?? shareIntent.text ?? '';
    const matchedUrl = sharedText.match(
      /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/\S+|youtu\.be\/\S+)/i,
    )?.[0];
    const youtubeUrl = matchedUrl?.replace(/[.,!?;:)]+$/, '');
    if (youtubeUrl) {
      setActiveTab('libraries');
      setSharedYoutubeUrl(youtubeUrl);
    } else {
      setError('Please share a YouTube video link.');
      resetShareIntent();
    }
  }, [hasShareIntent, resetShareIntent, shareIntent.text, shareIntent.webUrl]);

  useEffect(() => {
    setIsPlaying(audioStatus.playing);
    if (audioStatus.didJustFinish) {
      setIsPlaying(false);
      setPlayingLocalSongId(null);
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
    const playableUri = getPlayableUri(track, localDownloads);
    if (!playableUri) {
      setIsPlaying(false);
      setError('This song is not ready for playback yet.');
      return;
    }

    try {
      setError('');
      audio.replace(playableUri);
      setPlayingLocalSongId(localDownloads[track._id]?.localUri === playableUri ? track._id : null);
      audio.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
        artworkUrl: track.thumbnail,
      });
      setAudioSourceUrl(playableUri);
      audio.play();
      setIsPlaying(true);
    } catch (playbackError) {
      setIsPlaying(false);
      setError(playbackError instanceof Error ? `Playback failed: ${playbackError.message}` : 'Playback failed.');
    }
  };

  const handlePlayLocalSong = (download: LocalDownload) => {
    try {
      audio.replace(download.localUri);
      audio.setActiveForLockScreen(true, {
        title: download.title,
        artist: download.artist,
      });
      setAudioSourceUrl(download.localUri);
      setPlayingLocalSongId(download.songId);
      setError('');
      audio.play();
      setIsPlaying(true);
    } catch (playbackError) {
      setPlayingLocalSongId(null);
      setIsPlaying(false);
      setError(
        playbackError instanceof Error
          ? `Offline playback failed: ${playbackError.message}`
          : 'Offline playback failed.',
      );
    }
  };

  const handleToggleLocalPlay = () => {
    if (!playingLocalSongId) {
      return;
    }
    if (audioSourceUrl !== localDownloads[playingLocalSongId]?.localUri || !audioStatus.isLoaded) {
      const download = localDownloads[playingLocalSongId];
      if (download) {
        handlePlayLocalSong(download);
      }
      return;
    }
    if (audioStatus.playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleLocalTrackChange = (direction: 1 | -1) => {
    const downloads = Object.values(localDownloads);
    const currentIndex = downloads.findIndex((song) => song.songId === playingLocalSongId);
    if (currentIndex < 0 || downloads.length < 2) {
      return;
    }
    const nextIndex = (currentIndex + direction + downloads.length) % downloads.length;
    handlePlayLocalSong(downloads[nextIndex]);
  };

  const handleRemoveLocalSong = async (songId: string) => {
    try {
      await removeLocalDownload(songId);
      if (playingLocalSongId === songId) {
        audio.pause();
        setAudioSourceUrl(null);
        setPlayingLocalSongId(null);
        setIsPlaying(false);
      }
      setLocalDownloads((current) => {
        const next = { ...current };
        delete next[songId];
        return next;
      });
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove the local song.');
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
      if (playingLocalSongId) {
        handleLocalTrackChange(1);
      } else {
        void handleTrackChange(1);
      }
    }
  }, [audioStatus.didJustFinish, playingLocalSongId]);

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

  const handleSaveSharedSong = async (libraryId: string) => {
    if (!sharedYoutubeUrl) {
      return;
    }

    try {
      setIsSavingSharedSong(true);
      setError('');
      await saveSongToLibrary(libraryId, sharedYoutubeUrl);
      setSharedYoutubeUrl(null);
      resetShareIntent();
      await loadLibraries(libraryId);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the shared song.');
    } finally {
      setIsSavingSharedSong(false);
    }
  };

  const dismissSharedSong = () => {
    if (isSavingSharedSong) {
      return;
    }
    setSharedYoutubeUrl(null);
    resetShareIntent();
  };

  const handleCreateLibrary = async (name: string, description: string): Promise<LibraryItem> => {
    try {
      setIsCreatingLibrary(true);
      setError('');
      const library = await createLibrary(name, description);
      await loadLibraries(library._id);
      return mapLibrary(library, libraries.length);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create the library.');
      throw createError;
    } finally {
      setIsCreatingLibrary(false);
    }
  };

  const handleTogglePlay = async () => {
    if (!activeTrack || !getPlayableUri(activeTrack, localDownloads)) {
      if (activeTrack) {
        await playTrack(activeTrack);
      }
      return;
    }

    try {
      const playableUri = getPlayableUri(activeTrack, localDownloads);
      if (audioSourceUrl !== playableUri || !audioStatus.isLoaded) {
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
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {activeTab === 'libraries' ? (
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
          sharedYoutubeUrl={sharedYoutubeUrl}
          isSavingSharedSong={isSavingSharedSong}
          onSaveSharedSong={(libraryId) => void handleSaveSharedSong(libraryId)}
          onDismissSharedSong={dismissSharedSong}
          isCreatingLibrary={isCreatingLibrary}
          onCreateLibrary={(name, description) => handleCreateLibrary(name, description)}
          localDownloads={localDownloads}
          downloadingSongId={downloadingSongId}
          downloadProgress={downloadProgress}
          onDownloadSong={(song, libraryId, libraryName) =>
            void handleDownloadSong(song, libraryId, libraryName)
          }
        />
      ) : activeTab === 'offline' ? (
        <OfflineScreen
          downloads={localDownloads}
          playingSongId={playingLocalSongId}
          onPlay={handlePlayLocalSong}
          onRemove={(songId) => void handleRemoveLocalSong(songId)}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onTogglePlay={handleToggleLocalPlay}
          onPrevious={() => handleLocalTrackChange(-1)}
          onNext={() => handleLocalTrackChange(1)}
          onSeek={(seconds) => void handleSeek(seconds)}
        />
      ) : (
        <SettingsScreen onLogout={() => void handleLogout()} />
      )}
      <BottomNavigation
        activeTab={activeTab}
        offlineCount={Object.keys(localDownloads).length}
        onChange={setActiveTab}
      />
    </View>
  );
}
