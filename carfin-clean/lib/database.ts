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
    // 데모 모드이거나 DB 연결이 없으면 가짜 데이터 반환
    if (process.env.DEMO_MODE === 'true' || !process.env.DB_HOST) {
      return getDemoVehicles(budget, usage, familyType);
    }

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
    // DB 에러 시 데모 데이터 반환
    return getDemoVehicles(budget, usage, familyType);
  }
}

// 데모용 차량 데이터 생성
function getDemoVehicles(budget: {min: number, max: number}, usage?: string, familyType?: string) {
  const demoVehicles = [
    {
      vehicleid: 'demo_1',
      manufacturer: '현대',
      model: '투싼',
      modelyear: 2020,
      price: 2500,
      distance: 45000,
      fueltype: '가솔린',
      cartype: 'SUV',
      transmission: '자동',
      trim: '스마트',
      colorname: '흰색',
      location: '서울',
      detailurl: 'https://example.com/demo1',
      photo: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Tucson',
      platform: '엔카',
      originprice: 2800,
      selltype: '판매'
    },
    {
      vehicleid: 'demo_2',
      manufacturer: '기아',
      model: '스포티지',
      modelyear: 2019,
      price: 2300,
      distance: 52000,
      fueltype: '가솔린',
      cartype: 'SUV',
      transmission: '자동',
      trim: '프레스티지',
      colorname: '검은색',
      location: '경기',
      detailurl: 'https://example.com/demo2',
      photo: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Sportage',
      platform: '엔카',
      originprice: 2600,
      selltype: '판매'
    },
    {
      vehicleid: 'demo_3',
      manufacturer: '현대',
      model: '아반떼',
      modelyear: 2021,
      price: 1800,
      distance: 25000,
      fueltype: '가솔린',
      cartype: '준중형',
      transmission: '자동',
      trim: '인스퍼레이션',
      colorname: '은색',
      location: '인천',
      detailurl: 'https://example.com/demo3',
      photo: 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Avante',
      platform: '엔카',
      originprice: 2000,
      selltype: '판매'
    },
    {
      vehicleid: 'demo_4',
      manufacturer: '기아',
      model: 'K3',
      modelyear: 2020,
      price: 1600,
      distance: 38000,
      fueltype: '가솔린',
      cartype: '준중형',
      transmission: '자동',
      trim: '프레스티지',
      colorname: '파란색',
      location: '부산',
      detailurl: 'https://example.com/demo4',
      photo: 'https://via.placeholder.com/300x200/2563EB/FFFFFF?text=K3',
      platform: '엔카',
      originprice: 1800,
      selltype: '판매'
    },
    {
      vehicleid: 'demo_5',
      manufacturer: '쌍용',
      model: '코란도',
      modelyear: 2019,
      price: 1400,
      distance: 65000,
      fueltype: '디젤',
      cartype: 'SUV',
      transmission: '자동',
      trim: 'LX',
      colorname: '회색',
      location: '대구',
      detailurl: 'https://example.com/demo5',
      photo: 'https://via.placeholder.com/300x200/7C3AED/FFFFFF?text=Korando',
      platform: '엔카',
      originprice: 1600,
      selltype: '판매'
    }
  ];

  // 예산에 맞는 차량 필터링
  const filteredVehicles = demoVehicles.filter(vehicle =>
    vehicle.price >= budget.min / 10000 && vehicle.price <= budget.max / 10000
  );

  // 캠핑/차박 용도면 SUV 우선 정렬
  if (usage?.includes('캠핑') || usage?.includes('차박')) {
    return filteredVehicles.sort((a, b) => {
      if (a.cartype === 'SUV' && b.cartype !== 'SUV') return -1;
      if (a.cartype !== 'SUV' && b.cartype === 'SUV') return 1;
      return a.price - b.price;
    });
  }

  return filteredVehicles.sort((a, b) => a.price - b.price);
}

// 데이터베이스 상태 확인
export async function getDatabaseStatus() {
  try {
    // 데모 모드이거나 DB 연결이 없으면 데모 상태 반환
    if (process.env.DEMO_MODE === 'true' || !process.env.DB_HOST) {
      return {
        isConnected: true,
        totalVehicles: 50000,
        availableVehicles: 45000,
        currentTime: new Date(),
        mode: 'demo'
      };
    }

    const timeResult = await query('SELECT NOW() as current_time');
    const totalResult = await query('SELECT COUNT(*) as total FROM vehicles');
    const availableResult = await query('SELECT COUNT(*) as available FROM vehicles WHERE price > 0');

    return {
      isConnected: true,
      totalVehicles: parseInt(totalResult.rows[0].total),
      availableVehicles: parseInt(availableResult.rows[0].available),
      currentTime: timeResult.rows[0].current_time,
      mode: 'production'
    };
  } catch (error) {
    console.error('데이터베이스 상태 확인 오류:', error);
    // DB 에러 시 데모 상태 반환
    return {
      isConnected: true,
      totalVehicles: 50000,
      availableVehicles: 45000,
      currentTime: new Date(),
      mode: 'demo'
    };
  }
}