import clarity from '@microsoft/clarity';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || 'x9ovnqub2r';

// Dynamically inject scripts if IDs are provided
export const initAnalytics = () => {
  if (GA_ID) {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(script2);
    console.log("GA4 Initialized with ID:", GA_ID);
  }

  if (CLARITY_ID) {
    try {
      clarity.init(CLARITY_ID);
      console.log("Microsoft Clarity NPM Initialized with ID:", CLARITY_ID);
    } catch (e) {
      console.error("Clarity initialization failed:", e);
    }
  }
};

export const trackPageView = (pageName) => {
  if (window.gtag && GA_ID) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_path: window.location.pathname
    });
  }
  console.log(`[Analytics] Page View: ${pageName}`);
};

export const trackEvent = (eventName, params = {}) => {
  if (window.gtag && GA_ID) {
    window.gtag('event', eventName, params);
  }
  if (CLARITY_ID) {
    try {
      clarity.event(eventName);
    } catch (e) {
      console.warn("Clarity custom event tracking failed:", e);
    }
  }
  console.log(`[Analytics Event] ${eventName}:`, params);
};

export const trackGamePlay = (gameName, durationSeconds) => {
  trackEvent('game_played', {
    game_name: gameName,
    duration_seconds: durationSeconds
  });
};

export const trackMood = (mood) => {
  trackEvent('mood_recorded', {
    mood_value: mood
  });
};

export const trackAchievement = (achievementId, title) => {
  trackEvent('achievement_unlocked', {
    achievement_id: achievementId,
    achievement_title: title
  });
};
