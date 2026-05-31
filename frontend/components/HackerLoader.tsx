import React, { useRef } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';

// Update props to accept the live logs and loading state from the hook
interface HackerLoaderProps {
  liveLogs: string[];
  loading: boolean;
}

export const HackerLoader = ({ liveLogs, loading }: HackerLoaderProps) => {
  // Ref to automatically scroll to the newest log
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.terminalWindow}>
      {/* Mac-style Window Header */}
      <View style={styles.headerBar}>
        <View style={styles.dotRed} />
        <View style={styles.dotYellow} />
        <View style={styles.dotGreen} />
        <Text style={styles.headerTitle}>root@cyberguard:~</Text>
      </View>
      
      {/* Auto-scrolling Terminal Body */}
      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        style={styles.consoleContent}
      >
        {liveLogs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            <Text style={{color: '#555'}}>{'> '}</Text>{log}
          </Text>
        ))}
        
        {/* Blinking Cursor only shows while actively scanning */}
        {loading && <Text style={styles.cursor}>_</Text>}
        
        {/* Add a tiny bit of padding at the bottom so the cursor isn't cut off */}
        <View style={{height: 20}} /> 
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  terminalWindow: {
    width: '100%',
    backgroundColor: '#050505', // Slightly darker for better contrast
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
    height: 500, // Fixed height so the scrollview works properly
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 20,
  },
  headerBar: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff5f56', marginRight: 8 },
  dotYellow: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffbd2e', marginRight: 8 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#27c93f', marginRight: 10 },
  headerTitle: {
    color: '#888',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 5,
  },
  consoleContent: {
    padding: 15,
  },
  logText: {
    color: '#00ff9d', 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  cursor: {
    color: '#00ff9d',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
});