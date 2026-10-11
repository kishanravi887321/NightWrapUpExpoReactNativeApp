import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LibraryItem, SongItem } from '../types/api';
import { LocalDownload } from '../services/localDownloads';
import { LocalQueue, QueueMode } from '../services/localQueues';
import { BottomSheetPlayer } from './BottomSheetPlayer';

const modeIcon: Record<QueueMode, string> = {
  online: '☁',
  offline: '⇩',
  mixed: '⇄',
};

type TracksScreenProps = {
  queues: LocalQueue[];
  libraries: LibraryItem[];
  songsByLibrary: Record<string, SongItem[]>;
  downloads: Record<string, LocalDownload>;
  onCreateQueue: (name: string, mode: QueueMode, songs: SongItem[]) => void;
  onDeleteQueue: (queueId: string) => void;
  onUpdateQueue: (queue: LocalQueue) => void;
  onPlayQueue: (queue: LocalQueue) => void;
  activeTrack: SongItem | null;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
};

export function TracksScreen({
  queues,
  libraries,
  songsByLibrary,
  downloads,
  onCreateQueue,
  onDeleteQueue,
  onUpdateQueue,
  onPlayQueue,
  activeTrack,
  isPlaying,
  currentTime,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
}: TracksScreenProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<QueueMode>('mixed');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [editingQueue, setEditingQueue] = useState<LocalQueue | null>(null);
  const allSongs = useMemo(
    () => libraries.flatMap((library) => songsByLibrary[library._id] ?? []),
    [libraries, songsByLibrary],
  );
  const selectableSongs = allSongs.filter((song) => {
    if (mode === 'offline') return Boolean(downloads[song._id]);
    return true;
  });

  const closeEditor = () => {
    setIsCreating(false);
    setEditingQueue(null);
    setName('');
    setSelectedSongIds([]);
    setMode('mixed');
  };

  const openCreate = () => {
    setEditingQueue(null);
    setName('');
    setMode('mixed');
    setSelectedSongIds([]);
    setIsCreating(true);
  };

  const openQueue = (queue: LocalQueue) => {
    setEditingQueue(queue);
    setName(queue.name);
    setMode(queue.mode);
    setSelectedSongIds(queue.tracks.map((track) => track.songId));
    setIsCreating(true);
  };

  const submit = () => {
    if (!name.trim() || selectedSongIds.length === 0) return;
    const selectedSongs = selectableSongs.filter((song) => selectedSongIds.includes(song._id));
    if (editingQueue) {
      onUpdateQueue({
        ...editingQueue,
        name: name.trim(),
        mode,
        tracks: selectedSongs.map((song) => ({
          songId: song._id,
          libraryId: libraries.find((library) => (songsByLibrary[library._id] ?? []).some((item) => item._id === song._id))?._id ?? downloads[song._id]?.libraryId ?? '',
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail,
          duration: song.duration,
          audioUrl: song.audioUrl,
          localUri: downloads[song._id]?.localUri,
        })),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onCreateQueue(name, mode, selectedSongs);
    }
    closeEditor();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracks</Text>
      <Text style={styles.subtitle}>{queues.length} saved tracks</Text>
      <Pressable style={styles.createButton} onPress={openCreate}>
        <Text style={styles.createText}>+ Create track</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.list}>
        {queues.map((queue) => (
          <Pressable key={queue.id} style={styles.queueRow} onPress={() => openQueue(queue)}>
            <View style={styles.info}>
              <Text style={styles.queueName}>{queue.name}</Text>
                <Text style={styles.meta}>{modeIcon[queue.mode]} · {queue.tracks.length} songs</Text>
            </View>
            <Pressable onPress={() => onPlayQueue(queue)}><Text style={styles.play}>▶</Text></Pressable>
            <Pressable onPress={() => Alert.alert('Delete track?', 'Are you sure you want to delete this track?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteQueue(queue.id) },
            ])}><Text style={styles.remove}>×</Text></Pressable>
          </Pressable>
        ))}
        {queues.length === 0 && <Text style={styles.empty}>Create a local track to start listening.</Text>}
      </ScrollView>

      <Modal visible={isCreating} animationType="slide" onRequestClose={closeEditor}>
        <View style={styles.modal}>
          <Text style={styles.title}>{editingQueue ? 'Edit track' : 'Create track'}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Track name"
            placeholderTextColor="#666"
            style={styles.input}
          />
          <View style={styles.modeRow}>
            {(['online', 'offline', 'mixed'] as QueueMode[]).map((item) => (
              <Pressable key={item} style={[styles.modeButton, mode === item && styles.modeActive]} onPress={() => {
                setMode(item);
                setSelectedSongIds([]);
              }}>
                <Text style={styles.modeText}>{modeIcon[item]}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView style={styles.songPicker}>
            {selectableSongs.map((song) => {
              const selected = selectedSongIds.includes(song._id);
              return (
                <Pressable key={song._id} style={styles.songOption} onPress={() => setSelectedSongIds((current) =>
                  selected ? current.filter((id) => id !== song._id) : [...current, song._id],
                )}>
                  <View style={styles.info}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.meta}>{song.artist} · {downloads[song._id] ? '⇩' : '☁'}</Text>
                  </View>
                  <Text style={selected ? styles.selected : styles.checkbox}>{selected ? '✓' : '○'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={[styles.createButton, (!name.trim() || !selectedSongIds.length) && styles.disabled]} disabled={!name.trim() || !selectedSongIds.length} onPress={submit}>
            <Text style={styles.createText}>Save track</Text>
          </Pressable>
          <Pressable style={styles.cancel} onPress={closeEditor}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View>
      </Modal>
      {activeTrack ? (
        <BottomSheetPlayer
          activeTrack={activeTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          totalDuration={activeTrack.duration}
          trackNumber={1}
          trackCount={1}
          onTogglePlay={onTogglePlay}
          onPrevious={onPrevious}
          onNext={onNext}
          onSeek={onSeek}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  modal: { flex: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#888', marginTop: 6, marginBottom: 16 },
  createButton: { alignItems: 'center', backgroundColor: '#1db954', borderRadius: 10, padding: 14 },
  createText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { paddingVertical: 16, paddingBottom: 100 },
  queueRow: { alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, flexDirection: 'row', marginBottom: 8, padding: 16 },
  info: { flex: 1, minWidth: 0 },
  queueName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  meta: { color: '#777', fontSize: 12, marginTop: 4 },
  play: { color: '#1db954', fontSize: 20, padding: 8 },
  remove: { color: '#ff7777', fontSize: 26, padding: 8 },
  empty: { color: '#777', paddingTop: 40, textAlign: 'center' },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, color: '#fff', fontSize: 16, marginTop: 20, padding: 14 },
  modeRow: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  modeButton: { borderColor: '#333', borderRadius: 8, borderWidth: 1, flex: 1, padding: 10 },
  modeActive: { backgroundColor: '#1db954', borderColor: '#1db954' },
  modeText: { color: '#fff', fontSize: 12, textAlign: 'center', textTransform: 'capitalize' },
  songPicker: { flex: 1 },
  songOption: { alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, flexDirection: 'row', marginBottom: 6, padding: 12 },
  songTitle: { color: '#eee', fontSize: 14, fontWeight: '600' },
  selected: { color: '#1db954', fontSize: 22 },
  checkbox: { color: '#777', fontSize: 22 },
  disabled: { backgroundColor: '#444' },
  cancel: { alignItems: 'center', padding: 16 },
  cancelText: { color: '#aaa', fontWeight: '600' },
});
