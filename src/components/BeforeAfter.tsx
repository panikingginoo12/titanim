import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors, radius } from '@/theme';
import { Icon } from './ui';

type Props = { beforeUri: string; afterUri: string; beforeLabel: string; afterLabel: string };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Drag the handle to reveal the "before" photo over the "after" one. */
export function BeforeAfter({ beforeUri, afterUri, beforeLabel, afterLabel }: Props) {
  const [width, setWidth] = useState(0);
  const [split, setSplit] = useState(0.5);
  const widthRef = useRef(0);

  const startRef = useRef(0.5);
  // Mirrors `split` for the gesture handlers, which outlive any single render.
  const splitRef = useRef(0.5);

  function update(next: number) {
    splitRef.current = next;
    setSplit(next);
  }

  // Standard PanResponder: dx is the finger's travel since touch-down, the same on every platform.
  // The handlers only read refs when gestures fire, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startRef.current = splitRef.current;
      },
      onPanResponderMove: (_, g) => update(clamp(startRef.current + g.dx / (widthRef.current || 1), 0, 1)),
    }),
  );

  function onLayout(e: LayoutChangeEvent) {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  }

  const x = split * width;

  return (
    <View
      style={[styles.frame, { height: width }]}
      onLayout={onLayout}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Before and after: ${beforeLabel} and ${afterLabel}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(split * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => update(clamp(splitRef.current + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1), 0, 1))}
    >
      {/* Absorbs touches so the photos can be scrubbed, not just the handle. */}
      <View
        style={StyleSheet.absoluteFill}
        {...responder.panHandlers}
      >
        <Image source={{ uri: afterUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[styles.clip, { width: x }]} pointerEvents="none">
          <Image source={{ uri: beforeUri }} style={{ width, height: width }} contentFit="cover" />
        </View>
        <View style={[styles.line, { left: x - 1 }]} pointerEvents="none" />
        <View style={[styles.handle, { left: x - 22, top: width / 2 - 22 }]} pointerEvents="none">
          <Icon name="swap-horizontal" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.tag, { left: 8 }]} pointerEvents="none">
          {beforeLabel}
        </Text>
        <Text style={[styles.tag, { right: 8 }]} pointerEvents="none">
          {afterLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  clip: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden' },
  line: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#fff' },
  handle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    position: 'absolute',
    bottom: 8,
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
