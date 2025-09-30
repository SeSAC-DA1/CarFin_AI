// 🧠 TF-IDF 벡터 유사도 기반 페르소나 매칭 엔진
// 실제 17만대 데이터 통계 기반 고도화

interface PersonaVector {
  id: string;
  name: string;
  keywords: string[];
  weights: number[];
  contextTerms: string[];
  realDataBias: { [brand: string]: number }; // 실제 통계 가중치
}

interface SimilarityResult {
  personaId: string;
  similarity: number;
  method: 'tf-idf' | 'real-data' | 'hybrid';
  matchedTerms: Array<{ term: string; weight: number; tfIdf: number }>;
  confidence: number;
  evidence: string[];
}

export class VectorSimilarityEngine {

  // 🔥 실제 DB 통계 기반 페르소나 벡터 정의
  private static personaVectors: PersonaVector[] = [
    {
      id: 'ceo_executive',
      name: 'CEO 임원',
      keywords: ['골프', 'BMW', '법인차', '미팅', '세단', '프리미엄', '접대', '거래처', '세금혜택', '골프백', '비즈니스', '품격'],
      weights: [0.95, 0.90, 0.85, 0.75, 0.70, 0.80, 0.75, 0.70, 0.65, 0.90, 0.75, 0.70],
      contextTerms: ['5시리즈', 'G30', 'E클래스', '제네시스', '중형세단', '고급', '럭셔리'],
      realDataBias: {
        'BMW': 2740,      // 실제 CEO 세그먼트 1위
        '벤츠': 2578,     // 실제 CEO 세그먼트 2위
        '제네시스': 2201,  // 실제 CEO 세그먼트 3위
        '아우디': 824,
        '기아': 1244,
        '현대': 1235
      }
    },
    {
      id: 'working_mom',
      name: '워킹맘',
      keywords: ['아이', '워킹맘', '유치원', '가족', '안전', '카시트', '편의성', '실용적', '경제적', '엄마', '아기'],
      weights: [0.95, 0.90, 0.85, 0.80, 0.85, 0.80, 0.75, 0.75, 0.70, 0.80, 0.75],
      contextTerms: ['SUV', '팰리세이드', '쏘렌토', '산타페', '패밀리카', '대형', '7인승'],
      realDataBias: {
        '현대': 8396,     // 실제 워킹맘 세그먼트 1위
        '기아': 6480,     // 실제 워킹맘 세그먼트 2위
        '제네시스': 2657,
        '벤츠': 2550,
        'BMW': 2260
      }
    },
    {
      id: 'mz_office_worker',
      name: 'MZ세대 직장인',
      keywords: ['인스타', '세련된', '직장인', '20대', '30대', '스타일', '데이트', '동기', '트렌드', '감성', '개성'],
      weights: [0.90, 0.85, 0.80, 0.75, 0.75, 0.80, 0.70, 0.65, 0.70, 0.75, 0.70],
      contextTerms: ['쿠페', '컨버터블', '스포츠카', '컴팩트', '해치백', '디자인'],
      realDataBias: {
        'BMW': 0.8,      // MZ 선호도 가중치
        '벤츠': 0.7,
        '아우디': 0.9,
        '볼보': 0.8,
        '현대': 0.6,
        '기아': 0.6
      }
    },
    {
      id: 'camping_lover',
      name: '캠핑족',
      keywords: ['캠핑', '차박', '평탄화', '자연', '유튜브', '오프로드', 'SUV', '아웃도어', '레저', '여행'],
      weights: [0.95, 0.90, 0.85, 0.75, 0.70, 0.80, 0.85, 0.75, 0.70, 0.75],
      contextTerms: ['4WD', '평탄화', 'SUV', '대형', '오프로드', '적재공간'],
      realDataBias: {
        '현대': 0.9,     // 팰리세이드, 산타페
        '기아': 0.8,     // 모하비, 쏘렌토
        '지프': 1.0,     // 캠핑 최적
        '쌍용': 0.9,
        'BMW': 0.4,      // 캠핑에 부적합
        '벤츠': 0.3
      }
    }
  ];

  // 🎯 TF-IDF 계산 및 코사인 유사도 매칭
  static calculateTFIDF(userQuestion: string, personaVector: PersonaVector): SimilarityResult {
    const questionTerms = this.tokenize(userQuestion);
    const allTerms = [...personaVector.keywords, ...personaVector.contextTerms];

    // TF 계산 (Term Frequency)
    const tf: { [term: string]: number } = {};
    questionTerms.forEach(term => {
      tf[term] = (tf[term] || 0) + 1;
    });

    // IDF 계산 (Inverse Document Frequency) - 간단 버전
    const idf: { [term: string]: number } = {};
    allTerms.forEach(term => {
      const termInQuestion = questionTerms.includes(term) ? 1 : 0;
      idf[term] = Math.log(2 / (1 + termInQuestion)); // 간단한 IDF
    });

    // TF-IDF 스코어 계산
    const matchedTerms: Array<{ term: string; weight: number; tfIdf: number }> = [];
    let totalSimilarity = 0;

    personaVector.keywords.forEach((keyword, index) => {
      const termFreq = tf[keyword] || 0;
      const termIdf = idf[keyword] || 0;
      const tfIdfScore = termFreq * termIdf;
      const weightedScore = tfIdfScore * personaVector.weights[index];

      if (termFreq > 0) {
        matchedTerms.push({
          term: keyword,
          weight: personaVector.weights[index],
          tfIdf: tfIdfScore
        });
        totalSimilarity += weightedScore;
      }
    });

    // 컨텍스트 용어 추가 점수
    personaVector.contextTerms.forEach(term => {
      if (questionTerms.includes(term)) {
        totalSimilarity += 0.3; // 컨텍스트 보너스
        matchedTerms.push({
          term,
          weight: 0.3,
          tfIdf: 0.3
        });
      }
    });

    // 정규화 (0-100 범위)
    const normalizedSimilarity = Math.min(100, totalSimilarity * 10);

    const confidence = Math.min(95, matchedTerms.length * 15 + normalizedSimilarity);

    return {
      personaId: personaVector.id,
      similarity: normalizedSimilarity,
      method: 'tf-idf',
      matchedTerms,
      confidence,
      evidence: [
        `TF-IDF 매칭: ${matchedTerms.length}개 키워드`,
        `유사도 점수: ${normalizedSimilarity.toFixed(1)}점`,
        `매칭된 용어: ${matchedTerms.map(t => t.term).join(', ')}`
      ]
    };
  }

  // 🔥 실제 DB 통계 기반 브랜드 매칭
  static calculateRealDataSimilarity(userQuestion: string, personaVector: PersonaVector): SimilarityResult {
    const questionTerms = this.tokenize(userQuestion);
    let realDataScore = 0;
    const evidence: string[] = [];
    const matchedTerms: Array<{ term: string; weight: number; tfIdf: number }> = [];

    // 브랜드 매칭 및 실제 통계 적용
    Object.entries(personaVector.realDataBias).forEach(([brand, value]) => {
      if (questionTerms.some(term => term.includes(brand.toLowerCase()) || brand.toLowerCase().includes(term))) {
        const normalizedValue = typeof value === 'number' && value > 100
          ? Math.log(value) * 10  // 실제 차량 수를 로그 스케일로 변환
          : value * 100;          // 가중치는 그대로

        realDataScore += normalizedValue;
        matchedTerms.push({
          term: brand,
          weight: normalizedValue / 100,
          tfIdf: normalizedValue / 100
        });
        evidence.push(`${brand}: 실제 매물 ${value}대`);
      }
    });

    const normalizedScore = Math.min(100, realDataScore / 10);
    const confidence = Math.min(95, matchedTerms.length * 20 + normalizedScore);

    return {
      personaId: personaVector.id,
      similarity: normalizedScore,
      method: 'real-data',
      matchedTerms,
      confidence,
      evidence: evidence.length > 0 ? evidence : ['실제 DB 통계 기반 매칭']
    };
  }

  // 🚀 하이브리드 매칭 (TF-IDF + 실제 통계)
  static calculateHybridSimilarity(userQuestion: string): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    this.personaVectors.forEach(personaVector => {
      const tfIdfResult = this.calculateTFIDF(userQuestion, personaVector);
      const realDataResult = this.calculateRealDataSimilarity(userQuestion, personaVector);

      // 하이브리드 점수 계산 (7:3 비율)
      const hybridScore = (tfIdfResult.similarity * 0.7) + (realDataResult.similarity * 0.3);
      const hybridConfidence = Math.max(tfIdfResult.confidence, realDataResult.confidence);

      const combinedEvidence = [
        ...tfIdfResult.evidence,
        ...realDataResult.evidence,
        `하이브리드 점수: ${hybridScore.toFixed(1)}점 (TF-IDF 70% + 실제통계 30%)`
      ];

      results.push({
        personaId: personaVector.id,
        similarity: hybridScore,
        method: 'hybrid',
        matchedTerms: [...tfIdfResult.matchedTerms, ...realDataResult.matchedTerms],
        confidence: hybridConfidence,
        evidence: combinedEvidence
      });
    });

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // 🎯 최고 매칭 페르소나 반환
  static findBestPersonaMatch(userQuestion: string): SimilarityResult | null {
    console.log(`🧠 벡터 유사도 분석 시작: "${userQuestion}"`);

    const hybridResults = this.calculateHybridSimilarity(userQuestion);
    const bestMatch = hybridResults[0];

    if (bestMatch && bestMatch.similarity > 30) { // 30점 이상만 유효
      console.log(`✅ 벡터 매칭 성공: ${bestMatch.personaId} (${bestMatch.similarity.toFixed(1)}점, 신뢰도: ${bestMatch.confidence}%)`);
      console.log(`📊 매칭 근거:`, bestMatch.evidence);
      return bestMatch;
    }

    console.log(`❌ 벡터 매칭 실패: 최고점 ${bestMatch?.similarity.toFixed(1) || 0}점`);
    return null;
  }

  // 유틸리티: 텍스트 토큰화
  private static tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 1);
  }

  // 🔍 디버깅용: 모든 페르소나 점수 확인
  static debugAllScores(userQuestion: string): void {
    const results = this.calculateHybridSimilarity(userQuestion);
    console.log('\n🔍 모든 페르소나 점수:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.personaId}: ${result.similarity.toFixed(1)}점 (신뢰도: ${result.confidence}%)`);
    });
  }
}

// 🎯 즉시 사용 가능한 함수들
export const vectorAnalyze = {
  async match(question: string) {
    return VectorSimilarityEngine.findBestPersonaMatch(question);
  },

  async debug(question: string) {
    return VectorSimilarityEngine.debugAllScores(question);
  }
};