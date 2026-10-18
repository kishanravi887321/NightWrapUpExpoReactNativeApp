import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SongItem } from '../types/api';
import { formatTime } from '../utils/format';
import { SongArtwork } from './SongArtwork';
import { playbackClock, usePlaybackTime } from '../services/playbackClock';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_HEIGHT = 64;
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.76);
const SNAP_THRESHOLD = 50;

type BottomSheetPlayerProps = {
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
};

export function BottomSheetPlayer({
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
}: BottomSheetPlayerProps) {
  const sheetHeight = useRef(new Animated.Value(MINI_HEIGHT)).current;
  const isExpanded = useRef(false);
  const currentHeightVal = useRef(MINI_HEIGHT);
  const [progressWidth, setProgressWidth] = useState(1);
  const [miniProgressWidth, setMiniProgressWidth] = useState(1);
  const [internalPlaying, setInternalPlaying] = useState<boolean | null>(null);
  const activeIsPlaying = internalPlaying !== null ? internalPlaying : isPlaying;

  useEffect(() => {
    setInternalPlaying(null);
  }, [isPlaying]);

  const duration = totalDuration > 0 ? totalDuration : activeTrack.duration || 1;
  const liveClockTime = usePlaybackTime();
  const displayTime = liveClockTime;
  const progressPercent = Math.min(Math.max(displayTime / duration, 0), 1);

  const handleSeekPress = (targetSeconds: number) => {
    playbackClock.seek(targetSeconds);
    onSeek(targetSeconds);
  };

  const animateTo = (target: number) => {
    isExpanded.current = target === EXPANDED_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue: target,
      friction: 8,
      tension: 65,
      useNativeDriver: false,
    }).start(() => {
      currentHeightVal.current = target;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        const nextHeight = Math.max(
          MINI_HEIGHT,
          Math.min(EXPANDED_HEIGHT, currentHeightVal.current - gesture.dy),
        );
        sheetHeight.setValue(nextHeight);
      },
      onPanResponderRelease: (_, gesture) => {
        const delta = -gesture.dy;
        const projectedHeight = currentHeightVal.current + delta;
        const goingUp = delta > 0;

        if (goingUp) {
          if (delta > SNAP_THRESHOLD || gesture.vy < -0.5) {
            animateTo(EXPANDED_HEIGHT);
          } else {
            animateTo(isExpanded.current ? EXPANDED_HEIGHT : MINI_HEIGHT);
          }
        } else {
          if (-delta > SNAP_THRESHOLD || gesture.vy > 0.5) {
            animateTo(MINI_HEIGHT);
          } else {
            animateTo(isExpanded.current ? EXPANDED_HEIGHT : MINI_HEIGHT);
          }
        }
      },
    }),
  ).current;

  const clampedHeight = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, EXPANDED_HEIGHT],
    outputRange: [MINI_HEIGHT, EXPANDED_HEIGHT],
    extrapolate: 'clamp',
  });
  const expandedOpacity = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, MINI_HEIGHT + 50, EXPANDED_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  const miniOpacity = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, MINI_HEIGHT + 40, EXPANDED_HEIGHT],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });
  const expandedCoverSize = sheetHeight.interpolate({
    inputRange: [MINI_HEIGHT, EXPANDED_HEIGHT],
    outputRange: [0, 130],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.sheet, { height: clampedHeight }]}>
      <View {...panResponder.panHandlers} style={styles.dragZone}>
        {/* Mini progress line along top of mini bar for immediate jumping */}
        <Pressable
          style={styles.miniProgressBar}
          onLayout={(e) => setMiniProgressWidth(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (miniProgressWidth > 0 && duration > 0) {
              const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / miniProgressWidth));
              handleSeekPress(ratio * duration);
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
        >
          <View pointerEvents="none" style={[styles.miniProgressFill, { width: `${progressPercent * 100}%` }]} />
        </Pressable>

        <Animated.View style={[styles.miniRow, { opacity: miniOpacity }]}>
          <Pressable
            style={styles.miniMetaWrap}
            onPress={() => animateTo(EXPANDED_HEIGHT)}
            hitSlop={4}
          >
            <SongArtwork uri={activeTrack.thumbnail} fallbackUri={activeTrack.fallbackThumbnail} style={styles.miniCover} />
            <View style={styles.miniMeta}>
              <Text style={styles.miniTitle} numberOfLines={1}>{activeTrack.title}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>{activeTrack.artist}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.miniBtn} onPress={onPrevious} hitSlop={6}><Text style={styles.miniBtnText}>⏮</Text></Pressable>
          <Pressable
            style={styles.miniBtnPlay}
            onPress={() => {
              setInternalPlaying(!activeIsPlaying);
              onTogglePlay();
            }}
            hitSlop={6}
          >
            <Text style={styles.miniBtnPlayText}>{activeIsPlaying ? '⏸' : '▶'}</Text>
          </Pressable>
          <Pressable style={styles.miniBtn} onPress={onNext} hitSlop={6}><Text style={styles.miniBtnText}>⏭</Text></Pressable>
        </Animated.View>
      </View>

      <Animated.View style={[styles.expandedContent, { opacity: expandedOpacity }]}>
        <View style={styles.expandedCoverWrap}>
          <Animated.View style={{ width: expandedCoverSize, height: expandedCoverSize, borderRadius: 14, overflow: 'hidden' }}>
            <SongArtwork uri={activeTrack.thumbnail} fallbackUri={activeTrack.fallbackThumbnail} style={styles.expandedCover} />
          </Animated.View>
        </View>
        <Text style={styles.expandedTitle} numberOfLines={2}>{activeTrack.title}</Text>
        <Text style={styles.expandedArtist} numberOfLines={1}>{activeTrack.artist}</Text>
        <Text style={styles.queueLabel}>{trackNumber} of {trackCount} in this library</Text>
        <View style={styles.progressRow}>
          <Pressable
            style={styles.progressBar}
            onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
            onPress={(event) => {
              if (progressWidth > 0 && duration > 0) {
                const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth));
                handleSeekPress(ratio * duration);
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
          >
            <View pointerEvents="none" style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
            <View pointerEvents="none" style={[styles.scrubberThumb, { left: `${progressPercent * 100}%` }]} />
          </Pressable>
          <View style={styles.progressTimes}>
            <Text style={styles.progressTime}>{formatTime(displayTime)}</Text>
            <Text style={styles.progressTime}>-{formatTime(Math.max(0, duration - displayTime))}</Text>
          </View>
        </View>
        <View style={styles.expandedControls}>
          <Pressable style={styles.exBtn} onPress={onPrevious}><Text style={styles.exBtnText}>⏮</Text></Pressable>
          <Pressable
            style={styles.exBtnPlay}
            onPress={() => {
              setInternalPlaying(!activeIsPlaying);
              onTogglePlay();
            }}
          >
            <Text style={styles.exBtnPlayText}>{activeIsPlaying ? '⏸' : '▶'}</Text>
          </Pressable>
          <Pressable style={styles.exBtn} onPress={onNext}><Text style={styles.exBtnText}>⏭</Text></Pressable>
        </View>
        <Text style={styles.expandedStatus}>{activeIsPlaying ? '♫ Playing' : '⏸ Paused'} · {activeTrack.audioReady ? 'Stream ready' : 'Pending'}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#040d18',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 229, 255, 0.3)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 9999,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  dragZone: {},
  dragHandleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0, 229, 255, 0.4)' },
  miniProgressBar: { width: '100%', height: 3, backgroundColor: 'rgba(0, 229, 255, 0.15)' },
  miniProgressFill: { height: '100%', backgroundColor: '#00e5ff' },
  miniRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, paddingTop: 4, height: MINI_HEIGHT - 8 },
  miniMetaWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  miniCover: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#071526', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.25)' },
  miniMeta: { flex: 1, marginLeft: 12, minWidth: 0 },
  miniTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  miniArtist: { color: '#7b95b0', fontSize: 12, marginTop: 1 },
  miniBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  miniBtnText: { color: '#7b95b0', fontSize: 15 },
  miniBtnPlay: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#00e5ff', alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginRight: 2, shadowColor: '#00e5ff', shadowRadius: 8, shadowOpacity: 0.6, elevation: 4 },
  miniBtnPlayText: { color: '#030914', fontSize: 16, fontWeight: '800' },
  expandedContent: { paddingHorizontal: 24, paddingTop: 4, alignItems: 'center' },
  expandedCoverWrap: { alignItems: 'center', marginBottom: 12 },
  expandedCover: { width: '100%', height: '100%', backgroundColor: '#071526' },
  expandedTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  expandedArtist: { color: '#7b95b0', fontSize: 14, marginTop: 3, textAlign: 'center' },
  queueLabel: { color: '#59748f', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  progressRow: { width: '100%', marginTop: 14 },
  progressBar: { height: 4, backgroundColor: 'rgba(0, 229, 255, 0.2)', borderRadius: 2, position: 'relative' },
  progressFill: { height: '100%', backgroundColor: '#00e5ff', borderRadius: 2 },
  scrubberThumb: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#00e5ff', marginLeft: -6 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressTime: { color: '#59748f', fontSize: 11, fontWeight: '600' },
  expandedControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 20 },
  exBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#07172b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' },
  exBtnText: { color: '#00e5ff', fontSize: 20 },
  exBtnPlay: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#00e5ff', alignItems: 'center', justifyContent: 'center', shadowColor: '#00e5ff', shadowRadius: 10, shadowOpacity: 0.8, elevation: 6 },
  exBtnPlayText: { color: '#030914', fontSize: 24, fontWeight: '800' },
  expandedStatus: { color: '#00e5ff', fontSize: 12, fontWeight: '700', marginTop: 10 },
});
