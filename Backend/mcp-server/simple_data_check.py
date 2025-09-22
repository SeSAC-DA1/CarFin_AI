#!/usr/bin/env python3
"""
AWS RDS 데이터 확인 (Windows 호환)
"""

import asyncio
import asyncpg
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataCheck")

async def check_data():
    """AWS RDS 데이터 현황 확인"""

    print("AWS RDS 연결 정보를 입력해주세요:")

    host = input("Host (기본값: carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com): ") or "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com"
    database = input("Database (기본값: carfin): ") or "carfin"
    user = input("User (기본값: carfin_user): ") or "carfin_user"
    password = input("Password: ")

    if not password:
        print("ERROR: 비밀번호를 입력해야 합니다")
        return

    try:
        logger.info("AWS RDS 연결 중...")
        conn = await asyncpg.connect(
            host=host,
            port=5432,
            database=database,
            user=user,
            password=password
        )

        logger.info("연결 성공!")

        # 테이블 목록 확인
        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)

        print(f"\n테이블 목록 ({len(tables)}개):")
        for table in tables:
            print(f"   - {table['table_name']}")

        # vehicles 테이블 데이터 확인
        vehicle_count = 0
        if any(t['table_name'] == 'vehicles' for t in tables):
            vehicle_count = await conn.fetchval("SELECT COUNT(*) FROM vehicles")
            print(f"\n차량 데이터: {vehicle_count:,}건")

            if vehicle_count > 0:
                # 샘플 데이터 확인
                sample = await conn.fetchrow("SELECT * FROM vehicles LIMIT 1")
                print(f"\n샘플 데이터:")
                for key, value in sample.items():
                    print(f"   {key}: {value}")

                # 브랜드별 분포
                brand_stats = await conn.fetch("""
                    SELECT brand, COUNT(*) as count
                    FROM vehicles
                    GROUP BY brand
                    ORDER BY count DESC
                    LIMIT 10
                """)

                print(f"\n브랜드별 분포 (TOP 10):")
                for stat in brand_stats:
                    print(f"   {stat['brand']}: {stat['count']:,}대")

                # 연도별 분포
                year_stats = await conn.fetch("""
                    SELECT year, COUNT(*) as count
                    FROM vehicles
                    WHERE year >= 2015
                    GROUP BY year
                    ORDER BY year DESC
                    LIMIT 10
                """)

                print(f"\n연도별 분포 (2015년 이후):")
                for stat in year_stats:
                    print(f"   {stat['year']}년: {stat['count']:,}대")

                # 가격 범위
                price_stats = await conn.fetchrow("""
                    SELECT
                        MIN(price) as min_price,
                        MAX(price) as max_price,
                        AVG(price)::integer as avg_price,
                        COUNT(*) as total_count
                    FROM vehicles
                    WHERE price > 0
                """)

                print(f"\n가격 정보:")
                print(f"   최저가: {price_stats['min_price']:,}만원")
                print(f"   최고가: {price_stats['max_price']:,}만원")
                print(f"   평균가: {price_stats['avg_price']:,}만원")
                print(f"   총 데이터: {price_stats['total_count']:,}건")

        else:
            print("\nWARNING: vehicles 테이블이 없습니다")

        # 다른 테이블들도 확인
        for table in tables:
            table_name = table['table_name']
            if table_name != 'vehicles':
                try:
                    count = await conn.fetchval(f"SELECT COUNT(*) FROM {table_name}")
                    print(f"\n{table_name}: {count:,}건")
                except:
                    print(f"\n{table_name}: 확인 불가")

        await conn.close()
        print(f"\n데이터 확인 완료!")

        # 85,320건 목표 달성 여부
        if vehicle_count >= 85000:
            print(f"SUCCESS: 목표 달성! {vehicle_count:,}건 (85,320건 목표)")
        elif vehicle_count > 0:
            print(f"WARNING: 목표 부족 {vehicle_count:,}건 / 85,320건 목표 ({85320-vehicle_count:,}건 부족)")
        else:
            print("ERROR: 차량 데이터가 없습니다")

    except Exception as e:
        logger.error(f"연결 실패: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())