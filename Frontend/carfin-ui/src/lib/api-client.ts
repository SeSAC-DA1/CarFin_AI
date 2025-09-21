/**
 * CarFin API Client - FastAPI 백엔드와 통신 (강화된 에러 핸들링)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
  isOffline?: boolean;
}

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

class CarFinAPIClient {
  private baseURL: string;
  private defaultTimeout = 10000; // 10초
  private defaultRetries = 3;
  private defaultRetryDelay = 1000; // 1초

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async requestWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getDetailedError(error: any, retryCount: number): { error: string; isOffline: boolean } {
    const isOffline = !navigator.onLine;

    if (isOffline) {
      return {
        error: '인터넷 연결을 확인해주세요. 오프라인 상태입니다.',
        isOffline: true
      };
    }

    if (error.name === 'AbortError') {
      return {
        error: `서버 응답이 지연되고 있습니다. (${retryCount}/${this.defaultRetries} 재시도)`,
        isOffline: false
      };
    }

    if (error.message.includes('Failed to fetch')) {
      return {
        error: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        isOffline: false
      };
    }

    if (error.message.includes('500')) {
      return {
        error: '서버 내부 오류가 발생했습니다. 개발팀에 문의해주세요.',
        isOffline: false
      };
    }

    if (error.message.includes('404')) {
      return {
        error: '요청한 리소스를 찾을 수 없습니다.',
        isOffline: false
      };
    }

    return {
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      isOffline: false
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      timeout = this.defaultTimeout,
      ...fetchOptions
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`🔄 API 요청 시도 ${attempt + 1}/${retries + 1}: ${url}`);

        const response = await this.requestWithTimeout(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        }, timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API 요청 성공: ${endpoint}`);

        return {
          success: true,
          data,
          retryCount: attempt
        };
      } catch (error) {
        lastError = error;
        console.warn(`❌ API 요청 실패 (시도 ${attempt + 1}/${retries + 1}):`, error);

        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt); // 지수적 백오프
          console.log(`⏳ ${delay}ms 후 재시도...`);
          await this.sleep(delay);
        }
      }
    }

    const { error, isOffline } = this.getDetailedError(lastError, retries + 1);

    return {
      success: false,
      error,
      retryCount: retries + 1,
      isOffline
    };
  }

  // 헬스체크 (빠른 응답 필요)
  async healthCheck() {
    return this.request('/health', {
      timeout: 5000, // 5초로 단축
      retries: 1 // 재시도 1회로 제한
    });
  }

  // 사용자 등록
  async registerUser(userData: {
    full_name: string;
    email: string;
    age: number;
    phone?: string;
  }) {
    return this.request('/api/v1/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      timeout: 15000 // 사용자 등록은 더 긴 시간 허용
    });
  }

  // 사용자 선호도 저장
  async saveUserPreferences(userId: string, preferences: Record<string, any>) {
    return this.request(`/api/v1/users/${userId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  // 차량 목록 가져오기 (가장 중요한 API - 안정성 우선)
  async getVehicles(params?: {
    limit?: number;
    offset?: number;
    brand?: string;
    min_price?: number;
    max_price?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/v1/vehicles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint, {
      timeout: 20000, // 차량 데이터는 큰 데이터셋이므로 더 긴 시간 허용
      retries: 5, // 중요한 API이므로 재시도 횟수 증가
      retryDelay: 2000 // 재시도 간격도 늘림
    });
  }

  // 특정 차량 상세 정보
  async getVehicle(vehicleId: string) {
    return this.request(`/api/v1/vehicles/${vehicleId}`, {
      timeout: 15000
    });
  }

  // AI 추천 요청 (AI 처리 시간 고려)
  async getRecommendations(userProfile: Record<string, any>) {
    return this.request('/api/v1/recommendations', {
      method: 'POST',
      body: JSON.stringify(userProfile),
      timeout: 30000, // AI 추천은 더 긴 처리 시간 필요
      retries: 2 // 추천은 재시도 줄임
    });
  }

  // 연결 상태 확인
  async isOnline(): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      const response = await this.healthCheck();
      return response.success;
    } catch {
      return false;
    }
  }

  // API 상태 모니터링
  async getApiStatus() {
    const startTime = Date.now();
    const healthResponse = await this.healthCheck();
    const responseTime = Date.now() - startTime;

    return {
      ...healthResponse,
      responseTime,
      timestamp: new Date().toISOString(),
      isOnline: navigator.onLine
    };
  }
}

// Singleton 패턴
export const apiClient = new CarFinAPIClient();
export default apiClient;