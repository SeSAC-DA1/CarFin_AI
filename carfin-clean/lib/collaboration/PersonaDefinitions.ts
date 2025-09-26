// PersonaDefinitions.ts - 초공감 현실 페르소나 5개 (완전 리뉴얼)

export interface DemoPersona {
  id: 'first_car_anxiety' | 'working_mom' | 'mz_office_worker' | 'camping_lover' | 'large_family_dad';
  name: string;
  emoji: string;
  age: number;
  occupation: string;
  situation: string;
  realConcerns: string[]; // 실제 고민들
  budget: { min: number; max: number };
  priorities: string[];
  sampleQuestions: string[];
  collaborationFlow: ('concierge' | 'needs_analyst' | 'data_analyst')[];
  theme: {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
  };
  expectedPattern: string;
  keyPhrases: string[];
  personalStory: string; // 개인적 스토리로 공감대 형성
}

export const DEMO_PERSONAS: DemoPersona[] = [
  // 1. 김지수 - 갓 사회인, 첫차의 공포
  {
    id: 'first_car_anxiety',
    name: '김지수',
    emoji: '😨',
    age: 26,
    occupation: '신입사원 (입사 8개월차)',
    situation: '드디어 첫 월급으로 차를 사려고 하는데... 무서워요',
    personalStory: '대학생 때는 부모님 차만 가끔 빌려 탔는데, 이제 내 차를 가져야 한다니 떨려요. 사고라도 나면 어떡하죠?',
    realConcerns: [
      '사고 나면 정말 어떡하지? 💥',
      '보험료가 월급의 절반이면 어떡해? 😱',
      '친구들이 "그 돈이면 더 좋은 차 샀을텐데"라고 할까봐',
      '부모님한테 "역시 애는 애야"라는 소리 들을까봐',
      '중고차 딜러가 나를 호구로 볼까봐'
    ],
    budget: { min: 1600, max: 2000 },
    priorities: ['안전성', '보험료', '브랜드 신뢰성', '연비', '중고차 상태'],
    sampleQuestions: [
      '첫차로 뭐가 좋을까요? 진짜 무서워요 ㅠㅠ',
      '초보운전자도 안전하게 탈 수 있는 차 추천해주세요',
      '보험료까지 생각하면 어떤 차가 경제적일까요?'
    ],
    collaborationFlow: ['concierge', 'needs_analyst', 'data_analyst'],
    theme: {
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '🛡️',
      description: '첫걸음의 안전'
    },
    expectedPattern: 'FIRST_CAR_ANXIETY',
    keyPhrases: ['첫차', '초보', '무서워', '안전한', '보험료']
  },

  // 2. 이소영 - 워킹맘, 아이와 나의 새로운 일상
  {
    id: 'working_mom',
    name: '이소영',
    emoji: '👩‍💼',
    age: 33,
    occupation: '워킹맘 (회계팀 대리, 4세 딸)',
    situation: '아이가 커서 유치원 등하원, 주말 나들이 etc. 차 없으면 진짜 힘들어요',
    personalStory: '임신 전에는 지하철이 편했는데, 이제 유모차에 기저귀 가방까지... 차가 절실해요',
    realConcerns: [
      '아이가 차 멀미하면 어떡하지? 🤢',
      '카시트 설치하기 편할까?',
      '급할 때 병원 가기 편해야 하는데',
      '주차할 때 옆 차에 문 부딪히면... (아이가 갑자기 문 열어서)',
      '남편이 "돈 아까워"라고 하면 어떡하지'
    ],
    budget: { min: 2500, max: 3200 },
    priorities: ['아이 안전성', '승하차 편의성', '공간 활용', '연비', '주차 편의성'],
    sampleQuestions: [
      '4살 아이 키우는데 어떤 차가 좋을까요?',
      '유치원 등하원하기 편한 차 추천해주세요',
      '아이와 주말 나들이 다니기 좋은 SUV 있나요?'
    ],
    collaborationFlow: ['needs_analyst', 'data_analyst', 'concierge'],
    theme: {
      color: 'pink',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      icon: '👨‍👩‍👧',
      description: '가족의 행복'
    },
    expectedPattern: 'FAMILY_PRIORITY',
    keyPhrases: ['워킹맘', '아이', '유치원', '가족', '안전']
  },

  // 3. 박준혁 - MZ세대 직장인, 인스타 감성 중요
  {
    id: 'mz_office_worker',
    name: '박준혁',
    emoji: '📱',
    age: 29,
    occupation: '마케팅 회사 과장 (인스타 팔로워 3K)',
    situation: '동기들 다 좋은 차 타는데 나만 지하철... 이제 좀 멋진 차 타고 싶어요',
    personalStory: '회사 동기가 BMW 타고 오는데 나는 아직도 버스정류장에서... 인스타 스토리에도 못 올리겠어요',
    realConcerns: [
      '동기들한테 "아직도 그런 차 타?" 소리 들을까봐 😅',
      '인스타에 올려도 부끄럽지 않을까?',
      '데이트 할 때 여자친구가 실망하면?',
      '부모님이 "너 허세 부리나?"라고 하시면...',
      '할부금 때문에 용돈이 줄어들면 어떡하지?'
    ],
    budget: { min: 3800, max: 4800 },
    priorities: ['디자인/외관', '브랜드 이미지', '연비', '옵션', '내 스타일'],
    sampleQuestions: [
      '20대 후반 직장인한테 어울리는 세련된 차 뭐예요?',
      'BMW vs 벤츠 vs 아우디, 뭐가 가장 가성비일까요?',
      '인스타에 올리기 좋고 데이트하기 좋은 차 추천해주세요'
    ],
    collaborationFlow: ['concierge', 'needs_analyst', 'data_analyst'],
    theme: {
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: '✨',
      description: 'MZ의 감성'
    },
    expectedPattern: 'MZ_LIFESTYLE',
    keyPhrases: ['MZ세대', '직장인', '세련된', 'BMW', '인스타']
  },

  // 4. 최민준 - 캠핑족, 진짜 자유를 찾아서
  {
    id: 'camping_lover',
    name: '최민준',
    emoji: '🏕️',
    age: 32,
    occupation: '프리랜서 디자이너 (캠핑 유튜버 부업)',
    situation: '코로나 이후 캠핑에 완전 빠져서 이제 캠핑이 내 삶... 완벽한 캠핑카가 필요해요',
    personalStory: '처음에는 텐트만 쳤는데, 이제 차박의 매력에 빠져서... 유튜브에 캠핑 브이로그도 올려요',
    realConcerns: [
      '뒷좌석이 진짜 평평하게 될까? (완전 중요) 🛏️',
      '캠핑 장비 다 넣고도 공간이 남을까?',
      '차박할 때 진짜 편안하게 잘 수 있을까?',
      '산길 오르막도 힘 좋게 올라갈까?',
      '유튜브에 나와도 멋있을까? (구독자들이 인정해줄까)'
    ],
    budget: { min: 3200, max: 4000 },
    priorities: ['평탄화 기능', '적재 공간', '오프로드 성능', '연비', '외관 디자인'],
    sampleQuestions: [
      '캠핑하기 완벽한 차 추천해주세요! 평탄화 꼭 필요해요',
      '차박할 때 정말 편한 SUV나 캠핑카 있나요?',
      '캠핑 장비 많이 실을 수 있고 산길도 잘 올라가는 차'
    ],
    collaborationFlow: ['needs_analyst', 'data_analyst', 'concierge'],
    theme: {
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '🌲',
      description: '자연과의 동행'
    },
    expectedPattern: 'CAMPING_LIFESTYLE',
    keyPhrases: ['캠핑', '차박', '평탄화', '자연', '유튜브']
  },

  // 5. 이경수 - 대가족의 든든한 기둥, 다인용차의 현실
  {
    id: 'large_family_dad',
    name: '이경수',
    emoji: '👨‍👩‍👧‍👦‍👶',
    age: 45,
    occupation: '대기업 차장 (아이 3명 + 부모님 동거)',
    situation: '7명 대가족이라 일반 차로는 한계... 다인용차가 절실해요',
    personalStory: '아이 셋에 부모님까지 모시고 사니 어디 가려면 두 번 나눠 가야 해요. 이제 승합차를 진지하게 고려 중이에요',
    realConcerns: [
      '승합차 기름값이 얼마나 나올까? 💸',
      '주차할 곳이 있을까? (아파트 지하주차장)',
      '아이들이 "우리 집 차 너무 크다"고 부끄러워하면?',
      '부모님 승하차가 편할까? (무릎이 안 좋으셔서)',
      '10년 이상 타야 하는데 고장 안 나고 버틸까?'
    ],
    budget: { min: 4000, max: 5500 },
    priorities: ['다인용 공간', '연료 경제성', '승하차 편의성', '내구성', '유지비'],
    sampleQuestions: [
      '7명 대가족이 모두 탈 수 있는 차 추천해주세요',
      '9인승 승합차 vs 대형 SUV 어떤게 경제적일까요?',
      '부모님까지 편하게 태울 수 있는 다인용차 있나요?'
    ],
    collaborationFlow: ['data_analyst', 'needs_analyst', 'concierge'],
    theme: {
      color: 'amber',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: '🏠',
      description: '대가족의 기둥'
    },
    expectedPattern: 'LARGE_FAMILY',
    keyPhrases: ['대가족', '9인승', '승합차', '다인용', '7명']
  }
];

// 페르소나별 맞춤 메시지 (리뉴얼)
export const PERSONA_MESSAGES = {
  first_car_anxiety: {
    welcome: "첫차 구매 정말 떨리시죠? 걱정 마세요! 안전하고 신뢰할 수 있는 차량을 차근차근 찾아드릴게요 😊",
    priority: "첫차는 무엇보다 안전성과 신뢰성이 중요해요. 보험료도 꼼꼼히 따져드릴게요!",
    budget_comment: "신입사원 예산으로도 충분히 좋은 차를 찾을 수 있어요!"
  },
  working_mom: {
    welcome: "아이와 함께하는 소중한 시간, 안전하고 편리한 차로 더욱 행복하게 만들어드릴게요! 👨‍👩‍👧",
    priority: "워킹맘에게는 아이 안전과 편의성이 최우선이죠. 실용적인 선택을 도와드릴게요!",
    budget_comment: "가족 예산 범위에서 가장 만족스러운 차량을 찾아드릴게요."
  },
  mz_office_worker: {
    welcome: "MZ세대의 감성과 스타일을 담은 차량을 찾아보세요! 인스타 감성도 충족시켜드릴게요 ✨",
    priority: "20대 후반 직장인에게는 디자인과 브랜드, 그리고 가성비의 균형이 중요해요!",
    budget_comment: "이 예산대면 정말 멋진 차들이 많아요. 동기들도 인정할 선택을 도와드릴게요!"
  },
  camping_lover: {
    welcome: "캠핑의 진정한 자유를 느낄 수 있는 완벽한 차량을 찾아드릴게요! 자연과의 동행을 도와드릴게요 🏕️",
    priority: "캠핑족에게는 평탄화 기능과 적재공간이 생명이죠! 완벽한 차박을 위한 차량을 추천드릴게요!",
    budget_comment: "이 예산이면 캠핑에 최적화된 정말 좋은 차들을 선택할 수 있어요!"
  },
  large_family_dad: {
    welcome: "대가족의 든든한 기둥! 7명이 모두 편안한 차량을 찾아드릴게요. 다인용차의 모든 것을 분석해드릴게요! 🏠",
    priority: "대가족 가장에게는 넓은 공간과 연료 경제성, 그리고 승하차 편의성이 가장 중요하죠!",
    budget_comment: "9인승 승합차부터 대형 SUV까지, 대가족에게 최적화된 차량을 추천드릴게요."
  }
};

// 페르소나 매칭 유틸리티 (업데이트)
export class PersonaDetector {
  static detectPersona(question: string, budget: { min: number; max: number }): DemoPersona | null {
    for (const persona of DEMO_PERSONAS) {
      // 키워드 매칭 (가중치 적용)
      const hasStrongMatch = persona.keyPhrases.some(phrase =>
        question.toLowerCase().includes(phrase.toLowerCase())
      );

      // 개인 스토리 기반 매칭 (감정적 키워드)
      const emotionalKeywords = ['무서워', '떨려', '걱정', '힘들어', '절실', '완벽한'];
      const hasEmotionalMatch = emotionalKeywords.some(keyword =>
        question.includes(keyword)
      );

      // 예산 범위 매칭 (±25% 허용)
      const budgetMatch = (
        budget.max >= persona.budget.min * 0.75 &&
        budget.min <= persona.budget.max * 1.25
      );

      if (hasStrongMatch || (hasEmotionalMatch && budgetMatch)) {
        return persona;
      }
    }

    return null;
  }

  static getPersonaById(id: string): DemoPersona | null {
    return DEMO_PERSONAS.find(p => p.id === id) || null;
  }

  static getAllPersonas(): DemoPersona[] {
    return [...DEMO_PERSONAS];
  }
}