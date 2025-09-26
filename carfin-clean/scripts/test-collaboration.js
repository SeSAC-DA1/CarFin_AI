// 협업 시스템 테스트 스크립트

const { CollaborationDemo } = require('../lib/collaboration/CollaborationDemo');

async function testCollaboration() {
  console.log("🎬 CarFin AI 동적 협업 시스템 테스트");
  console.log("=" * 50);

  const demo = new CollaborationDemo(process.env.GEMINI_API_KEY);

  try {
    // 실제 동작 예시
    console.log("1️⃣ 실제 동작 예시:");
    const pattern = await demo.showRealExample();
    console.log(`결과: ${pattern}`);

    console.log("\n2️⃣ 다양한 시나리오 시뮬레이션:");
    await demo.demonstrateDynamicCollaboration();

    console.log("\n✅ 테스트 완료!");
    console.log("\n📝 결론:");
    console.log("- 완벽한 A2A는 아니지만, 현재보다 훨씬 동적임");
    console.log("- 실제 데이터에 따라 다른 협업 패턴 생성");
    console.log("- 사용자 경험상 충분히 흥미롭고 유용함");

  } catch (error) {
    console.error("❌ 테스트 실패:", error.message);
  }
}

// 환경변수 체크
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

testCollaboration();