// 클라이언트에서 차량 검색 API를 호출하는 함수들
// 데이터베이스 연결 문제를 해결하기 위해 API 라우트 사용

import { UserData, VehicleData, InferenceResult } from '@/lib/inference-engines/RealDatabaseEngine';

export interface VehicleSearchResponse {
  success: boolean;
  data?: InferenceResult;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * 실제 데이터베이스에서 차량 검색 (API 호출)
 */
export async function searchVehicles(userData: UserData): Promise<VehicleData[]> {
  try {
    const response = await fetch('/api/vehicles/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result: VehicleSearchResponse = await response.json();

    if (!response.ok || !result.success) {
      console.error('Vehicle search API failed:', result.error || result.message);
      return [];
    }

    // 검색 결과에서 차량 데이터 추출
    return result.data?.data?.allVehicles || [];

  } catch (error) {
    console.error('Vehicle search request failed:', error);
    return [];
  }
}

/**
 * 차량 검색 결과와 분석 정보 전체 가져오기
 */
export async function getVehicleAnalysis(userData: UserData): Promise<InferenceResult | null> {
  try {
    const response = await fetch('/api/vehicles/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result: VehicleSearchResponse = await response.json();

    if (!response.ok || !result.success) {
      console.error('Vehicle analysis API failed:', result.error || result.message);
      return null;
    }

    return result.data || null;

  } catch (error) {
    console.error('Vehicle analysis request failed:', error);
    return null;
  }
}

/**
 * 데이터베이스 연결 테스트
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/vehicles/search', {
      method: 'GET',
    });

    const result: VehicleSearchResponse = await response.json();

    if (result.success) {
      console.log('Database connection test successful');
      return true;
    } else {
      console.error('Database connection test failed:', result.error);
      return false;
    }

  } catch (error) {
    console.error('Database connection test request failed:', error);
    return false;
  }
}

/**
 * 특정 차량 상세 정보 조회 (향후 확장)
 */
export async function getVehicleDetails(vehicleId: string): Promise<VehicleData | null> {
  try {
    const response = await fetch(`/api/vehicles/${vehicleId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;

  } catch (error) {
    console.error('Vehicle details request failed:', error);
    return null;
  }
}

/**
 * 🚀 울트라띵크 모드: PostgreSQL 전용 - 백업 데이터 완전 제거
 * AWS RDS PostgreSQL 연결 실패시 오류를 반환하여 문제를 명확히 표시
 */
export function handleDatabaseConnectionFailure(error: any): never {
  console.error('🚨 AWS PostgreSQL RDS 연결 실패 - 백업 데이터 사용 금지:', error);
  throw new Error(
    '무조건 실제 PostgreSQL AWS RDB 데이터만 사용해야 합니다. ' +
    'AWS RDS 연결을 확인하고 다시 시도하세요. 백업 데이터는 사용할 수 없습니다.'
  );
}