// CollaborationDemo.ts - 현실적인 협업 시뮬레이션 데모

import { GoogleGenerativeAI } from '@google/generative-ai';

interface DemoScenario {
  userQuestion: string;
  budget: { min: number; max: number };
  vehicleCount: number;
  expectedDynamics: string[];
}

export class CollaborationDemo {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // 시나리오별 동적 협업 데모
  async demonstrateDynamicCollaboration(): Promise<void> {
    const scenarios: DemoScenario[] = [
      {
        userQuestion: "SUV 추천해주세요. 2000만원으로 가족용",
        budget: { min: 1600, max: 2000 },
        vehicleCount: 15, // 예산에 맞는 SUV가 적음
        expectedDynamics: ['예산_부족_갈등', '우선순위_재정립', '대안_제시']
      },
      {
        userQuestion: "연비 좋고 큰 차 찾아요. 3000만원",
        budget: { min: 2400, max: 3000 },
        vehicleCount: 45,
        expectedDynamics: ['조건_상충_토론', '타협점_모색', '최적해_도출']
      },
      {
        userQuestion: "첫차로 안전한 차 추천해주세요",
        budget: { min: 2000, max: 2500 },
        vehicleCount: 67,
        expectedDynamics: ['니즈_심화_분석', '안전성_우선순위', '초보_맞춤_추천']
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n🎬 시나리오: ${scenario.userQuestion}`);
      console.log(`💰 예산: ${scenario.budget.min}-${scenario.budget.max}만원`);
      console.log(`🚗 매물: ${scenario.vehicleCount}대`);
      console.log(`🔮 예상 역학: ${scenario.expectedDynamics.join(', ')}`);

      await this.runScenarioSimulation(scenario);
    }
  }

  private async runScenarioSimulation(scenario: DemoScenario): Promise<void> {
    // 1단계: 상황 분석 및 갈등 지점 식별
    const conflicts = this.identifyPotentialConflicts(scenario);

    console.log(`\n🚨 예상 갈등 지점:`);
    conflicts.forEach((conflict, i) => {
      console.log(`  ${i+1}. ${conflict}`);
    });

    // 2단계: 동적 협업 흐름 시뮬레이션
    for (const conflict of conflicts) {
      await this.simulateConflictResolution(scenario, conflict);
    }
  }

  private identifyPotentialConflicts(scenario: DemoScenario): string[] {
    const conflicts: string[] = [];

    // 예산 vs 조건 갈등
    if (scenario.vehicleCount < 20) {
      conflicts.push("데이터 분석가: 예산으로는 선택지가 제한적 ↔ 니즈 분석가: 고객 요구사항 충족 필요");
    }

    // 상충하는 니즈
    if (scenario.userQuestion.includes('연비') && scenario.userQuestion.includes('큰')) {
      conflicts.push("니즈 분석가: 연비와 크기는 상충관계 ↔ 데이터 분석가: 데이터상 둘 다 만족하는 차량 없음");
    }

    // 초보 vs 고급 기능
    if (scenario.userQuestion.includes('첫차')) {
      conflicts.push("컨시어지: 초보에게는 단순한 차 ↔ 니즈 분석가: 안전 기능은 많을수록 좋음");
    }

    // 예산 확장 필요성
    if (scenario.budget.max < 2500) {
      conflicts.push("모든 전문가: 예산 확장 권유 vs 고객 예산 제약");
    }

    return conflicts.length > 0 ? conflicts : ["기본적인 견해 차이"];
  }

  private async simulateConflictResolution(scenario: DemoScenario, conflict: string): Promise<void> {
    console.log(`\n🎭 갈등 시뮬레이션: ${conflict}`);

    // 각 에이전트의 입장
    const positions = await this.generateAgentPositions(scenario, conflict);

    positions.forEach(position => {
      console.log(`  ${position.agent}: "${position.stance}"`);
    });

    // 합의점 도출
    const resolution = await this.generateResolution(scenario, conflict, positions);
    console.log(`  🤝 합의점: "${resolution}"`);

    // 실제로는 이런 패턴들이 동적으로 나타남
    await this.simulateRealTimeInteraction();
  }

  private async generateAgentPositions(scenario: DemoScenario, conflict: string) {
    return [
      {
        agent: '컨시어지 매니저',
        stance: await this.getAgentStance('concierge', scenario, conflict)
      },
      {
        agent: '니즈 분석 전문가',
        stance: await this.getAgentStance('needs_analyst', scenario, conflict)
      },
      {
        agent: '데이터 분석 전문가',
        stance: await this.getAgentStance('data_analyst', scenario, conflict)
      }
    ];
  }

  private async getAgentStance(agentType: string, scenario: DemoScenario, conflict: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const rolePrompts = {
      concierge: "고객 만족과 현실적 해결책을 우선시하는 컨시어지 매니저",
      needs_analyst: "고객의 진짜 니즈를 파악하고 최적 조건을 추구하는 니즈 분석가",
      data_analyst: "객관적 데이터와 현실적 제약을 중시하는 데이터 분석가"
    };

    const prompt = `당신은 ${rolePrompts[agentType as keyof typeof rolePrompts]}입니다.

상황:
- 고객 질문: "${scenario.userQuestion}"
- 예산: ${scenario.budget.min}-${scenario.budget.max}만원
- 매물 수: ${scenario.vehicleCount}대

갈등 상황: ${conflict}

당신의 전문적 입장에서 한 문장으로 의견을 제시하세요. 마크다운 없이 자연스럽게.`;

    const result = await model.generateContent(prompt);
    return (await result.response.text()).trim();
  }

  private async generateResolution(scenario: DemoScenario, conflict: string, positions: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `다음 3명 전문가의 의견을 종합해서 현실적인 합의점을 도출하세요:

${positions.map(p => `${p.agent}: ${p.stance}`).join('\n')}

갈등: ${conflict}
상황: ${scenario.userQuestion} (예산 ${scenario.budget.min}-${scenario.budget.max}만원)

한 문장으로 실용적인 해결책을 제시하세요.`;

    const result = await model.generateContent(prompt);
    return (await result.response.text()).trim();
  }

  private async simulateRealTimeInteraction(): Promise<void> {
    // 실제 구현에서는 이런 패턴이 실시간으로 나타남
    console.log(`    💬 실시간 협업 패턴:`);
    console.log(`      1. 데이터 기반 이의제기 → 니즈 재검토`);
    console.log(`      2. 컨시어지 중재 → 고객 확인 제안`);
    console.log(`      3. 3자 합의 → 대안 솔루션 도출`);
  }

  // 실제 사용 예시 메서드
  async showRealExample(): Promise<string> {
    console.log("\n🔬 실제 동작 예시:");

    const realQuestion = "SUV 찾는데 2000만원으로 가족용";
    const vehicleCount = 15; // 실제로는 DB 쿼리 결과

    console.log(`입력: "${realQuestion}"`);
    console.log(`DB 쿼리 결과: ${vehicleCount}대 (예산 부족 상황)`);

    // 이런 식으로 조건에 따라 다른 협업 패턴이 나타남
    if (vehicleCount < 20) {
      console.log("\n📊 데이터 분석가: '2000만원으로는 안전한 SUV 선택지가 매우 제한적입니다.'");
      console.log("🔍 니즈 분석가: '가족 안전이 우선이라면 예산을 2500만원으로 늘리면 어떨까요?'");
      console.log("🎯 컨시어지: '고객님께 예산 확장 가능성을 확인해보겠습니다.'");

      return "예산_부족_협업_패턴";
    }

    return "일반_협업_패턴";
  }
}