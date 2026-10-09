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
};

/* â”€â”€â”€ Pull-up / Pull-down Bottom Sheet Player â”€â”€â”€ */
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
    if (!sharedYoutubeUrl) {
      setShareSelectedLibraryId(null);
    }
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
                <ActivityIndicator color="#1db954" size="small" />
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
                <ActivityIndicator color="#1db954" size="small" />
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
            <View style={styles.nowPlaying}>
              <Text style={styles.npLabel}>NOW PLAYING</Text>
              <View style={styles.npRow}>
                <ModularSongArtwork
                  uri={activeTrack.thumbnail}
                  fallbackUri={activeTrack.fallbackThumbnail}
                  style={styles.npCover}
                />
                <View style={styles.npMeta}>
                  <Text style={styles.npTitle} numberOfLines={2}>
                    {activeTrack.title}
                  </Text>
                  <Text style={styles.npArtist} numberOfLines={1}>
                    {activeTrack.artist}
                  </Text>
                  <Text style={styles.npDuration}>
                    {formatTime(activeTrack.duration)}
                  </Text>
                </View>
              </View>
            </View>
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
            tintColor="#1db954"
            colors={['#1db954']}
            progressBackgroundColor="#1a1a1a"
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
              return (
                <Pressable
                  key={song._id}
                  style={({ pressed }) => [
                    styles.songRow,
                    active && styles.songRowActive,
                    pressed && styles.songRowPressed,
                  ]}
                  onPress={() => onSongPress(song._id)}
                >
                  {/* Track Number */}
                  <View style={styles.songIndex}>
                    {active && isPlaying ? (
                      <Text style={styles.songIndexPlaying}>▶</Text>
                    ) : (
                      <Text
                        style={[
                          styles.songIndexText,
                          active && styles.songIndexTextActive,
                        ]}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>

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
                    {!song.audioReady && (
                      <View style={styles.queuedBadge}>
                        <Text style={styles.queuedText}>queued</Text>
                      </View>
                    )}
                    <Text style={styles.songDur}>
                      {formatTime(song.duration)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Bottom spacing for the sheet */}
        <View style={{ height: MINI_HEIGHT + 20 }} />
        </Animated.ScrollView>
      </View>

      {/* â”€â”€ Pull-up/Pull-down Bottom Sheet Player â”€â”€ */}
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
    backgroundColor: '#121212',
  },
  shareModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  shareModalCard: {
    maxHeight: '80%',
    backgroundColor: '#181818',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  shareModalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  shareModalDescription: {
    color: '#bbb',
    fontSize: 15,
    marginTop: 12,
  },
  createLibraryInput: {
    color: '#fff',
    backgroundColor: '#252525',
    borderRadius: 12,
    fontSize: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  createLibraryDescriptionInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  shareLibraryList: {
    marginTop: 12,
  },
  shareLibraryListContent: {
    gap: 10,
    paddingBottom: 12,
  },
  shareLibraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  shareLibraryButtonPressed: {
    backgroundColor: '#333',
  },
  shareLibraryButtonSelected: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    borderWidth: 1,
    borderColor: '#1db954',
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
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  shareLibraryCheck: {
    color: '#1db954',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
  },
  shareCreateLibraryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1db954',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  shareCreateLibraryButtonPressed: {
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
  },
  shareCreateLibraryIcon: {
    color: '#1db954',
    fontSize: 24,
    fontWeight: '500',
    marginRight: 10,
  },
  shareCreateLibraryText: {
    color: '#1db954',
    fontSize: 15,
    fontWeight: '700',
  },
  shareSaveButton: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1db954',
    paddingVertical: 14,
    marginTop: 4,
  },
  shareSaveButtonDisabled: {
    backgroundColor: '#3a3a3a',
  },
  shareSaveButtonPressed: {
    backgroundColor: '#18a34a',
  },
  shareSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareSavingStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#252525',
    paddingVertical: 14,
    marginTop: 4,
  },
  shareSavingText: {
    color: '#1db954',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  shareCancelButton: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1db954',
    paddingVertical: 14,
    marginTop: 4,
  },
  shareCancelText: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* â”€â”€ Top Bar â”€â”€ */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
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
    backgroundColor: '#252525',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 28,
  },
  topBarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topBarIconText: {
    color: '#fff',
    fontSize: 16,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  menuCard: {
    width: 190,
    marginTop: 58,
    marginLeft: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemIcon: {
    width: 26,
    color: '#1db954',
    fontSize: 22,
    textAlign: 'center',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },

  /* â”€â”€ Error â”€â”€ */
  errorBanner: {
    backgroundColor: 'rgba(220, 50, 50, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },

  /* â”€â”€ Now Playing â”€â”€ */
  nowPlaying: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#252525',
  },
  npLabel: {
    color: '#1db954',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  npRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  npCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#252525',
  },
  npMeta: {
    flex: 1,
    marginLeft: 14,
  },
  npTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  npArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 3,
  },
  npDuration: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  /* â”€â”€ Library Tabs â”€â”€ */
  libraryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#252525',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1db954',
    borderColor: '#1db954',
  },
  tabText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabCount: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
  },
  tabCountActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  /* â”€â”€ Track Header â”€â”€ */
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  trackHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  trackHeaderCount: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },

  /* â”€â”€ Song List â”€â”€ */
  songList: {
    paddingHorizontal: 8,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  songRowActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
  },
  songRowPressed: {
    backgroundColor: '#1a1a1a',
  },
  songIndex: {
    width: 28,
    alignItems: 'center',
  },
  songIndexText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  songIndexTextActive: {
    color: '#1db954',
  },
  songIndexPlaying: {
    color: '#1db954',
    fontSize: 12,
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#252525',
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: '600',
  },
  songTitleActive: {
    color: '#1db954',
  },
  songArtist: {
    color: '#777',
    fontSize: 13,
    marginTop: 2,
  },
  songRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  queuedBadge: {
    backgroundColor: '#252525',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  queuedText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  songDur: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },

  /* â”€â”€ Empty â”€â”€ */
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
    color: '#ccc',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”€â”€ Bottom Sheet (Pull-up Player) â”€â”€
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#181818',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  dragZone: {
    // The top area that is always visible and draggable
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
  },

  /* â”€â”€ Mini Row (collapsed) â”€â”€ */
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    height: MINI_HEIGHT - 12, // minus drag handle height
  },
  miniCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#252525',
  },
  miniMeta: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  miniTitle: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '600',
  },
  miniArtist: {
    color: '#777',
    fontSize: 12,
    marginTop: 1,
  },
  miniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  miniBtnText: {
    color: '#bbb',
    fontSize: 15,
  },
  miniBtnPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginRight: 2,
  },
  miniBtnPlayText: {
    color: '#fff',
    fontSize: 17,
  },

  /* â”€â”€ Expanded Content â”€â”€ */
  expandedContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    alignItems: 'center',
  },
  expandedCoverWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#252525',
  },
  expandedTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  expandedArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 3,
    textAlign: 'center',
  },
  queueLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  /* â”€â”€ Progress Bar â”€â”€ */
  progressRow: {
    width: '100%',
    marginTop: 14,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#1db954',
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTime: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },

  /* â”€â”€ Expanded Controls â”€â”€ */
  expandedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  exBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exBtnPressed: {
    backgroundColor: '#333',
  },
  exBtnText: {
    color: '#ccc',
    fontSize: 20,
  },
  exBtnPlay: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exBtnPlayPressed: {
    backgroundColor: '#18a34a',
  },
  exBtnPlayText: {
    color: '#fff',
    fontSize: 24,
  },

  /* â”€â”€ Status â”€â”€ */
  expandedStatus: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
});
