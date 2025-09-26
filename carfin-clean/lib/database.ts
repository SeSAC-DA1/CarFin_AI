import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query:', { text: text.substring(0, 100) + '...', duration: `${duration}ms`, rows: res.rowCount });
  return res;
}

export async function getClient() {
  return pool.connect();
}

// 차량 검색 함수
export async function searchVehicles(budget: {min: number, max: number}, usage?: string, familyType?: string) {
  try {
    const vehicleQuery = `
      SELECT
        vehicleid, manufacturer, model, modelyear, price, distance,
        fueltype, cartype, transmission, trim, colorname, location,
        detailurl, photo, platform, originprice, selltype
      FROM vehicles
      WHERE price BETWEEN $1 AND $2
        AND price > 0
        AND distance IS NOT NULL
        AND distance < 150000
        AND modelyear IS NOT NULL
        AND modelyear >= 2015
        AND cartype IN ('준중형', '중형', '소형', 'SUV', '경차')
        AND manufacturer NOT IN ('기타 제조사', '기타')
        AND detailurl IS NOT NULL
        AND photo IS NOT NULL
      ORDER BY
        CASE
          WHEN cartype = '준중형' THEN 1
          WHEN cartype = '소형' THEN 2
          WHEN cartype = 'SUV' THEN 3
          ELSE 4
        END,
        price ASC
      LIMIT 10
    `;

    const result = await query(vehicleQuery, [budget.min, budget.max]);
    return result.rows;

  } catch (error) {
    console.error('차량 검색 오류:', error);
    return [];
  }
}

// 데이터베이스 상태 확인
export async function getDatabaseStatus() {
  try {
    const timeResult = await query('SELECT NOW() as current_time');
    const totalResult = await query('SELECT COUNT(*) as total FROM vehicles');
    const availableResult = await query('SELECT COUNT(*) as available FROM vehicles WHERE price > 0');

    return {
      isConnected: true,
      totalVehicles: parseInt(totalResult.rows[0].total),
      availableVehicles: parseInt(availableResult.rows[0].available),
      currentTime: timeResult.rows[0].current_time,
    };
  } catch (error) {
    console.error('데이터베이스 상태 확인 오류:', error);
    return {
      isConnected: false,
      totalVehicles: 0,
      availableVehicles: 0,
      currentTime: null,
    };
  }
}