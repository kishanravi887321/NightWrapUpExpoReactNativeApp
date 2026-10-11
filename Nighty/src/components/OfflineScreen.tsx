import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LocalDownload } from '../services/localDownloads';
import { BottomSheetPlayer } from './BottomSheetPlayer';
import { SongItem } from '../types/api';

const MINI_HEIGHT = 64;

type OfflineScreenProps = {
  downloads: Record<string, LocalDownload>;
  playingSongId: string | null;
  onPlay: (download: LocalDownload) => void;
  onRemove: (songId: string) => void;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
};

export function OfflineScreen({
  downloads,
  playingSongId,
  onPlay,
  onRemove,
  isPlaying,
  currentTime,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
}: OfflineScreenProps) {
  const songs = useMemo(() => Object.values(downloads), [downloads]);

  // Group downloaded songs by library
  const libraries = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; songs: LocalDownload[] }>();
    songs.forEach((song) => {
      const id = song.libraryId || 'unknown';
      const library = grouped.get(id);
      if (library) {
        library.songs.push(song);
      } else {
        grouped.set(id, {
          id,
          name: song.libraryName || 'Downloads',
          songs: [song],
        });
      }
    });
    return Array.from(grouped.values());
  }, [songs]);

  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const selectedLibrary = libraries.find((library) => library.id === selectedLibraryId);

  // Active track for BottomSheetPlayer
  const playingDownload = songs.find((song) => song.songId === playingSongId);
  const playerTrack: SongItem | null = playingDownload
    ? {
        _id: playingDownload.songId,
        title: playingDownload.title,
        artist: playingDownload.artist,
        duration: playingDownload.duration ?? 0,
        thumbnail: playingDownload.thumbnail ?? '',
        fallbackThumbnail: playingDownload.thumbnail ?? '',
        audioUrl: playingDownload.localUri,
        tag: 'offline',
        mood: 'saved',
        audioReady: true,
      }
    : null;

  const playerSongs = selectedLibrary?.songs ?? songs;
  const playerIndex = playerSongs.findIndex((song) => song.songId === playingSongId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>♫</Text>
          </View>
          <View>
            <Text style={styles.topBarTitle}>
              {selectedLibrary ? selectedLibrary.name : 'Offline Songs'}
            </Text>
            <Text style={styles.topBarSubtitle}>
              {selectedLibrary
                ? `${selectedLibrary.songs.length} downloaded`
                : `${songs.length} downloaded across ${libraries.length} ${libraries.length === 1 ? 'library' : 'libraries'}`}
            </Text>
          </View>
        </View>

        <View style={styles.cyanBadge}>
          <Text style={styles.cyanBadgeText}>OFFLINE</Text>
        </View>
      </View>

      {/* ── Body Content ── */}
      {songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>↓</Text>
          </View>
          <Text style={styles.emptyTitle}>No offline tracks</Text>
          <Text style={styles.emptySubtitle}>
            Downloaded songs will appear here. Tap download (↓) on any track in your libraries to save it for offline listening.
          </Text>
        </View>
      ) : selectedLibrary ? (
        /* ── Level 2: Songs inside Selected Library ── */
        <View style={styles.contentWrap}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => setSelectedLibraryId(null)}
          >
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>All offline libraries</Text>
          </Pressable>

          <FlatList
            data={selectedLibrary.songs}
            keyExtractor={(song) => song.songId}
            contentContainerStyle={[
              styles.listContent,
              playerTrack ? { paddingBottom: MINI_HEIGHT + 30 } : null,
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isItemActive = playingSongId === item.songId;
              const isItemPlaying = isItemActive && isPlaying;

              return (
                <View style={[styles.songCard, isItemActive && styles.songCardActive]}>
                  {/* Song Details */}
                  <Pressable
                    style={styles.songInfo}
                    onPress={() => {
                      if (isItemActive) {
                        onTogglePlay();
                      } else {
                        onPlay(item);
                      }
                    }}
                  >
                    <Text
                      style={[styles.songTitle, isItemActive && styles.songTitleActive]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.statusDot, isItemActive && styles.statusDotActive]} />
                      <Text style={[styles.badgeText, isItemActive && styles.badgeTextActive]}>
                        {isItemPlaying ? 'Playing locally' : isItemActive ? 'Paused locally' : 'Available offline'}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Play / Pause Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.playButton,
                      isItemActive && styles.playButtonActive,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      if (isItemActive) {
                        onTogglePlay();
                      } else {
                        onPlay(item);
                      }
                    }}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.playIcon,
                        isItemActive && styles.playIconActive,
                      ]}
                    >
                      {isItemPlaying ? '❚❚' : '▶'}
                    </Text>
                  </Pressable>

                  {/* Remove Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() =>
                      Alert.alert(
                        'Remove local song?',
                        'This removes only the downloaded file from this device. The song stays in your online library.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => onRemove(item.songId),
                          },
                        ],
                      )
                    }
                    hitSlop={8}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>
      ) : (
        /* ── Level 1: List of Offline Libraries ── */
        <View style={styles.contentWrap}>
          <Text style={styles.sectionHeader}>OFFLINE LIBRARIES</Text>
          <FlatList
            data={libraries}
            keyExtractor={(library) => library.id}
            contentContainerStyle={[
              styles.listContent,
              playerTrack ? { paddingBottom: MINI_HEIGHT + 30 } : null,
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.libraryCard,
                  pressed && styles.libraryCardPressed,
                ]}
                onPress={() => setSelectedLibraryId(item.id)}
              >
                <View style={styles.libraryFolderIconWrap}>
                  <Text style={styles.libraryFolderIcon}>📁</Text>
                </View>
                <View style={styles.libraryInfo}>
                  <Text style={styles.libraryTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.librarySubtitle}>
                    {item.songs.length} {item.songs.length === 1 ? 'downloaded song' : 'downloaded songs'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* ── Persistent Bottom Sheet Player ── */}
      {playerTrack ? (
        <BottomSheetPlayer
          activeTrack={playerTrack}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onPrevious={onPrevious}
          onNext={onNext}
          currentTime={currentTime}
          totalDuration={playerTrack.duration}
          trackNumber={Math.max(1, playerIndex + 1)}
          trackCount={playerSongs.length || 1}
          onSeek={onSeek}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#030914',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.12)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topBarIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  topBarIconText: {
    color: '#030914',
    fontSize: 20,
    fontWeight: '900',
  },
  topBarTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  topBarSubtitle: {
    color: '#7b95b0',
    fontSize: 12,
    marginTop: 2,
  },
  cyanBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  cyanBadgeText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 6,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: '#00e5ff',
  },
  backChevron: {
    color: '#00e5ff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  backText: {
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  /* ── Library Card ── */
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#051120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    padding: 16,
  },
  libraryCardPressed: {
    backgroundColor: '#07172b',
    borderColor: '#00e5ff',
  },
  libraryFolderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  libraryFolderIcon: {
    fontSize: 20,
  },
  libraryInfo: {
    flex: 1,
    minWidth: 0,
  },
  libraryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  librarySubtitle: {
    color: '#7b95b0',
    fontSize: 13,
    marginTop: 4,
  },
  chevron: {
    color: '#00e5ff',
    fontSize: 24,
    marginLeft: 12,
    fontWeight: '600',
  },
  /* ── Song Card ── */
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#051120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    padding: 14,
    gap: 12,
  },
  songCardActive: {
    backgroundColor: '#07172b',
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  songTitleActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },
  songArtist: {
    color: '#7b95b0',
    fontSize: 13,
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4e657d',
  },
  statusDotActive: {
    backgroundColor: '#00e5ff',
  },
  badgeText: {
    color: '#7b95b0',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: '#00e5ff',
    borderColor: '#00e5ff',
  },
  playIcon: {
    color: '#00e5ff',
    fontSize: 15,
    marginLeft: 2,
    fontWeight: '800',
  },
  playIconActive: {
    color: '#030914',
    marginLeft: 0,
    fontWeight: '900',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 80, 80, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 80, 80, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    color: '#00e5ff',
    fontSize: 28,
    fontWeight: '800',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#7b95b0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
