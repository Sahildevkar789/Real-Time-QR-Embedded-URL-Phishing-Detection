import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  accent: '#00ff9d',
  inactive: '#666666',
  text: '#ffffff'
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      // GLOBAL HEADER STYLES (Applies to all tabs)
      headerStyle: {
        backgroundColor: COLORS.bg,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: COLORS.text, // Default white text
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
      },
      // GLOBAL TAB BAR STYLES
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: '#222',
        paddingTop: 6,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: 'bold',
      },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.inactive,
    }}>
      <Tabs.Screen
        name="news"
        options={{
          // This hides the button from the bottom bar!
          href: null, 
          headerShown: false,
        }}
      />
      
      {/* 1. HOME TAB (Header Restored!) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'CYBER GUARD', // The text in the top bar
          headerTitleStyle: { 
            color: COLORS.accent, // Neon Green Title
            fontWeight: '900',
            fontSize: 20
          },
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="dashboard" color={color} />,
        }}
      />

      {/* 2. SCANNER TAB (Header still hidden for camera) */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={30} color={color} />,
          tabBarStyle: { display: 'none' } // Optional: Hide bottom bar while scanning
        }}
      />

      {/* 3. HISTORY TAB */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'SCAN LOGS',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,         // <--- This removes the icon from the bottom bar
          headerShown: false, // <--- This hides the default header
        }}
      />

      {/* 6. PRIVACY (HIDDEN) */}
      <Tabs.Screen
        name="privacy"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      {/* 4. PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'USER PROFILE',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-secret" color={color} />,
        }}
      />
      {/* 3. WI-FI SENTINEL (HIDDEN BUT ACCESSIBLE) */}
      <Tabs.Screen
        name="wifi"
        options={{
          href: null, // <--- This hides the icon from the bottom bar
          headerShown: false, // Hide default header
        }}
      />
      
    </Tabs>
  );
}