import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { signOut, sendEmailVerification, deleteUser } from 'firebase/auth';
import { useFocusEffect, router } from 'expo-router'; 
import { doc, deleteDoc, collection, query, getDocs, getDoc } from 'firebase/firestore';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// --- DARK THEME CONSTANTS ---
const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  subText: '#aaaaaa',
  accent: '#00ff9d',  // Neon Green
  danger: '#ff4b4b',  // Neon Red
  warning: '#f0ad4e', // Orange
  border: '#333333'
};

export default function ProfileScreen() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [username, setUsername] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const checkUser = async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          setUser(auth.currentUser);

          // Fetch Username
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             setUsername(docSnap.data().username);
          }
        }
      };
      checkUser();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout Failed', 'An error occurred while logging out.');
    }
  };

  const handleResendVerification = async () => {
    if (user) {
      setLoading(true);
      try {
        await sendEmailVerification(user);
        Alert.alert('Email Sent', 'A new verification email has been sent to your inbox.');
      } catch (error) {
        Alert.alert('Error', 'Could not send email. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const scansQuery = query(collection(db, 'users', user.uid, 'scans'));
      const querySnapshot = await getDocs(scansQuery);
      const deletePromises: Promise<void>[] = [];
      querySnapshot.forEach((doc) => { deletePromises.push(deleteDoc(doc.ref)); });
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      Alert.alert('Account Deleted', 'Your account and all data have been successfully deleted.');
      router.replace('/login');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Security Alert', 'Please log out and log back in to verify identity before deleting your account.');
        await signOut(auth);
      } else {
        Alert.alert('Deletion Failed', error.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      '⚠ DELETE ACCOUNT?',
      'This action is permanent. All scan logs and history will be wiped.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'DELETE PERMANENTLY', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* USER INFO CARD */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            {/* Dynamic Avatar based on Username */}
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                    {username ? username.substring(0, 2).toUpperCase() : 'OP'}
                </Text>
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.label}>IDENTITY</Text>
              {/* Display Username prominently */}
              <Text style={styles.usernameText}>{username || 'OPERATIVE'}</Text>
              <Text style={styles.emailText} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* SECURITY STATUS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SECURITY CLEARANCE</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>EMAIL VERIFICATION</Text>
            {user?.emailVerified ? (
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeText}>VERIFIED</Text>
              </View>
            ) : (
              <View style={styles.badgeFail}>
                <Text style={styles.badgeText}>UNVERIFIED</Text>
              </View>
            )}
          </View>

          {!user?.emailVerified && (
            <TouchableOpacity 
              style={[styles.actionButton, { borderColor: COLORS.warning }]} 
              onPress={handleResendVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.warning} />
              ) : (
                <Text style={[styles.buttonText, { color: COLORS.warning }]}>RESEND CODE</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* SYSTEM INFORMATION (About Us) */}
        <View style={styles.card}>
           <Text style={styles.sectionTitle}>SYSTEM INTELLIGENCE</Text>
           
           <TouchableOpacity 
             style={styles.menuRow} 
             onPress={() => router.push('/about')}
           >
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialIcons name="info-outline" size={20} color={COLORS.accent} style={{marginRight: 10}} />
                <Text style={styles.menuText}>Architecture & About</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.subText} />
           </TouchableOpacity>
           
           <View style={styles.dividerLight} />

           <TouchableOpacity 
             style={styles.menuRow}
             onPress={() => router.push('/privacy')}
           >
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialIcons name="privacy-tip" size={20} color={COLORS.accent} style={{marginRight: 10}} />
                <Text style={styles.menuText}>Privacy Protocol</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.subText} />
           </TouchableOpacity>
        </View>

        {/* ACCOUNT ACTIONS */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading || isDeleting}>
            <MaterialIcons name="logout" size={20} color={COLORS.text} style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>LOGOUT SESSION</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={[styles.deleteButton, isDeleting && { opacity: 0.5 }]} 
            onPress={confirmDelete} 
            disabled={loading || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <>
                <MaterialIcons name="delete-forever" size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
                <Text style={[styles.buttonText, { color: COLORS.danger }]}>DELETE ACCOUNT</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.versionText}>CYBER GUARD v2.0 // SECURE</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  
  // New Avatar Styles
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent
  },
  avatarText: { color: COLORS.accent, fontSize: 20, fontWeight: 'bold' },

  headerText: { marginLeft: 15, flex: 1 },
  label: { color: COLORS.subText, fontSize: 10, letterSpacing: 1, marginBottom: 4, fontWeight: 'bold' },
  usernameText: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 2, letterSpacing: 1 },
  emailText: { color: COLORS.subText, fontSize: 14 },
  
  sectionTitle: { color: COLORS.accent, fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  badgeSuccess: { backgroundColor: 'rgba(0, 255, 157, 0.15)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent },
  badgeFail: { backgroundColor: 'rgba(255, 75, 75, 0.15)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.danger },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.text },

  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },

  // Menu Styles
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  menuText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  dividerLight: { height: 1, backgroundColor: '#333', marginVertical: 15 },

  actionsContainer: { marginTop: 20 },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 75, 75, 0.05)', 
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
    marginTop: 15,
  },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  
  buttonText: { color: COLORS.text, fontWeight: 'bold', letterSpacing: 1 },
  versionText: { textAlign: 'center', color: '#444', fontSize: 10, marginTop: 30, letterSpacing: 2 },
});