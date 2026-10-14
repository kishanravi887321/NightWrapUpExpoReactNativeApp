import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useShareIntent } from 'expo-share-intent';
import { BottomNavigation, AppTab } from './components/BottomNavigation';
import { LoginScreen } from './components/LoginScreen';
import { SplashScreen } from './components/SplashScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { OfflineScreen } from './components/OfflineScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { TracksScreen } from './components/TracksScreen';
import { clearSession, createLibrary, deleteSongFromLibrary, fetchLibraries, fetchSongsForLibrary, getStoredToken, mobileLogin, saveSongToLibrary } from './services/api';
import {
  downloadSongLocally,
  getPlayableUri,
  loadLocalDownloads,
  LocalDownload,
  removeLocalDownload,
} from './services/localDownloads';
import { LibraryItem, SongItem } from './types/api';
import { mapLibrary, mapSong } from './utils/mappers';
import {
  clearLocalQueues,
  createLocalQueue,
  deleteLocalQueue,
  loadLocalQueues,
  LocalQueue,
  QueueMode,
  updateLocalQueue,
} from './services/localQueues';
import { playbackClock } from './services/playbackClock';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [songsByLibrary, setSongsByLibrary] = useState<Record<string, SongItem[]>>({});
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [playingLibraryId, setPlayingLibraryId] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<'library' | 'offline' | 'queue' | null>(null);
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
  const [localQueues, setLocalQueues] = useState<LocalQueue[]>([]);
  const [queueTracks, setQueueTracks] = useState<SongItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isQueuePlaying, setIsQueuePlaying] = useState(false);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const audio = useAudioPlayer(null, { updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audio);
  // Track the last played song id to detect switches and reset display time
  const lastTrackIdRef = useRef<string | null>(null);
  const userPauseIntentRef = useRef(false);

  const isSongPlayable = (
    song: SongItem | null | undefined,
    downloads: Record<string, LocalDownload>,
  ): boolean => {
    if (!song) return false;
    if (downloads[song._id]?.localUri) return true;
    return Boolean(song.audioReady && song.audioUrl);
  };

  const selectedLibrary = libraries.find((library) => library._id === selectedLibraryId) ?? null;
  const selectedSongs = useMemo(
    () => (selectedLibraryId ? songsByLibrary[selectedLibraryId] ?? [] : []),
    [selectedLibraryId, songsByLibrary],
  );

  const playingSongs = useMemo(() => {
    if (playingLibraryId && songsByLibrary[playingLibraryId]) {
      return songsByLibrary[playingLibraryId];
    }
    return selectedSongs;
  }, [playingLibraryId, songsByLibrary, selectedSongs]);

  const activeTrack = useMemo(() => {
    if (activeSongId) {
      const inPlaying = playingSongs.find((song) => song._id === activeSongId);
      if (inPlaying) return inPlaying;
      const inSelected = selectedSongs.find((song) => song._id === activeSongId);
      if (inSelected) return inSelected;
      for (const libId of Object.keys(songsByLibrary)) {
        const found = songsByLibrary[libId]?.find((s) => s._id === activeSongId);
        if (found) return found;
      }
    }
    const firstPlayable = selectedSongs.find((s) => isSongPlayable(s, localDownloads));
    return firstPlayable ?? selectedSongs[0] ?? null;
  }, [activeSongId, playingSongs, selectedSongs, songsByLibrary, localDownloads]);

  // Once the audio has loaded its real duration, keep it stable; fall back to metadata
  const totalDuration = audioStatus.isLoaded && audioStatus.duration > 0
    ? audioStatus.duration
    : activeTrack?.duration ?? 0;

  // Sync global playbackClock with audio state
  useEffect(() => {
    playbackClock.setTrack(activeTrack?._id ?? null, totalDuration);
  }, [activeTrack?._id, totalDuration]);

  useEffect(() => {
    playbackClock.setPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    playbackClock.syncNative(Math.max(0, audioStatus.currentTime ?? 0));
  }, [audioStatus.currentTime]);

  const currentTime = playbackClock.getTime();
  const activePlaylist = playingLibraryId && songsByLibrary[playingLibraryId]?.length
    ? songsByLibrary[playingLibraryId]
    : selectedSongs;
  const trackCount = activePlaylist.length;
  const trackNumber = Math.max(0, activePlaylist.findIndex((song) => song._id === activeTrack?._id) + 1);
  const queueActiveTrack = queueTracks[queueIndex] ?? null;

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

  const libraryBySongId = useMemo(() => {
    const result: Record<string, string> = {};
    libraries.forEach((library) => {
      (songsByLibrary[library._id] ?? []).forEach((song) => {
        result[song._id] = library._id;
      });
    });
    return result;
  }, [libraries, songsByLibrary]);

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
        await Promise.all(
          mappedLibraries
            .filter((library) => library._id !== libraryToSelect._id)
            .map((library) => loadSongsForLibrary(library._id)),
        );
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
    void loadLocalQueues().then(setLocalQueues);
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
    try {
      audio.loop = isRepeat;
    } catch {
      // ignore if player does not support direct loop assignment
    }
  }, [audio, isRepeat]);

  useEffect(() => {
    if (userPauseIntentRef.current) {
      // User explicitly paused: do not let in-flight native status revert isPlaying back to true
      if (!audioStatus.playing) {
        userPauseIntentRef.current = false;
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying(audioStatus.playing);
    if (audioStatus.didJustFinish && !isRepeat) {
      setIsPlaying(false);
      setPlayingLocalSongId(null);
    }
  }, [audioStatus.playing, audioStatus.didJustFinish, isRepeat]);

  const handleLibraryChange = async (libraryId: string) => {
    if (libraryId === selectedLibraryId) {
      return;
    }

    setSelectedLibraryId(libraryId);
    setError('');

    // If no song is currently playing, prepare the first playable song of the selected library
    const isAudioActive = isPlaying || (audioStatus.isLoaded && !userPauseIntentRef.current);
    if (!isAudioActive) {
      setActiveSongId(null);
    }

    try {
      const songs = await loadSongsForLibrary(libraryId);
      if (!isAudioActive) {
        const firstPlayable = songs.find((s) => isSongPlayable(s, localDownloads));
        setActiveSongId(firstPlayable?._id ?? songs[0]?._id ?? null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load tracks.');
    }
  };

  const playTrack = async (track: SongItem, libraryId?: string) => {
    const targetLibraryId = libraryId ?? playingLibraryId ?? selectedLibraryId;
    const playableUri = getPlayableUri(track, localDownloads);
    if (!playableUri) {
      setIsPlaying(false);
      setError('This song is not ready for playback yet.');
      return;
    }

    try {
      setError('');
      userPauseIntentRef.current = false;
      setPlaybackMode('library');
      if (targetLibraryId) {
        setPlayingLibraryId(targetLibraryId);
      }
      setActiveSongId(track._id);
      setPlayingLocalSongId(null);
      setIsQueuePlaying(false);

      audio.replace(playableUri);
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

  const playQueueTrack = (tracks: SongItem[], index: number, _localDownloads = localDownloads) => {
    const track = tracks[index];
    if (!track) return;

    // Resolve the best available URI: prefer a locally downloaded file, fall back to online URL.
    const localUri = _localDownloads[track._id]?.localUri;
    const playableUri = localUri ?? track.audioUrl ?? null;

    if (!playableUri) {
      // No URI available for this track — skip to the next one automatically.
      if (tracks.length > 1) {
        const nextIndex = (index + 1) % tracks.length;
        if (nextIndex !== index) {
          playQueueTrack(tracks, nextIndex, _localDownloads);
          return;
        }
      }
      setError('No tracks in this queue are playable right now.');
      return;
    }

    setPlaybackMode('queue');
    setPlayingLocalSongId(null);
    setQueueTracks(tracks);
    setQueueIndex(index);
    setIsQueuePlaying(true);
    try {
      setError('');
      userPauseIntentRef.current = false;
      audio.replace(playableUri);
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
      setError(playbackError instanceof Error ? playbackError.message : 'Track playback failed.');
    }
  };

  const handlePlayQueue = (queue: LocalQueue) => {
    // Build SongItem list from the saved queue tracks.
    // playQueueTrack will resolve the actual URI at play time using localDownloads,
    // so we expose both audioUrl (online) and the download map is consulted live.
    const tracks = queue.tracks.map((track) => ({
      _id: track.songId,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: track.thumbnail,
      fallbackThumbnail: track.thumbnail,
      // For online-only mode always use the remote URL; for offline/mixed let
      // playQueueTrack decide based on what is downloaded.
      audioUrl: queue.mode === 'online' ? track.audioUrl : (track.audioUrl ?? undefined),
      tag: queue.mode,
      mood: 'queue',
      audioReady: Boolean(track.localUri ?? track.audioUrl),
    }));
    playQueueTrack(tracks, 0);
    setActiveQueueId(queue.id);
  };

  const handleCreateQueue = async (name: string, mode: QueueMode, songs: SongItem[]) => {
    const queue = await createLocalQueue(name, mode, songs, libraryBySongId, localDownloads);
    setLocalQueues((current) => [queue, ...current]);
  };

  const handleQueueChange = (direction: 1 | -1) => {
    if (queueTracks.length < 2) return;
    const next = (queueIndex + direction + queueTracks.length) % queueTracks.length;
    playQueueTrack(queueTracks, next);
  };

  const handleUpdateQueue = async (queue: LocalQueue) => {
    const updatedQueue = await updateLocalQueue(queue);
    setLocalQueues((current) => current.map((item) => item.id === queue.id ? updatedQueue : item));
    if (activeQueueId === queue.id && !updatedQueue.tracks.some((track) => track.songId === queueTracks[queueIndex]?._id)) {
      audio.pause();
      setAudioSourceUrl(null);
      setQueueTracks([]);
      setQueueIndex(-1);
      setIsQueuePlaying(false);
      setActiveQueueId(null);
      setIsPlaying(false);
    }
  };

  const handlePlayLocalSong = (download: LocalDownload) => {
    try {
      userPauseIntentRef.current = false;
      setPlaybackMode('offline');
      setIsQueuePlaying(false);
      audio.replace(download.localUri);
      audio.setActiveForLockScreen(true, {
        title: download.title,
        artist: download.artist,
        artworkUrl: download.thumbnail,
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
    if (audioStatus.playing || isPlaying) {
      userPauseIntentRef.current = true;
      setIsPlaying(false);
      audio.pause();
    } else {
      userPauseIntentRef.current = false;
      setIsPlaying(true);
      audio.play();
    }
  };

  const handleLocalTrackChange = (direction: 1 | -1, filterLibraryId?: string | null) => {
    const currentDownload = playingLocalSongId ? localDownloads[playingLocalSongId] : null;
    const targetLibraryId = filterLibraryId !== undefined ? filterLibraryId : currentDownload?.libraryId;

    let candidates = Object.values(localDownloads);
    if (targetLibraryId) {
      const scoped = candidates.filter((song) => song.libraryId === targetLibraryId);
      if (scoped.length > 0) {
        candidates = scoped;
      }
    }

    if (candidates.length === 0) {
      return;
    }

    const currentIndex = candidates.findIndex((song) => song.songId === playingLocalSongId);
    let nextIndex: number;
    if (isShuffle && direction === 1 && candidates.length > 1) {
      let rand = Math.floor(Math.random() * candidates.length);
      if (rand === currentIndex) {
        rand = (rand + 1) % candidates.length;
      }
      nextIndex = rand;
    } else {
      nextIndex = currentIndex >= 0
        ? (currentIndex + direction + candidates.length) % candidates.length
        : 0;
    }
    handlePlayLocalSong(candidates[nextIndex]);
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

  const handleSongPress = async (songId: string, libraryId?: string) => {
    const targetLibraryId = libraryId ?? selectedLibraryId;
    if (!targetLibraryId) {
      return;
    }

    if (songId === activeSongId && activeTrack && isPlaying) {
      userPauseIntentRef.current = true;
      setIsPlaying(false);
      audio.pause();
      return;
    }

    if (songId === activeSongId && activeTrack && !isPlaying && audioStatus.isLoaded) {
      userPauseIntentRef.current = false;
      setIsPlaying(true);
      audio.play();
      return;
    }

    const playlist = songsByLibrary[targetLibraryId] ?? selectedSongs;
    const selectedSong = playlist.find((song) => song._id === songId);
    if (selectedSong) {
      await playTrack(selectedSong, targetLibraryId);
    }
  };

  const handleTrackChange = async (direction: 1 | -1) => {
    const targetLibraryId = playingLibraryId ?? selectedLibraryId;
    const currentPlaylist = (targetLibraryId ? songsByLibrary[targetLibraryId] : null) ?? selectedSongs;

    if (!currentPlaylist || currentPlaylist.length === 0) {
      return;
    }

    const playableSongs = currentPlaylist.filter((song) => isSongPlayable(song, localDownloads));
    if (playableSongs.length === 0) {
      setError('No playable songs in this library.');
      return;
    }

    const currentPlayableIndex = activeTrack
      ? playableSongs.findIndex((song) => song._id === activeTrack._id)
      : -1;

    let nextIndex: number;
    if (isShuffle && direction === 1) {
      const otherIndices = playableSongs
        .map((_, idx) => idx)
        .filter((idx) => idx !== currentPlayableIndex);
      if (otherIndices.length > 0) {
        nextIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
      } else {
        nextIndex = 0;
      }
    } else {
      if (currentPlayableIndex >= 0) {
        nextIndex = (currentPlayableIndex + direction + playableSongs.length) % playableSongs.length;
      } else {
        nextIndex = 0;
      }
    }

    const nextSong = playableSongs[nextIndex];
    if (nextSong) {
      await playTrack(nextSong, targetLibraryId ?? undefined);
    }
  };

  useEffect(() => {
    if (audioStatus.didJustFinish) {
      if (isRepeat) {
        try {
          audio.seekTo(0);
          audio.play();
          setIsPlaying(true);
        } catch {
          if (playbackMode === 'queue' && queueTracks.length > 0 && queueIndex >= 0) {
            playQueueTrack(queueTracks, queueIndex);
          } else if (playbackMode === 'offline' && playingLocalSongId && localDownloads[playingLocalSongId]) {
            handlePlayLocalSong(localDownloads[playingLocalSongId]);
          } else if (activeTrack) {
            void playTrack(activeTrack, playingLibraryId ?? undefined);
          }
        }
        return;
      }

      if (playbackMode === 'queue' && queueTracks.length > 1) {
        const next = isShuffle
          ? Math.floor(Math.random() * queueTracks.length)
          : (queueIndex + 1 + queueTracks.length) % queueTracks.length;
        playQueueTrack(queueTracks, next);
      } else if (playbackMode === 'offline') {
        handleLocalTrackChange(1);
      } else {
        void handleTrackChange(1);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioStatus.didJustFinish, isRepeat, isShuffle, playbackMode, playingLibraryId, activeSongId]);

  useEffect(() => {
    // When a queue track fails to load (e.g. online song with no internet), skip to next.
    if (audioStatus.error && isQueuePlaying && queueTracks.length > 1) {
      const next = (queueIndex + 1 + queueTracks.length) % queueTracks.length;
      playQueueTrack(queueTracks, next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioStatus.error]);

  const handleLogout = async () => {
    // The logout confirmation is rendered before this action is called.
    audio.pause();
    audio.setActiveForLockScreen(false);
    setAudioSourceUrl(null);
    await clearSession();
    setLibraries([]);
    setSongsByLibrary({});
    setSelectedLibraryId(null);
    setPlayingLibraryId(null);
    setPlaybackMode(null);
    setActiveSongId(null);
    setIsAuthenticated(false);
    await clearLocalQueues();
    setLocalQueues([]);
    setQueueTracks([]);
    setQueueIndex(-1);
    setIsQueuePlaying(false);
    setError('');
  };

  const confirmLogout = () => {
    if (localQueues.length === 0) {
      void handleLogout();
      return;
    }
    Alert.alert(
      'Sign out and remove tracks?',
      'Your locally saved tracks will be removed from this device when you sign out. Downloaded songs will remain available offline.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void handleLogout() },
      ],
    );
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

  const handleDeleteSong = async (song: SongItem, libraryId: string) => {
    try {
      setIsLoading(true);
      setError('');

      if (activeSongId === song._id) {
        audio.pause();
        setAudioSourceUrl(null);
        setIsPlaying(false);
      }

      await deleteSongFromLibrary(song._id, libraryId);

      setSongsByLibrary((current) => {
        const existing = current[libraryId] ?? [];
        const filtered = existing.filter((s) => s._id !== song._id);
        return {
          ...current,
          [libraryId]: filtered,
        };
      });

      setLibraries((current) =>
        current.map((lib) =>
          lib._id === libraryId
            ? { ...lib, songCount: Math.max(0, (lib.songCount ?? 1) - 1) }
            : lib,
        ),
      );

      if (activeSongId === song._id) {
        const remaining = (songsByLibrary[libraryId] ?? []).filter((s) => s._id !== song._id);
        const nextPlayable = remaining.find((s) => isSongPlayable(s, localDownloads));
        setActiveSongId(nextPlayable?._id ?? remaining[0]?._id ?? null);
      }

      if (localDownloads[song._id]) {
        void handleRemoveLocalSong(song._id);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the song.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlay = async () => {
    if (!activeTrack) {
      return;
    }

    const playableUri = getPlayableUri(activeTrack, localDownloads);
    if (!playableUri) {
      const targetLibraryId = playingLibraryId ?? selectedLibraryId;
      const currentPlaylist = (targetLibraryId ? songsByLibrary[targetLibraryId] : null) ?? selectedSongs;
      const firstPlayable = currentPlaylist.find((s) => isSongPlayable(s, localDownloads));
      if (firstPlayable) {
        await playTrack(firstPlayable, targetLibraryId ?? undefined);
      } else {
        setError('This song is not ready for playback yet.');
      }
      return;
    }

    try {
      if (audioSourceUrl !== playableUri || !audioStatus.isLoaded) {
        await playTrack(activeTrack, playingLibraryId ?? selectedLibraryId ?? undefined);
        return;
      }
      if (isPlaying || audioStatus.playing) {
        userPauseIntentRef.current = true;
        setIsPlaying(false);
        audio.pause();
      } else {
        userPauseIntentRef.current = false;
        setIsPlaying(true);
        audio.play();
      }
    } catch (playbackError) {
      setError(playbackError instanceof Error ? `Playback failed: ${playbackError.message}` : 'Playback failed.');
      setIsPlaying(false);
    }
  };

  const isSeekingRef = useRef(false);
  const pendingSeekSecondsRef = useRef<number | null>(null);

  const handleSeek = async (seconds: number) => {
    const target = Math.max(0, seconds);
    playbackClock.seek(target);

    pendingSeekSecondsRef.current = target;
    if (isSeekingRef.current) return;
    isSeekingRef.current = true;

    try {
      while (pendingSeekSecondsRef.current !== null) {
        const dest = pendingSeekSecondsRef.current;
        pendingSeekSecondsRef.current = null;
        await audio.seekTo(dest);
      }
    } catch (seekError) {
      setError(seekError instanceof Error ? `Unable to seek: ${seekError.message}` : 'Unable to seek.');
    } finally {
      isSeekingRef.current = false;
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

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
    <View style={{ flex: 1, backgroundColor: '#030914' }}>
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
          trackCount={trackCount}
          onSeek={(seconds) => void handleSeek(seconds)}
          onLogout={confirmLogout}
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
          isRepeat={isRepeat}
          onToggleRepeat={() => setIsRepeat((prev) => !prev)}
          isShuffle={isShuffle}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onDeleteSong={(song, libId) => void handleDeleteSong(song, libId)}
        />
      ) : activeTab === 'tracks' ? (
        <TracksScreen
          queues={localQueues}
          libraries={libraries}
          songsByLibrary={songsByLibrary}
          downloads={localDownloads}
          onCreateQueue={(name, mode, songs) => void handleCreateQueue(name, mode, songs)}
          onDeleteQueue={(queueId) => {
            if (activeQueueId === queueId) {
              audio.pause();
              setAudioSourceUrl(null);
              setQueueTracks([]);
              setQueueIndex(-1);
              setIsQueuePlaying(false);
              setActiveQueueId(null);
              setIsPlaying(false);
            }
            setLocalQueues((current) => current.filter((queue) => queue.id !== queueId));
            void deleteLocalQueue(queueId);
          }}
          onUpdateQueue={(queue) => void handleUpdateQueue(queue)}
          onPlayQueue={handlePlayQueue}
          activeTrack={queueActiveTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          totalDuration={totalDuration}
          onTogglePlay={() => {
            if (!queueActiveTrack) return;
            // Resolve what URI we expect to be playing for this queue track.
            const expectedUri =
              localDownloads[queueActiveTrack._id]?.localUri ?? queueActiveTrack.audioUrl ?? null;
            if (audioSourceUrl !== expectedUri || !audioStatus.isLoaded) {
              playQueueTrack(queueTracks, queueIndex);
            } else if (audioStatus.playing || isPlaying) {
              userPauseIntentRef.current = true;
              setIsPlaying(false);
              audio.pause();
            } else {
              userPauseIntentRef.current = false;
              setIsPlaying(true);
              audio.play();
            }
          }}
          onPrevious={() => {
            if (queueTracks.length < 2) return;
            const prev = (queueIndex - 1 + queueTracks.length) % queueTracks.length;
            playQueueTrack(queueTracks, prev);
          }}
          onNext={() => {
            if (queueTracks.length < 2) return;
            const next = (queueIndex + 1 + queueTracks.length) % queueTracks.length;
            playQueueTrack(queueTracks, next);
          }}
          onSeek={(seconds) => void handleSeek(seconds)}
        />
      ) : activeTab === 'offline' ? (
        <OfflineScreen
          downloads={localDownloads}
          playingSongId={playingLocalSongId}
          onPlay={handlePlayLocalSong}
          onRemove={(songId) => void handleRemoveLocalSong(songId)}
          isPlaying={isPlaying}
          currentTime={currentTime}
          totalDuration={totalDuration}
          onTogglePlay={handleToggleLocalPlay}
          onPrevious={(libId) => handleLocalTrackChange(-1, libId)}
          onNext={(libId) => handleLocalTrackChange(1, libId)}
          onSeek={(seconds) => void handleSeek(seconds)}
        />
      ) : (
        <SettingsScreen onLogout={confirmLogout} onShowSplash={() => setShowSplash(true)} />
      )}
      <BottomNavigation
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    </View>
  );
}
