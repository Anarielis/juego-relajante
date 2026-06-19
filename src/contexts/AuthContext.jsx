import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { trackEvent, trackAchievement } from '../analytics/tracking';

const AuthContext = createContext();

const DEFAULT_PROFILE = {
  username: '',
  email: '',
  createdAt: '',
  favoriteGame: 'Ninguno',
  totalTimeSpent: 0, // in minutes
  sessionCount: 0,
  frequentMood: 'Relajado',
  moodHistory: [],
  achievements: [],
  breathingSessions: 0,
  gamePlaytimes: {
    'zen-garden': 0,
    'pop-it': 0,
    'breathing': 0,
    'slime': 0,
    'light-rain': 0
  },
  consecutiveDays: 1,
  lastLoginDate: ''
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Initialize and listen to Auth state changes
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          await fetchUserProfile(firebaseUser.uid, firebaseUser.email);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Demo Mode local auth initialization
      setDemoMode(true);
      const savedUser = localStorage.getItem('cs_demo_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        fetchUserProfile(u.uid, u.email, true);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Fetch profile details
  const fetchUserProfile = async (uid, email, isDemo = false) => {
    try {
      if (!isDemo && db) {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          checkAndAwardAchievements(uid, data, false);
        } else {
          // Create new firestore profile
          const newProfile = {
            ...DEFAULT_PROFILE,
            email: email,
            username: email.split('@')[0],
            createdAt: new Date().toISOString(),
            lastLoginDate: new Date().toDateString(),
            achievements: ['first_login'] // First Login achievement automatically
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
          trackEvent('profile_created', { email });
        }
      } else {
        // LocalStorage mock implementation
        const profilesKey = 'cs_demo_profiles';
        const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}');
        let currentProfile = profiles[uid];
        
        if (!currentProfile) {
          currentProfile = {
            ...DEFAULT_PROFILE,
            email: email,
            username: email.split('@')[0],
            createdAt: new Date().toISOString(),
            lastLoginDate: new Date().toDateString(),
            achievements: ['first_login']
          };
          profiles[uid] = currentProfile;
          localStorage.setItem(profilesKey, JSON.stringify(profiles));
          trackEvent('profile_created_demo', { email });
        } else {
          // Update consecutive days logic
          const todayStr = new Date().toDateString();
          if (currentProfile.lastLoginDate !== todayStr) {
            const lastDate = currentProfile.lastLoginDate ? new Date(currentProfile.lastLoginDate) : null;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
              currentProfile.consecutiveDays += 1;
            } else if (lastDate && lastDate.toDateString() !== todayStr) {
              currentProfile.consecutiveDays = 1;
            }
            currentProfile.lastLoginDate = todayStr;
            profiles[uid] = currentProfile;
            localStorage.setItem(profilesKey, JSON.stringify(profiles));
          }
        }
        
        setProfile(currentProfile);
        checkAndAwardAchievements(uid, currentProfile, true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Helper to save profile edits
  const saveProfileData = async (updatedFields, isDemo = demoMode) => {
    if (!user || !profile) return;
    const nextProfile = { ...profile, ...updatedFields };
    setProfile(nextProfile);

    try {
      if (!isDemo && db) {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, updatedFields);
      } else {
        const profilesKey = 'cs_demo_profiles';
        const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}');
        profiles[user.uid] = nextProfile;
        localStorage.setItem(profilesKey, JSON.stringify(profiles));
      }
      
      // Recalculate achievements on updates
      checkAndAwardAchievements(user.uid, nextProfile, isDemo);
    } catch (e) {
      console.error("Error updating profile stats:", e);
    }
  };

  // Check achievements requirements and award
  const checkAndAwardAchievements = (uid, currentProfile, isDemo) => {
    let modified = false;
    const achievements = [...(currentProfile.achievements || [])];

    const award = (id, title) => {
      if (!achievements.includes(id)) {
        achievements.push(id);
        modified = true;
        trackAchievement(id, title);
        
        // Custom dispatch event for floating notification/confetti
        const event = new CustomEvent('achievement-unlocked', { detail: { id, title } });
        window.dispatchEvent(event);
      }
    };

    // 1. First login (awarded during profile creation, but check as safety)
    award('first_login', 'Primer inicio de sesión');

    // 2. First session (has at least 1 session and at least 1 mood log)
    if (currentProfile.sessionCount >= 1) {
      award('first_session', 'Primera sesión');
    }

    // 3. 7 consecutive days
    if (currentProfile.consecutiveDays >= 7) {
      award('seven_days', '7 días consecutivos');
    }

    // 4. 100 minutes of relaxation
    if (currentProfile.totalTimeSpent >= 100) {
      award('hundred_minutes', '100 minutos de relajación');
    }

    // 5. Try all 5 games
    const playtimes = currentProfile.gamePlaytimes || {};
    const playedAll = Object.values(playtimes).every(t => t > 0);
    if (playedAll) {
      award('all_games', 'Probar los cinco juegos');
    }

    // 6. Complete 50 breathing exercises
    if (currentProfile.breathingSessions >= 50) {
      award('fifty_breathing', 'Completar 50 ejercicios de respiración');
    }

    if (modified) {
      // Save background updates without infinite loops
      const nextProfile = { ...currentProfile, achievements };
      setProfile(nextProfile);
      
      if (!isDemo && db) {
        const docRef = doc(db, 'users', uid);
        updateDoc(docRef, { achievements });
      } else {
        const profilesKey = 'cs_demo_profiles';
        const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}');
        profiles[uid] = nextProfile;
        localStorage.setItem(profilesKey, JSON.stringify(profiles));
      }
    }
  };

  // Registers a new user
  const registerUser = async (username, email, password) => {
    trackEvent('auth_register_attempt');
    if (!demoMode && auth) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      // Wait for profile fetch which sets profile
      return credential.user;
    } else {
      // Mock Registration
      const mockUid = 'demo_user_' + Math.random().toString(36).substr(2, 9);
      const newUser = { uid: mockUid, email };
      
      // Save user to active session
      localStorage.setItem('cs_demo_user', JSON.stringify(newUser));
      
      // Seed details in profiles database
      const profilesKey = 'cs_demo_profiles';
      const profiles = JSON.parse(localStorage.getItem(profilesKey) || '{}');
      profiles[mockUid] = {
        ...DEFAULT_PROFILE,
        username: username || email.split('@')[0],
        email: email,
        createdAt: new Date().toISOString(),
        lastLoginDate: new Date().toDateString(),
        achievements: ['first_login']
      };
      localStorage.setItem(profilesKey, JSON.stringify(profiles));

      setUser(newUser);
      setProfile(profiles[mockUid]);
      setLoading(false);
      trackEvent('auth_register_success_demo', { email });
      return newUser;
    }
  };

  // Logs user in
  const loginUser = async (email, password) => {
    trackEvent('auth_login_attempt');
    if (!demoMode && auth) {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } else {
      // Mock Login
      // Create user if they don't exist, or log them in
      const mockUid = 'demo_user_12345';
      const newUser = { uid: mockUid, email };
      
      localStorage.setItem('cs_demo_user', JSON.stringify(newUser));
      setUser(newUser);
      await fetchUserProfile(mockUid, email, true);
      setLoading(false);
      
      trackEvent('auth_login_success_demo', { email });
      return newUser;
    }
  };

  // Log user out
  const logoutUser = async () => {
    trackEvent('auth_logout');
    if (!demoMode && auth) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem('cs_demo_user');
      setUser(null);
      setProfile(null);
    }
  };

  // Send password reset
  const recoverPassword = async (email) => {
    trackEvent('auth_password_reset_attempt', { email });
    if (!demoMode && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`Demo: Password reset email simulated for: ${email}`);
    }
  };

  // Record an emotional check-in
  const recordMood = async (mood) => {
    if (!profile) return;
    trackEvent('mood_recorded', { mood });

    const newHistory = [...(profile.moodHistory || [])];
    newHistory.push({ date: new Date().toISOString(), mood });
    
    // Calculate most frequent mood
    const counts = {};
    newHistory.forEach(item => {
      counts[item.mood] = (counts[item.mood] || 0) + 1;
    });
    
    let frequentMood = profile.frequentMood || 'Relajado';
    let maxCount = 0;
    Object.entries(counts).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        frequentMood = m;
      }
    });

    const fields = {
      moodHistory: newHistory,
      frequentMood,
      sessionCount: (profile.sessionCount || 0) + 1
    };

    await saveProfileData(fields);
  };

  // Record game session duration
  const recordGameSession = async (gameId, timeInSeconds) => {
    if (!profile) return;
    const timeInMinutes = parseFloat((timeInSeconds / 60).toFixed(2));
    
    const playtimes = { ...(profile.gamePlaytimes || {}) };
    playtimes[gameId] = parseFloat(((playtimes[gameId] || 0) + timeInMinutes).toFixed(2));
    
    // Determine favorite game
    let favoriteGame = profile.favoriteGame;
    let maxTime = 0;
    Object.entries(playtimes).forEach(([g, time]) => {
      if (time > maxTime) {
        maxTime = time;
        favoriteGame = g;
      }
    });

    // Map game identifier to localized names
    const gameNamesMapping = {
      'zen-garden': 'Jardín Zen',
      'pop-it': 'Pop It Antiestrés',
      'breathing': 'Respiración Guiada',
      'slime': 'Slime Simulator',
      'light-rain': 'Lluvia de Luz'
    };
    
    const mappedFavorite = gameNamesMapping[favoriteGame] || favoriteGame;

    const fields = {
      gamePlaytimes: playtimes,
      favoriteGame: mappedFavorite,
      totalTimeSpent: parseFloat(((profile.totalTimeSpent || 0) + timeInMinutes).toFixed(2))
    };

    // Increment breathing count specifically if breathing was played
    if (gameId === 'breathing') {
      fields.breathingSessions = (profile.breathingSessions || 0) + 1;
    }

    await saveProfileData(fields);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      demoMode,
      loginUser,
      registerUser,
      logoutUser,
      recoverPassword,
      recordMood,
      recordGameSession,
      saveProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
