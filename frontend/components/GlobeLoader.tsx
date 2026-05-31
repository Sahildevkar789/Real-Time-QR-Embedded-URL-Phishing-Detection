import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const GlobeLoader = () => {
  const spinValue = new Animated.Value(0);
  const tiltValue = new Animated.Value(0);
  const scanLineValue = new Animated.Value(0);

  useEffect(() => {
    // 1. Infinite Rotation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Reverse Rotation (for the inner ring)
    Animated.loop(
      Animated.timing(tiltValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Scanning Laser Line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineValue, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinReverse = tiltValue.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  
  const scanTranslateY = scanLineValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60] // Moves up and down across the globe
  });

  return (
    <View style={styles.container}>
      <View style={styles.radarContainer}>
        
        {/* Layer 1: The Central Grid (Static) */}
        <MaterialCommunityIcons name="web" size={80} color="#00ff9d" style={{ opacity: 0.3 }} />

        {/* Layer 2: Outer Rotating Ring */}
        <Animated.View style={[styles.ring, { width: 120, height: 120, transform: [{ rotate: spin }, { rotateX: '45deg' }] }]} />
        
        {/* Layer 3: Inner Rotating Ring (Reverse) */}
        <Animated.View style={[styles.ring, { width: 100, height: 100, borderColor: '#00f3ff', transform: [{ rotate: spinReverse }, { rotateY: '45deg' }] }]} />

        {/* Layer 4: The Scanning Laser */}
        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]} />
        
      </View>

      <Text style={styles.loadingText}>INITIALIZING HACK...</Text>
      <Text style={styles.subText}>Decrypting SSL & Tracing Route</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'transparent' },
  radarContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#00ff9d', // Neon Green
    opacity: 0.7,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#ff0055', // Cyber Red Laser
    shadowColor: '#ff0055',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    opacity: 0.9,
  },
  loadingText: {
    fontFamily: 'Courier', // Monospace font looks "hacker"
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff9d',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 255, 157, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#00f3ff',
    marginTop: 5,
  },
});