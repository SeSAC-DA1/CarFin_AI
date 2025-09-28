// lib/nthQuestionWelcome/WelcomeMessageGenerator.ts

interface WelcomeMessage {
  message: string;
  milestone?: string;
  specialOffer?: string;
  badge?: string;
  emoji?: string;
  personalizedNote?: string;
}

interface MilestoneData {
  message: string;
  milestone?: string;
  specialOffer?: string;
  badge: string;
  emoji: string;
}

export class WelcomeMessageGenerator {
  private static readonly MILESTONES: { [key: number]: MilestoneData } = {
    1: {
      message: "CarFin AI에 처음 오신 것을 환영합니다! 완벽한 중고차를 찾아드릴게요.",
      badge: "🌟 First Timer",
      emoji: "👋"
    },
    2: {
      message: "다시 찾아주셔서 감사해요! 2번째 질문이시네요.",
      badge: "🔄 Returning User",
      emoji: "🤗"
    },
    3: {
      message: "벌써 3번째 질문! CarFin AI가 마음에 드시는군요.",
      badge: "💙 Loyal User",
      emoji: "😊"
    },
    5: {
      message: "벌써 5번째 질문이시네요! CarFin AI의 단골 고객이 되어주셔서 감사해요.",
      milestone: "단골 고객 달성!",
      badge: "⭐ Regular Customer",
      emoji: "🎉"
    },
    10: {
      message: "10번째 질문 달성! CarFin AI VIP 회원이 되셨어요.",
      milestone: "VIP 회원 승격!",
      specialOffer: "프리미엄 상담 및 우선 알림 서비스",
      badge: "👑 VIP Member",
      emoji: "🏆"
    },
    25: {
      message: "25번째 질문! 진정한 CarFin AI 마니아시네요!",
      milestone: "마니아 등급 달성!",
      specialOffer: "전용 컨시어지 서비스",
      badge: "🏆 Expert User",
      emoji: "🌟"
    },
    50: {
      message: "50번째 질문 기념! CarFin AI 명예 회원으로 모십니다.",
      milestone: "명예 회원 달성!",
      specialOffer: "평생 프리미엄 서비스",
      badge: "💎 Hall of Fame",
      emoji: "🎖️"
    }
  };

  private static readonly DEFAULT_MESSAGES = [
    "번째 질문이시네요! 항상 이용해주셔서 감사해요.",
    "번째 방문, 정말 반가워요! 이번에는 어떤 차량을 찾고 계신가요?",
    "번째로 찾아주신 단골 고객님, 환영합니다!"
  ];

  generateWelcomeMessage(
    questionCount: number,
    userProfile?: any,
    personalizedInsights?: any
  ): WelcomeMessage {
    // 특별 마일스톤 체크
    const milestone = WelcomeMessageGenerator.MILESTONES[questionCount];
    if (milestone) {
      return {
        ...milestone,
        personalizedNote: this.generatePersonalizedNote(userProfile, personalizedInsights)
      };
    }

    // 일반 메시지 생성
    const messageIndex = questionCount % WelcomeMessageGenerator.DEFAULT_MESSAGES.length;
    const baseMessage = `${questionCount}${WelcomeMessageGenerator.DEFAULT_MESSAGES[messageIndex]}`;

    return {
      message: baseMessage,
      badge: this.getBadgeForCount(questionCount),
      emoji: this.getEmojiForCount(questionCount),
      personalizedNote: this.generatePersonalizedNote(userProfile, personalizedInsights)
    };
  }

  generateContextualWelcome(
    questionCount: number,
    userProfile?: any,
    insights?: any
  ): WelcomeMessage {
    const baseWelcome = this.generateWelcomeMessage(questionCount, userProfile, insights);

    // 페르소나 기반 맞춤 메시지
    if (insights?.favoritePersona) {
      const personaMessage = this.getPersonaSpecificMessage(
        questionCount,
        insights.favoritePersona,
        insights
      );
      if (personaMessage) {
        return {
          ...baseWelcome,
          message: personaMessage,
          specialOffer: this.getPersonaSpecificOffer(insights.favoritePersona)
        };
      }
    }

    // 예산 트렌드 기반 메시지
    if (insights?.budgetTrend) {
      const trendMessage = this.getBudgetTrendMessage(questionCount, insights.budgetTrend);
      if (trendMessage) {
        baseWelcome.personalizedNote = trendMessage;
      }
    }

    return baseWelcome;
  }

  private generatePersonalizedNote(userProfile?: any, insights?: any): string | undefined {
    if (!insights) return undefined;

    const notes: string[] = [];

    if (insights.favoritePersona) {
      const personaName = this.getPersonaDisplayName(insights.favoritePersona);
      if (personaName) {
        notes.push(`${personaName} 스타일의 차량을 자주 찾으시는군요!`);
      }
    }

    if (insights.budgetTrend === 'increasing') {
      notes.push('예산이 점점 올라가고 계시네요. 더 고급 차량들을 준비해드릴게요!');
    } else if (insights.budgetTrend === 'decreasing') {
      notes.push('합리적인 선택을 하고 계시네요. 가성비 좋은 차량들을 추천드려요!');
    }

    return notes.length > 0 ? notes.join(' ') : undefined;
  }

  private getPersonaSpecificMessage(
    questionCount: number,
    favoritePersona: string,
    insights: any
  ): string | null {
    const personaMessages: { [key: string]: string } = {
      'ceo_executive': `${questionCount}번째 질문 환영합니다! CEO님의 비즈니스 차량 찾기를 도와드릴게요. 골프백 수납과 브랜드 프리스티지를 고려한 추천을 준비했습니다.`,
      'working_mom': `${questionCount}번째 질문이시네요! 육아맘의 바쁜 일상을 이해합니다. 가족과 함께 안전하고 편리한 차량을 찾아드릴게요.`,
      'first_car_anxiety': `${questionCount}번째 질문! 첫 차 구매에 대한 고민, 저희가 함께 해결해드릴게요. 안전하고 믿을 만한 차량을 추천해드립니다.`,
      'camping_lover': `${questionCount}번째 질문! 캠핑족의 로망을 이해합니다. 장비도 많이 싣고 어디든 갈 수 있는 차량을 찾아드릴게요.`,
      'large_family_dad': `${questionCount}번째 질문! 대가족 아빠의 고민을 알고 있어요. 모든 가족이 편안하게 탈 수 있는 넓은 차량을 추천드립니다.`,
      'mz_office_worker': `${questionCount}번째 질문! MZ세대의 트렌디한 취향을 반영해서 스타일리시하면서도 실용적인 차량을 찾아드릴게요.`
    };

    return personaMessages[favoritePersona] || null;
  }

  private getPersonaSpecificOffer(favoritePersona: string): string | undefined {
    const offers: { [key: string]: string } = {
      'ceo_executive': 'CEO 전용 프리미엄 상담 및 법인차 세금혜택 안내',
      'working_mom': '육아맘 특화 안전 옵션 우선 안내',
      'first_car_anxiety': '첫 차 구매 전용 안심 보증 서비스',
      'camping_lover': '캠핑용품 수납 최적화 차량 우선 추천',
      'large_family_dad': '대가족용 넓은 차량 전용 상담',
      'mz_office_worker': 'MZ세대 트렌드 차량 우선 알림'
    };

    return offers[favoritePersona];
  }

  private getBudgetTrendMessage(questionCount: number, budgetTrend: string): string {
    switch (budgetTrend) {
      case 'increasing':
        return '예산이 점점 올라가고 계시는군요. 더 고급 차량들을 준비해드릴게요!';
      case 'decreasing':
        return '합리적인 선택을 하고 계시네요. 가성비 좋은 차량들을 추천드려요!';
      case 'stable':
        return '일정한 예산 범위를 유지하고 계시네요. 최적의 가성비 차량을 찾아드릴게요!';
      default:
        return '';
    }
  }

  private getBadgeForCount(questionCount: number): string {
    if (questionCount >= 100) return '💎 Legend';
    if (questionCount >= 50) return '💎 Hall of Fame';
    if (questionCount >= 25) return '🏆 Expert User';
    if (questionCount >= 10) return '👑 VIP Member';
    if (questionCount >= 5) return '⭐ Regular Customer';
    if (questionCount >= 3) return '💙 Loyal User';
    return '👋 Welcome';
  }

  private getEmojiForCount(questionCount: number): string {
    if (questionCount >= 50) return '🎖️';
    if (questionCount >= 25) return '🌟';
    if (questionCount >= 10) return '🏆';
    if (questionCount >= 5) return '🎉';
    if (questionCount >= 3) return '😊';
    if (questionCount >= 2) return '🤗';
    return '👋';
  }

  private getPersonaDisplayName(personaId: string): string | null {
    const displayNames: { [key: string]: string } = {
      'ceo_executive': 'CEO/임원',
      'working_mom': '워킹맘',
      'first_car_anxiety': '첫차 구매자',
      'camping_lover': '캠핑족',
      'large_family_dad': '대가족 아빠',
      'mz_office_worker': 'MZ 직장인'
    };

    return displayNames[personaId] || null;
  }

  // 진행률 및 다음 마일스톤 계산
  getProgressToNextMilestone(questionCount: number): {
    nextMilestone: number;
    progress: number;
    remaining: number;
  } {
    const milestones = [1, 2, 3, 5, 10, 25, 50, 100];
    const nextMilestone = milestones.find(m => questionCount < m) || 100;
    const previousMilestone = milestones[milestones.indexOf(nextMilestone) - 1] || 0;

    const progress = previousMilestone === 0
      ? (questionCount / nextMilestone) * 100
      : ((questionCount - previousMilestone) / (nextMilestone - previousMilestone)) * 100;

    return {
      nextMilestone,
      progress: Math.min(progress, 100),
      remaining: nextMilestone - questionCount
    };
  }
}

export type { WelcomeMessage };