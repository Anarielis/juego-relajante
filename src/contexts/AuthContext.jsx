import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { hashPassword } from '../utils/hash';
import { trackEvent, trackAchievement } from '../analytics/tracking';

const AuthContext = createContext();

const DEFAULT_PROFILE = {
  username: '',
  passwordHash: '',
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

  // Initialize and check active session
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUserStr = localStorage.getItem('cs_active_user');
      
      if (!isFirebaseConfigured || !db) {
        setDemoMode(true);
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            setUser(savedUser);
            await fetchUserProfile(savedUser.uid, savedUser.username, true);
          } catch (e) {
            console.error("Failed to parse demo session:", e);
          }
        }
        setLoading(false);
      } else {
        // Firebase Mode
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            setUser(savedUser);
            await fetchUserProfile(savedUser.uid, savedUser.username, false);
          } catch (e) {
            console.error("Failed to fetch profile session:", e);
            localStorage.removeItem('cs_active_user');
          }
        }
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (uid, username, isDemo = demoMode) => {
    try {
      const todayStr = new Date().toDateString();

      if (!isDemo && db) {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          let data = docSnap.data();
          
          // Update consecutive login streak
          if (data.lastLoginDate !== todayStr) {
            const lastDate = data.lastLoginDate ? new Date(data.lastLoginDate) : null;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let newStreak = data.consecutiveDays || 1;
            if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
              newStreak += 1;
            } else if (lastDate && lastDate.toDateString() !== todayStr) {
              newStreak = 1;
            }

            await updateDoc(docRef, {
              lastLoginDate: todayStr,
              consecutiveDays: newStreak
            });
            data = { ...data, lastLoginDate: todayStr, consecutiveDays: newStreak };
          }

          setProfile(data);
          checkAndAwardAchievements(uid, data, false);
        } else {
          throw new Error("No se encontró el perfil del usuario.");
        }
      } else {
        // Demo Mode / LocalStorage Mock
        const profilesKey = 'cs_profiles_db';
        const dbMock = JSON.parse(localStorage.getItem(profilesKey) || '{}');
        let currentProfile = dbMock[uid];

        if (currentProfile) {
          // Check streak days
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
            dbMock[uid] = currentProfile;
            localStorage.setItem(profilesKey, JSON.stringify(dbMock));
          }

          setProfile(currentProfile);
          checkAndAwardAchievements(uid, currentProfile, true);
        } else {
          throw new Error("Perfil simulado no encontrado.");
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Clean up session if profile fetch fails
      logoutUser();
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
        const profilesKey = 'cs_profiles_db';
        const dbMock = JSON.parse(localStorage.getItem(profilesKey) || '{}');
        dbMock[user.uid] = nextProfile;
        localStorage.setItem(profilesKey, JSON.stringify(dbMock));
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
      // Save updates
      const nextProfile = { ...currentProfile, achievements };
      setProfile(nextProfile);
      
      if (!isDemo && db) {
        const docRef = doc(db, 'users', uid);
        updateDoc(docRef, { achievements });
      } else {
        const profilesKey = 'cs_profiles_db';
        const dbMock = JSON.parse(localStorage.getItem(profilesKey) || '{}');
        dbMock[uid] = nextProfile;
        localStorage.setItem(profilesKey, JSON.stringify(dbMock));
      }
    }
  };

  // Registers a new user
  const registerUser = async (username, password) => {
    trackEvent('sign_up', { method: 'username' });
    const normalizedUsername = username.toLowerCase().trim();

    if (!isFirebaseConfigured || !db) {
      // LocalStorage Mock Registration
      const profilesKey = 'cs_profiles_db';
      const dbMock = JSON.parse(localStorage.getItem(profilesKey) || '{}');

      if (dbMock[normalizedUsername]) {
        throw new Error("El nombre de usuario ya está registrado.");
      }

      const passwordHash = await hashPassword(password);
      const newProfile = {
        ...DEFAULT_PROFILE,
        uid: normalizedUsername,
        username: username.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLoginDate: new Date().toDateString(),
        achievements: ['first_login']
      };

      dbMock[normalizedUsername] = newProfile;
      localStorage.setItem(profilesKey, JSON.stringify(dbMock));

      const activeSession = { username: username.trim(), uid: normalizedUsername };
      localStorage.setItem('cs_active_user', JSON.stringify(activeSession));

      setUser(activeSession);
      setProfile(newProfile);
      setDemoMode(true);
      return activeSession;
    } else {
      // Real Firebase Firestore Custom Registration
      const userRef = doc(db, 'users', normalizedUsername);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        throw new Error("El nombre de usuario ya está registrado.");
      }

      const passwordHash = await hashPassword(password);
      const newProfile = {
        ...DEFAULT_PROFILE,
        uid: normalizedUsername,
        username: username.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLoginDate: new Date().toDateString(),
        achievements: ['first_login']
      };

      await setDoc(userRef, newProfile);

      const activeSession = { username: username.trim(), uid: normalizedUsername };
      localStorage.setItem('cs_active_user', JSON.stringify(activeSession));

      setUser(activeSession);
      setProfile(newProfile);
      return activeSession;
    }
  };

  // Logs user in
  const loginUser = async (username, password) => {
    trackEvent('login', { method: 'username' });
    const normalizedUsername = username.toLowerCase().trim();
    const enteredHash = await hashPassword(password);

    if (!isFirebaseConfigured || !db) {
      // LocalStorage Mock Login
      const profilesKey = 'cs_profiles_db';
      const dbMock = JSON.parse(localStorage.getItem(profilesKey) || '{}');
      const account = dbMock[normalizedUsername];

      if (!account) {
        throw new Error("El nombre de usuario no existe.");
      }

      if (account.passwordHash !== enteredHash) {
        throw new Error("La contraseña es incorrecta.");
      }

      const activeSession = { username: account.username, uid: normalizedUsername };
      localStorage.setItem('cs_active_user', JSON.stringify(activeSession));

      setUser(activeSession);
      setDemoMode(true);
      await fetchUserProfile(normalizedUsername, account.username, true);
      return activeSession;
    } else {
      // Real Firebase Firestore Login
      const userRef = doc(db, 'users', normalizedUsername);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("El nombre de usuario no existe.");
      }

      const account = userSnap.data();

      if (account.passwordHash !== enteredHash) {
        throw new Error("La contraseña es incorrecta.");
      }

      const activeSession = { username: account.username, uid: normalizedUsername };
      localStorage.setItem('cs_active_user', JSON.stringify(activeSession));

      setUser(activeSession);
      await fetchUserProfile(normalizedUsername, account.username, false);
      return activeSession;
    }
  };

  // Log user out
  const logoutUser = () => {
    localStorage.removeItem('cs_active_user');
    setUser(null);
    setProfile(null);
  };

  // Record an emotional check-in
  const recordMood = async (mood) => {
    if (!profile) return;
    trackEvent('mood_selected', { mood });

    const newHistory = [...(profile.moodHistory || [])];
    newHistory.push({ date: new Date().toISOString(), mood });
    
    // Calculate most frequent mood
    const counts = {};
    newHistory.forEach(item => {
      counts[item.mood] = (counts[item.mood] || 0) + 1;
    });
    
    let mostFrequentMood = profile.mostFrequentMood || 'Relajado';
    let maxCount = 0;
    Object.entries(counts).forEach(([m, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentMood = m;
      }
    });

    const fields = {
      moodHistory: newHistory,
      mostFrequentMood,
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

    if (gameId === 'breathing') {
      fields.breathingSessions = (profile.breathingSessions || 0) + 1;
    }

    trackEvent('session_time', { game: gameId, duration_minutes: timeInMinutes });
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
      recordMood,
      recordGameSession,
      saveProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
