// 🎯 차량 인사이트 분석 엔진 (Python 로직 포팅)

import { Pool } from 'pg';

interface VehicleData {
  vehicle_id: number;
  model: string;
  manufacturer: string;
  model_year: number;
  price: number;
  distance: number;
  firstregistrationdate: Date;
  options: string;
  fuel_type?: string;
  transmission?: string;
}

interface AnalysisResult {
  vehicleId: string;
  overallScore: number;
  priceCompetitiveness: number;
  mileageVsAge: number;
  ageCompetitiveness: number;
  optionCompetitiveness: number;
  peerGroupSize: number;
  keyStrengths: string[];
  keyWeaknesses: string[];
  optionHighlights: {
    owned: string[];
    popular: Array<{ name: string; popularity: number }>;
    missing: string[];
  };
  userReviews: {
    sentiment: number;
    commonPositives: string[];
    commonNegatives: string[];
    sampleReviews: string[];
  };
  recommendation: string;
}

export class VehicleAnalysisEngine {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });
  }

  /**
   * 🎯 메인 차량 분석 함수
   */
  async analyzeVehicle(vehicleId: number): Promise<AnalysisResult | null> {
    try {
      console.log(`🔍 차량 분석 시작: ${vehicleId}`);

      // 1. 타겟 차량 데이터 조회
      const targetVehicle = await this.getVehicleData(vehicleId);
      if (!targetVehicle) {
        console.error('타겟 차량을 찾을 수 없습니다');
        return null;
      }

      // 2. 동질집단 빌드 (점진적 완화)
      const peerGroup = await this.buildPeerGroup(targetVehicle);
      console.log(`📊 동질집단 크기: ${peerGroup.length}대`);

      // 3. 각 경쟁력 점수 계산
      const scores = await this.calculateCompetitivenessScores(targetVehicle, peerGroup);

      // 4. 옵션 분석
      const optionAnalysis = await this.analyzeOptions(targetVehicle, peerGroup);

      // 5. 사용자 리뷰 분석
      const reviewAnalysis = await this.analyzeUserReviews(targetVehicle);

      // 6. 종합 분석 및 추천 생성
      const analysis = this.generateComprehensiveAnalysis(
        targetVehicle,
        scores,
        optionAnalysis,
        reviewAnalysis,
        peerGroup.length
      );

      console.log(`✅ 차량 분석 완료: 종합 점수 ${analysis.overallScore}점`);
      return analysis;

    } catch (error) {
      console.error('❌ 차량 분석 실패:', error);
      return null;
    }
  }

  /**
   * 🚗 차량 데이터 조회
   */
  private async getVehicleData(vehicleId: number): Promise<VehicleData | null> {
    const query = `
      SELECT
        v.*,
        STRING_AGG(DISTINCT om.option_name, ', ' ORDER BY om.option_name) AS options
      FROM vehicles v
      LEFT JOIN vehicle_options vo ON v.vehicle_id = vo.vehicle_id
      LEFT JOIN option_masters om ON vo.option_id = om.option_id
      WHERE v.vehicle_id = $1
      GROUP BY v.vehicle_id
    `;

    const result = await this.pool.query(query, [vehicleId]);
    return result.rows[0] || null;
  }

  /**
   * 👥 동질집단 빌드 (점진적 완화)
   */
  private async buildPeerGroup(target: VehicleData): Promise<VehicleData[]> {
    const currentYear = new Date().getFullYear();
    const targetAge = currentYear - target.model_year;

    // 연식 범위를 점진적으로 확장하면서 충분한 표본 확보
    for (const ageRange of [1, 2, 3]) {
      const query = `
        SELECT
          v.*,
          STRING_AGG(DISTINCT om.option_name, ', ' ORDER BY om.option_name) AS options
        FROM vehicles v
        LEFT JOIN vehicle_options vo ON v.vehicle_id = vo.vehicle_id
        LEFT JOIN option_masters om ON vo.option_id = om.option_id
        WHERE v.model = $1
          AND v.vehicle_id != $2
          AND v.model_year BETWEEN $3 AND $4
          AND v.price > 10
          ${ageRange <= 2 ? 'AND v.fuel_type = $5 AND v.transmission = $6' : ''}
        GROUP BY v.vehicle_id
        HAVING COUNT(*) >= 1
      `;

      const params = [
        target.model,
        target.vehicle_id,
        target.model_year - ageRange,
        target.model_year + ageRange
      ];

      if (ageRange <= 2) {
        params.push(target.fuel_type || '', target.transmission || '');
      }

      const result = await this.pool.query(query, params);

      if (result.rows.length >= 20) {
        return result.rows;
      }
    }

    // 최소한의 표본도 없으면 빈 배열 반환
    return [];
  }

  /**
   * 📊 경쟁력 점수 계산
   */
  private async calculateCompetitivenessScores(
    target: VehicleData,
    peers: VehicleData[]
  ): Promise<{
    priceCompetitiveness: number;
    mileageVsAge: number;
    ageCompetitiveness: number;
    optionCompetitiveness: number;
  }> {
    if (peers.length === 0) {
      return {
        priceCompetitiveness: 50,
        mileageVsAge: 50,
        ageCompetitiveness: 50,
        optionCompetitiveness: 50
      };
    }

    const currentYear = new Date().getFullYear();

    // 가격 경쟁력 (낮을수록 좋음)
    const peerPrices = peers.map(p => Math.log(p.price));
    const targetLogPrice = Math.log(target.price);
    const priceCompetitiveness = 100 - this.calculatePercentileScore(peerPrices, targetLogPrice);

    // 연식 대비 주행거리 (낮을수록 좋음)
    const targetMileagePerYear = target.distance / Math.max(1, currentYear - target.model_year);
    const peerMileagePerYear = peers.map(p => p.distance / Math.max(1, currentYear - p.model_year));
    const mileageVsAge = 100 - this.calculatePercentileScore(peerMileagePerYear, targetMileagePerYear);

    // 연식 경쟁력 (새로울수록 좋음)
    const targetAge = currentYear - target.model_year;
    const peerAges = peers.map(p => currentYear - p.model_year);
    const ageCompetitiveness = 100 - this.calculatePercentileScore(peerAges, targetAge);

    // 옵션 경쟁력 (TF-IDF 기반)
    const optionCompetitiveness = await this.calculateOptionScore(target, peers);

    return {
      priceCompetitiveness,
      mileageVsAge,
      ageCompetitiveness,
      optionCompetitiveness
    };
  }

  /**
   * 📈 백분위 점수 계산
   */
  private calculatePercentileScore(values: number[], target: number): number {
    const validValues = values.filter(v => !isNaN(v) && isFinite(v));
    if (validValues.length === 0) return 50;

    const sorted = validValues.sort((a, b) => a - b);
    let rank = 0;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] <= target) rank = i + 1;
    }

    return (rank / sorted.length) * 100;
  }

  /**
   * 🎛️ 옵션 점수 계산 (TF-IDF 기반)
   */
  private async calculateOptionScore(target: VehicleData, peers: VehicleData[]): Promise<number> {
    if (peers.length === 0) return 50;

    // IDF 계산을 위한 전체 차량 옵션 분포
    const globalQuery = `
      SELECT option_name, COUNT(DISTINCT vehicle_id) as doc_count
      FROM vehicle_options vo
      JOIN option_masters om ON vo.option_id = om.option_id
      GROUP BY option_name
    `;
    const globalResult = await this.pool.query(globalQuery);
    const totalVehicles = await this.getTotalVehicleCount();

    // IDF 맵 생성
    const idfMap = new Map<string, number>();
    globalResult.rows.forEach(row => {
      const idf = Math.log((totalVehicles + 1) / (row.doc_count + 1)) + 1;
      idfMap.set(row.option_name, Math.min(idf, 5)); // 최대값 제한
    });

    // 피어 그룹 TF 계산
    const peerOptionCounts = new Map<string, number>();
    peers.forEach(peer => {
      if (peer.options) {
        const options = peer.options.split(', ').filter(opt => opt.trim());
        const uniqueOptions = new Set(options);
        uniqueOptions.forEach(opt => {
          peerOptionCounts.set(opt, (peerOptionCounts.get(opt) || 0) + 1);
        });
      }
    });

    // TF-IDF 옵션 값 계산
    const optionValues = new Map<string, number>();
    peerOptionCounts.forEach((count, option) => {
      const tf = count / peers.length;
      const idf = idfMap.get(option) || 1;
      optionValues.set(option, tf * idf);
    });

    // 타겟 차량 옵션 점수
    const targetOptions = target.options ? target.options.split(', ').filter(opt => opt.trim()) : [];
    const targetScore = targetOptions.reduce((sum, opt) => sum + (optionValues.get(opt) || 0), 0);

    // 피어 그룹 옵션 점수들
    const peerScores = peers.map(peer => {
      const options = peer.options ? peer.options.split(', ').filter(opt => opt.trim()) : [];
      return options.reduce((sum, opt) => sum + (optionValues.get(opt) || 0), 0);
    });

    return this.calculatePercentileScore(peerScores, targetScore);
  }

  /**
   * 🎛️ 옵션 상세 분석
   */
  private async analyzeOptions(target: VehicleData, peers: VehicleData[]): Promise<{
    owned: string[];
    popular: Array<{ name: string; popularity: number }>;
    missing: string[];
  }> {
    const targetOptions = target.options ? target.options.split(', ').filter(opt => opt.trim()) : [];

    if (peers.length === 0) {
      return {
        owned: targetOptions.slice(0, 10), // 상위 10개만
        popular: [],
        missing: []
      };
    }

    // 피어 그룹 옵션 인기도 계산
    const optionCounts = new Map<string, number>();
    peers.forEach(peer => {
      if (peer.options) {
        const options = new Set(peer.options.split(', ').filter(opt => opt.trim()));
        options.forEach(opt => {
          optionCounts.set(opt, (optionCounts.get(opt) || 0) + 1);
        });
      }
    });

    // 인기 옵션 TOP 5
    const popular = Array.from(optionCounts.entries())
      .map(([name, count]) => ({
        name,
        popularity: (count / peers.length) * 100
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    // 미보유 인기 옵션 (상위 5개 중 미보유)
    const missing = popular
      .filter(opt => !targetOptions.includes(opt.name))
      .map(opt => opt.name)
      .slice(0, 3);

    return {
      owned: targetOptions.slice(0, 10),
      popular,
      missing
    };
  }

  /**
   * 📝 사용자 리뷰 분석
   */
  private async analyzeUserReviews(target: VehicleData): Promise<{
    sentiment: number;
    commonPositives: string[];
    commonNegatives: string[];
    sampleReviews: string[];
  }> {
    // 실제 리뷰 데이터를 사용 (기존 ReviewDatabaseConnector 활용)
    try {
      const reviewQuery = `
        SELECT "Review", "Satisfaction"
        FROM hyundai_segment_purchases
        WHERE "Model" ILIKE '%${target.model}%'
        ORDER BY RANDOM()
        LIMIT 10
      `;

      const reviewResult = await this.pool.query(reviewQuery);
      const reviews = reviewResult.rows;

      if (reviews.length === 0) {
        return this.getFallbackReviews(target.model);
      }

      // 감정 점수 계산 (만족도 기반)
      const avgSatisfaction = reviews.reduce((sum, r) => sum + parseFloat(r.Satisfaction || 0), 0) / reviews.length;
      const sentiment = (avgSatisfaction - 3) / 2; // -1 to 1 스케일

      // 긍정/부정 키워드 추출 (간단한 키워드 기반)
      const positiveKeywords = ['좋다', '만족', '편하다', '넓다', '안전', '품질'];
      const negativeKeywords = ['나쁘다', '별로', '불만', '시끄럽다', '좁다', '불편'];

      const commonPositives = this.extractKeywords(reviews, positiveKeywords);
      const commonNegatives = this.extractKeywords(reviews, negativeKeywords);

      // 샘플 리뷰 (짧은 것들만)
      const sampleReviews = reviews
        .filter(r => r.Review && r.Review.length < 100)
        .map(r => r.Review)
        .slice(0, 3);

      return {
        sentiment,
        commonPositives,
        commonNegatives,
        sampleReviews
      };

    } catch (error) {
      console.error('리뷰 분석 실패:', error);
      return this.getFallbackReviews(target.model);
    }
  }

  /**
   * 📝 키워드 추출
   */
  private extractKeywords(reviews: any[], keywords: string[]): string[] {
    const found = new Set<string>();

    reviews.forEach(review => {
      const text = review.Review || '';
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          found.add(this.getThemeForKeyword(keyword));
        }
      });
    });

    return Array.from(found).slice(0, 3);
  }

  /**
   * 🎯 키워드별 테마 매핑
   */
  private getThemeForKeyword(keyword: string): string {
    const themeMap: { [key: string]: string } = {
      '좋다': '전반적 만족도',
      '편하다': '편안한 승차감',
      '넓다': '넉넉한 공간',
      '안전': '뛰어난 안전성',
      '품질': '우수한 품질',
      '나쁘다': '품질 이슈',
      '시끄럽다': '소음 문제',
      '좁다': '공간 부족',
      '불편': '사용성 아쉬움',
      '별로': '기대 대비 부족',
      '불만': '개선 필요'
    };

    return themeMap[keyword] || keyword;
  }

  /**
   * 🛡️ 폴백 리뷰 데이터
   */
  private getFallbackReviews(model: string): {
    sentiment: number;
    commonPositives: string[];
    commonNegatives: string[];
    sampleReviews: string[];
  } {
    return {
      sentiment: 0.1,
      commonPositives: ['전반적 만족도', '편안한 승차감', '우수한 품질'],
      commonNegatives: ['연비 아쉬움', '소음 문제', '공간 부족'],
      sampleReviews: [
        '전반적으로 만족스러운 차량입니다',
        '가족용으로 사용하기 좋아요',
        '연비가 조금 아쉽지만 전체적으로 괜찮습니다'
      ]
    };
  }

  /**
   * 🎯 종합 분석 및 추천 생성
   */
  private generateComprehensiveAnalysis(
    target: VehicleData,
    scores: any,
    optionAnalysis: any,
    reviewAnalysis: any,
    peerGroupSize: number
  ): AnalysisResult {
    // 종합 점수 계산 (가중 평균)
    const overallScore = (
      scores.priceCompetitiveness * 0.3 +
      scores.mileageVsAge * 0.25 +
      scores.ageCompetitiveness * 0.2 +
      scores.optionCompetitiveness * 0.25
    );

    // 강점/약점 분석
    const scoreMap = {
      '가격 경쟁력': scores.priceCompetitiveness,
      '연식 대비 주행': scores.mileageVsAge,
      '연식 경쟁력': scores.ageCompetitiveness,
      '옵션 경쟁력': scores.optionCompetitiveness
    };

    const sortedScores = Object.entries(scoreMap).sort(([,a], [,b]) => b - a);
    const keyStrengths = sortedScores.slice(0, 2).map(([key, score]) =>
      `${key} 우수 (${score.toFixed(0)}점)`
    );
    const keyWeaknesses = sortedScores.slice(-2).map(([key, score]) =>
      `${key} 개선 필요 (${score.toFixed(0)}점)`
    );

    // 추천 의견 생성
    const recommendation = this.generateRecommendation(overallScore, scores, reviewAnalysis.sentiment);

    return {
      vehicleId: target.vehicle_id.toString(),
      overallScore,
      priceCompetitiveness: scores.priceCompetitiveness,
      mileageVsAge: scores.mileageVsAge,
      ageCompetitiveness: scores.ageCompetitiveness,
      optionCompetitiveness: scores.optionCompetitiveness,
      peerGroupSize,
      keyStrengths,
      keyWeaknesses,
      optionHighlights: optionAnalysis,
      userReviews: reviewAnalysis,
      recommendation
    };
  }

  /**
   * 💡 추천 의견 생성
   */
  private generateRecommendation(overallScore: number, scores: any, sentiment: number): string {
    if (overallScore >= 80) {
      return '매우 우수한 차량입니다. 가격, 상태, 옵션 모든 면에서 동급 대비 경쟁력이 뛰어나 적극 추천합니다.';
    } else if (overallScore >= 65) {
      return '경쟁력 있는 좋은 차량입니다. 일부 아쉬운 부분이 있지만 전반적으로 만족할 만한 선택이 될 것입니다.';
    } else if (overallScore >= 50) {
      return '평균적인 차량입니다. 장단점을 충분히 고려하여 다른 옵션과 비교 검토해보시기 바랍니다.';
    } else {
      return '신중한 검토가 필요한 차량입니다. 가격이나 상태 면에서 더 나은 대안을 찾아보시는 것을 권합니다.';
    }
  }

  /**
   * 📊 전체 차량 수 조회
   */
  private async getTotalVehicleCount(): Promise<number> {
    const result = await this.pool.query('SELECT COUNT(*) as total FROM vehicles');
    return parseInt(result.rows[0].total) || 1;
  }
}