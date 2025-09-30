// 🧪 실제 DB 빅데이터 분석 테스트

const { Pool } = require('pg');

async function testRealAnalytics() {
  console.log('🚀 실제 RDS DB 분석 테스트 시작...');

  const pool = new Pool({
    host: 'carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com',
    port: 5432,
    database: 'carfin',
    user: 'carfin_admin',
    password: 'carfin_secure_password_2025',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log('🔗 RDS 연결 설정 완료');

  try {
    // 전체 매물 수 확인
    console.log('\n📊 전체 시장 현황 분석:');
    const totalQuery = 'SELECT COUNT(*) as total FROM vehicles';
    const totalResult = await pool.query(totalQuery);
    const totalVehicles = parseInt(totalResult.rows[0].total);
    console.log(`총 매물 수: ${totalVehicles.toLocaleString()}대`);

    // CEO 타겟 세그먼트 분석 (4500-7000만원)
    console.log('\n🎯 CEO 세그먼트 분석 (4500-7000만원):');
    const ceoQuery = `
      SELECT
        manufacturer,
        COUNT(*) as vehicle_count,
        AVG(price) as avg_price,
        AVG(modelyear) as avg_year
      FROM vehicles
      WHERE price BETWEEN 4500 AND 7000
      GROUP BY manufacturer
      ORDER BY vehicle_count DESC
      LIMIT 10;
    `;

    const ceoResult = await pool.query(ceoQuery);
    ceoResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.manufacturer}: ${row.vehicle_count}대, 평균 ${Math.round(row.avg_price)}만원, ${Math.round(row.avg_year)}년`);
    });

    // CEO 세그먼트 총 매물 수
    const ceoTotalQuery = 'SELECT COUNT(*) as total FROM vehicles WHERE price BETWEEN 4500 AND 7000';
    const ceoTotalResult = await pool.query(ceoTotalQuery);
    const ceoTotal = parseInt(ceoTotalResult.rows[0].total);
    console.log(`CEO 세그먼트 총 매물: ${ceoTotal.toLocaleString()}대 (전체의 ${((ceoTotal/totalVehicles)*100).toFixed(1)}%)`);

    // BMW 골프백 시나리오 분석
    console.log('\n🏌️‍♂️ BMW 골프백 시나리오 실제 분석:');
    const bmwQuery = `
      SELECT
        model,
        COUNT(*) as count,
        AVG(price) as avg_price,
        AVG(modelyear) as avg_year
      FROM vehicles
      WHERE manufacturer = 'BMW' AND price BETWEEN 4500 AND 7000
      GROUP BY model
      ORDER BY count DESC
      LIMIT 5;
    `;

    const bmwResult = await pool.query(bmwQuery);
    bmwResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. BMW ${row.model}: ${row.count}대, 평균 ${Math.round(row.avg_price)}만원`);
    });

    // 워킹맘 세그먼트 분석 (2500-4000만원)
    console.log('\n👩‍👧‍👦 워킹맘 세그먼트 분석 (2500-4000만원):');
    const workingMomQuery = `
      SELECT
        manufacturer,
        COUNT(*) as vehicle_count,
        AVG(price) as avg_price
      FROM vehicles
      WHERE price BETWEEN 2500 AND 4000
      GROUP BY manufacturer
      ORDER BY vehicle_count DESC
      LIMIT 5;
    `;

    const workingMomResult = await pool.query(workingMomQuery);
    workingMomResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.manufacturer}: ${row.vehicle_count}대, 평균 ${Math.round(row.avg_price)}만원`);
    });

    console.log('\n✅ 실제 DB 분석 완료!');

  } catch (error) {
    console.error('❌ DB 분석 에러:', error.message);
  } finally {
    await pool.end();
  }
}

testRealAnalytics();