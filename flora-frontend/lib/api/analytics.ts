import { apiClient } from './client';
import { AnalyticsEvent } from '../types/analytics';
import { useAuthStore } from '../store/authStore';

// Get or create an anonymous session ID for tracking unauthenticated users
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-session';
  
  let sessionId = localStorage.getItem('flora_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('flora_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Sends an analytics event to the backend.
 * Fails silently to prevent blocking the user experience.
 */
export async function trackEvent(
  eventType: AnalyticsEvent['event_type'], 
  data?: any
): Promise<void> {
  try {
    const user = useAuthStore.getState().user;
    
    const payload: Partial<AnalyticsEvent> = {
      event_type: eventType,
      session_id: getSessionId(),
      data,
    };

    if (user?.id) {
      payload.user_id = user.id;
    }

    // Fire and forget
    apiClient.post('/analytics/track', payload).catch(() => {
      // Ignore network errors for analytics
    });
  } catch (error) {
    // Completely silent
    console.debug('Analytics error (ignored):', error);
  }
}
