import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 키 (환경변수에서 가져오기)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key');

interface UserProfileData {
  // 1단계: 나는 이런 사람이에요
  family_type: 'single' | 'newlywed' | 'young_parent' | 'office_worker' | 'retiree' | '';
  housing: 'apartment_parking' | 'apartment_street' | 'house_garage' | 'house_street' | '';
  driving_experience: 'beginner' | 'intermediate' | 'expert' | '';

  // 2단계: 이렇게 쓸 거예요
  main_purpose: 'commute' | 'family_trips' | 'weekend_leisure' | 'business' | 'daily_errands' | '';
  frequency: 'daily' | 'weekend_only' | 'occasionally' | '';
  typical_passengers: 'alone' | 'couple' | 'family_with_kids' | 'extended_family' | '';
  main_routes: 'city_center' | 'suburban' | 'highway' | 'mixed' | '';

  // 3단계: 이런 게 걱정돼요
  main_concerns: string[];
  priorities: ('safety' | 'convenience' | 'economy' | 'space' | 'reliability' | 'image')[];

  // 4단계: 현실적으로 이 정도예요
  budget: { min: number; max: number; };
  budget_flexibility: 'strict' | 'somewhat_flexible' | 'very_flexible' | '';
}

interface PersonaAnalysisResult {
  persona_profile: {
    name: string;
    description: string;
    key_characteristics: string[];
    decision_style: string;
  };
  vehicle_requirements: {
    mandatory_features: string[];
    preferred_features: string[];
    size_category: string;
    fuel_type_preference: string;
    brand_considerations: string[];
  };
  recommendation_strategy: {
    emphasis_points: string[];
    avoidance_factors: string[];
    communication_style: string;
    trust_building_elements: string[];
  };
  budget_analysis: {
    realistic_range: { min: number; max: number; };
    value_priorities: string[];
    compromise_suggestions: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userProfile }: { userProfile: UserProfileData } = body;

    console.log('🧠 페르소나 분석 시작:', {
      userProfile,
      timestamp: new Date().toISOString()
    });

    // Gemini API를 위한 프롬프트 생성
    const prompt = `
당신은 차량 구매 전문 컨설턴트입니다. 다음 사용자 정보를 바탕으로 개인화된 페르소나를 분석하고 차량 추천 전략을 수립해주세요.

## 사용자 정보

### 개인 배경
- 가족 형태: ${userProfile.family_type}
- 주거 환경: ${userProfile.housing}
- 운전 경험: ${userProfile.driving_experience}

### 사용 패턴
- 주 목적: ${userProfile.main_purpose}
- 사용 빈도: ${userProfile.frequency}
- 탑승 패턴: ${userProfile.typical_passengers}
- 주요 경로: ${userProfile.main_routes}

### 걱정거리 및 우선순위
- 주요 걱정: ${userProfile.main_concerns.join(', ')}
- 우선순위: ${userProfile.priorities.join(', ')}

### 예산 현실
- 예산 범위: ${userProfile.budget.min}만원 ~ ${userProfile.budget.max}만원
- 예산 유연성: ${userProfile.budget_flexibility}

## 요청사항

다음 JSON 형식으로 분석 결과를 제공해주세요:

{
  "persona_profile": {
    "name": "간단한 페르소나 이름 (예: 신중한 초보 운전자, 실용적 직장맘)",
    "description": "2-3문장으로 이 사용자의 특징을 요약",
    "key_characteristics": ["특징1", "특징2", "특징3"],
    "decision_style": "의사결정 스타일 설명"
  },
  "vehicle_requirements": {
    "mandatory_features": ["반드시 필요한 기능들"],
    "preferred_features": ["있으면 좋은 기능들"],
    "size_category": "권장 차량 크기 (경차/소형차/준중형차/중형차/대형차/SUV)",
    "fuel_type_preference": "권장 연료 타입",
    "brand_considerations": ["브랜드 선택 고려사항"]
  },
  "recommendation_strategy": {
    "emphasis_points": ["추천 시 강조할 포인트들"],
    "avoidance_factors": ["피해야 할 요소들"],
    "communication_style": "이 사용자에게 맞는 설명 방식",
    "trust_building_elements": ["신뢰 구축을 위한 요소들"]
  },
  "budget_analysis": {
    "realistic_range": {
      "min": 실제_최소_예산_숫자,
      "max": 실제_최대_예산_숫자
    },
    "value_priorities": ["가성비 우선순위"],
    "compromise_suggestions": ["예산 제약 시 타협 제안"]
  }
}

한국의 차량 시장과 사용자의 실제 니즈를 고려하여 실용적이고 현실적인 분석을 제공해주세요.
`;

    // Gemini API 호출
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    console.log('🎯 Gemini 원본 응답:', analysisText);

    // JSON 파싱 시도
    let personaAnalysis: PersonaAnalysisResult;
    try {
      // JSON 블록 추출 (```json...``` 형태로 응답이 올 수 있음)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        personaAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON 형식을 찾을 수 없음');
      }
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError);

      // 파싱 실패 시 기본값 제공
      personaAnalysis = generateFallbackPersona(userProfile);
    }

    // 사용자 프로필과 분석 결과 매핑
    const mappedProfile = mapToRDSFormat(userProfile, personaAnalysis);

    console.log('✅ 페르소나 분석 완료:', {
      persona: personaAnalysis.persona_profile.name,
      requirements: personaAnalysis.vehicle_requirements.size_category,
      budget: personaAnalysis.budget_analysis.realistic_range
    });

    return NextResponse.json({
      success: true,
      userProfile: userProfile,
      personaAnalysis: personaAnalysis,
      mappedProfile: mappedProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🚨 페르소나 분석 실패:', error);

    return NextResponse.json({
      success: false,
      error: `페르소나 분석 실패: ${error.message}`,
      fallbackPersona: generateFallbackPersona(body?.userProfile),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 파싱 실패 시 기본 페르소나 생성
function generateFallbackPersona(userProfile: UserProfileData): PersonaAnalysisResult {
  const basePersona: PersonaAnalysisResult = {
    persona_profile: {
      name: "실용적 차량 구매자",
      description: "합리적인 선택을 추구하는 사용자",
      key_characteristics: ["실용성 중시", "신중한 결정", "가성비 고려"],
      decision_style: "충분한 정보 수집 후 신중하게 결정"
    },
    vehicle_requirements: {
      mandatory_features: ["기본 안전장치", "연비 효율"],
      preferred_features: ["편의사양", "브랜드 신뢰성"],
      size_category: "준중형차",
      fuel_type_preference: "가솔린",
      brand_considerations: ["국산 브랜드", "A/S 편의성"]
    },
    recommendation_strategy: {
      emphasis_points: ["가성비", "실용성", "신뢰성"],
      avoidance_factors: ["과도한 옵션", "불필요한 기능"],
      communication_style: "구체적이고 명확한 설명",
      trust_building_elements: ["실제 데이터", "투명한 정보", "정직한 조언"]
    },
    budget_analysis: {
      realistic_range: userProfile.budget,
      value_priorities: ["연비", "내구성", "A/S"],
      compromise_suggestions: ["옵션 조정", "브랜드 타협"]
    }
  };

  // 사용자 프로필에 따른 기본적인 조정
  if (userProfile.family_type === 'young_parent') {
    basePersona.persona_profile.name = "안전 중시 육아맘/파";
    basePersona.vehicle_requirements.mandatory_features.push("아이 안전 기능");
    basePersona.vehicle_requirements.size_category = "SUV";
  }

  if (userProfile.driving_experience === 'beginner') {
    basePersona.persona_profile.name = "신중한 초보 운전자";
    basePersona.vehicle_requirements.mandatory_features.push("주차 보조");
    basePersona.vehicle_requirements.size_category = "소형차";
  }

  return basePersona;
}

// RDS API 형식으로 매핑
function mapToRDSFormat(userProfile: UserProfileData, persona: PersonaAnalysisResult) {
  // 페르소나 분석 결과를 RDS 추천 API 형식으로 변환
  const sizeToUsage: { [key: string]: string } = {
    '경차': 'daily',
    '소형차': 'daily',
    '준중형차': 'commute',
    '중형차': 'family',
    '대형차': 'business',
    'SUV': 'family'
  };

  const priorityMapping: { [key: string]: string[] } = {
    'safety': ['safety'],
    'convenience': ['convenience'],
    'economy': ['economy', 'reliability'],
    'space': ['space'],
    'reliability': ['reliability'],
    'image': ['brand']
  };

  let mappedPriorities: string[] = [];
  userProfile.priorities.forEach(priority => {
    if (priorityMapping[priority]) {
      mappedPriorities.push(...priorityMapping[priority]);
    }
  });

  return {
    usage: sizeToUsage[persona.vehicle_requirements.size_category] || 'daily',
    budget: persona.budget_analysis.realistic_range,
    priorities: [...new Set(mappedPriorities)], // 중복 제거
    persona_context: {
      name: persona.persona_profile.name,
      key_characteristics: persona.persona_profile.key_characteristics,
      emphasis_points: persona.recommendation_strategy.emphasis_points,
      mandatory_features: persona.vehicle_requirements.mandatory_features
    }
  };
}