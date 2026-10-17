import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreenNative from 'expo-splash-screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SplashScreenProps = {
  onFinish: () => void;
  minDurationMs?: number;
};

export function SplashScreen({ onFinish, minDurationMs = 2600 }: SplashScreenProps) {
  const [statusText, setStatusText] = useState('Initializing audio engine...');

  // Core animated values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  // Ambient glow pulse
  const ambientGlow = useRef(new Animated.Value(0.4)).current;

  // Sonic Ripple Rings (expanding outwards)
  const ring1Scale = useRef(new Animated.Value(0.7)).current;
  const ring1Opacity = useRef(new Animated.Value(0.7)).current;
  const ring2Scale = useRef(new Animated.Value(0.7)).current;
  const ring2Opacity = useRef(new Animated.Value(0.5)).current;
  const ring3Scale = useRef(new Animated.Value(0.7)).current;
  const ring3Opacity = useRef(new Animated.Value(0.35)).current;

  // Typography entrance
  const textTranslateY = useRef(new Animated.Value(24)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Feature pills entrance
  const pillsOpacity = useRef(new Animated.Value(0)).current;

  // Progress sweep
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Exit transition
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  // Equalizer frequencies (7 bars)
  const barHeights = useRef([
    new Animated.Value(6),
    new Animated.Value(12),
    new Animated.Value(20),
    new Animated.Value(28),
    new Animated.Value(18),
    new Animated.Value(14),
    new Animated.Value(8),
  ]).current;

  const isExitingRef = useRef(false);

  useEffect(() => {
    // Dismiss native splash screen immediately so animated React splash takes over with no flicker
    void SplashScreenNative.hideAsync().catch(() => {});

    // 1. Ambient Glow breathing animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlow, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientGlow, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    glowLoop.start();

    // 2. Vinyl rotation loop
    const rotateLoop = Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotateLoop.start();

    // 3. Sonic Ripple loops
    const createRingLoop = (scaleAnim: Animated.Value, opacityAnim: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 2.8,
              duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.8, duration: 0, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      );
    };

    const ring1Anim = createRingLoop(ring1Scale, ring1Opacity, 2000, 0);
    const ring2Anim = createRingLoop(ring2Scale, ring2Opacity, 2000, 450);
    const ring3Anim = createRingLoop(ring3Scale, ring3Opacity, 2000, 900);

    ring1Anim.start();
    ring2Anim.start();
    ring3Anim.start();

    // 4. Equalizer dancing bars
    const eqLoops = barHeights.map((bar, i) => {
      const minH = 6;
      const maxH = 14 + (i % 4) * 8;
      const duration = 280 + (i * 70) % 200;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: maxH,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: minH,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );
    });
    eqLoops.forEach((loop) => loop.start());

    // 5. Entrance Sequence
    Animated.parallel([
      // Logo spring entrance
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      // Typography delayed slide-up
      Animated.sequence([
        Animated.delay(220),
        Animated.parallel([
          Animated.spring(textTranslateY, {
            toValue: 0,
            tension: 55,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Feature pills
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(pillsOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      // Loading Progress bar (0 to 100%)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: minDurationMs - 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // 6. Status text progression
    const timer1 = setTimeout(() => setStatusText('Mounting offline vault...'), 750);
    const timer2 = setTimeout(() => setStatusText('Syncing lossless spectrum...'), 1450);
    const timer3 = setTimeout(() => setStatusText('Ready to play'), 2100);

    // 7. Graceful Exit transition
    const exitTimer = setTimeout(() => {
      triggerExit();
    }, minDurationMs);

    return () => {
      glowLoop.stop();
      rotateLoop.stop();
      ring1Anim.stop();
      ring2Anim.stop();
      ring3Anim.stop();
      eqLoops.forEach((l) => l.stop());
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(exitTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDurationMs]);

  const triggerExit = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 1.08,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  const spinInterpolation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: exitOpacity,
          transform: [{ scale: exitScale }],
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Deep Background Gradient */}
      <LinearGradient
        colors={['#02050e', '#040d1c', '#020612']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient Pulsing Aura Behind Logo */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: ambientGlow,
            transform: [
              {
                scale: ambientGlow.interpolate({
                  inputRange: [0.35, 0.9],
                  outputRange: [0.9, 1.3],
                }),
              },
            ],
          },
        ]}
      />

      {/* Skip button (top-right) */}
      <Pressable style={styles.skipBtn} onPress={triggerExit} hitSlop={12}>
        <Text style={styles.skipBtnText}>Skip ➔</Text>
      </Pressable>

      <View style={styles.centerContent}>
        {/* Sonic Ripple Waves */}
        <Animated.View
          style={[
            styles.rippleRing,
            styles.ring1,
            {
              transform: [{ scale: ring1Scale }],
              opacity: ring1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            styles.ring2,
            {
              transform: [{ scale: ring2Scale }],
              opacity: ring2Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            styles.ring3,
            {
              transform: [{ scale: ring3Scale }],
              opacity: ring3Opacity,
            },
          ]}
        />

        {/* ── Center Emblem: Glowing Vinyl Disc & Equalizer Core ── */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          {/* Outer Vinyl Disc with Concentric Grooves */}
          <Animated.View
            style={[
              styles.vinylDisc,
              { transform: [{ rotate: spinInterpolation }] },
            ]}
          >
            {/* Concentric grooved rings */}
            <View style={styles.vinylGroove1} />
            <View style={styles.vinylGroove2} />
            <View style={styles.vinylGroove3} />
            <View style={styles.vinylStrobeMark} />
          </Animated.View>

          {/* Central Glowing Core (Static orientation for sharp reading) */}
          <LinearGradient
            colors={['#00f5d4', '#00e5ff', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coreBadge}
          >
            <View style={styles.coreInner}>
              <Text style={styles.coreMusicIcon}>♫</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Dynamic Equalizer Visualizer */}
        <Animated.View style={[styles.eqRow, { opacity: logoOpacity }]}>
          {barHeights.map((bar, i) => (
            <Animated.View key={i} style={[styles.eqBar, { height: bar }]} />
          ))}
        </Animated.View>

        {/* ── Brand Typography ── */}
        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.titleWhite}>NIGHT</Text>
            <Text style={styles.titleCyan}>WRAP</Text>
            <Text style={styles.titleAccent}>UP</Text>
          </View>
          <Text style={styles.subtitle}>PRECISION AUDIO & MUSIC VAULT</Text>

          {/* Feature Badge Pills */}
          <Animated.View style={[styles.pillsRow, { opacity: pillsOpacity }]}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>⚡ LOSSLESS</Text>
            </View>
            <View style={styles.pillDot} />
            <View style={styles.pill}>
              <Text style={styles.pillText}>⇩ OFFLINE</Text>
            </View>
            <View style={styles.pillDot} />
            <View style={styles.pill}>
              <Text style={styles.pillText}>⇄ QUEUES</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ── Bottom Loading Progress Bar & Status Text ── */}
      <View style={styles.bottomSection}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#00e5ff', '#3b82f6', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPulseDot} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020612',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9999,
  },
  ambientGlow: {
    position: 'absolute',
    top: '28%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 70,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 23, 43, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    zIndex: 10,
  },
  skipBtnText: {
    color: '#00e5ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  rippleRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    pointerEvents: 'none',
  },
  ring1: {
    width: 140,
    height: 140,
    borderColor: 'rgba(0, 229, 255, 0.55)',
  },
  ring2: {
    width: 175,
    height: 175,
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  ring3: {
    width: 210,
    height: 210,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  logoWrap: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  vinylDisc: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#051120',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.75,
    shadowRadius: 24,
    elevation: 16,
  },
  vinylGroove1: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vinylGroove2: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  vinylGroove3: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vinylStrobeMark: {
    position: 'absolute',
    top: 5,
    width: 4,
    height: 8,
    backgroundColor: '#00e5ff',
    borderRadius: 2,
  },
  coreBadge: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.85,
    shadowRadius: 16,
  },
  coreInner: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: '#030914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreMusicIcon: {
    color: '#00e5ff',
    fontSize: 24,
    fontWeight: '900',
  },
  eqRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 4,
    marginTop: 22,
    marginBottom: 16,
  },
  eqBar: {
    width: 3.5,
    backgroundColor: '#00e5ff',
    borderRadius: 2,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 2,
  },
  titleWhite: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  titleCyan: {
    color: '#00e5ff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  titleAccent: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#7b95b0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.2,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  pillText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#3b82f6',
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: SCREEN_WIDTH * 0.7,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  statusText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
