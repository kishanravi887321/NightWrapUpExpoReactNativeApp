import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LibraryItem, SongItem } from '../types/api';
import { LocalDownload } from '../services/localDownloads';
import { LocalQueue, QueueMode } from '../services/localQueues';
import { BottomSheetPlayer } from './BottomSheetPlayer';

const MINI_HEIGHT = 64;

const modeLabels: Record<QueueMode, { icon: string; label: string }> = {
  online: { icon: '☁', label: 'Online' },
  offline: { icon: '⇩', label: 'Offline' },
  mixed: { icon: '⇄', label: 'Mixed' },
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
          libraryId:
            libraries.find((library) =>
              (songsByLibrary[library._id] ?? []).some((item) => item._id === song._id),
            )?._id ??
            downloads[song._id]?.libraryId ??
            '',
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* ── Top Bar matching LibraryScreen ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>♫</Text>
          </View>
          <Text style={styles.topBarTitle}>NightWrapUp</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          onPress={openCreate}
        >
          <Text style={styles.createButtonText}>+ New track</Text>
        </Pressable>
      </View>

      {/* ── Track Header matching LibraryScreen ── */}
      <View style={styles.trackHeader}>
        <View style={styles.trackHeaderInfo}>
          <Text style={styles.trackHeaderTitle}>Custom Tracks & Queues</Text>
          <Text style={styles.trackHeaderCount}>{queues.length} playlists</Text>
        </View>
      </View>

      {/* ── Queue List ── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {queues.map((queue) => {
          const modeInfo = modeLabels[queue.mode];
          return (
            <Pressable
              key={queue.id}
              style={({ pressed }) => [
                styles.queueCard,
                pressed && styles.queueCardPressed,
              ]}
              onPress={() => openQueue(queue)}
            >
              {/* Left mode badge */}
              <View style={styles.modeBadgeWrap}>
                <Text style={styles.modeBadgeIcon}>{modeInfo.icon}</Text>
              </View>

              {/* Info */}
              <View style={styles.queueInfo}>
                <Text style={styles.queueName} numberOfLines={1}>
                  {queue.name}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.modeLabel}>{modeInfo.label}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.trackCountText}>{queue.tracks.length} songs</Text>
                </View>
              </View>

              {/* Play Button */}
              <Pressable
                style={({ pressed }) => [styles.playBtn, pressed && styles.playBtnPressed]}
                onPress={() => onPlayQueue(queue)}
                hitSlop={8}
              >
                <Text style={styles.playIcon}>▶</Text>
              </Pressable>

              {/* Delete Button */}
              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
                onPress={() =>
                  Alert.alert('Delete track?', `Delete "${queue.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDeleteQueue(queue.id) },
                  ])
                }
                hitSlop={8}
              >
                <Text style={styles.deleteIcon}>×</Text>
              </Pressable>
            </Pressable>
          );
        })}

        {queues.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>☷</Text>
            </View>
            <Text style={styles.emptyTitle}>No tracks created</Text>
            <Text style={styles.emptySubtitle}>
              Combine your favourite online and offline songs into high-performance queues.
            </Text>
            <Pressable style={styles.emptyButton} onPress={openCreate}>
              <Text style={styles.emptyButtonText}>+ Create your first track</Text>
            </Pressable>
          </View>
        )}

        {/* Spacing for floating player */}
        <View style={{ height: MINI_HEIGHT + 30 }} />
      </ScrollView>

      {/* ── Create / Edit Modal ── */}
      <Modal
        visible={isCreating}
        transparent
        animationType="slide"
        onRequestClose={closeEditor}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingQueue ? 'Edit Track' : 'Create Track'}</Text>
              <Pressable onPress={closeEditor} hitSlop={10}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Track playlist name"
              placeholderTextColor="#4e657d"
              style={styles.modalInput}
            />

            {/* Mode selector pills */}
            <View style={styles.modeTabsRow}>
              {(['mixed', 'online', 'offline'] as QueueMode[]).map((item) => {
                const active = mode === item;
                const info = modeLabels[item];
                return (
                  <Pressable
                    key={item}
                    style={[styles.modeTab, active && styles.modeTabActive]}
                    onPress={() => {
                      setMode(item);
                      setSelectedSongIds([]);
                    }}
                  >
                    <Text style={[styles.modeTabIcon, active && styles.modeTabIconActive]}>
                      {info.icon}
                    </Text>
                    <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Song Picker */}
            <Text style={styles.pickerLabel}>
              Select songs ({selectedSongIds.length} selected)
            </Text>
            <ScrollView style={styles.songPickerList} showsVerticalScrollIndicator={false}>
              {selectableSongs.map((song) => {
                const selected = selectedSongIds.includes(song._id);
                const isDownloaded = Boolean(downloads[song._id]);
                return (
                  <Pressable
                    key={song._id}
                    style={[styles.songOption, selected && styles.songOptionSelected]}
                    onPress={() =>
                      setSelectedSongIds((current) =>
                        selected ? current.filter((id) => id !== song._id) : [...current, song._id],
                      )
                    }
                  >
                    <View style={styles.songOptionInfo}>
                      <Text style={[styles.songOptionTitle, selected && styles.songOptionTitleSelected]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.songOptionArtist} numberOfLines={1}>
                        {song.artist} {isDownloaded ? '· ⇩ Offline' : '· ☁ Stream'}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
              {selectableSongs.length === 0 && (
                <Text style={styles.noSongsNotice}>
                  {mode === 'offline'
                    ? 'No downloaded songs available for offline mode.'
                    : 'No songs available in your libraries.'}
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[
                  styles.submitBtn,
                  (!name.trim() || !selectedSongIds.length) && styles.submitBtnDisabled,
                ]}
                disabled={!name.trim() || !selectedSongIds.length}
                onPress={submit}
              >
                <Text style={styles.submitBtnText}>
                  {editingQueue ? 'Update Track' : 'Save Track'}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={closeEditor}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Persistent Bottom Player ── */}
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.12)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
    letterSpacing: 0.5,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
  },
  trackHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  trackHeaderCount: {
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 229, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  createButton: {
    backgroundColor: '#00e5ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    color: '#030914',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#051120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  queueCardPressed: {
    borderColor: 'rgba(0, 229, 255, 0.4)',
    backgroundColor: '#07172b',
  },
  modeBadgeWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modeBadgeIcon: {
    color: '#00e5ff',
    fontSize: 18,
    fontWeight: '700',
  },
  queueInfo: {
    flex: 1,
    minWidth: 0,
  },
  queueName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modeLabel: {
    color: '#00e5ff',
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: '#4e657d',
    marginHorizontal: 6,
    fontSize: 12,
  },
  trackCountText: {
    color: '#7b95b0',
    fontSize: 12,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  playBtnPressed: {
    backgroundColor: '#00e5ff',
  },
  playIcon: {
    color: '#00e5ff',
    fontSize: 14,
    marginLeft: 2,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  deleteBtnPressed: {
    backgroundColor: 'rgba(255, 80, 80, 0.15)',
  },
  deleteIcon: {
    color: '#7b95b0',
    fontSize: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#7b95b0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: '#00e5ff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 9, 20, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#051120',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
  },
  modalCloseText: {
    color: '#7b95b0',
    fontSize: 18,
    fontWeight: '600',
    padding: 4,
  },
  modalInput: {
    backgroundColor: '#07172b',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#07172b',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  modeTabActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00e5ff',
  },
  modeTabIcon: {
    color: '#7b95b0',
    fontSize: 14,
  },
  modeTabIconActive: {
    color: '#00e5ff',
  },
  modeTabText: {
    color: '#7b95b0',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#00e5ff',
  },
  pickerLabel: {
    color: '#7b95b0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  songPickerList: {
    maxHeight: 220,
    marginBottom: 16,
  },
  songOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07172b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  songOptionSelected: {
    borderColor: 'rgba(0, 229, 255, 0.35)',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  songOptionInfo: {
    flex: 1,
    minWidth: 0,
  },
  songOptionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  songOptionTitleSelected: {
    color: '#00e5ff',
  },
  songOptionArtist: {
    color: '#7b95b0',
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#4e657d',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkboxActive: {
    backgroundColor: '#00e5ff',
    borderColor: '#00e5ff',
  },
  checkmark: {
    color: '#030914',
    fontSize: 13,
    fontWeight: '800',
  },
  noSongsNotice: {
    color: '#7b95b0',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#00e5ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#030914',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  cancelBtnText: {
    color: '#7b95b0',
    fontSize: 14,
    fontWeight: '600',
  },
});
