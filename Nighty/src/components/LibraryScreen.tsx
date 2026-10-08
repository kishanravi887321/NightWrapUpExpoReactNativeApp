import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryItem, SongItem } from '../types/api';
import { formatTime } from '../utils/format';

type LibraryScreenProps = {
  libraries: LibraryItem[];
  selectedLibraryId: string | null;
  selectedSongs: SongItem[];
  activeTrack: SongItem | null;
  isLoading: boolean;
  error: string;
  onLibraryChange: (libraryId: string) => void;
  onSongPress: (songId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onLogout: () => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
};

export function LibraryScreen({
  libraries,
  selectedLibraryId,
  selectedSongs,
  activeTrack,
  isLoading,
  error,
  onLibraryChange,
  onSongPress,
  onPrevious,
  onNext,
  onLogout,
  onTogglePlay,
  isPlaying,
}: LibraryScreenProps) {
  const selectedLibrary = libraries.find((library) => library._id === selectedLibraryId) ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Good evening</Text>
            <Text style={styles.headerTitle}>NightWrapUp</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={onLogout} accessibilityRole="button">
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        {activeTrack ? (
          <View style={styles.heroCard}>
            <View style={styles.heroCardGlow} />
            <View style={styles.heroCardGlowSecondary} />
            <View style={styles.heroRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroLabel}>Listening now</Text>
                <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
                  {activeTrack.title}
                </Text>
                <Text style={styles.heroArtist} numberOfLines={1} ellipsizeMode="tail">
                  {activeTrack.artist}
                </Text>
              </View>
              <Pressable style={styles.playButton} onPress={onTogglePlay}>
                <Text style={styles.playButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{libraries.length}</Text>
            <Text style={styles.statLabel}>libraries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{selectedSongs.length}</Text>
            <Text style={styles.statLabel}>tracks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isLoading ? '…' : 'Live'}</Text>
            <Text style={styles.statLabel}>status</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your spaces</Text>
          <Text style={styles.sectionLink}>{isLoading ? 'Loading…' : 'Live data'}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.libraryStrip}>
          {libraries.map((library) => {
            const isSelected = library._id === selectedLibraryId;
            return (
              <Pressable
                key={library._id}
                style={[styles.libraryChip, isSelected && { backgroundColor: library.accent }]}
                onPress={() => onLibraryChange(library._id)}
              >
                <Text style={[styles.libraryChipText, isSelected && styles.libraryChipTextActive]}>
                  {library.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedLibrary ? (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
              {selectedLibrary.name}
            </Text>
            <Text style={styles.sectionLink} numberOfLines={1} ellipsizeMode="tail">
              {selectedLibrary.description}
            </Text>
          </View>
        ) : null}

        {selectedSongs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptyText}>This library is empty or the API has not returned any tracks.</Text>
          </View>
        ) : (
          <View style={styles.songList}>
            {selectedSongs.map((song) => {
              const isCurrent = song._id === activeTrack?._id;
              return (
                <Pressable
                  key={song._id}
                  style={[styles.songCard, isCurrent && styles.songCardActive]}
                  onPress={() => onSongPress(song._id)}
                >
                  <Image source={{ uri: song.thumbnail }} style={styles.songCover} />
                  <View style={styles.songMeta}>
                    <Text style={styles.songTitle} numberOfLines={1} ellipsizeMode="tail">
                      {song.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1} ellipsizeMode="tail">
                      {song.artist}
                    </Text>
                    <View style={styles.songTags}>
                      <Text style={styles.songTag}>{song.tag}</Text>
                      <Text style={[styles.songTag, styles.songTagSecondary]}>{song.mood}</Text>
                    </View>
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songDuration}>{formatTime(song.duration)}</Text>
                    <View style={styles.audioState}>
                      <Text style={styles.audioStateText}>{song.audioReady ? 'Ready' : 'Queued'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {activeTrack ? (
        <View style={styles.playerDock}>
          <View style={styles.playerTopRow}>
            <Image source={{ uri: activeTrack.thumbnail }} style={styles.playerCover} />
            <View style={styles.playerMeta}>
              <Text style={styles.playerTitle} numberOfLines={1} ellipsizeMode="tail">
                {activeTrack.title}
              </Text>
              <Text style={styles.playerArtist} numberOfLines={1} ellipsizeMode="tail">
                {activeTrack.artist}
              </Text>
            </View>
          </View>

          <View style={styles.playerControls}>
            <Pressable style={styles.transportButton} onPress={onPrevious}>
              <Text style={styles.transportText}>⏮</Text>
            </Pressable>
            <Pressable style={styles.transportButtonPrimary} onPress={onTogglePlay}>
              <Text style={styles.transportText}>{isPlaying ? '⏸' : '▶'}</Text>
            </Pressable>
            <Pressable style={styles.transportButton} onPress={onNext}>
              <Text style={styles.transportText}>⏭</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050816',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: {
    color: '#9cc6ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#edf4ff',
    fontSize: 26,
    fontWeight: '800',
  },
  logoutButton: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.32)',
  },
  logoutButtonText: {
    color: '#fda4af',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineError: {
    marginBottom: 12,
    color: '#fda4af',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#16213a',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardGlow: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#8b5cf6',
    opacity: 0.25,
  },
  heroCardGlowSecondary: {
    position: 'absolute',
    left: -30,
    bottom: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#38bdf8',
    opacity: 0.18,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  heroLabel: {
    color: '#90a0c5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#f8fbff',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  heroArtist: {
    color: '#dfe7ff',
    fontSize: 15,
    opacity: 0.9,
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  playButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    color: '#f5f9ff',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#929fbc',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionHeader: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    flexShrink: 1,
    color: '#edf4ff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionLink: {
    flexShrink: 1,
    maxWidth: '56%',
    color: '#9fb6df',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  libraryStrip: {
    paddingRight: 16,
  },
  libraryChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  libraryChipText: {
    color: '#c9d5ef',
    fontWeight: '700',
    fontSize: 13,
  },
  libraryChipTextActive: {
    color: '#ffffff',
  },
  songList: {
    marginTop: 6,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  songCardActive: {
    borderColor: 'rgba(139, 92, 246, 0.7)',
    backgroundColor: 'rgba(32, 23, 55, 0.9)',
  },
  songCover: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  songMeta: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  songTitle: {
    color: '#f5f9ff',
    fontSize: 15,
    fontWeight: '800',
  },
  songArtist: {
    color: '#b2bfe1',
    fontSize: 13,
    marginTop: 2,
  },
  songTags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  songTag: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    color: '#dfe8ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '700',
    marginRight: 8,
  },
  songTagSecondary: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    color: '#bfe8ff',
  },
  songInfo: {
    width: 58,
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  songDuration: {
    color: '#dfe7ff',
    fontWeight: '700',
    fontSize: 12,
  },
  audioState: {
    marginTop: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  audioStateText: {
    color: '#8ef5c7',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  playerDock: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#101828',
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  playerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  playerCover: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  playerMeta: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  playerTitle: {
    color: '#f9fbff',
    fontSize: 15,
    fontWeight: '800',
  },
  playerArtist: {
    color: '#a0afd3',
    fontSize: 12,
    marginTop: 2,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  transportButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportButtonPrimary: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  transportText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyState: {
    marginTop: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    padding: 20,
  },
  emptyTitle: {
    color: '#f5f9ff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#b9c8ea',
    marginTop: 8,
    lineHeight: 20,
  },
});
