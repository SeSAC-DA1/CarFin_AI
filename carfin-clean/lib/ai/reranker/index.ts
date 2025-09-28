// index.ts - Reranker 시스템 메인 export

export { VehicleReranker } from './VehicleReranker';
export {
  getPersonaWeights,
  explainWeights,
  adjustWeightsForPreferences,
  debugWeights,
  PERSONA_WEIGHTS
} from './personaWeights';

export {
  cosineSimilarity,
  generateVehicleDescription,
  enhanceUserQuery,
  calculateBudgetScore,
  calculateYearScore,
  calculateMileageScore,
  calculateBrandScore,
  calculateFuelTypeScore,
  calculateFeatureScore,
  calculateFinalScore,
  applyDiversityBoost,
  extractKeywords,
  logRerankingProcess
} from './utils';

export type {
  VehicleItem,
  RerankingQuery,
  RerankingOptions,
  RerankingResult,
  RankedVehicle,
  SimilarityScore,
  PersonaWeights,
  EmbeddingModel,
  ModelConfig
} from './types';

// 편의 함수들
export const createReranker = (modelName?: any) => new VehicleReranker(modelName);

// 기본 설정
export const DEFAULT_RERANKING_OPTIONS = {
  maxResults: 10,
  semanticThreshold: 0.3,
  usePersonaWeights: true,
  explainRanking: true,
  diversityFactor: 0.1
};

// 사전 정의된 모델 설정
export const MODEL_CONFIGS = {
  'multilingual-e5-small': {
    modelName: 'multilingual-e5-small' as const,
    dimension: 384,
    maxLength: 512,
    batchSize: 8
  },
  'paraphrase-multilingual-MiniLM-L12-v2': {
    modelName: 'paraphrase-multilingual-MiniLM-L12-v2' as const,
    dimension: 384,
    maxLength: 512,
    batchSize: 8
  }
};