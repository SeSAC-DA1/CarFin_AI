// Gemini API 테스트
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyArwWj3_TDhSuCVXYoDzVGM2MW26-5UqbU');

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello World");
    console.log('✅ Gemini API 정상:', result.response.text());
  } catch (error) {
    console.error('❌ Gemini API 에러:', error.message);

    // 다른 모델로 테스트
    try {
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result2 = await model2.generateContent("Hello World");
      console.log('✅ Gemini 1.5 Flash 정상:', result2.response.text());
    } catch (error2) {
      console.error('❌ Gemini 1.5 Flash도 에러:', error2.message);
    }
  }
}

testGemini();