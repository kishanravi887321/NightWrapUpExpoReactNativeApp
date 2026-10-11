import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type RowWaveVisualizerProps = {
  isPlaying: boolean;
  color?: string;
  maxHeight?: number;
};

export const RowWaveVisualizer = React.memo(function RowWaveVisualizer({
  isPlaying,
  color = '#00e5ff',
  maxHeight = 15,
}: RowWaveVisualizerProps) {
  const bar1 = useRef(new Animated.Value(0)).current;
  const bar2 = useRef(new Animated.Value(0)).current;
  const bar3 = useRef(new Animated.Value(0)).current;
  const bar4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];

    if (isPlaying) {
      const anim1 = Animated.loop(
        Animated.sequence([
          Animated.timing(bar1, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(bar1, {
            toValue: 0.15,
            duration: 260,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );

      const anim2 = Animated.loop(
        Animated.sequence([
          Animated.timing(bar2, {
            toValue: 1,
            duration: 310,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(bar2, {
            toValue: 0.2,
            duration: 340,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );

      const anim3 = Animated.loop(
        Animated.sequence([
          Animated.timing(bar3, {
            toValue: 1,
            duration: 170,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(bar3, {
            toValue: 0.1,
            duration: 210,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      );

      const anim4 = Animated.loop(
        Animated.sequence([
          Animated.timing(bar4, {
            toValue: 1,
            duration: 280,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(bar4, {
            toValue: 0.25,
            duration: 270,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );

      loops = [anim1, anim2, anim3, anim4];
      loops.forEach((l) => l.start());
    } else {
      // Freeze immediately to resting state (0ms delay)
      bar1.stopAnimation();
      bar1.setValue(0);
      bar2.stopAnimation();
      bar2.setValue(0);
      bar3.stopAnimation();
      bar3.setValue(0);
      bar4.stopAnimation();
      bar4.setValue(0);
    }

    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [isPlaying, bar1, bar2, bar3, bar4]);

  const h1 = bar1.interpolate({
    inputRange: [0, 1],
    outputRange: [3, Math.round(maxHeight * 0.85)],
  });
  const h2 = bar2.interpolate({
    inputRange: [0, 1],
    outputRange: [5, maxHeight],
  });
  const h3 = bar3.interpolate({
    inputRange: [0, 1],
    outputRange: [3, Math.round(maxHeight * 0.7)],
  });
  const h4 = bar4.interpolate({
    inputRange: [0, 1],
    outputRange: [4, Math.round(maxHeight * 0.9)],
  });

  return (
    <View style={[styles.container, { height: maxHeight }]}>
      <Animated.View style={[styles.bar, { height: h1, backgroundColor: color }]} />
      <Animated.View style={[styles.bar, { height: h2, backgroundColor: color }]} />
      <Animated.View style={[styles.bar, { height: h3, backgroundColor: color }]} />
      <Animated.View style={[styles.bar, { height: h4, backgroundColor: color }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    minWidth: 18,
  },
  bar: {
    width: 2.5,
    borderRadius: 1.5,
  },
});
