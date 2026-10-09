import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_HEIGHT = 64;
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.42);
const SNAP_THRESHOLD = 60;

/* ─── Artwork with fallback ─── */
function SongArtwork({
  uri,
  fallbackUri,
  style,
}: {
  uri: string;
  fallbackUri: string;
  style: object;
}) {
  const [imageUri, setImageUri] = useState(uri);

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
  currentTime: number;
  totalDuration: number;
  trackNumber: number;
  trackCount: number;
  onSeek: (seconds: number) => void;
  onLogout: () => void;
  onTogglePlay: () => void;
  onRefresh: () => void;
  isPlaying: boolean;
};

/* ─── Pull-up / Pull-down Bottom Sheet Player ─── */
function BottomSheetPlayer({
  activeTrack,
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  currentTime,
  totalDuration,
  trackNumber,
  trackCount,
  onSeek,
}: {
  activeTrack: SongItem;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentTime: number;
  totalDuration: number;
  trackNumber: number;
  trackCount: number;
  onSeek: (seconds: number) => void;
}) {
  const sheetHeight = useRef(new Animated.Value(MINI_HEIGHT)).current;
  const isExpanded = useRef(false);
  const lastHeight = useRef(MINI_HEIGHT);
  const [progressWidth, setProgressWidth] = useState(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 8,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((val) => {
          lastHeight.current = val;
          sheetHeight.setOffset(val);
          sheetHeight.setValue(0);
        });
      },
      onPanResponderMove: (_, gesture) => {
        // Dragging up = negative dy = increase height
        const newVal = -gesture.dy;
        sheetHeight.setValue(newVal);
      },
      onPanResponderRelease: (_, gesture) => {
        sheetHeight.flattenOffset();
        const currentHeight = lastHeight.current + (-gesture.dy);
        const goingUp = gesture.dy < 0;

        let target: number;
        if (goingUp && (currentHeight > MINI_HEIGHT + SNAP_THRESHOLD || Math.abs(gesture.vy) > 0.5)) {
          target = EXPANDED_HEIGHT;
          isExpanded.current = true;
        } else if (!goingUp && (currentHeight < EXPANDED_HEIGHT - SNAP_THRESHOLD || Math.abs(gesture.vy) > 0.5)) {
          target = MINI_HEIGHT;
          isExpanded.current = false;
        } else {
          target = isExpanded.current ? EXPANDED_HEIGHT : MINI_HEIGHT;
        }

        Animated.spring(sheetHeight, {
          toValue: target,
          friction: 9,
          tension: 80,
          useNativeDriver: false,
        }).start(() => {
          lastHeight.current = target;
        });
      },
    }),
  ).current;

  const toggleSheet = () => {
    const target = isExpanded.current ? MINI_HEIGHT : EXPANDED_HEIGHT;
    isExpanded.current = !isExpanded.current;
    Animated.spring(sheetHeight, {
      toValue: target,
      friction: 9,
      tension: 80,
      useNativeDriver: false,
    }).start(() => {
      lastHeight.current = target;
    });
  };

  // Interpolations
  const clampedHeight = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, EXPANDED_HEIGHT],
    outputRange: [MINI_HEIGHT, EXPANDED_HEIGHT],
    extrapolate: 'clamp',
  });

  const expandedOpacity = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, MINI_HEIGHT + 40, EXPANDED_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const miniOpacity = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, MINI_HEIGHT + 60, EXPANDED_HEIGHT],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const expandedCoverSize = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, EXPANDED_HEIGHT],
    outputRange: [0, 120],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.sheet, { height: clampedHeight }]}>
      {/* Drag Handle */}
      <View {...panResponder.panHandlers} style={styles.dragZone}>
        <Pressable onPress={toggleSheet} style={styles.dragHandleWrap}>
          <View style={styles.dragHandle} />
        </Pressable>

        {/* ── Mini Player (visible when collapsed) ── */}
        <Animated.View style={[styles.miniRow, { opacity: miniOpacity }]}>
          <SongArtwork
            uri={activeTrack.thumbnail}
            fallbackUri={activeTrack.fallbackThumbnail}
            style={styles.miniCover}
          />
          <View style={styles.miniMeta}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {activeTrack.title}
            </Text>
            <Text style={styles.miniArtist} numberOfLines={1}>
              {activeTrack.artist}
            </Text>
          </View>
          <Pressable style={styles.miniBtn} onPress={onPrevious}>
            <Text style={styles.miniBtnText}>⏮</Text>
          </Pressable>
          <Pressable style={styles.miniBtnPlay} onPress={onTogglePlay}>
            <Text style={styles.miniBtnPlayText}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>
          <Pressable style={styles.miniBtn} onPress={onNext}>
            <Text style={styles.miniBtnText}>⏭</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* ── Expanded Player (visible when pulled up) ── */}
      <Animated.View style={[styles.expandedContent, { opacity: expandedOpacity }]}>
        {/* Large Album Art */}
        <View style={styles.expandedCoverWrap}>
          <Animated.View style={{ width: expandedCoverSize, height: expandedCoverSize, borderRadius: 12, overflow: 'hidden' }}>
            <SongArtwork
              uri={activeTrack.thumbnail}
              fallbackUri={activeTrack.fallbackThumbnail}
              style={styles.expandedCover}
            />
          </Animated.View>
        </View>

        {/* Track Info */}
        <Text style={styles.expandedTitle} numberOfLines={2}>
          {activeTrack.title}
        </Text>
        <Text style={styles.expandedArtist} numberOfLines={1}>
          {activeTrack.artist}
        </Text>

        <Text style={styles.queueLabel}>
          {trackNumber} of {trackCount} in this library
        </Text>

        <View style={styles.progressRow}>
          <Pressable
            style={styles.progressBar}
            onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
            onPress={(event) => {
              const width = event.nativeEvent.locationX;
              const progress = Math.max(0, Math.min(1, width / progressWidth));
              onSeek(progress * totalDuration);
            }}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0}%` },
              ]}
            />
          </Pressable>
          <View style={styles.progressTimes}>
            <Text style={styles.progressTime}>{formatTime(currentTime)}</Text>
            <Text style={styles.progressTime}>-{formatTime(Math.max(0, totalDuration - currentTime))}</Text>
          </View>
        </View>

        {/* Full Transport Controls */}
        <View style={styles.expandedControls}>
          <Pressable
            style={({ pressed }) => [styles.exBtn, pressed && styles.exBtnPressed]}
            onPress={onPrevious}
          >
            <Text style={styles.exBtnText}>⏮</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.exBtnPlay, pressed && styles.exBtnPlayPressed]}
            onPress={onTogglePlay}
          >
            <Text style={styles.exBtnPlayText}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.exBtn, pressed && styles.exBtnPressed]}
            onPress={onNext}
          >
            <Text style={styles.exBtnText}>⏭</Text>
          </Pressable>
        </View>

        {/* Status */}
        <Text style={styles.expandedStatus}>
          {isPlaying ? '♫ Playing' : '⏸ Paused'} · {activeTrack.audioReady ? 'Stream ready' : 'Queued'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

/* ─── Main Library Screen ─── */
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
}: LibraryScreenProps) {
  const selectedLibrary =
    libraries.find((l) => l._id === selectedLibraryId) ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>♫</Text>
          </View>
          <Text style={styles.topBarTitle}>NightWrapUp</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
          onPress={onLogout}
        >
          <Text style={styles.logoutBtnText}>Sign out</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        {/* ── Now Playing Card ── */}
        {activeTrack ? (
          <View style={styles.nowPlaying}>
            <Text style={styles.npLabel}>NOW PLAYING</Text>
            <View style={styles.npRow}>
              <SongArtwork
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
            {/* Inline controls */}
            <View style={styles.npControls}>
              <Pressable
                style={({ pressed }) => [
                  styles.npBtn,
                  pressed && styles.npBtnPressed,
                ]}
                onPress={onPrevious}
              >
                <Text style={styles.npBtnText}>⏮</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.npBtnPlay,
                  pressed && styles.npBtnPlayPressed,
                ]}
                onPress={onTogglePlay}
              >
                <Text style={styles.npBtnPlayText}>
                  {isPlaying ? '⏸' : '▶'}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.npBtn,
                  pressed && styles.npBtnPressed,
                ]}
                onPress={onNext}
              >
                <Text style={styles.npBtnText}>⏭</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ── Library Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabStrip}
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
                  <Text
                    style={[
                      styles.tabCount,
                      active && styles.tabCountActive,
                    ]}
                  >
                    {lib.songCount}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Track Count ── */}
        <View style={styles.trackHeader}>
          <Text style={styles.trackHeaderTitle}>
            {selectedLibrary?.name ?? 'Tracks'}
          </Text>
          <Text style={styles.trackHeaderCount}>
            {isLoading ? 'Loading...' : `${selectedSongs.length} tracks`}
          </Text>
        </View>

        {/* ── Song List ── */}
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
                  <SongArtwork
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
      </ScrollView>

      {/* ── Pull-up/Pull-down Bottom Sheet Player ── */}
      {activeTrack ? (
        <BottomSheetPlayer
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
  scroll: {
    flex: 1,
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
    borderBottomColor: '#1e1e1e',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e1e1e',
  },
  logoutBtnPressed: {
    backgroundColor: '#2a2a2a',
  },
  logoutBtnText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Error ── */
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

  /* ── Now Playing ── */
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
  npControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#252525',
    gap: 16,
  },
  npBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  npBtnPressed: {
    backgroundColor: '#333',
  },
  npBtnText: {
    color: '#ccc',
    fontSize: 18,
  },
  npBtnPlay: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  npBtnPlayPressed: {
    backgroundColor: '#18a34a',
  },
  npBtnPlayText: {
    color: '#fff',
    fontSize: 22,
  },

  /* ── Library Tabs ── */
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

  /* ── Track Header ── */
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

  /* ── Song List ── */
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

  /* ══════════════════════════════════════
     ── Bottom Sheet (Pull-up Player) ──
     ══════════════════════════════════════ */
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

  /* ── Mini Row (collapsed) ── */
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

  /* ── Expanded Content ── */
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

  /* ── Progress Bar ── */
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

  /* ── Expanded Controls ── */
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

  /* ── Status ── */
  expandedStatus: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
});
