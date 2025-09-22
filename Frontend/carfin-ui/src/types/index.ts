// 멀티 에이전트 시스템 타입 정의

// 사용자 관련 타입
export interface UserInput {
  userId?: string;
  sessionId: string;
  carModel?: string;
  yearRange?: [number, number];
  budgetRange?: [number, number];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  fuelType?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  transmission?: 'manual' | 'automatic';
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'coupe';
  brands?: string[];
  features?: string[];
  priorities?: {
    price: number;
    fuel_efficiency: number;
    safety: number;
    performance: number;
    design: number;
  };
}

// 차량 관련 타입
export interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  images?: string[];
  features?: string[];
  location?: string;
  dealer?: string;
  sourceUrl?: string;
  lastUpdated: number;
}

export interface ProcessedCarData extends CarData {
  normalized_features: {
    age: number;
    mileage_per_year: number;
    price_per_year: number;
    fuel_efficiency?: number;
    depreciation_rate?: number;
    market_position?: 'budget' | 'mid-range' | 'premium';
  };
  semantic_features?: {
    target_demographic: string;
    usage_pattern: string;
    style_category: string;
    reliability_score: number;
    maintenance_cost_level: 'low' | 'medium' | 'high';
  };
  similarity_vector?: number[];
}

// 추천 관련 타입
export interface RecommendationRequest {
  userInput: UserInput;
  userProfile?: UserProfile;
  context?: RecommendationContext;
}

export interface RecommendationResult {
  cars: RecommendedCar[];
  metadata: {
    total_analyzed: number;
    processing_time: number;
    confidence_score: number;
    explanation?: string;
  };
}

export interface RecommendedCar extends ProcessedCarData {
  match_score: number;
  match_reasons: string[];
  ranking_position: number;
  agent_scores: {
    collaborative_filtering: number;
    market_analysis: number;
    personal_preference: number;
  };
}

// 에이전트 관련 타입
export enum AgentType {
  DATA_EXTRACTOR = 'data_extractor',
  COLLABORATIVE_FILTER = 'collaborative_filter',
  LEARNING_AGENT = 'learning_agent',
  MARKET_AGENT = 'market_agent',
  COORDINATOR = 'coordinator'
}

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | 'broadcast';
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  correlationId?: string;
}

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

// 사용자 인터랙션 타입
export interface UserInteraction {
  id: string;
  userId: string;
  sessionId: string;
  type: 'implicit' | 'explicit' | 'contextual';
  action: string;
  target: {
    type: 'car_card' | 'filter' | 'comparison';
    carId?: string;
    filterId?: string;
    position?: number;
  };
  context?: {
    duration?: number;
    scrollPosition?: number;
    viewport?: { width: number; height: number };
    device?: string;
    timeOfDay?: string;
  };
  value?: number;
  timestamp: number;
}

// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  preferences: Record<string, number>;
  interaction_history: UserInteraction[];
  learning_metadata: {
    session_count: number;
    last_active: number;
    preference_confidence: number;
    behavioral_patterns: string[];
  };
}

// Gemini 관련 타입
export interface GeminiRequest {
  agentType: AgentType;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: 'gemini-1.5-pro' | 'gemini-1.5-flash';
}

export interface GeminiResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model: string;
  timestamp: number;
}

// 컨텍스트 타입
export interface RecommendationContext {
  timeOfDay: string;
  device: string;
  location?: string;
  sessionDuration: number;
  previousSearches: string[];
}

// 성능 메트릭 타입
export interface PerformanceMetrics {
  agent_response_times: Record<AgentType, number>;
  recommendation_accuracy: number;
  user_satisfaction: number;
  system_throughput: number;
  error_rates: Record<AgentType, number>;
}

// ============ UI 컴포넌트 타입 정의 ============

// 기본 UI 프롭스
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 앱 페이즈 타입
export type AppPhase = 'landing' | 'signup' | 'chat' | 'ai-collaboration' | 'grid' | 'analysis' | 'finance' | 'service-complete';

// 로딩 상태 타입
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// 에러 상태 타입
export interface ErrorState {
  hasError: boolean;
  error?: string;
  retry?: () => void;
}

// Vehicle 컴포넌트용 확장 타입
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  body_type: string;
  color: string;
  location: string;
  images: string[];
  features: string[];
  fuel_efficiency: number;
  safety_rating: number;
  match_score: number;
  description: string;
  highlight?: string;
  detail_url?: string; // 엔카 상세보기 URL
  // 🧠 멀티 에이전트 분석 결과
  agent_scores?: {
    vehicle_expert: number;
    finance_expert: number;
    gemini_multi_agent: number;
    final_score: number;
    analysis_source: string;
  };
  recommendation_reason?: string;
  data_source?: string;
  price_adjusted?: boolean;
  original_price?: number;
}

// 차량 피드백 타입
export interface VehicleFeedback {
  vehicleId: string;
  feedbackType: 'love' | 'like' | 'dislike' | 'expensive' | 'maybe' | 'question';
  timestamp: Date;
}

// 사용자 프로필 UI 타입 (기존과 구분)
export interface UIUserProfile {
  user_id: string;
  name?: string;
  email?: string;
  age?: number;
  income?: number;
  preferences?: string[];
  purpose?: string;
  guest?: boolean;
}

// API 응답 타입
export interface APIResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// 이벤트 핸들러 타입들
export type SelectionHandler = (vehicles: Vehicle[], feedback: VehicleFeedback[]) => void;
export type FeedbackHandler = (vehicleId: string, feedbackType: VehicleFeedback['feedbackType']) => void;
export type SignupHandler = (profile: UIUserProfile) => void;
export type ChatHandler = (message: string) => void;

// 폼 관련 타입들
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: unknown) => string | null;
}

export interface FormData {
  [key: string]: string | number | boolean | string[];
}

// 분석 데이터 타입
export interface AnalysisData {
  overallScore: number;
  categories: {
    [key: string]: {
      score: number;
      description: string;
      details: string[];
    };
  };
  recommendations: string[];
  warnings?: string[];
}

// 금융 옵션 타입
export interface FinanceOptions {
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalCost: number;
  downPayment?: number;
}

// 컴포넌트 Props 타입들
export interface ModernVehicleGridProps {
  userProfile?: Record<string, unknown>;
  onSelectionComplete?: SelectionHandler;
}

export interface ModernSignupFormProps {
  onSignupComplete: SignupHandler;
  onSkip: () => void;
}

export interface ModernLandingPageProps {
  onGetStarted: () => void;
}