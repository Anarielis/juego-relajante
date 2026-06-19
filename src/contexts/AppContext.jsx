import React, { createContext, useContext, useState, useEffect } from 'react';
import audioSynth from '../utils/audioSynth';
import { trackEvent } from '../analytics/tracking';

const AppContext = createContext();

const translations = {
  es: {
    welcome_title: "CalmSpace",
    welcome_tagline: "Encuentra tu paz en un espacio diseñado para el bienestar y la relajación ASMR",
    welcome_start: "Comenzar",
    login: "Iniciar Sesión",
    register: "Registrarse",
    email: "Correo Electrónico",
    password: "Contraseña",
    username: "Nombre de Usuario",
    confirm_password: "Confirmar Contraseña",
    dont_have_account: "¿No tienes una cuenta?",
    already_have_account: "¿Ya tienes cuenta?",
    logout: "Cerrar Sesión",
    profile: "Perfil",
    settings: "Configuración",
    zen_garden: "Jardín Zen",
    pop_it: "Pop It Antiestrés",
    breathing: "Respiración Guiada",
    slime: "Slime Simulator",
    light_rain: "Lluvia de Luz",
    how_do_you_feel: "¿Cómo te sientes hoy?",
    mood_happy: "Feliz",
    mood_relaxed: "Relajado",
    mood_anxious: "Ansioso",
    mood_sad: "Triste",
    mood_stressed: "Estresado",
    mood_tired: "Cansado",
    submit: "Enviar",
    save: "Guardar",
    sound_settings: "Sonido y Música",
    enable_sounds: "Efectos de Sonido ASMR",
    ambient_music: "Música Ambiental Meditativa",
    volume: "Volumen General",
    ambient_volume: "Volumen Música",
    theme_settings: "Aspecto Visual",
    dark_mode: "Tema Oscuro",
    language_settings: "Idioma",
    select_language: "Seleccionar Idioma",
    reset_pref: "Restablecer Preferencias",
    favorite_game: "Juego Favorito",
    total_time: "Tiempo Total",
    sessions_count: "Sesiones",
    mood_frequent: "Estado de Ánimo Frecuente",
    achievements: "Logros Desbloqueados",
    play: "Jugar",
    minutes: "minutos",
    seconds: "segundos",
    clicks: "Pulsaciones",
    reset: "Reiniciar",
    breathing_inhale: "Inhala",
    breathing_hold: "Mantén",
    breathing_exhale: "Exhala",
    breathing_mode: "Modo de Respiración",
    mode_relax: "Relajación",
    mode_anxiety: "Reducir Ansiedad",
    mode_sleep: "Dormir",
    mode_focus: "Concentración",
    slime_color: "Color del Slime",
    slime_sparkle: "Agregar Brillantina",
    slime_texture: "Textura",
    texture_default: "Estándar",
    texture_fluffy: "Esponjosa",
    texture_metallic: "Metálica",
    light_scenario: "Escenario",
    scenario_galaxy: "Galaxia",
    scenario_aurora: "Aurora Boreal",
    scenario_magic: "Bosque Mágico",
    scenario_night: "Cielo Nocturno",
    active_sessions: "Sesiones Realizadas",
    recent_moods: "Historial Emocional",
    no_achievements: "Continúa explorando CalmSpace para desbloquear logros.",
    reset_success: "Preferencias restablecidas correctamente.",
  },
  en: {
    welcome_title: "CalmSpace",
    welcome_tagline: "Find your peace in a space designed for wellness and ASMR relaxation",
    welcome_start: "Get Started",
    login: "Log In",
    register: "Register",
    email: "Email Address",
    password: "Password",
    username: "Username",
    confirm_password: "Confirm Password",
    dont_have_account: "Don't have an account?",
    already_have_account: "Already have an account?",
    logout: "Log Out",
    profile: "Profile",
    settings: "Settings",
    zen_garden: "Zen Garden",
    pop_it: "Pop It Anti-stress",
    breathing: "Guided Breathing",
    slime: "Slime Simulator",
    light_rain: "Light Rain",
    how_do_you_feel: "How do you feel today?",
    mood_happy: "Happy",
    mood_relaxed: "Relaxed",
    mood_anxious: "Anxious",
    mood_sad: "Sad",
    mood_stressed: "Stressed",
    mood_tired: "Tired",
    submit: "Submit",
    save: "Save",
    sound_settings: "Sound & Music",
    enable_sounds: "ASMR Sound Effects",
    ambient_music: "Meditative Ambient Music",
    volume: "Master Volume",
    ambient_volume: "Music Volume",
    theme_settings: "Visual Settings",
    dark_mode: "Dark Theme",
    language_settings: "Language",
    select_language: "Select Language",
    reset_pref: "Reset Preferences",
    favorite_game: "Favorite Game",
    total_time: "Total Time",
    sessions_count: "Sessions",
    mood_frequent: "Frequent Mood",
    achievements: "Unlocked Achievements",
    play: "Play",
    minutes: "minutes",
    seconds: "seconds",
    clicks: "Clicks",
    reset: "Reset",
    breathing_inhale: "Inhale",
    breathing_hold: "Hold",
    breathing_exhale: "Exhale",
    breathing_mode: "Breathing Mode",
    mode_relax: "Relaxation",
    mode_anxiety: "Reduce Anxiety",
    mode_sleep: "Sleep",
    mode_focus: "Focus",
    slime_color: "Slime Color",
    slime_sparkle: "Add Glitter",
    slime_texture: "Texture",
    texture_default: "Standard",
    texture_fluffy: "Fluffy",
    texture_metallic: "Metallic",
    light_scenario: "Scenario",
    scenario_galaxy: "Galaxy",
    scenario_aurora: "Northern Lights",
    scenario_magic: "Magic Forest",
    scenario_night: "Night Sky",
    active_sessions: "Completed Sessions",
    recent_moods: "Emotional History",
    no_achievements: "Keep exploring CalmSpace to unlock achievements.",
    reset_success: "Preferences reset successfully.",
  }
};

export const AppProvider = ({ children }) => {
  // Load initial settings from localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem('cs_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('cs_language') || 'es');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const val = localStorage.getItem('cs_sound_enabled');
    return val !== null ? val === 'true' : true;
  });
  const [ambientMusicEnabled, setAmbientMusicEnabled] = useState(() => {
    const val = localStorage.getItem('cs_ambient_music');
    return val !== null ? val === 'true' : false;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const val = localStorage.getItem('cs_sound_volume');
    return val !== null ? parseFloat(val) : 0.5;
  });
  const [ambientVolume, setAmbientVolume] = useState(() => {
    const val = localStorage.getItem('cs_ambient_volume');
    return val !== null ? parseFloat(val) : 0.2;
  });

  // Apply visual theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cs_theme', theme);
  }, [theme]);

  // Synchronize audio elements
  useEffect(() => {
    audioSynth.setEnabled(soundEnabled);
    localStorage.setItem('cs_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    audioSynth.setVolume(soundVolume);
    localStorage.setItem('cs_sound_volume', soundVolume.toString());
  }, [soundVolume]);

  useEffect(() => {
    audioSynth.setAmbientVolume(ambientVolume);
    localStorage.setItem('cs_ambient_volume', ambientVolume.toString());
  }, [ambientVolume]);

  // Start or Stop ambient music loop
  useEffect(() => {
    if (ambientMusicEnabled && soundEnabled) {
      audioSynth.startAmbientMusic();
    } else {
      audioSynth.stopAmbientMusic();
    }
    localStorage.setItem('cs_ambient_music', ambientMusicEnabled.toString());
  }, [ambientMusicEnabled, soundEnabled]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    trackEvent('theme_toggled', { theme: nextTheme });
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('cs_language', lang);
    trackEvent('language_changed', { lang });
  };

  const resetPreferences = () => {
    setTheme('light');
    setLanguage('es');
    setSoundEnabled(true);
    setAmbientMusicEnabled(false);
    setSoundVolume(0.5);
    setAmbientVolume(0.2);
    trackEvent('preferences_reset');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      language,
      changeLanguage,
      soundEnabled,
      setSoundEnabled,
      ambientMusicEnabled,
      setAmbientMusicEnabled,
      soundVolume,
      setSoundVolume,
      ambientVolume,
      setAmbientVolume,
      resetPreferences,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
