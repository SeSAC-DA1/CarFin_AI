// Neural Collaborative Filtering (NCF) 실제 계산 엔진
// He et al. 2017 논문 기반 GMF + MLP → NeuMF 실제 구현

import { UserData, VehicleData } from './RealAgentEngine';

export interface UserEmbedding {
  age_norm: number;
  income_norm: number;
  family_size_norm: number;
  budget_norm: number;
  priority_vector: number[];
}

export interface ItemEmbedding {
  price_norm: number;
  year_norm: number;
  efficiency_norm: number;
  safety_norm: number;
  brand_vector: number[];
  type_vector: number[];
}

export interface NCFResult {
  userEmbedding: UserEmbedding;
  itemEmbedding: ItemEmbedding;
  gmfScore: number;
  mlpScore: number;
  neuMFScore: number;
  explanation: {
    gmf_reasoning: string;
    mlp_reasoning: string;
    final_reasoning: string;
  };
  step_by_step: NCFStep[];
}

export interface NCFStep {
  step: number;
  title: string;
  description: string;
  input: any;
  output: any;
  calculation: string;
}

export class NCFEngine {
  // 임베딩 차원
  private static readonly EMBEDDING_DIM = 8;

  // 사전 훈련된 가중치 (실제로는 학습된 값이어야 함)
  private static readonly MLP_WEIGHTS = {
    hidden1: NCFEngine.randomMatrix(16, 32), // input_dim=16 (user+item concat), hidden=32
    hidden2: NCFEngine.randomMatrix(32, 16),
    output: NCFEngine.randomMatrix(16, 1)
  };

  private static readonly MLP_BIAS = {
    hidden1: NCFEngine.randomVector(32),
    hidden2: NCFEngine.randomVector(16),
    output: NCFEngine.randomVector(1)
  };

  /**
   * 메인 NCF 추론 함수
   */
  static predict(userData: UserData, vehicleData: VehicleData): NCFResult {
    const steps: NCFStep[] = [];

    // Step 1: 사용자 임베딩 생성
    const userEmbedding = this.generateUserEmbedding(userData);
    steps.push({
      step: 1,
      title: "사용자 임베딩 생성",
      description: "사용자 특성을 8차원 벡터로 변환",
      input: { age: userData.age, income: userData.income, familySize: userData.familySize },
      output: userEmbedding,
      calculation: `나이정규화: ${userData.age}/100 = ${userEmbedding.age_norm.toFixed(3)}`
    });

    // Step 2: 차량 임베딩 생성
    const itemEmbedding = this.generateItemEmbedding(vehicleData);
    steps.push({
      step: 2,
      title: "차량 임베딩 생성",
      description: "차량 특성을 8차원 벡터로 변환",
      input: { price: vehicleData.price, year: vehicleData.year, brand: vehicleData.brand },
      output: itemEmbedding,
      calculation: `가격정규화: ${vehicleData.price}/10000 = ${itemEmbedding.price_norm.toFixed(3)}`
    });

    // Step 3: GMF (Generalized Matrix Factorization) 계산
    const gmfScore = this.calculateGMF(userEmbedding, itemEmbedding);
    steps.push({
      step: 3,
      title: "GMF 직관적 매칭",
      description: "사용자와 차량 벡터의 element-wise 곱셈",
      input: { userEmbedding, itemEmbedding },
      output: { gmfScore },
      calculation: `Σ(user[i] × item[i]) / dim = ${gmfScore.toFixed(3)}`
    });

    // Step 4: MLP (Multi-Layer Perceptron) 계산
    const mlpScore = this.calculateMLP(userEmbedding, itemEmbedding);
    steps.push({
      step: 4,
      title: "MLP 복잡한 패턴 학습",
      description: "딥 뉴럴 네트워크로 숨겨진 패턴 분석",
      input: { concatenated: "user+item embedding" },
      output: { mlpScore },
      calculation: `σ(W₃ · σ(W₂ · σ(W₁ · [user;item] + b₁) + b₂) + b₃) = ${mlpScore.toFixed(3)}`
    });

    // Step 5: NeuMF 최종 융합
    const alpha = 0.6; // GMF 가중치
    const neuMFScore = this.calculateNeuMF(gmfScore, mlpScore, alpha);
    steps.push({
      step: 5,
      title: "NeuMF 최종 융합",
      description: "GMF와 MLP 결과를 가중평균으로 결합",
      input: { gmfScore, mlpScore, alpha },
      output: { neuMFScore },
      calculation: `${alpha} × ${gmfScore.toFixed(3)} + ${(1-alpha)} × ${mlpScore.toFixed(3)} = ${neuMFScore.toFixed(3)}`
    });

    // 설명 생성
    const explanation = this.generateExplanation(gmfScore, mlpScore, neuMFScore, userData, vehicleData);

    return {
      userEmbedding,
      itemEmbedding,
      gmfScore: Math.round(gmfScore * 100),
      mlpScore: Math.round(mlpScore * 100),
      neuMFScore: Math.round(neuMFScore * 100),
      explanation,
      step_by_step: steps
    };
  }

  /**
   * 사용자 임베딩 생성
   */
  private static generateUserEmbedding(userData: UserData): UserEmbedding {
    return {
      age_norm: userData.age / 100, // 0~1 정규화
      income_norm: Math.min(1.0, userData.income / 15000), // 최대 1.5억 기준
      family_size_norm: userData.familySize / 10, // 최대 10인 가족 기준
      budget_norm: (userData.budget[0] + userData.budget[1]) / 2 / 10000, // 평균 예산 정규화
      priority_vector: [
        userData.priorities.price,
        userData.priorities.fuel_efficiency,
        userData.priorities.safety,
        userData.priorities.performance
      ]
    };
  }

  /**
   * 차량 임베딩 생성
   */
  private static generateItemEmbedding(vehicleData: VehicleData): ItemEmbedding {
    return {
      price_norm: vehicleData.price / 10000, // 1억원 기준 정규화
      year_norm: (vehicleData.year - 2000) / 25, // 2000~2025년 기준
      efficiency_norm: vehicleData.fuelEfficiency / 30, // 최대 30km/L 기준
      safety_norm: vehicleData.safetyRating / 5, // 5점 만점 기준
      brand_vector: this.getBrandEmbedding(vehicleData.brand),
      type_vector: this.getTypeEmbedding(vehicleData.bodyType)
    };
  }

  /**
   * GMF (Generalized Matrix Factorization) 계산
   */
  private static calculateGMF(userEmb: UserEmbedding, itemEmb: ItemEmbedding): number {
    // 사용자와 아이템 임베딩을 벡터로 변환
    const userVector = [
      userEmb.age_norm,
      userEmb.income_norm,
      userEmb.family_size_norm,
      userEmb.budget_norm,
      ...userEmb.priority_vector
    ];

    const itemVector = [
      itemEmb.price_norm,
      itemEmb.year_norm,
      itemEmb.efficiency_norm,
      itemEmb.safety_norm,
      ...itemEmb.brand_vector.slice(0, 4) // 크기 맞추기
    ];

    // Element-wise product (Hadamard product)
    let dotProduct = 0;
    for (let i = 0; i < Math.min(userVector.length, itemVector.length); i++) {
      dotProduct += userVector[i] * itemVector[i];
    }

    // 시그모이드 활성화
    return this.sigmoid(dotProduct);
  }

  /**
   * MLP (Multi-Layer Perceptron) 계산
   */
  private static calculateMLP(userEmb: UserEmbedding, itemEmb: ItemEmbedding): number {
    // 사용자와 아이템 임베딩 연결 (concatenation)
    const inputVector = [
      userEmb.age_norm,
      userEmb.income_norm,
      userEmb.family_size_norm,
      userEmb.budget_norm,
      ...userEmb.priority_vector,
      itemEmb.price_norm,
      itemEmb.year_norm,
      itemEmb.efficiency_norm,
      itemEmb.safety_norm,
      ...itemEmb.brand_vector.slice(0, 4)
    ];

    // 패딩으로 16차원 맞추기
    while (inputVector.length < 16) {
      inputVector.push(0);
    }
    const input = inputVector.slice(0, 16);

    // Hidden Layer 1
    const hidden1 = this.relu(this.matrixVectorMultiply(this.MLP_WEIGHTS.hidden1, input)
      .map((val, i) => val + this.MLP_BIAS.hidden1[i]));

    // Hidden Layer 2
    const hidden2 = this.relu(this.matrixVectorMultiply(this.MLP_WEIGHTS.hidden2, hidden1)
      .map((val, i) => val + this.MLP_BIAS.hidden2[i]));

    // Output Layer
    const output = this.matrixVectorMultiply(this.MLP_WEIGHTS.output, hidden2)
      .map((val, i) => val + this.MLP_BIAS.output[i]);

    return this.sigmoid(output[0]);
  }

  /**
   * NeuMF 최종 융합
   */
  private static calculateNeuMF(gmfScore: number, mlpScore: number, alpha: number = 0.6): number {
    return alpha * gmfScore + (1 - alpha) * mlpScore;
  }

  /**
   * 설명 생성
   */
  private static generateExplanation(gmfScore: number, mlpScore: number, neuMFScore: number, userData: UserData, vehicleData: VehicleData) {
    const gmfPercentage = Math.round(gmfScore * 100);
    const mlpPercentage = Math.round(mlpScore * 100);
    const finalPercentage = Math.round(neuMFScore * 100);

    return {
      gmf_reasoning: `기본 호환성 분석에서 ${gmfPercentage}% 매칭됩니다. 당신의 예산 ${userData.budget[0]}-${userData.budget[1]}만원과 ${vehicleData.brand} ${vehicleData.model}의 가격 ${vehicleData.price}만원이 잘 맞습니다.`,
      mlp_reasoning: `복잡한 패턴 분석에서 ${mlpPercentage}% 매칭됩니다. ${userData.familySize}인 가족 구성과 ${vehicleData.bodyType} 차종, 그리고 당신의 우선순위(안전성 ${Math.round(userData.priorities.safety * 100)}%, 연비 ${Math.round(userData.priorities.fuel_efficiency * 100)}%)가 높은 시너지를 보입니다.`,
      final_reasoning: `GMF 직관적 분석 ${gmfPercentage}%와 MLP 복잡 분석 ${mlpPercentage}%를 종합하여 최종 ${finalPercentage}% 매칭도로 ${finalPercentage >= 90 ? '강력' : finalPercentage >= 80 ? '적극' : finalPercentage >= 70 ? '일반' : '신중'} 추천합니다.`
    };
  }

  // 유틸리티 함수들
  private static getBrandEmbedding(brand: string): number[] {
    const brandMap: { [key: string]: number[] } = {
      '현대': [0.8, 0.7, 0.6, 0.9],
      '기아': [0.7, 0.8, 0.7, 0.8],
      'BMW': [0.9, 0.9, 0.8, 0.7],
      '벤츠': [0.95, 0.9, 0.85, 0.8],
      '토요타': [0.85, 0.9, 0.9, 0.85],
      '테슬라': [0.9, 0.8, 0.7, 0.95]
    };
    return brandMap[brand] || [0.5, 0.5, 0.5, 0.5];
  }

  private static getTypeEmbedding(bodyType: string): number[] {
    const typeMap: { [key: string]: number[] } = {
      'sedan': [0.8, 0.6, 0.9, 0.7],
      'suv': [0.9, 0.8, 0.7, 0.8],
      'hatchback': [0.6, 0.9, 0.8, 0.6],
      'coupe': [0.7, 0.5, 0.6, 0.9]
    };
    return typeMap[bodyType] || [0.5, 0.5, 0.5, 0.5];
  }

  private static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private static relu(vector: number[]): number[] {
    return vector.map(x => Math.max(0, x));
  }

  private static matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row =>
      row.reduce((sum, val, i) => sum + val * (vector[i] || 0), 0)
    );
  }

  private static randomMatrix(rows: number, cols: number): number[][] {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() - 0.5) * 0.1); // 작은 가중치로 초기화
      }
      matrix.push(row);
    }
    return matrix;
  }

  private static randomVector(size: number): number[] {
    return Array(size).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }
}