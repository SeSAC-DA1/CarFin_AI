// types.ts - Reranker 시스템 타입 정의

import { DemoPersona } from '@/lib/collaboration/PersonaDefinitions';

export interface VehicleItem {
  vehicleid?: string;
  manufacturer: string;
  model: string;
  modelyear: number;
  price: number;
  distance: number;
  location: string;
  fueltype: string;
  displacement?: number;
  color?: string;
  detailurl?: string;
  photo?: string;
  platform?: string;
  originprice?: number;
  // 추가 메타데이터
  rank?: number;
  suitabilityScore?: number;
  recommendationReason?: string;
  pros?: string[];
  cons?: string[];
}

export interface RerankingQuery {
  userQuery: string;
  persona?: DemoPersona;
  budget: { min: number; max: number };
  preferences?: {
    fuelType?: string;
    transmission?: string;
    bodyType?: string;
    features?: string[];
  };
}

export interface SimilarityScore {
  semantic: number;      // 의미론적 유사도 (0-1)
  persona: number;       // 페르소나 매칭 점수 (0-1)
  budget: number;        // 예산 적합도 (0-1)
  feature: number;       // 특징 매칭 점수 (0-1)
  final: number;         // 최종 점수 (0-1)
}

export interface RankedVehicle extends VehicleItem {
  originalRank: number;
  newRank: number;
  similarityScore: SimilarityScore;
  explanations: {
    whyRecommended: string;
    personaMatch: string;
    semanticMatch: string;
  };
}

export interface PersonaWeights {
  semantic: number;      // 의미론적 유사도 가중치
  price: number;         // 가격 중요도
  fuelEfficiency: number; // 연비 중요도
  safety: number;        // 안전성 중요도
  space: number;         // 공간 중요도
  brand: number;         // 브랜드 중요도
  performance: number;   // 성능 중요도
  luxury: number;        // 고급스러움 중요도
  reliability: number;   // 신뢰성 중요도
  technology: number;    // 기술 중요도
}

export interface RerankingOptions {
  maxResults?: number;           // 최대 결과 수 (기본: 10)
  semanticThreshold?: number;    // 의미론적 유사도 임계값 (기본: 0.3)
  usePersonaWeights?: boolean;   // 페르소나 가중치 사용 여부 (기본: true)
  explainRanking?: boolean;      // 순위 설명 생성 여부 (기본: true)
  diversityFactor?: number;      // 다양성 팩터 (기본: 0.1)
}

export interface RerankingResult {
  rankedVehicles: RankedVehicle[];
  query: RerankingQuery;
  options: RerankingOptions;
  metadata: {
    totalProcessed: number;
    processingTime: number;
    modelUsed: string;
    averageSimilarity: number;
    explanations: {
      overallStrategy: string;
      personaConsiderations: string;
      keyFactors: string[];
    };
  };
}

export type EmbeddingModel = 'multilingual-e5-small' | 'paraphrase-multilingual-MiniLM-L12-v2' | 'korean-sbert';

export interface ModelConfig {
  modelName: EmbeddingModel;
  dimension: number;
  maxLength: number;
  batchSize: number;
}