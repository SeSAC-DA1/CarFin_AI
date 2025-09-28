// CollaborationPatternDetector.ts - 상황 분석하여 적절한 협업 패턴 결정

import { PersonaDetector, DemoPersona, DEMO_PERSONAS } from './PersonaDefinitions';

interface PatternDetectionInput {
  userQuestion: string;
  budget: { min: number; max: number };
  vehicleCount: number;
  vehicleData: any[];
  avgPrice?: number;
  selectedPersona?: DemoPersona; // 데모용 페르소나 선택
}

export interface CollaborationPattern {
  type: 'BUDGET_CONSTRAINT' | 'CONFLICTING_REQUIREMENTS' | 'INFORMATION_GAP' |
        'EXPERT_DISAGREEMENT' | 'PROGRESSIVE_REFINEMENT' | 'STANDARD_FLOW' |
        // 페르소나 기반 패턴들 (리뉴얼)
        'FIRST_CAR_ANXIETY' | 'FAMILY_PRIORITY' | 'MZ_LIFESTYLE' |
        'CAMPING_LIFESTYLE' | 'LARGE_FAMILY' | 'CEO_BUSINESS';
  priority: number; // 1-5, 높을수록 긴급
  description: string;
  expectedDuration: number; // 예상 소요 시간 (분)
  participatingAgents: string[];
  keyTriggers: string[];
  resolutionStrategy: string;
  leadAgent?: string; // 협업 주도 에이전트
  persona?: DemoPersona; // 연관된 페르소나 정보
  collaborationFlow?: string[]; // 페르소나별 맞춤 플로우
}

export class CollaborationPatternDetector {

  /**
   * 메인 패턴 감지 메서드 (페르소나 기반 확장)
   */
  detectPattern(input: PatternDetectionInput): CollaborationPattern {
    // 1. 데모용 페르소나가 선택된 경우 우선 처리
    if (input.selectedPersona) {
      return this.detectPersonaBasedPattern(input, input.selectedPersona);
    }

    // 2. 자동 페르소나 감지 시도
    const detectedPersona = PersonaDetector.detectPersona(input.userQuestion, input.budget);
    if (detectedPersona) {
      return this.detectPersonaBasedPattern(input, detectedPersona);
    }

    // 3. 기존 패턴 감지 로직
    const patterns = [
      this.detectBudgetConstraintPattern(input),
      this.detectConflictingRequirementsPattern(input),
      this.detectInformationGapPattern(input),
    ].filter(pattern => pattern !== null) as CollaborationPattern[];

    // 우선순위가 가장 높은 패턴 선택
    if (patterns.length > 0) {
      return patterns.sort((a, b) => b.priority - a.priority)[0];
    }

    // 기본 표준 플로우
    return this.getStandardFlowPattern();
  }

  /**
   * 패턴 1: 예산 부족 상황
   */
  private detectBudgetConstraintPattern(input: PatternDetectionInput): CollaborationPattern | null {
    const { budget, vehicleCount, vehicleData, userQuestion } = input;

    // 트리거 조건들
    const lowVehicleCount = vehicleCount < 20;
    const avgPrice = this.calculateAveragePrice(vehicleData);
    const budgetTooLow = budget.max < avgPrice * 0.8;
    const budgetKeywords = ['저렴', '싸게', '예산', '돈'].some(keyword =>
      userQuestion.includes(keyword)
    );

    // 고급차 키워드 + 낮은 예산
    const luxuryKeywords = ['BMW', '벤츠', 'Mercedes', '아우디', 'Audi', 'Lexus', '렉서스'];
    const luxuryWithLowBudget = luxuryKeywords.some(keyword =>
      userQuestion.toLowerCase().includes(keyword.toLowerCase())
    ) && budget.max < 4000;

    if (lowVehicleCount || budgetTooLow || luxuryWithLowBudget) {
      return {
        type: 'BUDGET_CONSTRAINT',
        priority: 5, // 최고 우선순위 - 즉시 해결 필요
        description: '예산 제약으로 인한 선택지 부족 상황',
        expectedDuration: 3,
        participatingAgents: ['data_analyst', 'needs_analyst', 'concierge'],
        keyTriggers: [
          lowVehicleCount ? '매물 수 부족' : '',
          budgetTooLow ? '평균 가격 대비 예산 부족' : '',
          luxuryWithLowBudget ? '고급 브랜드 vs 낮은 예산' : ''
        ].filter(Boolean),
        resolutionStrategy: '예산 확장 제안 또는 조건 조정을 통한 대안 제시'
      };
    }

    return null;
  }

  /**
   * 패턴 2: 조건 상충 상황
   */
  private detectConflictingRequirementsPattern(input: PatternDetectionInput): CollaborationPattern | null {
    const { userQuestion } = input;

    const conflicts = [
      // 연비 vs 크기
      {
        keywords: [['연비', '기름값', '경제적'], ['큰', 'SUV', '대형', '넓은']],
        description: '연비와 차량 크기 상충'
      },
      // 가격 vs 브랜드
      {
        keywords: [['저렴', '싸게', '경제적'], ['BMW', '벤츠', '아우디', '렉서스']],
        description: '경제성과 프리미엄 브랜드 상충'
      },
      // 성능 vs 연비
      {
        keywords: [['빠른', '성능', '파워'], ['연비', '경제적', '기름값']],
        description: '성능과 연비 상충'
      },
      // 새차 vs 예산
      {
        keywords: [['최신', '신형', '새로운'], ['저렴', '예산', '경제적']],
        description: '최신성과 경제성 상충'
      }
    ];

    for (const conflict of conflicts) {
      const hasFirstSet = conflict.keywords[0].some(keyword =>
        userQuestion.includes(keyword)
      );
      const hasSecondSet = conflict.keywords[1].some(keyword =>
        userQuestion.includes(keyword)
      );

      if (hasFirstSet && hasSecondSet) {
        return {
          type: 'CONFLICTING_REQUIREMENTS',
          priority: 4,
          description: conflict.description,
          expectedDuration: 4,
          participatingAgents: ['needs_analyst', 'data_analyst', 'concierge'],
          keyTriggers: [conflict.description],
          resolutionStrategy: '우선순위 확인을 통한 타협점 모색'
        };
      }
    }

    return null;
  }

  /**
   * 패턴 3: 정보 부족 상황
   */
  private detectInformationGapPattern(input: PatternDetectionInput): CollaborationPattern | null {
    const { userQuestion } = input;

    const vagueKeywords = [
      '좋은 차', '괜찮은 차', '추천', '뭐가 좋을까',
      '어떤 차', '차 하나', '적당한', '무난한'
    ];

    const isVague = vagueKeywords.some(keyword => userQuestion.includes(keyword));
    const isShort = userQuestion.length < 15; // 너무 짧은 질문
    const lackSpecifics = !this.hasSpecificRequirements(userQuestion);

    if (isVague || (isShort && lackSpecifics)) {
      return {
        type: 'INFORMATION_GAP',
        priority: 2,
        description: '구체적 요구사항 부족으로 인한 정보 수집 필요',
        expectedDuration: 5,
        participatingAgents: ['concierge', 'needs_analyst', 'data_analyst'],
        keyTriggers: [
          isVague ? '모호한 표현' : '',
          isShort ? '짧은 질문' : '',
          lackSpecifics ? '구체적 조건 부족' : ''
        ].filter(Boolean),
        resolutionStrategy: '단계별 정보 수집을 통한 요구사항 구체화'
      };
    }

    return null;
  }

  /**
   * 표준 협업 플로우 (패턴이 감지되지 않은 경우)
   */
  private getStandardFlowPattern(): CollaborationPattern {
    return {
      type: 'STANDARD_FLOW',
      priority: 1,
      description: '일반적인 상담 진행',
      expectedDuration: 3,
      participatingAgents: ['concierge', 'needs_analyst', 'data_analyst'],
      keyTriggers: ['표준 상담 조건'],
      resolutionStrategy: '순차적 분석을 통한 체계적 추천'
    };
  }

  /**
   * 헬퍼 메서드들
   */
  private calculateAveragePrice(vehicleData: any[]): number {
    if (!vehicleData || vehicleData.length === 0) return 2500; // 기본값

    const validPrices = vehicleData
      .map(v => v.price)
      .filter(price => price && price > 0);

    if (validPrices.length === 0) return 2500;

    return validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  }

  private hasSpecificRequirements(question: string): boolean {
    const specificKeywords = [
      // 차종
      'SUV', '세단', '해치백', '쿠페', '트럭',
      // 브랜드
      '현대', '기아', 'BMW', '벤츠', '토요타', '혼다',
      // 구체적 조건
      '연비', '안전', '가족용', '출퇴근', '첫차', '연식',
      // 예산 관련
      '만원', '천만원', '억', '예산'
    ];

    return specificKeywords.some(keyword => question.includes(keyword));
  }

  /**
   * 패턴 전환 가능성 확인 (협업 진행 중 패턴 변경)
   */
  canTransitionToPattern(
    currentPattern: CollaborationPattern,
    newInput: PatternDetectionInput
  ): CollaborationPattern | null {
    const newPattern = this.detectPattern(newInput);

    // 더 높은 우선순위 패턴이 감지된 경우에만 전환
    if (newPattern.priority > currentPattern.priority) {
      return newPattern;
    }

    return null;
  }

  /**
   * 패턴별 예상 성공률 계산
   */
  calculateSuccessProbability(pattern: CollaborationPattern, input: PatternDetectionInput): number {
    switch (pattern.type) {
      case 'BUDGET_CONSTRAINT':
        return input.vehicleCount > 5 ? 0.8 : 0.6; // 대안이 있으면 높은 성공률

      case 'CONFLICTING_REQUIREMENTS':
        return 0.75; // 보통 타협점을 찾을 수 있음

      case 'INFORMATION_GAP':
        return 0.9; // 정보만 수집하면 대부분 해결 가능

      default:
        return 0.85; // 표준 플로우는 안정적
    }
  }

  /**
   * 페르소나 기반 패턴 감지 (리뉴얼된 페르소나 시스템)
   */
  private detectPersonaBasedPattern(input: PatternDetectionInput, persona: DemoPersona): CollaborationPattern {
    // 새로운 페르소나 ID와 패턴 타입 매핑
    const patternMap = {
      'first_car_anxiety': 'FIRST_CAR_ANXIETY' as const,
      'working_mom': 'FAMILY_PRIORITY' as const,
      'mz_office_worker': 'MZ_LIFESTYLE' as const,
      'camping_lover': 'CAMPING_LIFESTYLE' as const,
      'large_family_dad': 'LARGE_FAMILY' as const,
      'ceo_executive': 'CEO_BUSINESS' as const
    };

    const patternType = patternMap[persona.id];

    return {
      type: patternType,
      priority: 5, // 페르소나 패턴은 최고 우선순위
      description: `${persona.name}님 맞춤 협업: ${persona.situation}`,
      expectedDuration: 4,
      participatingAgents: persona.collaborationFlow,
      keyTriggers: persona.realConcerns,
      resolutionStrategy: `${persona.name}님의 ${persona.priorities[0]} 우선 니즈에 맞춘 맞춤형 추천`,
      leadAgent: persona.collaborationFlow[0],
      persona: persona,
      collaborationFlow: persona.collaborationFlow
    };
  }

  /**
   * 디버그 정보 생성
   */
  generateDebugInfo(input: PatternDetectionInput): any {
    const detectedPersona = input.selectedPersona || PersonaDetector.detectPersona(input.userQuestion, input.budget);

    return {
      input: {
        question: input.userQuestion,
        budget: `${input.budget.min}-${input.budget.max}만원`,
        vehicleCount: input.vehicleCount,
        avgPrice: this.calculateAveragePrice(input.vehicleData),
        selectedPersona: input.selectedPersona?.name || null
      },
      analysis: {
        detectedPersona: detectedPersona?.name || null,
        personaPattern: detectedPersona ? this.detectPersonaBasedPattern(input, detectedPersona) : null,
        budgetConstraint: this.detectBudgetConstraintPattern(input),
        conflictingRequirements: this.detectConflictingRequirementsPattern(input),
        informationGap: this.detectInformationGapPattern(input)
      },
      finalPattern: this.detectPattern(input)
    };
  }
}