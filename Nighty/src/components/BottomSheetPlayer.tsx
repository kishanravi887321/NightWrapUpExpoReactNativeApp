import React, { useRef, useState } from 'react';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINI_HEIGHT = 64;
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.68);
const SNAP_THRESHOLD = 60;

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
  const lastHeight = useRef(MINI_HEIGHT);
  const [progressWidth, setProgressWidth] = useState(1);

  const animateTo = (target: number) => {
    isExpanded.current = target === EXPANDED_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue: target,
      friction: 9,
      tension: 80,
      useNativeDriver: false,
    }).start(() => {
      lastHeight.current = target;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          lastHeight.current = value;
          sheetHeight.setOffset(value);
          sheetHeight.setValue(0);
        });
      },
      onPanResponderMove: (_, gesture) => sheetHeight.setValue(-gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        sheetHeight.flattenOffset();
        const currentHeight = lastHeight.current - gesture.dy;
        const goingUp = gesture.dy < 0;
        const shouldExpand =
          goingUp &&
          (currentHeight > MINI_HEIGHT + SNAP_THRESHOLD || Math.abs(gesture.vy) > 0.5);
        const shouldCollapse =
          !goingUp &&
          (currentHeight < EXPANDED_HEIGHT - SNAP_THRESHOLD || Math.abs(gesture.vy) > 0.5);

        if (shouldExpand) animateTo(EXPANDED_HEIGHT);
        else if (shouldCollapse) animateTo(MINI_HEIGHT);
        else animateTo(isExpanded.current ? EXPANDED_HEIGHT : MINI_HEIGHT);
      },
    }),
  ).current;

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
      <View {...panResponder.panHandlers} style={styles.dragZone}>
        <Pressable
          onPress={() => animateTo(isExpanded.current ? MINI_HEIGHT : EXPANDED_HEIGHT)}
          style={styles.dragHandleWrap}
        >
          <View style={styles.dragHandle} />
        </Pressable>
        <Animated.View style={[styles.miniRow, { opacity: miniOpacity }]}>
          <SongArtwork uri={activeTrack.thumbnail} fallbackUri={activeTrack.fallbackThumbnail} style={styles.miniCover} />
          <View style={styles.miniMeta}>
            <Text style={styles.miniTitle} numberOfLines={1}>{activeTrack.title}</Text>
            <Text style={styles.miniArtist} numberOfLines={1}>{activeTrack.artist}</Text>
          </View>
          <Pressable style={styles.miniBtn} onPress={onPrevious}><Text style={styles.miniBtnText}>⏮</Text></Pressable>
          <Pressable style={styles.miniBtnPlay} onPress={onTogglePlay}><Text style={styles.miniBtnPlayText}>{isPlaying ? '⏸' : '▶'}</Text></Pressable>
          <Pressable style={styles.miniBtn} onPress={onNext}><Text style={styles.miniBtnText}>⏭</Text></Pressable>
        </Animated.View>
      </View>

      <Animated.View style={[styles.expandedContent, { opacity: expandedOpacity }]}>
        <View style={styles.expandedCoverWrap}>
          <Animated.View style={{ width: expandedCoverSize, height: expandedCoverSize, borderRadius: 12, overflow: 'hidden' }}>
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
            onPress={(event) => onSeek(Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth)) * totalDuration)}
          >
            <View style={[styles.progressFill, { width: `${totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0}%` }]} />
          </Pressable>
          <View style={styles.progressTimes}>
            <Text style={styles.progressTime}>{formatTime(currentTime)}</Text>
            <Text style={styles.progressTime}>-{formatTime(Math.max(0, totalDuration - currentTime))}</Text>
          </View>
        </View>
        <View style={styles.expandedControls}>
          <Pressable style={styles.exBtn} onPress={onPrevious}><Text style={styles.exBtnText}>⏮</Text></Pressable>
          <Pressable style={styles.exBtnPlay} onPress={onTogglePlay}><Text style={styles.exBtnPlayText}>{isPlaying ? '⏸' : '▶'}</Text></Pressable>
          <Pressable style={styles.exBtn} onPress={onNext}><Text style={styles.exBtnText}>⏭</Text></Pressable>
        </View>
        <Text style={styles.expandedStatus}>{isPlaying ? '♫ Playing' : '⏸ Paused'} · {activeTrack.audioReady ? 'Stream ready' : 'Queued'}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#181818', borderTopWidth: 1, borderTopColor: '#2a2a2a', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  dragZone: {},
  dragHandleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#444' },
  miniRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, height: MINI_HEIGHT - 12 },
  miniCover: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#252525' },
  miniMeta: { flex: 1, marginLeft: 10, minWidth: 0 },
  miniTitle: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
  miniArtist: { color: '#777', fontSize: 12, marginTop: 1 },
  miniBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  miniBtnText: { color: '#bbb', fontSize: 15 },
  miniBtnPlay: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginRight: 2 },
  miniBtnPlayText: { color: '#fff', fontSize: 17 },
  expandedContent: { paddingHorizontal: 24, paddingTop: 4, alignItems: 'center' },
  expandedCoverWrap: { alignItems: 'center', marginBottom: 12 },
  expandedCover: { width: '100%', height: '100%', backgroundColor: '#252525' },
  expandedTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  expandedArtist: { color: '#888', fontSize: 14, marginTop: 3, textAlign: 'center' },
  queueLabel: { color: '#888', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  progressRow: { width: '100%', marginTop: 14 },
  progressBar: { height: 3, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1db954', borderRadius: 2 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressTime: { color: '#666', fontSize: 11, fontWeight: '600' },
  expandedControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 20 },
  exBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
  exBtnText: { color: '#ccc', fontSize: 20 },
  exBtnPlay: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center' },
  exBtnPlayText: { color: '#fff', fontSize: 24 },
  expandedStatus: { color: '#555', fontSize: 12, fontWeight: '600', marginTop: 10 },
});
