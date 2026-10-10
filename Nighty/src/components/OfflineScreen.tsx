import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LocalDownload } from '../services/localDownloads';
import { BottomSheetPlayer } from './BottomSheetPlayer';
import { SongItem } from '../types/api';

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
  const songs = Object.values(downloads);
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
          name: song.libraryName || 'Unknown library',
          songs: [song],
        });
      }
    });
    return Array.from(grouped.values());
  }, [songs]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const selectedLibrary = libraries.find((library) => library.id === selectedLibraryId);
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
  const playerSongs = selectedLibrary?.songs ?? [];
  const playerIndex = playerSongs.findIndex((song) => song.songId === playingSongId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{selectedLibrary ? selectedLibrary.name : 'Offline songs'}</Text>
      <Text style={styles.subtitle}>
        {selectedLibrary ? `${selectedLibrary.songs.length} downloaded` : `${songs.length} downloaded`}
      </Text>

      {songs.length === 0 ? (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>Downloaded songs will appear here.</Text>
        </View>
      ) : selectedLibrary ? (
        <>
          <Pressable style={styles.backButton} onPress={() => setSelectedLibraryId(null)}>
            <Text style={styles.backText}>‹ All offline libraries</Text>
          </Pressable>
          <FlatList
            data={selectedLibrary.songs}
            keyExtractor={(song) => song.songId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Pressable style={styles.info} onPress={() => onPlay(item)}>
                  <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                  <Text style={styles.badge}>
                    {playingSongId === item.songId ? 'Playing locally' : 'Available offline'}
                  </Text>
                </Pressable>
                <Pressable style={styles.playButton} onPress={() => onPlay(item)}>
                  <Text style={styles.playIcon}>{playingSongId === item.songId ? 'Ⅱ' : '▶'}</Text>
                </Pressable>
                <Pressable
                  style={styles.removeButton}
                  onPress={() =>
                    Alert.alert(
                      'Remove local song?',
                      'This removes only the downloaded file. The song stays in its online library.',
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
                >
                  <Text style={styles.removeIcon}>×</Text>
                </Pressable>
              </View>
            )}
          />
        </>
      ) : (
        <FlatList
          data={libraries}
          keyExtractor={(library) => library.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.libraryRow} onPress={() => setSelectedLibraryId(item.id)}>
              <View style={styles.info}>
                <Text style={styles.libraryTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.artist}>{item.songs.length} downloaded songs</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#888', marginTop: 6, marginBottom: 16 },
  list: { paddingBottom: 100 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { color: '#777', textAlign: 'center', fontSize: 15 },
  backButton: { marginBottom: 12 },
  backText: { color: '#1db954', fontSize: 14, fontWeight: '600' },
  row: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 14,
  },
  info: { flex: 1, minWidth: 0 },
  songTitle: { color: '#eee', fontSize: 15, fontWeight: '600' },
  libraryRow: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
  },
  libraryTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  artist: { color: '#777', fontSize: 13, marginTop: 3 },
  badge: { color: '#1db954', fontSize: 12, fontWeight: '700', marginTop: 3 },
  chevron: { color: '#1db954', fontSize: 28, marginLeft: 12 },
  playButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  playIcon: { color: '#1db954', fontSize: 20 },
  removeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  removeIcon: { color: '#ff7777', fontSize: 26 },
});
