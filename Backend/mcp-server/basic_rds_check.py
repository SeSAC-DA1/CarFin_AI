#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RDS 연결 및 차량 데이터 확인 (이모지 없음)
"""

import asyncio
import asyncpg
import os
import sys

async def check_rds_data():
    """RDS 차량 데이터 확인"""

    # 환경변수에서 연결 정보 가져오기
    host = os.getenv("DB_HOST", "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com")
    port = int(os.getenv("DB_PORT", "5432"))
    database = os.getenv("DB_NAME", "carfin")
    user = os.getenv("DB_USER", "carfin_admin")
    password = os.getenv("DB_PASSWORD", "carfin_secure_password_2025")

    print("RDS 차량 데이터 확인 시작")
    print(f"호스트: {host}")
    print(f"사용자: {user}")
    print(f"데이터베이스: {database}")
    print(f"패스워드 길이: {len(password)}자")
    print("-" * 50)

    # 여러 연결 방법 시도
    connection_configs = [
        {"ssl": "require", "name": "SSL 필수"},
        {"ssl": "disable", "name": "SSL 비활성화"},
        {"name": "SSL 없음"}
    ]

    connection = None

    for config in connection_configs:
        try:
            print(f"[{config['name']}] 연결 시도 중...")

            connect_params = {
                "host": host,
                "port": port,
                "database": database,
                "user": user,
                "password": password
            }

            if "ssl" in config:
                connect_params["ssl"] = config["ssl"]

            connection = await asyncpg.connect(**connect_params)
            print(f"[성공] {config['name']} 연결 성공!")
            break

        except Exception as e:
            print(f"[실패] {config['name']} 연결 실패: {str(e)}")
            continue

    if not connection:
        print("ERROR: 모든 연결 시도 실패")
        return

    try:
        print("\n테이블 목록 확인 중...")

        # 테이블 목록 조회
        tables_query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """
        tables = await connection.fetch(tables_query)

        if not tables:
            print("WARNING: 테이블이 없습니다")
            return

        print(f"발견된 테이블: {len(tables)}개")
        for table in tables:
            print(f"  - {table['table_name']}")

        print("\n테이블별 데이터 개수 확인 중...")
        total_records = 0
        vehicle_records = 0

        for table in tables:
            table_name = table['table_name']
            try:
                # 테이블 레코드 수 확인
                count = await connection.fetchval(f"SELECT COUNT(*) FROM {table_name}")
                total_records += count

                print(f"  {table_name}: {count:,}개")

                # 차량 관련 테이블인지 확인
                vehicle_keywords = ['vehicle', 'car', '차량', 'auto', 'listing', 'inventory']
                if any(keyword in table_name.lower() for keyword in vehicle_keywords):
                    vehicle_records += count
                    print(f"    -> 차량 관련 테이블!")

                    # 샘플 데이터 확인
                    if count > 0:
                        sample = await connection.fetchrow(f"SELECT * FROM {table_name} LIMIT 1")
                        if sample:
                            columns = list(sample.keys())
                            print(f"    -> 컬럼: {columns[:5]}{'...' if len(columns) > 5 else ''}")

            except Exception as e:
                print(f"  ERROR: {table_name} 조회 실패: {str(e)}")

        print("\n" + "=" * 50)
        print("최종 결과")
        print(f"전체 테이블: {len(tables)}개")
        print(f"전체 레코드: {total_records:,}개")
        print(f"차량 관련 레코드: {vehicle_records:,}개")
        print("=" * 50)

        # 결과를 파일에 저장
        result_text = f"""RDS 연결 성공!
전체 테이블: {len(tables)}개
전체 레코드: {total_records:,}개
차량 관련 레코드: {vehicle_records:,}개
테이블 목록: {[t['table_name'] for t in tables]}
"""

        with open("rds_result.txt", "w", encoding="utf-8") as f:
            f.write(result_text)

        print("SUCCESS: RDS 차량 데이터 확인 완료!")
        print("결과가 rds_result.txt 파일에 저장되었습니다.")

    except Exception as e:
        print(f"ERROR: 데이터 조회 중 오류: {str(e)}")

    finally:
        if connection:
            await connection.close()
            print("연결 종료")

if __name__ == "__main__":
    asyncio.run(check_rds_data())