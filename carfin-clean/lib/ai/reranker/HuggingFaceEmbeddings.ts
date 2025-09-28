// HuggingFaceEmbeddings.ts - HuggingFace API 통합 임베딩 생성 시스템

import { EmbeddingModel, ModelConfig } from './types';

export interface HuggingFaceConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    tokens: number;
    time_ms: number;
  };
}

export interface BatchEmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    total_tokens: number;
    time_ms: number;
    batch_size: number;
  };
}

export class HuggingFaceEmbeddings {
  private config: HuggingFaceConfig;
  private modelConfig: ModelConfig;
  private embeddingCache: Map<string, number[]> = new Map();
  private isInitialized: boolean = false;

  // 지원하는 임베딩 모델들
  private static readonly SUPPORTED_MODELS: Record<EmbeddingModel, ModelConfig> = {
    'multilingual-e5-small': {
      modelName: 'multilingual-e5-small',
      dimension: 384,
      maxLength: 512,
      batchSize: 8
    },
    'paraphrase-multilingual-MiniLM-L12-v2': {
      modelName: 'paraphrase-multilingual-MiniLM-L12-v2',
      dimension: 384,
      maxLength: 512,
      batchSize: 8
    }
  };

  constructor(
    modelName: EmbeddingModel = 'multilingual-e5-small',
    config: Partial<HuggingFaceConfig> = {}
  ) {
    this.modelConfig = HuggingFaceEmbeddings.SUPPORTED_MODELS[modelName];
    this.config = {
      apiKey: process.env.HUGGINGFACE_API_KEY || config.apiKey || '',
      baseUrl: config.baseUrl || 'https://api-inference.huggingface.co/pipeline/feature-extraction',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
  }

  /**
   * HuggingFace 임베딩 시스템 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🤗 HuggingFace 임베딩 시스템 초기화 중...');
      console.log(`📊 모델: ${this.modelConfig.modelName}`);
      console.log(`📏 차원: ${this.modelConfig.dimension}`);

      // API 키 확인
      if (!this.config.apiKey) {
        console.warn('⚠️ HuggingFace API 키가 없습니다. 로컬 임베딩으로 폴백합니다.');
        this.isInitialized = false;
        return;
      }

      // 테스트 요청으로 API 연결 확인
      await this.testConnection();

      this.isInitialized = true;
      console.log('✅ HuggingFace 임베딩 시스템 초기화 완료');

    } catch (error) {
      console.error('❌ HuggingFace 초기화 실패:', error);
      console.warn('🔄 로컬 임베딩 시스템으로 폴백합니다.');
      this.isInitialized = false;
    }
  }

  /**
   * 단일 텍스트에 대한 임베딩 생성
   */
  async getEmbedding(text: string): Promise<number[]> {
    // 캐시 확인
    const cacheKey = `${this.modelConfig.modelName}:${text}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      let embedding: number[];

      if (this.isInitialized && this.config.apiKey) {
        // HuggingFace API 사용
        const response = await this.callHuggingFaceAPI([text]);
        embedding = response.embeddings[0];
      } else {
        // 로컬 폴백 임베딩 사용
        embedding = this.createFallbackEmbedding(text);
      }

      // 캐시에 저장 (메모리 제한 고려)
      if (this.embeddingCache.size < 1000) {
        this.embeddingCache.set(cacheKey, embedding);
      }

      return embedding;

    } catch (error) {
      console.error('❌ 임베딩 생성 실패:', error);
      console.log('🔄 폴백 임베딩 사용');
      return this.createFallbackEmbedding(text);
    }
  }

  /**
   * 배치 텍스트에 대한 임베딩 생성
   */
  async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      // 배치 크기로 나누어 처리
      const batches = this.createBatches(texts, this.modelConfig.batchSize);
      const allEmbeddings: number[][] = [];

      for (const batch of batches) {
        if (this.isInitialized && this.config.apiKey) {
          // HuggingFace API 사용
          const response = await this.callHuggingFaceAPI(batch);
          allEmbeddings.push(...response.embeddings);
        } else {
          // 로컬 폴백 임베딩 사용
          const batchEmbeddings = batch.map(text => this.createFallbackEmbedding(text));
          allEmbeddings.push(...batchEmbeddings);
        }
      }

      return allEmbeddings;

    } catch (error) {
      console.error('❌ 배치 임베딩 생성 실패:', error);
      return texts.map(text => this.createFallbackEmbedding(text));
    }
  }

  /**
   * HuggingFace API 호출
   */
  private async callHuggingFaceAPI(texts: string[]): Promise<BatchEmbeddingResponse> {
    const startTime = performance.now();

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/${this.modelConfig.modelName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: texts,
            options: {
              wait_for_model: true,
              use_cache: true
            }
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          if (response.status === 503) {
            // 모델 로딩 중인 경우 재시도
            console.log(`🔄 모델 로딩 중... 재시도 ${attempt}/${this.config.retryAttempts}`);
            await this.delay(this.config.retryDelay * attempt);
            continue;
          }
          throw new Error(`HuggingFace API 오류: ${response.status} ${response.statusText}`);
        }

        const embeddings = await response.json();
        const endTime = performance.now();

        // 응답 형태 정규화 (HuggingFace는 여러 형태로 응답 가능)
        const normalizedEmbeddings = this.normalizeEmbeddingResponse(embeddings);

        return {
          embeddings: normalizedEmbeddings,
          model: this.modelConfig.modelName,
          usage: {
            total_tokens: texts.reduce((sum, text) => sum + text.length, 0),
            time_ms: endTime - startTime,
            batch_size: texts.length
          }
        };

      } catch (error) {
        console.error(`❌ API 호출 실패 (시도 ${attempt}/${this.config.retryAttempts}):`, error);

        if (attempt === this.config.retryAttempts) {
          throw error;
        }

        await this.delay(this.config.retryDelay * attempt);
      }
    }

    throw new Error('모든 재시도 실패');
  }

  /**
   * HuggingFace 응답 정규화
   */
  private normalizeEmbeddingResponse(response: any): number[][] {
    // HuggingFace는 다양한 형태로 응답 가능
    if (Array.isArray(response)) {
      // 단일 텍스트인 경우: [[embedding]]
      if (response.length > 0 && Array.isArray(response[0])) {
        if (typeof response[0][0] === 'number') {
          // 이미 정규화된 형태
          return response;
        }
      }
    }

    // 다른 형태의 응답 처리
    console.warn('⚠️ 예상과 다른 HuggingFace 응답 형태:', typeof response);
    throw new Error('HuggingFace 응답 형태를 파싱할 수 없습니다');
  }

  /**
   * 폴백 임베딩 생성 (HuggingFace 실패 시)
   */
  private createFallbackEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\\s+/);
    const embedding = new Array(this.modelConfig.dimension).fill(0);

    // 개선된 해시 기반 임베딩
    words.forEach((word, wordIndex) => {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const position = (charCode + wordIndex * i + word.length) % this.modelConfig.dimension;
        embedding[position] += 1 / (words.length + 1);

        // 추가 해시 레이어
        const position2 = (charCode * 31 + wordIndex) % this.modelConfig.dimension;
        embedding[position2] += 0.5 / (words.length + 1);
      }
    });

    // 정규화
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * API 연결 테스트
   */
  private async testConnection(): Promise<void> {
    try {
      const testText = '테스트';
      await this.callHuggingFaceAPI([testText]);
      console.log('✅ HuggingFace API 연결 확인됨');
    } catch (error) {
      throw new Error(`HuggingFace API 연결 실패: ${error}`);
    }
  }

  /**
   * 텍스트를 배치로 나누기
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('🧹 HuggingFace 임베딩 캐시가 정리되었습니다.');
  }

  /**
   * 상태 정보
   */
  getStatus(): {
    initialized: boolean;
    model: string;
    cacheSize: number;
    hasApiKey: boolean;
    config: Partial<HuggingFaceConfig>;
  } {
    return {
      initialized: this.isInitialized,
      model: this.modelConfig.modelName,
      cacheSize: this.embeddingCache.size,
      hasApiKey: !!this.config.apiKey,
      config: {
        baseUrl: this.config.baseUrl,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts
      }
    };
  }

  /**
   * 임베딩 품질 검증 (선택적)
   */
  async validateEmbeddingQuality(texts: string[]): Promise<{
    averageMagnitude: number;
    dimensionVariance: number;
    isValid: boolean;
  }> {
    const embeddings = await this.getBatchEmbeddings(texts);

    let totalMagnitude = 0;
    const dimensionSums = new Array(this.modelConfig.dimension).fill(0);

    embeddings.forEach(embedding => {
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      totalMagnitude += magnitude;

      embedding.forEach((val, dim) => {
        dimensionSums[dim] += Math.abs(val);
      });
    });

    const averageMagnitude = totalMagnitude / embeddings.length;
    const averageDimensionSum = dimensionSums.reduce((sum, val) => sum + val, 0) / this.modelConfig.dimension;
    const dimensionVariance = dimensionSums.reduce((sum, val) => sum + Math.pow(val - averageDimensionSum, 2), 0) / this.modelConfig.dimension;

    // 정규화된 임베딩은 크기가 1에 가까워야 하고, 차원별 분산이 적절해야 함
    const isValid = averageMagnitude > 0.8 && averageMagnitude < 1.2 && dimensionVariance > 0.001;

    return {
      averageMagnitude,
      dimensionVariance,
      isValid
    };
  }
}