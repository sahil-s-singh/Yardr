import React, { useCallback, useRef, useState } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface RadiusSliderProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
  trackColor?: string;
}

const THUMB_W = 50;

export default React.memo(function RadiusSlider({
  min,
  max,
  value,
  onValueChange,
  trackColor = "rgba(0,0,0,0.08)",
}: RadiusSliderProps) {
  const trackPageX = useRef(0);
  const trackW = useRef(0);
  const currentVal = useRef(value);
  const [label, setLabel] = useState(`${value} km`);

  // Direct refs for zero-overhead updates during drag
  const thumbRef = useRef<View>(null);
  const fillRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  const positionThumb = useCallback((pct: number) => {
    const usable = trackW.current - THUMB_W;
    const left = pct * usable;
    const fill = pct * usable + THUMB_W / 2;
    // Bypass React — write directly to native views
    thumbRef.current?.setNativeProps({ style: { transform: [{ translateX: left }] } });
    fillRef.current?.setNativeProps({ style: { width: fill } });
  }, []);

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      const w = trackW.current;
      if (w <= 0) return;
      const px = e.nativeEvent.pageX - trackPageX.current;
      const pct = Math.max(0, Math.min(px / w, 1));
      positionThumb(pct);
      const v = Math.round(min + pct * (max - min));
      if (v !== currentVal.current) {
        currentVal.current = v;
        setLabel(`${v} km`);
      }
    },
    [min, max, positionThumb]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleTouch(e),
      onPanResponderMove: (e) => handleTouch(e),
      onPanResponderRelease: () => onValueChange(currentVal.current),
      onPanResponderTerminate: () => onValueChange(currentVal.current),
    })
  ).current;

  const measure = useCallback(() => {
    containerRef.current?.measureInWindow((x, _y, w) => {
      if (w > 0) {
        trackPageX.current = x;
        trackW.current = w;
        const pct = (currentVal.current - min) / (max - min);
        positionThumb(pct);
      }
    });
  }, [min, max, positionThumb]);

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={measure}
      {...panResponder.panHandlers}
    >
      <View style={[styles.trackBg, { backgroundColor: trackColor }]} />
      <View ref={fillRef} style={styles.trackFill} />
      <View ref={thumbRef} style={styles.thumb}>
        <Text style={styles.thumbLabel}>{label}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 28,
    justifyContent: "center",
  },
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  trackFill: {
    position: "absolute",
    left: 0,
    width: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DF6B4F",
  },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB_W,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DF6B4F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
