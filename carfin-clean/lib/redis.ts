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

      // 🔥 Valkey 연결 에러 핸들링 - Mock 전환 금지, 계속 재시도!
      this.client.on('error', (err) => {
        console.error(`❌ AWS Valkey 연결 에러 - 재시도 필요: ${err.message}`);
        console.log(`🔄 Valkey 연결 재시도 중... (Host: ${process.env.REDIS_HOST})`);
        // Mock 전환하지 않고 계속 실제 연결 시도
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
      // 🔥 Valkey 연결 실패 - Mock 전환 절대 금지, 실제 연결만 허용!
      this.client = null;
      this.isConnecting = false;

      const isDevelopment = process.env.NODE_ENV === 'development';
      console.error(`❌ ${isDevelopment ? 'DEV' : 'PROD'} 환경에서 AWS Valkey 연결 실패`);
      console.log(`🔄 Valkey Host: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
      console.log(`🚨 Mock 캐시 사용 금지 - 실제 Valkey 연결 필수!`);
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