// CalmSpace Analytics Service
// Skeletons for Google Analytics 4 and Microsoft Clarity

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

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
    const script3 = document.createElement('script');
    script3.type = 'text/javascript';
    script3.innerHTML = `
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_ID}");
    `;
    document.head.appendChild(script3);
    console.log("Microsoft Clarity Initialized with ID:", CLARITY_ID);
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
  if (window.clarity && CLARITY_ID) {
    window.clarity("event", eventName);
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
