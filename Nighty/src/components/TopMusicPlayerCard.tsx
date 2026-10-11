import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SongItem } from '../types/api';
import { formatTime } from '../utils/format';
import { getSongWaveform } from '../utils/waveform';
import { SongArtwork } from './SongArtwork';

type TopMusicPlayerCardProps = {
  activeTrack: SongItem;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
};

export function TopMusicPlayerCard({
  activeTrack,
  isPlaying,
  currentTime,
  totalDuration,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  isRepeat,
  onToggleRepeat,
  isShuffle,
  onToggleShuffle,
}: TopMusicPlayerCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [internalShuffle, setInternalShuffle] = useState(false);
  const [internalRepeat, setInternalRepeat] = useState(false);
  const [internalPlaying, setInternalPlaying] = useState<boolean | null>(null);
  const [progressBarWidth, setProgressBarWidth] = useState(1);

  const activeIsPlaying = internalPlaying !== null ? internalPlaying : isPlaying;

  useEffect(() => {
    setInternalPlaying(null);
  }, [isPlaying]);

  const repeatEnabled = isRepeat !== undefined ? isRepeat : internalRepeat;
  const handleToggleRepeat = onToggleRepeat || (() => setInternalRepeat((prev) => !prev));

  const shuffleEnabled = isShuffle !== undefined ? isShuffle : internalShuffle;
  const handleToggleShuffle = onToggleShuffle || (() => setInternalShuffle((prev) => !prev));

  // Rotation animation for the vinyl disc
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for neon glow
  const glowAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let spinLoop: Animated.CompositeAnimation | null = null;
    if (activeIsPlaying) {
      spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinLoop.start();
    } else {
      spinAnim.stopAnimation();
    }

    return () => {
      spinLoop?.stop();
    };
  }, [activeIsPlaying, spinAnim]);

  useEffect(() => {
    let glowLoop: Animated.CompositeAnimation | null = null;
    if (activeIsPlaying) {
      glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.65,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      glowLoop.start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0.75);
    }

    return () => {
      glowLoop?.stop();
    };
  }, [activeIsPlaying, glowAnim]);

  // ── Audio Frequency Drivers for Dynamic Waveform & Equalizer ──
  const bassAnim = useRef(new Animated.Value(0)).current;
  const subBassAnim = useRef(new Animated.Value(0)).current;
  const lowMidAnim = useRef(new Animated.Value(0)).current;
  const midAnim = useRef(new Animated.Value(0)).current;
  const highMidAnim = useRef(new Animated.Value(0)).current;
  const trebleAnim = useRef(new Animated.Value(0)).current;

  // Compute a deterministic signature from song to give each track its own tempo/groove
  const songBpmScale = useMemo(() => {
    const key = (activeTrack._id || '') + (activeTrack.title || '');
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    // Tempo scale multiplier between 0.88 and 1.22
    const norm = (Math.abs(hash) % 35) / 100;
    return 0.88 + norm;
  }, [activeTrack._id, activeTrack.title]);

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];

    if (activeIsPlaying) {
      // 1. Bass Kick Drum Driver: punchy attack, smooth resonant decay
      const bassLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bassAnim, {
            toValue: 1,
            duration: Math.round(90 / songBpmScale),
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(bassAnim, {
            toValue: 0.15,
            duration: Math.round(380 / songBpmScale),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );

      // 2. Sub-Bass Driver: deeper rolling wave
      const subBassLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(subBassAnim, {
            toValue: 0.95,
            duration: Math.round(320 / songBpmScale),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(subBassAnim, {
            toValue: 0.2,
            duration: Math.round(410 / songBpmScale),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );

      // 3. Low-Mid Driver: rhythmic chords / groove
      const lowMidLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(lowMidAnim, {
            toValue: 1,
            duration: Math.round(180 / songBpmScale),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(lowMidAnim, {
            toValue: 0.25,
            duration: Math.round(210 / songBpmScale),
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );

      // 4. Mid Driver: vocal & melodic oscillation
      const midLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(midAnim, {
            toValue: 0.9,
            duration: Math.round(240 / songBpmScale),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(midAnim, {
            toValue: 0.1,
            duration: Math.round(290 / songBpmScale),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );

      // 5. High-Mid Driver: snare snap & percussive bounce
      const highMidLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(highMidAnim, {
            toValue: 1,
            duration: Math.round(130 / songBpmScale),
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(highMidAnim, {
            toValue: 0.2,
            duration: Math.round(170 / songBpmScale),
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );

      // 6. Treble Driver: fast hi-hat and cymbal flutter
      const trebleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(trebleAnim, {
            toValue: 1,
            duration: Math.round(85 / songBpmScale),
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(trebleAnim, {
            toValue: 0.15,
            duration: Math.round(105 / songBpmScale),
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ]),
      );

      loops = [bassLoop, subBassLoop, lowMidLoop, midLoop, highMidLoop, trebleLoop];
      loops.forEach((l) => l.start());
    } else {
      // Stopped / Paused: immediately freeze all drivers down to resting baseline (0ms delay)
      bassAnim.stopAnimation();
      bassAnim.setValue(0);
      subBassAnim.stopAnimation();
      subBassAnim.setValue(0);
      lowMidAnim.stopAnimation();
      lowMidAnim.setValue(0);
      midAnim.stopAnimation();
      midAnim.setValue(0);
      highMidAnim.stopAnimation();
      highMidAnim.setValue(0);
      trebleAnim.stopAnimation();
      trebleAnim.setValue(0);
    }

    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [activeIsPlaying, songBpmScale, bassAnim, subBassAnim, lowMidAnim, midAnim, highMidAnim, trebleAnim]);

  // Compute a 100% unique, identical waveform fingerprint tailored for this exact song
  const songWaveform = useMemo(
    () => getSongWaveform(activeTrack, 30),
    [activeTrack._id, activeTrack.title, activeTrack.artist, activeTrack.duration],
  );

  // Memoize bar height interpolations for this specific song's 30 waveform bars
  const animatedBarHeights = useMemo(() => {
    return songWaveform.map((baseH, i) => {
      // Map bars across the frequency spectrum with alternating counterpoint drivers
      let driver: Animated.Value;
      if (i < 5) {
        // Deep Sub-Bass
        driver = i % 2 === 0 ? bassAnim : subBassAnim;
      } else if (i < 10) {
        // Bass Kick
        driver = i % 2 === 0 ? subBassAnim : bassAnim;
      } else if (i < 16) {
        // Low-Mids
        driver = i % 2 === 0 ? lowMidAnim : midAnim;
      } else if (i < 22) {
        // Melodic Mids
        driver = i % 2 === 0 ? midAnim : highMidAnim;
      } else if (i < 26) {
        // High-Mids / Snare
        driver = i % 2 === 0 ? highMidAnim : trebleAnim;
      } else {
        // Treble & Shimmer
        driver = i % 2 === 0 ? trebleAnim : highMidAnim;
      }

      // Idle height when stopped (quiet resting baseline preserving wave contour)
      const idleH = Math.max(3, Math.round(baseH * 0.35));
      // Peak height during energetic beats (up to 28px)
      const peakH = Math.min(28, Math.max(idleH + 5, Math.round(baseH * 1.15)));

      return driver.interpolate({
        inputRange: [0, 1],
        outputRange: [idleH, peakH],
      });
    });
  }, [songWaveform, bassAnim, subBassAnim, lowMidAnim, midAnim, highMidAnim, trebleAnim]);

  // Header equalizer (5 bars) animated heights
  const animatedEqHeights = useMemo(() => {
    const configs = [
      { driver: bassAnim, idle: 4, peak: 15 },
      { driver: midAnim, idle: 6, peak: 18 },
      { driver: subBassAnim, idle: 4, peak: 13 },
      { driver: highMidAnim, idle: 5, peak: 17 },
      { driver: trebleAnim, idle: 3, peak: 12 },
    ];
    return configs.map(({ driver, idle, peak }) =>
      driver.interpolate({
        inputRange: [0, 1],
        outputRange: [idle, peak],
      }),
    );
  }, [bassAnim, subBassAnim, midAnim, highMidAnim, trebleAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const [optimisticSeekTime, setOptimisticSeekTime] = useState<number | null>(null);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (optimisticSeekTime !== null && Math.abs(currentTime - optimisticSeekTime) < 1.5) {
      setOptimisticSeekTime(null);
    }
  }, [currentTime, optimisticSeekTime]);

  const duration = totalDuration > 0 ? totalDuration : activeTrack.duration || 1;
  const displayTime = optimisticSeekTime !== null ? optimisticSeekTime : currentTime;
  const progressPercent = Math.min(Math.max(displayTime / duration, 0), 1);

  const handleProgressBarLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setProgressBarWidth(width);
    }
  };

  const handleSeekPress = (e: GestureResponderEvent) => {
    if (progressBarWidth <= 0 || duration <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(clickX / progressBarWidth, 1));
    const targetSeconds = ratio * duration;

    // Instant zero-latency visual feedback
    setOptimisticSeekTime(targetSeconds);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      setOptimisticSeekTime(null);
    }, 1200);

    onSeek(targetSeconds);
  };

  // Pre-calculate active waveform bars according to display progress
  const activeBarIndex = Math.floor(progressPercent * songWaveform.length);

  const hasThumbnail = Boolean(activeTrack.thumbnail && activeTrack.thumbnail.trim().length > 0);

  return (
    <LinearGradient
      colors={['#030914', '#051120', '#030914']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.cardContainer}
    >
      {/* ── Top Header: Animated Equalizer + NOW PLAYING ── */}
      <View style={styles.headerRow}>
        <View style={styles.equalizer}>
          {animatedEqHeights.map((h, i) => (
            <Animated.View key={i} style={[styles.eqBar, { height: h }]} />
          ))}
        </View>
        <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
      </View>

      {/* ── Center Content: Left Vinyl/Art + Right Metadata & Waveform ── */}
      <View style={styles.mainContent}>
        {/* Left: Vinyl Record Peeking Out Behind Circular Cover */}
        <View style={styles.artworkWrapper}>
          {/* Peeking Vinyl Disc - only shown when there is no thumbnail URL */}
          {!hasThumbnail && (
            <Animated.View
              style={[
                styles.vinylDisc,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              {/* Concentric Grooves */}
              <View style={styles.vinylGrooveOuter} />
              <View style={styles.vinylGrooveMid} />
              <View style={styles.vinylGrooveInner} />
              <View style={styles.vinylCenterLabel} />
            </Animated.View>
          )}

          {/* Circular Cover Artwork */}
          <SongArtwork
            uri={activeTrack.thumbnail}
            fallbackUri={activeTrack.fallbackThumbnail}
            style={styles.coverFrame}
          />
        </View>

        {/* Right: Title, Favorite, Artist, Waveform, Progress */}
        <View style={styles.trackDetails}>
          {/* Title & Heart Row */}
          <View style={styles.titleRow}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {activeTrack.title}
            </Text>
            <Pressable
              onPress={() => setIsLiked((prev) => !prev)}
              style={styles.heartButton}
              hitSlop={10}
            >
              <Text style={[styles.heartIcon, isLiked && styles.heartActive]}>
                {isLiked ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>

          {/* Artist */}
          <Text style={styles.artistName} numberOfLines={1}>
            {activeTrack.artist || 'Unknown Artist'}
          </Text>

          {/* Seekable Audio Waveform & Progress Bar */}
          <Pressable
            style={styles.seekableArea}
            onPress={handleSeekPress}
            onLayout={handleProgressBarLayout}
            hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
          >
            {/* Audio Waveform Visualizer */}
            <View style={styles.waveformRow} pointerEvents="none">
              {animatedBarHeights.map((animatedH, i) => {
                const isPast = i <= activeBarIndex;
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveformBar,
                      { height: animatedH },
                      isPast ? styles.waveformBarActive : styles.waveformBarInactive,
                    ]}
                  />
                );
              })}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer} pointerEvents="none">
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent * 100}%` },
                  ]}
                />
                {/* Scrubber Knob */}
                <View
                  style={[
                    styles.scrubberThumb,
                    {
                      left: `${progressPercent * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Pressable>

          {/* Time Labels */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>

      {/* ── Bottom Controls Row ── */}
      <View style={styles.controlsRow}>
        {/* Shuffle */}
        <Pressable
          style={[styles.sideControl, shuffleEnabled && styles.sideControlActive]}
          onPress={handleToggleShuffle}
          hitSlop={8}
        >
          <Text style={[styles.shuffleIcon, shuffleEnabled && styles.controlActive]}>
            ⇄
          </Text>
          {shuffleEnabled && <View style={styles.activeDot} />}
        </Pressable>

        {/* Previous */}
        <Pressable style={styles.navButton} onPress={onPrevious} hitSlop={8}>
          <Text style={styles.prevNextIcon}>◀◀</Text>
        </Pressable>

        {/* Play / Pause Circular Glowing Button */}
        <Pressable
          style={({ pressed }) => [
            styles.playPauseButton,
            pressed && styles.playPausePressed,
          ]}
          onPress={() => {
            setInternalPlaying(!activeIsPlaying);
            onTogglePlay();
          }}
        >
          {activeIsPlaying ? (
            <View style={styles.pauseBars}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <Text style={styles.playIcon}>▶</Text>
          )}
        </Pressable>

        {/* Next */}
        <Pressable style={styles.navButton} onPress={onNext} hitSlop={8}>
          <Text style={styles.prevNextIcon}>▶▶</Text>
        </Pressable>

        {/* Repeat / Loop */}
        <Pressable
          style={[styles.sideControl, repeatEnabled && styles.sideControlActive]}
          onPress={handleToggleRepeat}
          hitSlop={8}
        >
          <Text style={[styles.repeatIcon, repeatEnabled && styles.controlActive]}>
            {repeatEnabled ? '🔂' : '🔁'}
          </Text>
          {repeatEnabled && <View style={styles.activeDot} />}
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  equalizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 2.5,
    marginRight: 8,
  },
  eqBar: {
    width: 2.5,
    backgroundColor: '#00e5ff',
    borderRadius: 1.5,
  },
  nowPlayingText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },

  /* Main Center */
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Left Artwork & Vinyl */
  artworkWrapper: {
    width: 118,
    height: 104,
    justifyContent: 'center',
    position: 'relative',
  },
  vinylDisc: {
    position: 'absolute',
    left: 20,
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#050a12',
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
  vinylGrooveOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  vinylGrooveMid: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
  },
  vinylGrooveInner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
  },
  vinylCenterLabel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#030810',
    borderWidth: 1,
    borderColor: '#00e5ff',
  },
  coverFrame: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00e5ff',
    backgroundColor: '#071526',
    zIndex: 3,
    elevation: 6,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },

  /* Right Details */
  trackDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  songTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    paddingRight: 6,
  },
  heartButton: {
    padding: 2,
  },
  heartIcon: {
    color: '#00e5ff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 229, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  heartActive: {
    color: '#00e5ff',
  },
  artistName: {
    color: '#7b92ab',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  /* Seekable Area */
  seekableArea: {
    width: '100%',
    paddingVertical: 2,
  },

  /* Waveform Visualizer */
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
    marginTop: 8,
    marginBottom: 6,
    gap: 2.2,
  },
  waveformBar: {
    flex: 1,
    width: 2.5,
    borderRadius: 1.5,
  },
  waveformBarActive: {
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  waveformBarInactive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },

  /* Progress Bar */
  progressContainer: {
    paddingVertical: 5,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#00e5ff',
    borderRadius: 2,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#00e5ff',
    marginLeft: -5,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    color: '#657e96',
    fontSize: 10,
    fontWeight: '600',
  },

  /* Bottom Controls */
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  sideControl: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 36,
    minHeight: 36,
  },
  sideControlActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: 18,
  },
  shuffleIcon: {
    color: '#496682',
    fontSize: 18,
    fontWeight: '700',
  },
  repeatIcon: {
    color: '#496682',
    fontSize: 16,
    fontWeight: '700',
  },
  controlActive: {
    color: '#00e5ff',
    textShadowColor: 'rgba(0, 229, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00e5ff',
    position: 'absolute',
    bottom: 2,
    shadowColor: '#00e5ff',
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  navButton: {
    padding: 6,
  },
  prevNextIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -2,
  },
  playPauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#041324',
    borderWidth: 2,
    borderColor: '#00e5ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  playPausePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  playIcon: {
    color: '#00e5ff',
    fontSize: 18,
    marginLeft: 3,
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  pauseBar: {
    width: 3.5,
    height: 16,
    backgroundColor: '#00e5ff',
    borderRadius: 1.5,
  },
});
