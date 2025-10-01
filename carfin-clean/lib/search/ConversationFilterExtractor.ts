// 🎯 대화에서 차량 필터링 조건을 추출하는 AI 서비스

import { GoogleGenerativeAI } from '@google/generative-ai';

interface FilterCondition {
  type: 'carType' | 'priceRange' | 'fuelEfficiency' | 'brand' | 'features' | 'year' | 'mileage';
  label: string;
  value: string;
  sqlCondition?: string;
  priority: number; // 1-10 (높을수록 중요)
}

interface ExtractedFilters {
  conditions: FilterCondition[];
  confidence: number;
  reasoning: string;
}

export class ConversationFilterExtractor {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  /**
   * 🎯 대화 내용에서 차량 필터링 조건 추출
   */
  async extractFilters(
    userMessage: string,
    conversationHistory: string[] = []
  ): Promise<ExtractedFilters> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
당신은 자동차 구매 상담에서 고객의 니즈를 데이터베이스 필터 조건으로 변환하는 전문가입니다.

# 대화 맥락
이전 대화: ${conversationHistory.join('\n')}
현재 사용자 메시지: "${userMessage}"

# 추출 가능한 필터 조건들
1. carType: 'SUV', '세단', '해치백', '쿠페', '컨버터블', '트럭', '승합차'
2. priceRange: '1000만원~3000만원', '3000만원~5000만원', '5000만원~7000만원', '7000만원 이상'
3. brand: '현대', '기아', 'BMW', '벤츠', '아우디', '렉서스', '볼보' 등
4. fuelEfficiency: '12km/L 이상', '15km/L 이상', '20km/L 이상'
5. features: '골프백', '3열시트', '파노라마선루프', '전자식주차브레이크', '후방카메라' 등
6. year: '2020년 이후', '2022년 이후', '2024년 모델'
7. mileage: '3만km 이하', '5만km 이하', '10만km 이하'

# 예시
사용자: "골프백 들어가는 BMW SUV 찾고 있어요, 예산은 5000만원 정도로"
추출 결과:
- carType: SUV (priority: 9)
- brand: BMW (priority: 8)
- priceRange: 4000만원~6000만원 (priority: 7)
- features: 골프백 수납 (priority: 6)

사용자: "연비 좋은 차로 바꿔주세요"
추출 결과:
- fuelEfficiency: 15km/L 이상 (priority: 8)

# 지침
1. 명시적으로 언급된 조건만 추출
2. 애매한 표현은 적절한 범위로 해석 (예: "저렴한" → 3000만원 이하)
3. priority는 사용자가 얼마나 강조했는지 기준 (1-10)
4. 이전 대화에서 언급된 조건도 고려
5. 조건 제거 요청도 감지 ("연비는 상관없어요" → fuelEfficiency 제거)

다음 JSON 형식으로 응답하세요:
{
  "conditions": [
    {
      "type": "carType",
      "label": "차종",
      "value": "SUV",
      "priority": 9
    }
  ],
  "confidence": 0.85,
  "reasoning": "사용자가 명확히 SUV를 요청했으며, BMW 브랜드와 예산 범위도 구체적으로 제시했습니다."
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // JSON 추출 (코드 블록 제거)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI 응답에서 JSON을 찾을 수 없습니다');
      }

      const extracted = JSON.parse(jsonMatch[0]) as ExtractedFilters;

      // SQL 조건 자동 생성
      extracted.conditions = extracted.conditions.map(condition => ({
        ...condition,
        sqlCondition: this.generateSqlCondition(condition)
      }));

      console.log('✅ 필터 조건 추출 성공:', extracted);
      return extracted;

    } catch (error) {
      console.error('❌ 필터 조건 추출 실패:', error);
      return {
        conditions: [],
        confidence: 0,
        reasoning: '조건 추출에 실패했습니다.'
      };
    }
  }

  /**
   * 🎯 필터 조건을 SQL WHERE 절로 변환
   */
  private generateSqlCondition(condition: FilterCondition): string {
    switch (condition.type) {
      case 'carType':
        return `"CarType" = '${condition.value}'`;

      case 'brand':
        return `"Brand" ILIKE '%${condition.value}%'`;

      case 'priceRange':
        const priceRange = this.parsePriceRange(condition.value);
        return `"Price" BETWEEN ${priceRange.min} AND ${priceRange.max}`;

      case 'fuelEfficiency':
        const efficiency = parseFloat(condition.value.match(/\d+/)?.[0] || '0');
        return `"FuelEfficiency" >= ${efficiency}`;

      case 'year':
        const year = parseInt(condition.value.match(/\d{4}/)?.[0] || '0');
        return `"Year" >= ${year}`;

      case 'mileage':
        const mileage = parseInt(condition.value.replace(/[^\d]/g, '')) * 10000; // 만km -> km
        return `"Mileage" <= ${mileage}`;

      case 'features':
        return `"Options" ILIKE '%${condition.value}%'`;

      default:
        return '1=1'; // 무조건 true
    }
  }

  /**
   * 🎯 가격 범위 파싱
   */
  private parsePriceRange(value: string): { min: number; max: number } {
    // "3000만원~5000만원" 형태 파싱
    const numbers = value.match(/\d+/g)?.map(n => parseInt(n) * 10000); // 만원 -> 원

    if (numbers && numbers.length >= 2) {
      return { min: numbers[0], max: numbers[1] };
    } else if (numbers && numbers.length === 1) {
      if (value.includes('이상')) {
        return { min: numbers[0], max: 999999999 };
      } else if (value.includes('이하')) {
        return { min: 0, max: numbers[0] };
      } else {
        // 단일 값인 경우 ±20% 범위
        const base = numbers[0];
        return { min: base * 0.8, max: base * 1.2 };
      }
    }

    return { min: 0, max: 999999999 };
  }

  /**
   * 🎯 필터 조건들을 SQL WHERE 절로 결합
   */
  buildWhereClause(conditions: FilterCondition[]): string {
    if (conditions.length === 0) return '1=1';

    const clauses = conditions
      .filter(c => c.sqlCondition)
      .map(c => c.sqlCondition);

    return clauses.join(' AND ');
  }

  /**
   * 🎯 조건 제거/변경 감지
   */
  async detectFilterChanges(
    userMessage: string,
    currentFilters: FilterCondition[]
  ): Promise<{
    toRemove: string[]; // 제거할 필터 타입들
    toUpdate: FilterCondition[]; // 업데이트할 필터들
  }> {
    // 간단한 키워드 기반 감지 (추후 AI로 확장 가능)
    const removeKeywords = ['상관없어', '제거해', '빼고', '없어도 돼'];
    const message = userMessage.toLowerCase();

    const toRemove: string[] = [];

    // 제거 키워드 감지
    if (removeKeywords.some(keyword => message.includes(keyword))) {
      if (message.includes('연비')) toRemove.push('fuelEfficiency');
      if (message.includes('가격') || message.includes('예산')) toRemove.push('priceRange');
      if (message.includes('브랜드')) toRemove.push('brand');
    }

    // 새로운 조건 추출
    const extracted = await this.extractFilters(userMessage);

    return {
      toRemove,
      toUpdate: extracted.conditions
    };
  }
}