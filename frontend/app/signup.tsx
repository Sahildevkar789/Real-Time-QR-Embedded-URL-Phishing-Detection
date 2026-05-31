import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router'; // <--- UPDATED IMPORT (Direct Router)
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'; 

const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  accent: '#00ff9d',
  muted: '#888888',
  border: '#333333'
};

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. CHECK UNIQUENESS
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setLoading(false);
        Alert.alert("Username Taken", "Please choose a different username.");
        return;
      }

      // 2. CREATE AUTH USER
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. SAVE USERNAME TO FIRESTORE
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: username,
        createdAt: new Date()
      });

      // 4. SEND VERIFICATION EMAIL
      await sendEmailVerification(user);

      // 5. SIGN OUT IMMEDIATELY
      await signOut(auth);

      setLoading(false);

      // 6. REDIRECT (Updated Logic)
      // We navigate immediately, THEN show the alert on the login screen context if possible, 
      // or just show it here before the navigation kicks in fully.
      Alert.alert(
        'Identity Created', 
        'A verification link has been sent to your email. You must verify it before logging in.',
        [
          { 
            text: 'GO TO LOGIN', 
            onPress: () => {
              // Using the global router object is safer here
              if (router.canDismiss()) {
                router.dismissAll();
              }
              router.replace('/login');
            } 
          }
        ]
      );
      
    } catch (error: any) {
      setLoading(false);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = 'Email is already registered.';
      if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      Alert.alert('Signup Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formCard}>
        <Text style={styles.title}>INITIALIZE AGENT</Text>
        <Text style={styles.subtitle}>Create your secure identity</Text>

        {/* USERNAME INPUT */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>CODENAME (USERNAME)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex. Shadow07" 
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>EMAIL FREQUENCY</Text>
          <TextInput 
            style={styles.input} 
            placeholder="agent@secure.net" 
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ACCESS KEY</Text>
          <TextInput 
            style={styles.input} 
            placeholder="******" 
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>ESTABLISH CONNECTION</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
           <Text style={styles.linkText}>Already have an ID? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: 20 },
  formCard: { backgroundColor: COLORS.card, padding: 30, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.accent, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, letterSpacing: 2 },
  subtitle: { color: COLORS.muted, textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { color: COLORS.accent, fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#121212', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 15, color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  button: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: 'bold', color: '#000', letterSpacing: 1 },
  linkText: { color: COLORS.muted, textAlign: 'center', fontSize: 12 }
});