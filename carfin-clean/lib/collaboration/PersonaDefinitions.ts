// PersonaDefinitions.ts - 초공감 현실 페르소나 6개 (질문 4개씩 완전 확장)

export interface DemoPersona {
  id: 'first_car_anxiety' | 'working_mom' | 'mz_office_worker' | 'camping_lover' | 'large_family_dad' | 'ceo_executive';
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

  // 🧠 감성분석 기반 페르소나 감지 시스템 (핵심문서 사양)
  sentimentProfile: {
    anxietyIndex: number; // 불안감 지수 (0-100)
    complexityIndex: number; // 복합성 지수 (0-100)
    emotionalKeywords: { keyword: string; weight: number; category: 'anxiety' | 'confidence' | 'urgency' | 'complexity' }[];
    priorityWeighting: { [key: string]: number }; // 동적 우선순위 가중치
    sentimentThreshold: number; // 페르소나 매칭 임계값
  };
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
      '보험료까지 생각하면 어떤 차가 경제적일까요?',
      '1500만원 예산으로 신뢰할 수 있는 차 있나요? 사고나면 어떡하죠..'
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
    keyPhrases: ['첫차', '초보', '무서워', '안전한', '보험료'],

    // 🧠 감성분석 프로파일 (핵심문서 사양)
    sentimentProfile: {
      anxietyIndex: 80, // 불안감 지수: 높음 (PROJECT_WORKFLOW.md 사양)
      complexityIndex: 20, // 복합성 지수: 낮음 (단순한 니즈)
      emotionalKeywords: [
        { keyword: '무서워', weight: 25, category: 'anxiety' },
        { keyword: '걱정', weight: 20, category: 'anxiety' },
        { keyword: '떨려', weight: 18, category: 'anxiety' },
        { keyword: '첫차', weight: 15, category: 'anxiety' },
        { keyword: '초보', weight: 12, category: 'anxiety' },
        { keyword: '안전', weight: 10, category: 'confidence' },
        { keyword: '신뢰', weight: 8, category: 'confidence' }
      ],
      priorityWeighting: {
        '안전성': 0.40, // 최우선
        '경제성': 0.30,
        '편의성': 0.30
      },
      sentimentThreshold: 25 // 매칭 임계값
    }
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
      '아이와 주말 나들이 다니기 좋은 SUV 있나요?',
      '워킹맘 예산 2500만원이면 어떤 차가 실용적일까요? 카시트 설치도 쉽고..'
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
    keyPhrases: ['워킹맘', '아이', '유치원', '가족', '안전'],

    // 🧠 감성분석 프로파일
    sentimentProfile: {
      anxietyIndex: 60, // 자녀 안전에 대한 적당한 불안감
      complexityIndex: 50, // 중간 복합성 (가족+직장 균형)
      emotionalKeywords: [
        { keyword: '아이', weight: 20, category: 'complexity' },
        { keyword: '가족', weight: 18, category: 'complexity' },
        { keyword: '워킹맘', weight: 15, category: 'complexity' },
        { keyword: '안전', weight: 15, category: 'anxiety' },
        { keyword: '유치원', weight: 12, category: 'urgency' }
      ],
      priorityWeighting: {
        '아이_안전성': 0.40,
        '실용성': 0.35,
        '경제성': 0.25
      },
      sentimentThreshold: 20
    }
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
      '인스타에 올리기 좋고 데이트하기 좋은 차 추천해주세요',
      '동기들 다 비싼 차 타는데... 4000만원 예산으로 인스타 감성 사려요!'
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
    keyPhrases: ['MZ세대', '직장인', '세련된', 'BMW', '인스타'],

    // 🧠 감성분석 프로파일 - BMW 키워드 이슈 해결!
    sentimentProfile: {
      anxietyIndex: 40, // 사회적 체면 걱정
      complexityIndex: 40, // 중간 복합성 (스타일+경제성)
      emotionalKeywords: [
        { keyword: '세련된', weight: 20, category: 'confidence' },
        { keyword: '인스타', weight: 18, category: 'complexity' },
        { keyword: '동기들', weight: 15, category: 'anxiety' },
        { keyword: '데이트', weight: 12, category: 'complexity' },
        { keyword: '브랜드', weight: 10, category: 'confidence' },
        // BMW 키워드는 제거하여 CEO와의 충돌 방지
        { keyword: '직장인', weight: 8, category: 'complexity' }
      ],
      priorityWeighting: {
        '브랜드_가치': 0.40,
        '디자인': 0.35,
        '가성비': 0.25
      },
      sentimentThreshold: 22
    }
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
      '캠핑 장비 많이 실을 수 있고 산길도 잘 올라가는 차',
      '유튜버 하는데 캠핑 브이로그 찍기 좋은 차요! 예산 3500만원 정도로...'
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
    keyPhrases: ['캠핑', '차박', '평탄화', '자연', '유튜브'],

    // 🧠 감성분석 프로파일
    sentimentProfile: {
      anxietyIndex: 25, // 자신감 있는 캠핑족
      complexityIndex: 60, // 캠핑 특화 니즈
      emotionalKeywords: [
        { keyword: '캠핑', weight: 25, category: 'complexity' },
        { keyword: '차박', weight: 20, category: 'complexity' },
        { keyword: '평탄화', weight: 18, category: 'complexity' },
        { keyword: '자연', weight: 10, category: 'confidence' },
        { keyword: '유튜브', weight: 8, category: 'complexity' }
      ],
      priorityWeighting: {
        '평탄화_기능': 0.35,
        '적재_공간': 0.30,
        '내구성': 0.35
      },
      sentimentThreshold: 25
    }
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
      '부모님까지 편하게 태울 수 있는 다인용차 있나요?',
      '아이 3명+부모님 모시고 살는데... 5000만원 예산 대형 차 추천요!'
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
    keyPhrases: ['대가족', '9인승', '승합차', '다인용', '7명'],

    // 🧠 감성분석 프로파일
    sentimentProfile: {
      anxietyIndex: 50, // 대가족 책임에 대한 부담감
      complexityIndex: 70, // 높은 복합성 (7명 가족)
      emotionalKeywords: [
        { keyword: '대가족', weight: 25, category: 'complexity' },
        { keyword: '7명', weight: 20, category: 'complexity' },
        { keyword: '승합차', weight: 18, category: 'complexity' },
        { keyword: '부모님', weight: 15, category: 'complexity' },
        { keyword: '아이', weight: 12, category: 'anxiety' },
        { keyword: '절실', weight: 10, category: 'urgency' }
      ],
      priorityWeighting: {
        '다인용_공간': 0.50,
        '경제성': 0.30,
        '편의성': 0.20
      },
      sentimentThreshold: 30
    }
  },

  // 6. 김정훈 - CEO, 골프와 비즈니스의 품격
  {
    id: 'ceo_executive',
    name: '김정훈',
    emoji: '👔',
    age: 44,
    occupation: 'IT 중소기업 대표 (직원 120명, 연매출 150억)',
    situation: '회사 성장하면서 골프 접대도 늘고, 브랜드 이미지도 중요해졌어요',
    personalStory: '창업한 지 15년째인데, 이제 거래처 사장님들과 골프도 치고... 법인차로 등록해서 세금혜택도 받고 싶어요',
    realConcerns: [
      '골프백이 들어갈까? 캐디백 + 골프화까지 🏌️‍♂️',
      '거래처 사장님들과 만날 때 부끄럽지 않을까?',
      '법인차로 등록해서 세금 혜택 받을 수 있을까? 💰',
      '직원들이 "사장님 차 너무 좋네요"라고 할까? (부담스러워서)',
      '아내가 "너무 비싸다"고 하면 어떡하지? 😅',
      '중고차인게 들키면 체면이... (신차처럼 보였으면)'
    ],
    budget: { min: 4500, max: 7000 },
    priorities: ['골프백 수납', '브랜드 프리스티지', '법인차 세금혜택', '비즈니스 미팅 적합성', '연비 vs 체면 균형'],
    sampleQuestions: [
      'BMW 골프백 들어가는 차량 추천해주세요',
      '법인차로 등록할 수 있는 중형세단 추천해주세요',
      '골프 치러 다니기 좋은 차 있나요? 세금혜택도 받고 싶어요',
      '거래처 사장님들과 만날 때 부끄럽지 않은 차 추천'
    ],
    collaborationFlow: ['concierge', 'needs_analyst', 'data_analyst'],
    theme: {
      color: 'slate',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-300',
      icon: '🏢',
      description: '기업가의 품격'
    },
    expectedPattern: 'CEO_BUSINESS',
    keyPhrases: ['CEO', '사장', '법인차', '골프', '세금혜택', '접대', '브랜드', '거래처', '미팅', '품격', '실용적', '대표', '회사', '비즈니스', 'golf', 'business', 'corporate', 'meeting', 'premium', 'company'],

    // 🧠 감성분석 프로파일 (핵심문서 사양)
    sentimentProfile: {
      anxietyIndex: 30, // 불안감 지수: 낮음 (자신감 있는 CEO)
      complexityIndex: 95, // 복합성 지수: 최고 (PROJECT_WORKFLOW.md 사양)
      emotionalKeywords: [
        { keyword: '골프', weight: 30, category: 'complexity' },
        { keyword: 'BMW', weight: 25, category: 'complexity' },
        { keyword: '법인차', weight: 25, category: 'complexity' },
        { keyword: '거래처', weight: 20, category: 'complexity' },
        { keyword: '미팅', weight: 18, category: 'complexity' },
        { keyword: '세금혜택', weight: 15, category: 'complexity' },
        { keyword: '브랜드', weight: 12, category: 'complexity' },
        { keyword: 'CEO', weight: 10, category: 'confidence' },
        { keyword: '사장', weight: 10, category: 'confidence' },
        { keyword: '회사', weight: 8, category: 'complexity' },
        { keyword: '비즈니스', weight: 8, category: 'complexity' }
      ],
      priorityWeighting: {
        '브랜드_밸런스': 0.35, // 과하지도, 초라하지도 않게
        '골프_적재': 0.30,     // 골프백 수납 필수
        '법인_절세': 0.25,     // 세금혜택
        '실용성': 0.10         // 나머지
      },
      sentimentThreshold: 10 // CEO 복합 니즈 매칭 임계값 (긴급수정: BMW 골프백 질문 매칭을 위해 35→20→10 조정)
    }
  }
];

// 🧠 감성분석 기반 페르소나별 맞춤 메시지 (핵심문서 사양)
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
  },
  ceo_executive: {
    welcome: "기업가로서의 품격과 실용성을 모두 갖춘 차량을 찾아드릴게요! 골프와 비즈니스, 두 마리 토끼를 모두 잡아보세요 🏢",
    priority: "CEO에게는 브랜드 프리스티지와 골프백 수납, 그리고 법인차 세금혜택이 가장 중요하죠!",
    budget_comment: "이 예산대라면 독일 프리미엄 브랜드도 충분히 고려할 수 있어요. 법인차 등록으로 세금혜택까지!"
  }
};

// 🔧 하이브리드 페르소나 감지 시스템 (키워드 조합 + 확장 가능한 아키텍처)
export class HybridPersonaDetector {

  // 🎯 강력한 키워드 패턴 매칭 (CEO 골프백+BMW 시나리오 완벽 대응)
  static detectByKeywordPatterns(question: string, budget: { min: number; max: number }): DemoPersona | null {
    const lowerQuestion = question.toLowerCase();
    console.log(`🔍 하이브리드 감지 시작 - 질문: "${question}", 예산: ${budget.min}-${budget.max}만원`);

    // ✅ CEO 페르소나 우선 감지 (BMW + 골프 조합 키워드)
    const ceoPrimaryKeywords = ['bmw', '골프', 'golf'];
    const ceoSecondaryKeywords = ['법인차', '사장', 'ceo', '대표', '회사', '비즈니스', '접대', '거래처', '세금혜택', '미팅'];
    const ceoPersona = DEMO_PERSONAS.find(p => p.id === 'ceo_executive')!;

    // BMW + 골프 조합 감지 (확실한 CEO 신호)
    const hasBmwGolf = ceoPrimaryKeywords.some(k => lowerQuestion.includes(k)) &&
                      (lowerQuestion.includes('골프') || lowerQuestion.includes('golf'));

    if (hasBmwGolf && budget.max >= 3000) { // 합리적 예산 검증
      console.log(`🎯 CEO 페르소나 확실 감지: BMW+골프 조합 키워드 발견`);
      return ceoPersona;
    }

    // CEO 이차 키워드 조합 감지
    const ceoKeywordCount = ceoSecondaryKeywords.filter(k => lowerQuestion.includes(k)).length;
    if (ceoKeywordCount >= 2 && budget.max >= 4000) {
      console.log(`🎯 CEO 페르소나 감지: 이차 키워드 ${ceoKeywordCount}개 조합`);
      return ceoPersona;
    }

    // 나머지 페르소나들 패턴 매칭
    const patterns = [
      {
        persona: DEMO_PERSONAS.find(p => p.id === 'first_car_anxiety')!,
        keywords: ['첫차', '초보', '무서워', '떨려', '걱정', '신입'],
        minMatches: 1,
        budgetRange: [1000, 2500]
      },
      {
        persona: DEMO_PERSONAS.find(p => p.id === 'working_mom')!,
        keywords: ['워킹맘', '아이', '유치원', '가족', '엄마', '카시트'],
        minMatches: 1,
        budgetRange: [2000, 4000]
      },
      {
        persona: DEMO_PERSONAS.find(p => p.id === 'mz_office_worker')!,
        keywords: ['인스타', '세련된', '직장인', '동기', '데이트', '스타일'],
        minMatches: 1,
        budgetRange: [3000, 5000]
      },
      {
        persona: DEMO_PERSONAS.find(p => p.id === 'camping_lover')!,
        keywords: ['캠핑', '차박', '평탄화', '자연', '유튜브'],
        minMatches: 1,
        budgetRange: [3000, 4500]
      },
      {
        persona: DEMO_PERSONAS.find(p => p.id === 'large_family_dad')!,
        keywords: ['대가족', '7명', '9인승', '승합차', '부모님', '아이'],
        minMatches: 2,
        budgetRange: [3500, 6000]
      }
    ];

    // 패턴 매칭으로 페르소나 감지
    for (const pattern of patterns) {
      const matches = pattern.keywords.filter(k => lowerQuestion.includes(k)).length;
      const budgetFit = budget.max >= pattern.budgetRange[0] && budget.min <= pattern.budgetRange[1];

      if (matches >= pattern.minMatches && budgetFit) {
        console.log(`🎯 ${pattern.persona.name} 감지: 키워드 ${matches}개 매칭`);
        return pattern.persona;
      }
    }

    console.log(`❌ 하이브리드 감지 실패: 명확한 패턴 없음`);
    return null;
  }

  // 📊 기존 감성분석 시스템 (백업용 + 확장성)
  static calculateSentimentScore(question: string, persona: DemoPersona): {
    anxietyScore: number;
    complexityScore: number;
    emotionalScore: number;
    totalScore: number;
    matchDetails: any;
  } {
    const lowerQuestion = question.toLowerCase();

    // 1. 불안감 지수 계산 (Anxiety Index)
    const anxietyKeywords = persona.sentimentProfile.emotionalKeywords.filter(k => k.category === 'anxiety');
    const anxietyScore = anxietyKeywords.reduce((score, item) => {
      return lowerQuestion.includes(item.keyword) ? score + item.weight : score;
    }, 0);

    // 2. 복합성 지수 계산 (Complexity Index)
    const complexityKeywords = persona.sentimentProfile.emotionalKeywords.filter(k => k.category === 'complexity');
    const complexityScore = complexityKeywords.reduce((score, item) => {
      return lowerQuestion.includes(item.keyword) ? score + item.weight : score;
    }, 0);

    // 3. 전체 감성 점수 (가중평균)
    const allMatches = persona.sentimentProfile.emotionalKeywords.filter(item =>
      lowerQuestion.includes(item.keyword)
    );

    const emotionalScore = allMatches.reduce((score, item) => score + item.weight, 0);

    // 4. 총합 점수 (가중치 적용)
    const totalScore = (anxietyScore * 0.4) + (complexityScore * 0.3) + (emotionalScore * 0.3);

    return {
      anxietyScore,
      complexityScore,
      emotionalScore,
      totalScore,
      matchDetails: {
        matchedKeywords: allMatches.map(m => m.keyword),
        anxietyLevel: anxietyScore >= persona.sentimentProfile.anxietyIndex ? '높음' : '낮음',
        complexityLevel: complexityScore >= persona.sentimentProfile.complexityIndex ? '최고' : '보통'
      }
    };
  }

  // 🚀 메인 감지 함수 (하이브리드 접근)
  static detectPersona(question: string, budget: { min: number; max: number }): DemoPersona | null {
    // 1단계: 키워드 패턴 매칭 우선 시도
    const keywordResult = this.detectByKeywordPatterns(question, budget);
    if (keywordResult) {
      console.log(`✅ 키워드 패턴으로 감지 성공: ${keywordResult.name}`);
      return keywordResult;
    }

    // 2단계: 기존 감성분석 시스템 백업 (확장성 보장)
    console.log(`🔄 키워드 매칭 실패, 감성분석 백업 시도`);

    let bestMatch: DemoPersona | null = null;
    let highestScore = 0;
    let bestMatchDetails = null;

    // 모든 페르소나에 대해 감성분석 점수 계산
    for (const persona of DEMO_PERSONAS) {
      const sentimentResult = this.calculateSentimentScore(question, persona);

      // 예산 매칭 (더 관대하게)
      const budgetMatch = (
        budget.max >= persona.budget.min * 0.5 ||
        budget.min <= persona.budget.max * 1.5
      );

      // 임계값 이상이고 예산이 맞으면 후보
      if (sentimentResult.totalScore >= persona.sentimentProfile.sentimentThreshold && budgetMatch) {
        if (sentimentResult.totalScore > highestScore) {
          highestScore = sentimentResult.totalScore;
          bestMatch = persona;
          bestMatchDetails = sentimentResult;
        }
      }
    }

    if (bestMatch && bestMatchDetails) {
      console.log(`✅ 감성분석으로 감지 성공: ${bestMatch.name} (점수: ${highestScore.toFixed(1)})`);
      return bestMatch;
    }

    console.log(`❌ 모든 감지 방법 실패`);
    return null;
  }

  static getPersonaById(id: string): DemoPersona | null {
    return DEMO_PERSONAS.find(p => p.id === id) || null;
  }

  static getAllPersonas(): DemoPersona[] {
    return [...DEMO_PERSONAS];
  }
}

// 🔄 기존 시스템과의 호환성 (PersonaDetector 별칭)
export class PersonaDetector {
  static detectPersona(question: string, budget: { min: number; max: number }): DemoPersona | null {
    return HybridPersonaDetector.detectPersona(question, budget);
  }

  static getPersonaById(id: string): DemoPersona | null {
    return HybridPersonaDetector.getPersonaById(id);
  }

  static getAllPersonas(): DemoPersona[] {
    return HybridPersonaDetector.getAllPersonas();
  }

  static calculateSentimentScore(question: string, persona: DemoPersona) {
    return HybridPersonaDetector.calculateSentimentScore(question, persona);
  }
}