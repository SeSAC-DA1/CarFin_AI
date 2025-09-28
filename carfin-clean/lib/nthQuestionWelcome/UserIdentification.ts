// lib/nthQuestionWelcome/UserIdentification.ts

interface UserSession {
  userId: string;
  sessionId: string;
  visitCount: number;
  questionCount: number;
  firstVisit: Date;
  lastVisit: Date;
  preferences?: UserPreferences;
}

interface UserPreferences {
  favoritePersona?: string;
  budgetRange?: { min: number; max: number };
  brandPreference?: string[];
  searchHistory?: SearchHistory[];
}

interface SearchHistory {
  timestamp: Date;
  query: string;
  detectedPersona?: string;
  budget: { min: number; max: number };
  recommendations: string[];
  userFeedback?: 'satisfied' | 'unsatisfied' | 'neutral';
}

export class UserTracker {
  private static readonly STORAGE_KEY_PREFIX = 'carfin_user_';
  private static readonly HISTORY_KEY_PREFIX = 'carfin_history_';
  private static readonly MAX_HISTORY_ITEMS = 50;

  // 브라우저 지문(fingerprint) + localStorage 조합
  generateUserId(): string {
    if (typeof window === 'undefined') {
      // 서버 사이드에서는 임시 ID 생성
      return 'server_' + Math.random().toString(36).substring(2, 15);
    }

    const fingerprint = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.language
    ].join('|');

    return btoa(fingerprint).substring(0, 16);
  }

  getOrCreateUserSession(): UserSession {
    if (typeof window === 'undefined') {
      // 서버 사이드에서는 기본 세션 반환
      return this.createDefaultSession();
    }

    const userId = this.generateUserId();
    const storageKey = `${UserTracker.STORAGE_KEY_PREFIX}${userId}`;
    const sessionStorageKey = `carfin_current_session`;

    // 현재 세션 확인
    const currentSessionId = sessionStorage.getItem(sessionStorageKey);
    const stored = localStorage.getItem(storageKey);

    if (stored && currentSessionId) {
      try {
        const session: UserSession = JSON.parse(stored);

        // 같은 세션인지 확인
        if (session.sessionId === currentSessionId) {
          // 동일 세션: 기존 데이터 유지
          session.lastVisit = new Date();
          localStorage.setItem(storageKey, JSON.stringify(session));
          return session;
        }
      } catch (error) {
        console.warn('Failed to parse stored user session, creating new one');
      }
    }

    // 새로운 세션 생성 (새로운 대화 시작)
    const newSessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionStorageKey, newSessionId);

    let visitCount = 1;
    if (stored) {
      try {
        const prevSession: UserSession = JSON.parse(stored);
        visitCount = prevSession.visitCount + 1;
      } catch (error) {
        console.warn('Failed to parse previous session data');
      }
    }

    const newSession: UserSession = {
      userId,
      sessionId: newSessionId,
      visitCount,
      questionCount: 0, // 새 세션마다 질문 카운트 리셋
      firstVisit: stored ? JSON.parse(stored).firstVisit : new Date(),
      lastVisit: new Date()
    };

    localStorage.setItem(storageKey, JSON.stringify(newSession));
    return newSession;
  }

  private createDefaultSession(): UserSession {
    return {
      userId: 'default_user',
      sessionId: 'default_session',
      visitCount: 1,
      questionCount: 0,
      firstVisit: new Date(),
      lastVisit: new Date()
    };
  }

  incrementQuestionCount(userId: string): number {
    if (typeof window === 'undefined') {
      return 1; // 서버 사이드에서는 기본값 반환
    }

    const storageKey = `${UserTracker.STORAGE_KEY_PREFIX}${userId}`;
    const sessionStorageKey = `carfin_current_session`;
    const stored = localStorage.getItem(storageKey);
    const currentSessionId = sessionStorage.getItem(sessionStorageKey);

    if (stored && currentSessionId) {
      try {
        const session: UserSession = JSON.parse(stored);

        // 세션 ID 일치 확인
        if (session.sessionId === currentSessionId) {
          session.questionCount += 1;
          session.lastVisit = new Date();

          localStorage.setItem(storageKey, JSON.stringify(session));
          return session.questionCount;
        }
      } catch (error) {
        console.warn('Failed to parse session during question count increment');
      }
    }

    // 세션 불일치 또는 오류 시 1 반환
    return 1;
  }

  addSearchToHistory(userId: string, search: SearchHistory): void {
    if (typeof window === 'undefined') {
      return;
    }

    const historyKey = `${UserTracker.HISTORY_KEY_PREFIX}${userId}`;
    const history = this.getSearchHistory(userId);

    history.push(search);

    // 최근 50개 검색만 보관 (성능 고려)
    if (history.length > UserTracker.MAX_HISTORY_ITEMS) {
      history.splice(0, history.length - UserTracker.MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  getSearchHistory(userId: string): SearchHistory[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const historyKey = `${UserTracker.HISTORY_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(historyKey);

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse search history');
        return [];
      }
    }

    return [];
  }

  generatePersonalizedInsights(userId: string): PersonalizedInsights {
    const history = this.getSearchHistory(userId);

    return {
      favoritePersona: this.analyzeFavoritePersona(history),
      budgetTrend: this.analyzeBudgetTrend(history),
      brandPreference: this.analyzeBrandPreference(history),
      recommendations: this.generateSmartRecommendations(history)
    };
  }

  private analyzeFavoritePersona(history: SearchHistory[]): string | null {
    if (history.length === 0) return null;

    const personaCounts: { [key: string]: number } = {};

    history.forEach(search => {
      if (search.detectedPersona) {
        personaCounts[search.detectedPersona] = (personaCounts[search.detectedPersona] || 0) + 1;
      }
    });

    if (Object.keys(personaCounts).length === 0) return null;

    return Object.keys(personaCounts).reduce((a, b) =>
      personaCounts[a] > personaCounts[b] ? a : b
    );
  }

  private analyzeBudgetTrend(history: SearchHistory[]): 'increasing' | 'decreasing' | 'stable' | null {
    if (history.length < 2) return null;

    const recentHistory = history.slice(-5); // 최근 5개 검색
    const budgets = recentHistory.map(h => (h.budget.min + h.budget.max) / 2);

    if (budgets.length < 2) return null;

    const firstBudget = budgets[0];
    const lastBudget = budgets[budgets.length - 1];
    const difference = lastBudget - firstBudget;

    if (Math.abs(difference) < 200) return 'stable'; // 200만원 미만 차이는 안정적
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  private analyzeBrandPreference(history: SearchHistory[]): string[] {
    // 검색 히스토리에서 브랜드 선호도 분석 (현재는 기본 구현)
    return [];
  }

  private generateSmartRecommendations(history: SearchHistory[]): string[] {
    // 검색 히스토리 기반 스마트 추천 생성 (현재는 기본 구현)
    return [];
  }
}

interface PersonalizedInsights {
  favoritePersona: string | null;
  budgetTrend: 'increasing' | 'decreasing' | 'stable' | null;
  brandPreference: string[];
  recommendations: string[];
}

export type { UserSession, UserPreferences, SearchHistory, PersonalizedInsights };