// VehicleReranker.ts - 메인 차량 재순위 매김 시스템

import {
  VehicleItem,
  RerankingQuery,
  RerankingOptions,
  RerankingResult,
  RankedVehicle,
  SimilarityScore,
  ModelConfig,
  EmbeddingModel
} from './types';

import { HuggingFaceEmbeddings } from './HuggingFaceEmbeddings';

import { getPersonaWeights, explainWeights } from './personaWeights';
import {
  generateVehicleDescription,
  enhanceUserQuery,
  calculateBudgetScore,
  calculateFeatureScore,
  calculateFinalScore,
  applyDiversityBoost,
  extractKeywords,
  logRerankingProcess
} from './utils';

export class VehicleReranker {
  private modelConfig: ModelConfig;
  private huggingFaceEmbeddings: HuggingFaceEmbeddings;
  private isInitialized: boolean = false;

  constructor(modelName: EmbeddingModel = 'multilingual-e5-small') {
    this.modelConfig = {
      modelName,
      dimension: 384, // multilingual-e5-small의 차원
      maxLength: 512,
      batchSize: 8
    };

    // HuggingFace 임베딩 시스템 초기화
    this.huggingFaceEmbeddings = new HuggingFaceEmbeddings(modelName);
  }

  // 초기화 (모델 로딩)
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 VehicleReranker 초기화 시작...');

      // HuggingFace 임베딩 시스템 초기화
      await this.huggingFaceEmbeddings.initialize();

      console.log(`📊 모델: ${this.modelConfig.modelName}`);
      console.log(`📏 임베딩 차원: ${this.modelConfig.dimension}`);

      // HuggingFace 상태 확인
      const embeddingStatus = this.huggingFaceEmbeddings.getStatus();
      console.log(`🤗 HuggingFace 상태: ${embeddingStatus.initialized ? '연결됨' : '로컬 모드'}`);
      console.log(`🔑 API 키: ${embeddingStatus.hasApiKey ? '설정됨' : '미설정'}`);

      this.isInitialized = true;
      console.log('✅ VehicleReranker 초기화 완료');
    } catch (error) {
      console.error('❌ VehicleReranker 초기화 실패:', error);
      throw new Error('Reranker 초기화에 실패했습니다.');
    }
  }

  // 메인 재순위 매김 메서드
  async rerank(
    vehicles: VehicleItem[],
    query: RerankingQuery,
    options: RerankingOptions = {}
  ): Promise<RerankingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    // 기본 옵션 설정
    const finalOptions: Required<RerankingOptions> = {
      maxResults: options.maxResults ?? 10,
      semanticThreshold: options.semanticThreshold ?? 0.3,
      usePersonaWeights: options.usePersonaWeights ?? true,
      explainRanking: options.explainRanking ?? true,
      diversityFactor: options.diversityFactor ?? 0.1
    };

    try {
      // 1. 페르소나 가중치 계산
      const weights = getPersonaWeights(query.persona);

      // 2. 쿼리 강화
      const enhancedQuery = enhanceUserQuery(query.userQuery, query.persona);

      // 3. 쿼리 임베딩 생성
      const queryEmbedding = await this.getEmbedding(enhancedQuery);

      // 4. 각 차량에 대한 점수 계산
      const scoredVehicles: Array<{ vehicle: VehicleItem; score: SimilarityScore; index: number }> = [];

      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];

        // 차량 설명 생성 및 임베딩
        const vehicleDesc = generateVehicleDescription(vehicle);
        const vehicleEmbedding = await this.getEmbedding(vehicleDesc);

        // 의미론적 유사도 계산
        const semanticScore = await this.calculateSemanticSimilarity(queryEmbedding, vehicleEmbedding);

        // 예산 적합도
        const budgetScore = calculateBudgetScore(vehicle.price, query.budget);

        // 특징 점수
        const featureScore = calculateFeatureScore(vehicle);

        // 최종 점수 계산
        const finalScore = calculateFinalScore(semanticScore, budgetScore, featureScore, weights);

        // 임계값 적용
        if (finalScore.final >= finalOptions.semanticThreshold) {
          scoredVehicles.push({
            vehicle,
            score: finalScore,
            index: i
          });
        }
      }

      // 5. 다양성 적용
      const diversityAdjustedScores = applyDiversityBoost(
        scoredVehicles.map(sv => sv.vehicle),
        scoredVehicles.map(sv => sv.score),
        finalOptions.diversityFactor
      );

      // 6. 점수 업데이트 및 정렬
      scoredVehicles.forEach((sv, i) => {
        sv.score = diversityAdjustedScores[i];
      });

      scoredVehicles.sort((a, b) => b.score.final - a.score.final);

      // 7. 최대 결과 수 제한
      const topScoredVehicles = scoredVehicles.slice(0, finalOptions.maxResults);

      // 8. RankedVehicle 객체 생성
      const rankedVehicles: RankedVehicle[] = topScoredVehicles.map((sv, newRank) => ({
        ...sv.vehicle,
        originalRank: sv.index + 1,
        newRank: newRank + 1,
        similarityScore: sv.score,
        explanations: this.generateExplanations(sv.vehicle, sv.score, query, weights)
      }));

      const processingTime = performance.now() - startTime;

      // 9. 로깅
      if (process.env.NODE_ENV === 'development') {
        logRerankingProcess(
          enhancedQuery,
          vehicles.length,
          topScoredVehicles.map(sv => sv.score),
          processingTime
        );
      }

      // 10. 결과 생성
      const result: RerankingResult = {
        rankedVehicles,
        query,
        options: finalOptions,
        metadata: {
          totalProcessed: vehicles.length,
          processingTime,
          modelUsed: this.modelConfig.modelName,
          averageSimilarity: topScoredVehicles.reduce((sum, sv) => sum + sv.score.final, 0) / topScoredVehicles.length,
          explanations: {
            overallStrategy: explainWeights(weights, query.persona),
            personaConsiderations: query.persona ? `${query.persona.name}님의 특성을 반영하여 ${query.persona.priorities.slice(0, 2).join(', ')}을 중점적으로 고려했습니다.` : '일반적인 기준을 적용했습니다.',
            keyFactors: extractKeywords(enhancedQuery)
          }
        }
      };

      return result;

    } catch (error) {
      console.error('❌ Reranking 처리 중 오류:', error);
      throw new Error('차량 재순위 매김에 실패했습니다.');
    }
  }

  // 임베딩 생성 (HuggingFace 통합)
  private async getEmbedding(text: string): Promise<number[]> {
    return await this.huggingFaceEmbeddings.getEmbedding(text);
  }


  // 의미론적 유사도 계산
  private async calculateSemanticSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    if (embedding1.length !== embedding2.length) {
      throw new Error('임베딩 차원이 일치하지 않습니다');
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    return Math.max(0, Math.min(1, dotProduct)); // 0-1 범위로 클램핑
  }

  // 설명 생성
  private generateExplanations(
    vehicle: VehicleItem,
    score: SimilarityScore,
    query: RerankingQuery,
    weights: any
  ): { whyRecommended: string; personaMatch: string; semanticMatch: string } {
    const vehicleName = `${vehicle.manufacturer} ${vehicle.model}`;

    const whyRecommended = this.generateRecommendationReason(vehicle, score, query);
    const personaMatch = this.generatePersonaMatchExplanation(vehicle, query.persona);
    const semanticMatch = this.generateSemanticMatchExplanation(vehicle, query.userQuery, score.semantic);

    return {
      whyRecommended,
      personaMatch,
      semanticMatch
    };
  }

  private generateRecommendationReason(vehicle: VehicleItem, score: SimilarityScore, query: RerankingQuery): string {
    const reasons = [];

    if (score.budget > 0.8) {
      reasons.push('예산에 적합함');
    }

    if (score.feature > 0.7) {
      if (vehicle.modelyear >= 2020) reasons.push('비교적 최신 연식');
      if (vehicle.distance < 50000) reasons.push('적은 주행거리');
    }

    if (score.semantic > 0.6) {
      reasons.push('검색 조건과 잘 맞음');
    }

    return reasons.length > 0 ? reasons.join(', ') + '하여 추천드립니다.' : '종합적으로 적합하여 추천드립니다.';
  }

  private generatePersonaMatchExplanation(vehicle: VehicleItem, persona?: any): string {
    if (!persona) {
      return '일반적인 기준으로 적합합니다.';
    }

    const personaExplanations: Record<string, string> = {
      first_car_anxiety: '첫차로 안전하고 신뢰할 만한 선택입니다.',
      working_mom: '가족과 아이의 안전을 위한 실용적인 선택입니다.',
      mz_office_worker: '출퇴근과 일상에 적합한 경제적인 선택입니다.',
      camping_lover: '캠핑과 레저 활동에 최적화된 선택입니다.',
      large_family_dad: '대가족의 이동과 경제성을 고려한 선택입니다.',
      ceo_executive: '비즈니스와 프리스티지를 고려한 품격있는 선택입니다.'
    };

    return personaExplanations[persona.id] || '귀하의 특성에 적합한 선택입니다.';
  }

  private generateSemanticMatchExplanation(vehicle: VehicleItem, userQuery: string, semanticScore: number): string {
    const keywords = extractKeywords(userQuery);

    if (keywords.length === 0) {
      return `검색 조건과 ${Math.round(semanticScore * 100)}% 일치합니다.`;
    }

    const matchedFeatures = [];
    const vehicleDesc = generateVehicleDescription(vehicle).toLowerCase();

    keywords.forEach(keyword => {
      if (vehicleDesc.includes(keyword)) {
        matchedFeatures.push(keyword);
      }
    });

    if (matchedFeatures.length > 0) {
      return `${matchedFeatures.join(', ')} 조건과 잘 맞습니다.`;
    }

    return `검색 조건과 ${Math.round(semanticScore * 100)}% 일치합니다.`;
  }

  // 캐시 정리
  clearCache(): void {
    this.huggingFaceEmbeddings.clearCache();
    console.log('🧹 Reranker 캐시가 정리되었습니다.');
  }

  // 상태 정보
  getStatus(): {
    initialized: boolean;
    cacheSize: number;
    modelConfig: ModelConfig;
    huggingFaceStatus: any;
  } {
    const hfStatus = this.huggingFaceEmbeddings.getStatus();
    return {
      initialized: this.isInitialized,
      cacheSize: hfStatus.cacheSize,
      modelConfig: this.modelConfig,
      huggingFaceStatus: hfStatus
    };
  }
}