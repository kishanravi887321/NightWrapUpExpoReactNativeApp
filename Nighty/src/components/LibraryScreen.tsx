import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryItem, SongItem } from '../types/api';
import { formatTime } from '../utils/format';
import { BottomSheetPlayer as ModularBottomSheetPlayer } from './BottomSheetPlayer';
import { SongArtwork as ModularSongArtwork } from './SongArtwork';
import { TopMusicPlayerCard } from './TopMusicPlayerCard';
import { RowWaveVisualizer } from './RowWaveVisualizer';
import { LocalDownload } from '../services/localDownloads';

const MINI_HEIGHT = 64;

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
  currentTime: number;
  totalDuration: number;
  trackNumber: number;
  trackCount: number;
  onSeek: (seconds: number) => void;
  onLogout: () => void;
  onTogglePlay: () => void;
  onRefresh: () => void;
  isPlaying: boolean;
  sharedYoutubeUrl: string | null;
  isSavingSharedSong: boolean;
  onSaveSharedSong: (libraryId: string) => void;
  onDismissSharedSong: () => void;
  isCreatingLibrary: boolean;
  onCreateLibrary: (name: string, description: string) => Promise<LibraryItem>;
  localDownloads: Record<string, LocalDownload>;
  downloadingSongId: string | null;
  downloadProgress: number;
  onDownloadSong: (song: SongItem, libraryId: string, libraryName: string) => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
};

type SongRowItemProps = {
  song: SongItem;
  index?: number;
  active: boolean;
  isPlaying: boolean;
  isDownloaded: boolean;
  downloadProgressText: string | null;
  canDownload: boolean;
  isDownloadDisabled: boolean;
  onPress: () => void;
  onDownloadPress: () => void;
};

const SongRowItem = React.memo(function SongRowItem({
  song,
  index: _index,
  active,
  isPlaying,
  isDownloaded,
  downloadProgressText,
  canDownload,
  isDownloadDisabled,
  onPress,
  onDownloadPress,
}: SongRowItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.songRow,
        active && styles.songRowActive,
        pressed && styles.songRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Cover */}
      <ModularSongArtwork
        uri={song.thumbnail}
        fallbackUri={song.fallbackThumbnail}
        style={styles.songCover}
      />

      {/* Info */}
      <View style={styles.songInfo}>
        <Text
          style={[
            styles.songTitle,
            active && styles.songTitleActive,
          ]}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      {/* Status & Duration */}
      <View style={styles.songRight}>
        {active && (
          <View style={styles.rowWaveContainer}>
            <RowWaveVisualizer isPlaying={isPlaying} maxHeight={12} />
          </View>
        )}
        {!song.audioReady && (
          <View style={styles.queuedBadge}>
            <Text
              style={styles.queuedText}
              accessibilityLabel="Pending audio"
            >
              ⏳
            </Text>
          </View>
        )}
        <Text style={[styles.songDur, active && styles.songDurActive]}>
          {formatTime(song.duration)}
        </Text>
        {isDownloaded ? (
          <Text
            style={styles.downloadedBadge}
            accessibilityLabel="Available offline"
          >
            ⇩
          </Text>
        ) : canDownload ? (
          <Pressable
            style={styles.downloadButton}
            onPressIn={(event) => event.stopPropagation()}
            onPress={onDownloadPress}
            disabled={isDownloadDisabled}
            accessibilityRole="button"
            accessibilityLabel={`Download ${song.title}`}
          >
            {downloadProgressText ? (
              <Text style={styles.downloadProgress}>
                {downloadProgressText}
              </Text>
            ) : (
              <Text style={styles.onlineBadge}>☁</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
});

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
  currentTime,
  totalDuration,
  trackNumber,
  trackCount,
  onSeek,
  onLogout,
  onTogglePlay,
  onRefresh,
  isPlaying,
  sharedYoutubeUrl,
  isSavingSharedSong,
  onSaveSharedSong,
  onDismissSharedSong,
  isCreatingLibrary,
  onCreateLibrary,
  localDownloads,
  downloadingSongId,
  downloadProgress,
  onDownloadSong,
  isRepeat,
  onToggleRepeat,
  isShuffle,
  onToggleShuffle,
}: LibraryScreenProps) {
  const selectedLibrary =
    libraries.find((l) => l._id === selectedLibraryId) ?? null;
  const [shareSelectedLibraryId, setShareSelectedLibraryId] = useState<string | null>(null);
  const [isCreateLibraryVisible, setIsCreateLibraryVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [newLibraryDescription, setNewLibraryDescription] = useState('');
  const [collapsibleHeaderHeight, setCollapsibleHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const shouldCollapseHeader = selectedSongs.length > 1;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, collapsibleHeaderHeight || 1],
    outputRange: [0, shouldCollapseHeader ? -(collapsibleHeaderHeight || 1) : 0],
    extrapolate: 'clamp',
  });

  React.useEffect(() => {
    setShareSelectedLibraryId(null);
    setIsCreateLibraryVisible(false);
  }, [sharedYoutubeUrl]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <Modal
        visible={Boolean(sharedYoutubeUrl)}
        transparent
        animationType="slide"
        onRequestClose={onDismissSharedSong}
      >
        <View style={styles.shareModalBackdrop}>
          <View style={styles.shareModalCard}>
            <Text style={styles.shareModalTitle}>Save to library</Text>
            <Text style={styles.shareModalDescription}>
              Choose a library for the shared song.
            </Text>

            <ScrollView
              style={styles.shareLibraryList}
              contentContainerStyle={styles.shareLibraryListContent}
              showsVerticalScrollIndicator={false}
            >
              {libraries.map((library) => (
                <Pressable
                  key={library._id}
                  style={({ pressed }) => [
                    styles.shareLibraryButton,
                    shareSelectedLibraryId === library._id && styles.shareLibraryButtonSelected,
                    pressed && styles.shareLibraryButtonPressed,
                  ]}
                  disabled={isSavingSharedSong}
                  onPress={() => setShareSelectedLibraryId(library._id)}
                >
                  <View style={styles.shareLibraryText}>
                    <Text style={styles.shareLibraryName}>{library.name}</Text>
                    {library.songCount != null && (
                      <Text style={styles.shareLibraryCount}>{library.songCount} tracks</Text>
                    )}
                  </View>
                  {shareSelectedLibraryId === library._id && (
                    <Text style={styles.shareLibraryCheck}>✓</Text>
                  )}
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [
                  styles.shareCreateLibraryButton,
                  pressed && styles.shareCreateLibraryButtonPressed,
                ]}
                disabled={isSavingSharedSong || isCreatingLibrary}
                onPress={() => setIsCreateLibraryVisible(true)}
              >
                <Text style={styles.shareCreateLibraryIcon}>+</Text>
                <Text style={styles.shareCreateLibraryText}>Create new library</Text>
              </Pressable>
            </ScrollView>

            {isSavingSharedSong ? (
              <View style={styles.shareSavingStatus}>
                <ActivityIndicator color="#00e5ff" size="small" />
                <Text style={styles.shareSavingText}>Saving song...</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.shareSaveButton,
                  !shareSelectedLibraryId && styles.shareSaveButtonDisabled,
                  pressed && shareSelectedLibraryId && styles.shareSaveButtonPressed,
                ]}
                disabled={!shareSelectedLibraryId}
                onPress={() => {
                  if (shareSelectedLibraryId) {
                    onSaveSharedSong(shareSelectedLibraryId);
                  }
                }}
              >
                <Text style={styles.shareSaveText}>Save</Text>
              </Pressable>
            )}

            {!isSavingSharedSong && (
              <Pressable style={styles.shareCancelButton} onPress={onDismissSharedSong}>
                <Text style={styles.shareCancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCreateLibraryVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isCreatingLibrary) setIsCreateLibraryVisible(false);
        }}
      >
        <View style={styles.shareModalBackdrop}>
          <View style={styles.shareModalCard}>
            <Text style={styles.shareModalTitle}>Create library</Text>
            <Text style={styles.shareModalDescription}>
              Create a library for organizing your songs.
            </Text>
            <TextInput
              value={newLibraryName}
              onChangeText={setNewLibraryName}
              placeholder="Library name"
              placeholderTextColor="#666"
              style={styles.createLibraryInput}
              editable={!isCreatingLibrary}
              autoFocus
            />
            <TextInput
              value={newLibraryDescription}
              onChangeText={setNewLibraryDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#666"
              style={[styles.createLibraryInput, styles.createLibraryDescriptionInput]}
              editable={!isCreatingLibrary}
              multiline
              numberOfLines={3}
            />
            {isCreatingLibrary ? (
              <View style={styles.shareSavingStatus}>
                <ActivityIndicator color="#00e5ff" size="small" />
                <Text style={styles.shareSavingText}>Creating library...</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.shareSaveButton,
                  !newLibraryName.trim() && styles.shareSaveButtonDisabled,
                  pressed && newLibraryName.trim() && styles.shareSaveButtonPressed,
                ]}
                disabled={!newLibraryName.trim()}
                onPress={async () => {
                  try {
                    const createdLibrary = await onCreateLibrary(newLibraryName, newLibraryDescription);
                    setNewLibraryName('');
                    setNewLibraryDescription('');
                    setIsCreateLibraryVisible(false);
                    if (sharedYoutubeUrl) {
                      setShareSelectedLibraryId(createdLibrary._id);
                    }
                  } catch {
                    // The parent displays the API error and keeps the modal open.
                  }
                }}
              >
                <Text style={styles.shareSaveText}>Create</Text>
              </Pressable>
            )}
            {!isCreatingLibrary && (
              <Pressable
                style={styles.shareCancelButton}
                onPress={() => setIsCreateLibraryVisible(false)}
              >
                <Text style={styles.shareCancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                setIsCreateLibraryVisible(true);
              }}
            >
              <Text style={styles.menuItemIcon}>+</Text>
              <Text style={styles.menuItemText}>New library</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                onLogout();
              }}
            >
              <Text style={styles.menuItemIcon}>↪</Text>
              <Text style={styles.menuItemText}>Sign out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* â”€â”€ Top Bar â”€â”€ */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            onPress={() => setIsMenuVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <Text style={styles.menuButtonText}>☰</Text>
          </Pressable>
          <View style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>♫</Text>
          </View>
          <Text style={styles.topBarTitle}>NightWrapUp</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      <View style={styles.libraryContent}>
        <Animated.View
          style={[
            styles.collapsibleHeader,
            { transform: [{ translateY: headerTranslateY }] },
          ]}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height !== collapsibleHeaderHeight) {
              setCollapsibleHeaderHeight(height);
            }
          }}
        >
          {/* â”€â”€ Now Playing Card â”€â”€ */}
          {activeTrack ? (
            <TopMusicPlayerCard
              activeTrack={activeTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              totalDuration={totalDuration}
              onTogglePlay={onTogglePlay}
              onPrevious={onPrevious}
              onNext={onNext}
              onSeek={onSeek}
              isRepeat={isRepeat}
              onToggleRepeat={onToggleRepeat}
              isShuffle={isShuffle}
              onToggleShuffle={onToggleShuffle}
            />
          ) : null}

          {/* â”€â”€ Library Tabs â”€â”€ */}
          <View style={styles.libraryTabsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabStrip}
              style={styles.libraryTabsScroll}
            >
              {libraries.map((lib) => {
                const active = lib._id === selectedLibraryId;
                return (
                  <Pressable
                    key={lib._id}
                    style={[styles.tab, active && styles.tabActive]}
                    onPress={() => onLibraryChange(lib._id)}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {lib.name}
                    </Text>
                    {lib.songCount != null && (
                      <Text style={[styles.tabCount, active && styles.tabCountActive]}>
                        {lib.songCount}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* â”€â”€ Track Count â”€â”€ */}
          <View style={styles.trackHeader}>
            <View style={styles.trackHeaderInfo}>
              <Text style={styles.trackHeaderTitle}>
                {selectedLibrary?.name ?? 'Tracks'}
              </Text>
              <Text style={styles.trackHeaderCount}>
                {isLoading ? 'Loading...' : `${selectedSongs.length} tracks`}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: collapsibleHeaderHeight },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#00e5ff"
            colors={['#00e5ff']}
            progressBackgroundColor="#07172b"
          />
        }
      >
        {/* â”€â”€ Song List â”€â”€ */}
        {selectedSongs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyTitle}>No tracks</Text>
            <Text style={styles.emptyText}>
              This library is empty. Pull down to refresh.
            </Text>
          </View>
        ) : (
          <View style={styles.songList}>
            {selectedSongs.map((song, i) => {
              const active = song._id === activeTrack?._id;
              const isDownloaded = Boolean(localDownloads[song._id]);
              const isDownloading = downloadingSongId === song._id;
              const progressText = isDownloading ? `${Math.round(downloadProgress * 100)}%` : null;

              return (
                <SongRowItem
                  key={song._id}
                  song={song}
                  index={i}
                  active={active}
                  isPlaying={isPlaying}
                  isDownloaded={isDownloaded}
                  downloadProgressText={progressText}
                  canDownload={song.audioReady}
                  isDownloadDisabled={downloadingSongId !== null}
                  onPress={() => onSongPress(song._id)}
                  onDownloadPress={() => {
                    if (selectedLibrary) {
                      onDownloadSong(song, selectedLibrary._id, selectedLibrary.name);
                    }
                  }}
                />
              );
            })}
          </View>
        )}

        {/* Bottom spacing for the bottom player */}
        <View style={{ height: MINI_HEIGHT + 24 }} />
        </Animated.ScrollView>
      </View>

      {/* ── Bottom Sheet Player for jumping in song & next song ── */}
      {activeTrack ? (
        <ModularBottomSheetPlayer
          activeTrack={activeTrack}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onPrevious={onPrevious}
          onNext={onNext}
          currentTime={currentTime}
          totalDuration={totalDuration}
          trackNumber={trackNumber}
          trackCount={trackCount}
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
    position: 'relative',
  },
  shareModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(1, 6, 14, 0.75)',
  },
  shareModalCard: {
    maxHeight: '80%',
    backgroundColor: '#051120',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 229, 255, 0.25)',
  },
  shareModalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  shareModalDescription: {
    color: '#7b95b0',
    fontSize: 14,
    marginTop: 8,
  },
  createLibraryInput: {
    color: '#fff',
    backgroundColor: '#07172b',
    borderRadius: 12,
    fontSize: 15,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  createLibraryDescriptionInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  shareLibraryList: {
    marginTop: 14,
  },
  shareLibraryListContent: {
    gap: 10,
    paddingBottom: 12,
  },
  shareLibraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#07172b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
  },
  shareLibraryButtonPressed: {
    backgroundColor: '#0a1f38',
  },
  shareLibraryButtonSelected: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00e5ff',
  },
  shareLibraryText: {
    flex: 1,
  },
  shareLibraryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareLibraryCount: {
    color: '#7b95b0',
    fontSize: 12,
    marginTop: 3,
  },
  shareLibraryCheck: {
    color: '#00e5ff',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
  },
  shareCreateLibraryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00e5ff',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  shareCreateLibraryButtonPressed: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
  },
  shareCreateLibraryIcon: {
    color: '#00e5ff',
    fontSize: 22,
    fontWeight: '700',
    marginRight: 10,
  },
  shareCreateLibraryText: {
    color: '#00e5ff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareSaveButton: {
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#00e5ff',
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  shareSaveButtonDisabled: {
    backgroundColor: '#0c1b2c',
    shadowOpacity: 0,
    elevation: 0,
  },
  shareSaveButtonPressed: {
    opacity: 0.85,
  },
  shareSaveText: {
    color: '#030914',
    fontSize: 16,
    fontWeight: '800',
  },
  shareSavingStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#07172b',
    paddingVertical: 14,
    marginTop: 6,
  },
  shareSavingText: {
    color: '#00e5ff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  shareCancelButton: {
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#091829',
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  shareCancelText: {
    color: '#7b95b0',
    fontSize: 15,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  libraryContent: {
    flex: 1,
    position: 'relative',
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: '#030914',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* ── Top Bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.12)',
    backgroundColor: '#030914',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 18,
  },
  menuButtonPressed: {
    backgroundColor: '#07172b',
  },
  menuButtonText: {
    color: '#00e5ff',
    fontSize: 22,
    lineHeight: 26,
  },
  topBarIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#041324',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  topBarIconText: {
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: '700',
  },
  topBarTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(1, 6, 14, 0.5)',
  },
  menuCard: {
    width: 190,
    marginTop: 58,
    marginLeft: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#051222',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemIcon: {
    width: 26,
    color: '#00e5ff',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  menuItemText: {
    color: '#e2ebf5',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },

  /* ── Error ── */
  errorBanner: {
    backgroundColor: 'rgba(255, 80, 80, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 80, 80, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Library Tabs ── */
  libraryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  libraryTabsScroll: {
    flex: 1,
  },
  trackHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  tabStrip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#061324',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#00e5ff',
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    color: '#7b95b0',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#030914',
    fontWeight: '800',
  },
  tabCount: {
    color: '#49637d',
    fontSize: 11,
    fontWeight: '700',
  },
  tabCountActive: {
    color: 'rgba(3, 9, 20, 0.75)',
    fontWeight: '800',
  },

  /* ── Track Header ── */
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
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

  /* ── Song List ── */
  songList: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  songRowActive: {
    backgroundColor: 'transparent',
  },
  songRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  songIndex: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  songIndexText: {
    color: '#4e657d',
    fontSize: 14,
    fontWeight: '600',
  },
  songIndexTextActive: {
    color: '#00e5ff',
    fontWeight: '800',
  },
  miniEqualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 14,
    gap: 2,
  },
  miniEqBar: {
    width: 2.5,
    backgroundColor: '#00e5ff',
    borderRadius: 1.5,
  },
  songCover: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#071526',
    marginRight: 14,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  songTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  songTitleActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },
  songArtist: {
    color: '#7b95b0',
    fontSize: 13,
    marginTop: 2,
  },
  songRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  queuedBadge: {
    backgroundColor: '#0a1d33',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  queuedText: {
    color: '#7895b3',
    fontSize: 10,
    fontWeight: '600',
  },
  songDur: {
    color: '#5d768f',
    fontSize: 12,
    fontWeight: '500',
  },
  songDurActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },
  rowWaveContainer: {
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadedBadge: {
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '800',
  },
  onlineBadge: {
    color: '#506c88',
    fontSize: 15,
    fontWeight: '600',
  },
  downloadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  downloadProgress: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
  },

  /* ── Empty ── */
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#c5d5e5',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#657e96',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
