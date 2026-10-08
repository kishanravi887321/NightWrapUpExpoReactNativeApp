import React from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryItem, SongItem } from '../types/api';
import { formatTime } from '../utils/format';

function SongArtwork({
  uri,
  fallbackUri,
  style,
}: {
  uri: string;
  fallbackUri: string;
  style: object;
}) {
  const [imageUri, setImageUri] = React.useState(uri);

  React.useEffect(() => {
    setImageUri(uri);
  }, [uri]);

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode="cover"
      onError={() => {
        if (imageUri !== fallbackUri) {
          setImageUri(fallbackUri);
        }
      }}
    />
  );
}

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
  onRefresh: () => void;
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
  onRefresh,
  isPlaying,
}: LibraryScreenProps) {
  const selectedLibrary = libraries.find((library) => library._id === selectedLibraryId) ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#a78bfa"
            colors={['#8b5cf6']}
            progressBackgroundColor="#111a2d"
          />
        }
      >
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
              <SongArtwork
                uri={activeTrack.thumbnail}
                fallbackUri={activeTrack.fallbackThumbnail}
                style={styles.heroCover}
              />
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your library</Text>
          <Text style={styles.sectionLink}>{isLoading ? 'Loading…' : `${selectedSongs.length} songs`}</Text>
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
            <Text style={styles.libraryTitle} numberOfLines={1} ellipsizeMode="tail">
              {selectedLibrary.name}
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
                  <SongArtwork
                    uri={song.thumbnail}
                    fallbackUri={song.fallbackThumbnail}
                    style={styles.songCover}
                  />
                  <View style={styles.songMeta}>
                    <Text style={styles.songTitle} numberOfLines={1} ellipsizeMode="tail">
                      {song.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1} ellipsizeMode="tail">
                      {song.artist}
                    </Text>
                    <View style={styles.songTags}>
                      <Text style={styles.songTag}>{song.audioReady ? 'Available' : 'Not ready'}</Text>
                    </View>
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songDuration}>{formatTime(song.duration)}</Text>
                    <Text style={styles.rowPlayIcon}>{isCurrent && isPlaying ? 'Ⅱ' : '▶'}</Text>
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
            <SongArtwork
              uri={activeTrack.thumbnail}
              fallbackUri={activeTrack.fallbackThumbnail}
              style={styles.playerCover}
            />
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
  heroCover: {
    width: 86,
    height: 110,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: '#253553',
  },
  heroTextWrap: {
    flex: 1,
    minWidth: 0,
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
  sectionHeader: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    flexShrink: 1,
    color: '#edf4ff',
    fontSize: 18,
    fontWeight: '800',
  },
  libraryTitle: {
    flex: 1,
    color: '#edf4ff',
    fontSize: 22,
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
    backgroundColor: '#111a2d',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    marginTop: 2,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 3,
    minHeight: 72,
  },
  songCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  songCover: {
    width: 56,
    height: 56,
    borderRadius: 10,
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
    marginTop: 5,
  },
  songTag: {
    color: '#8190ad',
    fontSize: 11,
    fontWeight: '600',
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
  rowPlayIcon: {
    color: '#a78bfa',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  playerDock: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#111a2d',
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  playerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  playerCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportButtonPrimary: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
