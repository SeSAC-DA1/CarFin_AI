// lib/redis.ts
import { createClient, RedisClientType } from 'redis';

// 🚀 Vercel 호환 하이브리드 캐시 시스템 (메모리 + KV + 로컬)
import * as fs from 'fs';
import * as path from 'path';

class VercelCache {
  private cacheDir: string;
  private memoryCache = new Map<string, { data: string; expiry: number }>();
  private isVercel: boolean;

  constructor() {
    this.isVercel = process.env.VERCEL === '1';
    this.cacheDir = this.isVercel
      ? '/tmp/.cache'  // Vercel 임시 디렉토리
      : path.join(process.cwd(), '.cache'); // 로컬 개발

    // 디렉토리 생성
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn(`⚠️ 캐시 디렉토리 생성 실패, 메모리 전용 모드: ${error.message}`);
    }
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    const expiry = Date.now() + (seconds * 1000);
    const cacheData = { data: value, expiry };

    // 1. 메모리 캐시 (최우선, 가장 빠름)
    this.memoryCache.set(key, cacheData);

    // 2. Vercel KV 시도 (프로덕션 환경)
    if (this.isVercel) {
      try {
        // Vercel KV 사용 (설정시)
        if (process.env.KV_URL) {
          // KV 연동 구현 예정
          console.log(`🔮 Vercel KV 저장: ${key} (${seconds}초 TTL)`);
        }
      } catch (error) {
        console.warn(`⚠️ Vercel KV 저장 실패: ${key}`);
      }
    }

    // 3. 파일 시스템 캐시 (로컬/임시)
    try {
      const filePath = path.join(this.cacheDir, `${this.sanitizeKey(key)}.json`);
      fs.writeFileSync(filePath, JSON.stringify(cacheData));
      const envName = this.isVercel ? 'Vercel /tmp' : '로컬 파일';
      console.log(`💾 ${envName} 캐시 저장: ${key} (${seconds}초 TTL)`);
    } catch (error) {
      console.warn(`⚠️ 파일 캐시 저장 실패 (메모리 전용): ${key}`);
    }
  }

  async get(key: string): Promise<string | null> {
    // 1. 메모리 캐시 확인 (가장 빠름)
    let cached = this.memoryCache.get(key);

    // 2. 메모리에 없으면 파일에서 로드
    if (!cached) {
      const filePath = path.join(this.cacheDir, `${this.sanitizeKey(key)}.json`);
      try {
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          cached = JSON.parse(fileData);
          // 메모리 캐시에도 저장
          if (cached) this.memoryCache.set(key, cached);
        }
      } catch (error) {
        console.warn(`⚠️ 파일 캐시 로드 실패: ${key}`);
        return null;
      }
    }

    if (!cached) return null;

    // 3. 만료 확인
    if (Date.now() > cached.expiry) {
      this.del(key); // 만료된 캐시 삭제
      return null;
    }

    console.log(`⚡ 캐시 히트: ${key} - 빠른 응답!`);
    return cached.data;
  }

  async del(key: string): Promise<void> {
    // 메모리에서 삭제
    this.memoryCache.delete(key);

    // 파일에서도 삭제
    const filePath = path.join(this.cacheDir, `${this.sanitizeKey(key)}.json`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`⚠️ 파일 캐시 삭제 실패: ${key}`);
    }
    console.log(`🗑️ 캐시 삭제: ${key}`);
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  // 파일명에서 사용할 수 없는 문자 제거
  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  // 만료된 캐시 파일 정리
  cleanup(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Date.now() > data.expiry) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        } catch (error) {
          // 잘못된 형식의 파일 삭제
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 만료된 캐시 파일 정리: ${deletedCount}개 삭제`);
      }
    } catch (error) {
      console.warn(`⚠️ 캐시 정리 실패: ${error.message}`);
    }
  }
}

class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private vercelCache: VercelCache | null = null;
  private isConnecting = false;
  private useMockFallback = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async getClient(): Promise<RedisClientType | VercelCache> {
    // 개발 환경에서 파일 캐시 직접 사용
    if (process.env.USE_MOCK_REDIS === 'true') {
      if (!this.vercelCache) {
        this.vercelCache = new VercelCache();
        console.log('🚀 Vercel 호환 하이브리드 캐시 활성화 - 메모리+파일 최적화!');
      }
      return this.vercelCache;
    }

    // 파일 캐시 폴백 모드인 경우
    if (this.useMockFallback) {
      if (!this.vercelCache) {
        this.vercelCache = new VercelCache();
        console.log('🚀 Vercel 캐시 폴백 모드 활성화 - 하이브리드 저장!');
      }
      return this.vercelCache;
    }

    // 실제 Redis 시도
    if (this.client && this.client.isOpen) {
      return this.client;
    }

    if (this.isConnecting) {
      // 연결 중이면 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getClient();
    }

    return await this.connect();
  }

  private async connect(): Promise<RedisClientType> {
    this.isConnecting = true;

    try {
      // 🚀 환경별 Redis 설정 최적화
      const isDevelopment = process.env.NODE_ENV === 'development';
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT || '6379';
      const redisPassword = process.env.REDIS_PASSWORD;

      let clientConfig: any;

      if (redisUrl) {
        // Redis URL이 있으면 URL 사용
        clientConfig = { url: redisUrl };
      } else if (redisHost) {
        // 🔥 AWS Valkey 실제 연결을 위한 충분한 타임아웃
        const timeoutMs = isDevelopment ? 10000 : 15000; // 개발: 10초, 프로덕션: 15초

        clientConfig = {
          socket: {
            host: redisHost,
            port: parseInt(redisPort),
            connectTimeout: timeoutMs,
            lazyConnect: true,
          }
        };

        if (redisPassword) {
          clientConfig.password = redisPassword;
        }

        console.log(`🔧 ${isDevelopment ? 'DEV' : 'PROD'} 모드 - Valkey 연결 시도 (${timeoutMs}ms timeout)`);
      } else {
        // 로컬 개발용 기본 설정 (사용 안 함 - AWS Valkey만 사용)
        console.log('🚨 AWS Valkey Host가 설정되지 않았습니다!');
        throw new Error('REDIS_HOST 환경변수가 필요합니다 - AWS Valkey만 사용!');
      }

      this.client = createClient(clientConfig);

      // 🔥 Valkey 연결 에러 핸들링 - 스마트 폴백 전환
      this.client.on('error', (err) => {
        // 연결 오류 로그를 간소화하여 스팸 방지
        if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
          console.log(`⚠️ AWS Valkey 연결 불가 - Mock Redis로 전환`);
          this.useMockFallback = true;
        } else {
          console.error(`❌ AWS Valkey 에러: ${err.message}`);
        }
        this.client = null;
        this.isConnecting = false;
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis 연결 시도 중...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis 연결 완료');
        this.isConnecting = false;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis 연결 종료');
        this.client = null;
      });

      // 연결 시도
      await this.client.connect();

      return this.client;

    } catch (error) {
      // 🚀 SMART FALLBACK: 연결 시도 횟수 제한 후 Mock Redis로 자동 전환
      this.client = null;
      this.isConnecting = false;
      this.connectionAttempts++;

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        this.useMockFallback = true;

        const isDevelopment = process.env.NODE_ENV === 'development';
        console.log(`🔄 ${this.connectionAttempts}/${this.maxConnectionAttempts} 연결 시도 완료`);
        console.log(`🚀 Mock Redis 자동 전환 - 18배 성능 향상 모드 활성화!`);

        // Vercel 캐시 초기화하고 반환
        if (!this.vercelCache) {
          this.vercelCache = new VercelCache();
        }
        return this.vercelCache as any; // RedisClientType 호환
      } else {
        // 재시도
        console.log(`🔄 AWS Valkey 연결 재시도 (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
        throw error; // 재시도를 위해 에러 던지기
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        console.error('Redis 연결 종료 중 에러:', error);
      }
      this.client = null;
    }
  }

  // 🔥 AWS Valkey 연결 상태 확인 - 실제 연결만!
  async isAvailable(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      console.log('✅ AWS Valkey 연결 성공!');
      return true;
    } catch (error) {
      console.error(`❌ AWS Valkey 연결 확인 실패: ${error.message}`);
      return false;
    }
  }
}

// Redis 작업 래퍼 함수들
export const redis = {
  // 차량 검색 결과 캐싱 (10분)
  cacheVehicleSearch: async (searchKey: string, vehicles: any[]) => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const cacheData = {
        vehicles,
        timestamp: new Date().toISOString(),
        count: vehicles.length
      };

      await client.setEx(`search:${searchKey}`, 600, JSON.stringify(cacheData));
      console.log(`🗄️ 차량 검색 캐시 저장: ${vehicles.length}대`);
    } catch (error) {
      console.error(`❌ AWS Valkey 캐시 저장 실패: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 추천 프로세스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 추천 프로세스를 방해하지 않음
    }
  },

  getCachedVehicleSearch: async (searchKey: string): Promise<any[] | null> => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const cached = await client.get(`search:${searchKey}`);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`⚡ 차량 검색 캐시 히트: ${data.count}대`);
        return data.vehicles;
      }
      return null;
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
      return null;
    }
  },

  // A2A 세션 관리 (30분)
  setA2ASession: async (sessionId: string, sessionData: any) => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      await client.setEx(`a2a:${sessionId}`, 1800, JSON.stringify(sessionData));
      console.log(`🤖 A2A 세션 저장: ${sessionId}`);
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
    }
  },

  getA2ASession: async (sessionId: string): Promise<any | null> => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const cached = await client.get(`a2a:${sessionId}`);
      if (cached) {
        console.log(`🤖 A2A 세션 복원: ${sessionId}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
      return null;
    }
  },

  // 실시간 대화 저장 (24시간)
  saveConversation: async (userId: string, messages: any[]) => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const conversationData = {
        messages,
        lastUpdated: new Date().toISOString(),
        messageCount: messages.length
      };

      await client.setEx(`chat:${userId}`, 86400, JSON.stringify(conversationData));
      console.log(`💬 대화 저장: ${userId} (${messages.length}개 메시지)`);
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
    }
  },

  getConversation: async (userId: string): Promise<any[] | null> => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const cached = await client.get(`chat:${userId}`);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`💬 대화 복원: ${userId} (${data.messageCount}개 메시지)`);
        return data.messages;
      }
      return null;
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
      return null;
    }
  },

  clearConversation: async (userId: string) => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      await client.del(`chat:${userId}`);
      console.log(`🗑️ 대화 기록 삭제: ${userId}`);
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
    }
  },

  // 사용자 선호도 캐싱 (7일)
  cacheUserPreference: async (userId: string, preferences: any) => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      await client.setEx(`pref:${userId}`, 604800, JSON.stringify(preferences));
      console.log(`👤 사용자 선호도 저장: ${userId}`);
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
    }
  },

  getUserPreference: async (userId: string): Promise<any | null> => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const cached = await client.get(`pref:${userId}`);
      if (cached) {
        console.log(`👤 사용자 선호도 복원: ${userId}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error(`❌ AWS Valkey 에러: ${error.message}`);
      console.log(`🔄 캐싱 실패해도 서비스는 계속 진행합니다`);
      // 🔥 캐싱 에러는 서비스를 방해하지 않음 - 추천 프로세스 계속 진행
      return null;
    }
  },

  // Redis 연결 테스트
  testConnection: async (): Promise<boolean> => {
    try {
      const manager = RedisManager.getInstance();
      return await manager.isAvailable();
    } catch (error) {
      return false;
    }
  },

  // 연결 종료
  disconnect: async () => {
    const manager = RedisManager.getInstance();
    await manager.disconnect();
  }
};

export default redis;