import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; // Added Ionicons
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// --- DARK THEME COLORS ---
const COLORS = {
  bg: '#121212',
  card: '#1E1E1E',
  text: '#ffffff',
  accent: '#00ff9d',
  input: '#2C2C2C',
  border: '#333333',
  googleBtn: '#ffffff'
};

export default function LoginScreen() {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!input || !password) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    setLoading(true);
    let emailToUse = input;

    try {
      // 1. Check if input is a Username
      if (!input.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', input));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setLoading(false);
          Alert.alert('Login Failed', 'Username not found.');
          return;
        }

        const userData = snapshot.docs[0].data();
        emailToUse = userData.email;
      }

      // 2. Perform Login
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email ID before logging in. Check your inbox.'
        );
        await signOut(auth);
      } 
      
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* HEADER LOGO */}
      <View style={styles.header}>
        <MaterialIcons name="security" size={60} color={COLORS.accent} />
        <Text style={styles.title}>CYBER<Text style={{color: COLORS.accent}}>GUARD</Text></Text>
        <Text style={styles.subtitle}>SECURE ACCESS TERMINAL</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>USER LOGIN</Text>

        <TextInput
          style={styles.input}
          placeholder="ENTER EMAIL OR USERNAME"
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="ENTER PASSWORD"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>AUTHENTICATE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')} style={{marginTop: 20}}>
          <Text style={styles.signupText}>
            NEW USER? <Text style={styles.signupLink}>INITIATE REGISTRATION</Text>
          </Text>
        </TouchableOpacity>

        {/* --- OFFLINE TOOLS SECTION (ADDED) --- */}
        <View style={styles.offlineContainer}>
           <View style={styles.dividerContainer}>
             <View style={styles.dividerLine} />
             <Text style={styles.dividerText}>OFFLINE TOOLS</Text>
             <View style={styles.dividerLine} />
           </View>

           <TouchableOpacity 
             style={styles.guestWifiBtn}
             onPress={() => router.push('/wifi')} // Bypass Auth
           >
             <Ionicons name="wifi" size={20} color={COLORS.accent} style={{marginRight: 10}} />
             <Text style={styles.guestBtnText}>SCAN WI-FI SECURITY (NO LOGIN)</Text>
           </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 10,
  },
  subtitle: {
    color: '#666',
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 5,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    height: 55,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 14,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    height: 55,
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 1,
  },
  signupText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  signupLink: {
    color: COLORS.accent,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // --- NEW STYLES FOR OFFLINE TOOLS ---
  offlineContainer: {
    marginTop: 30,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 10,
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  guestWifiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
    borderStyle: 'dashed' // Gives it a cool tech look
  },
  guestBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});