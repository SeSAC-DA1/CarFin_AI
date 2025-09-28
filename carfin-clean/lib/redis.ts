// lib/redis.ts
import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private isConnecting = false;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async getClient(): Promise<RedisClientType> {
    if (this.client && this.client.isReady) {
      return this.client;
    }

    if (this.isConnecting) {
      // 연결 중이면 최대 5초 대기
      let attempts = 0;
      while (this.isConnecting && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (this.client && this.client.isReady) {
        return this.client;
      }
    }

    return this.connect();
  }

  private async connect(): Promise<RedisClientType> {
    this.isConnecting = true;

    try {
      // 환경변수에서 Redis 설정 읽기
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT || '6379';
      const redisPassword = process.env.REDIS_PASSWORD;

      let clientConfig: any;

      if (redisUrl) {
        // Redis URL이 있으면 URL 사용
        clientConfig = { url: redisUrl };
      } else if (redisHost) {
        // 개별 설정 사용
        clientConfig = {
          socket: {
            host: redisHost,
            port: parseInt(redisPort),
            connectTimeout: 10000,
            lazyConnect: true,
          }
        };

        if (redisPassword) {
          clientConfig.password = redisPassword;
        }
      } else {
        // 로컬 개발용 기본 설정
        console.log('⚠️ Redis 환경변수가 없습니다. 로컬 Redis 사용 (localhost:6379)');
        clientConfig = {
          socket: {
            host: 'localhost',
            port: 6379,
            connectTimeout: 5000,
            lazyConnect: true,
          }
        };
      }

      this.client = createClient(clientConfig);

      // 에러 핸들링
      this.client.on('error', (err) => {
        console.error('🚨 Redis 연결 에러:', err);
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
      console.error('🚨 Redis 연결 실패:', error);
      this.client = null;
      this.isConnecting = false;
      throw error;
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

  // Redis가 사용 가능한지 확인
  async isAvailable(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      console.log('⚠️ Redis 사용 불가, 로컬 캐시로 폴백');
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
      console.log(`🗄️ 차량 검색 캐시 저장: ${vehicles.length}대 (키: ${searchKey})`);
    } catch (error) {
      console.log('⚠️ 차량 검색 캐시 저장 실패, 계속 진행:', error.message);
    }
  },

  getCachedVehicleSearch: async (searchKey: string): Promise<any[] | null> => {
    try {
      const manager = RedisManager.getInstance();
      const client = await manager.getClient();

      const cached = await client.get(`search:${searchKey}`);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`⚡ 차량 검색 캐시 히트: ${data.count}대 (키: ${searchKey})`);
        return data.vehicles;
      }
      return null;
    } catch (error) {
      console.log('⚠️ 차량 검색 캐시 조회 실패, DB에서 조회:', error.message);
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
      console.log('⚠️ A2A 세션 저장 실패:', error.message);
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
      console.log('⚠️ A2A 세션 조회 실패:', error.message);
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
      console.log('⚠️ 대화 저장 실패:', error.message);
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
      console.log('⚠️ 대화 조회 실패:', error.message);
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
      console.log('⚠️ 대화 삭제 실패:', error.message);
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
      console.log('⚠️ 사용자 선호도 저장 실패:', error.message);
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
      console.log('⚠️ 사용자 선호도 조회 실패:', error.message);
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