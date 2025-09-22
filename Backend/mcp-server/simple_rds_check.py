#!/usr/bin/env python3
"""
간단한 RDS 연결 및 차량 데이터 확인
"""

import asyncio
import asyncpg
import os
import sys

async def check_rds_data():
    """RDS 차량 데이터 확인"""

    # 환경변수 로드
    from dotenv import load_dotenv
    load_dotenv()

    # 연결 설정
    configs = [
        {
            "name": "SSL require",
            "host": os.getenv("DB_HOST", "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com"),
            "port": int(os.getenv("DB_PORT", "5432")),
            "database": os.getenv("DB_NAME", "carfin"),
            "user": os.getenv("DB_USER", "carfin_admin"),
            "password": os.getenv("DB_PASSWORD", "carfin_secure_password_2025"),
            "ssl": "require"
        },
        {
            "name": "SSL disable",
            "host": os.getenv("DB_HOST", "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com"),
            "port": int(os.getenv("DB_PORT", "5432")),
            "database": os.getenv("DB_NAME", "carfin"),
            "user": os.getenv("DB_USER", "carfin_admin"),
            "password": os.getenv("DB_PASSWORD", "carfin_secure_password_2025"),
            "ssl": "disable"
        },
        {
            "name": "No SSL",
            "host": os.getenv("DB_HOST", "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com"),
            "port": int(os.getenv("DB_PORT", "5432")),
            "database": os.getenv("DB_NAME", "carfin"),
            "user": os.getenv("DB_USER", "carfin_admin"),
            "password": os.getenv("DB_PASSWORD", "carfin_secure_password_2025")
        }
    ]

    print("🚀 RDS 차량 데이터 확인 시작")
    print(f"🔗 호스트: {configs[0]['host']}")
    print(f"👤 사용자: {configs[0]['user']}")
    print(f"🗄️ 데이터베이스: {configs[0]['database']}")
    print(f"🔑 패스워드 길이: {len(configs[0]['password'])}자")
    print("-" * 50)

    connection = None

    for config in configs:
        try:
            print(f"🔗 {config['name']} 시도 중...")

            connection = await asyncpg.connect(**config)
            print(f"✅ {config['name']} 연결 성공!")
            break

        except Exception as e:
            print(f"❌ {config['name']} 실패: {e}")
            continue

    if not connection:
        print("❌ 모든 연결 시도 실패")
        return

    try:
        # 테이블 목록 확인
        print("\n📋 테이블 목록 확인 중...")
        tables_result = await connection.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)

        if not tables_result:
            print("⚠️ 테이블이 없습니다")
            return

        print(f"📊 발견된 테이블: {len(tables_result)}개")
        for table in tables_result:
            print(f"  - {table['table_name']}")

        # 각 테이블 데이터 개수 확인
        print("\n📈 테이블별 데이터 개수:")
        total_records = 0
        vehicle_records = 0

        for table in tables_result:
            table_name = table['table_name']
            try:
                count_result = await connection.fetchval(f"SELECT COUNT(*) FROM {table_name}")
                total_records += count_result

                print(f"  📊 {table_name}: {count_result:,}개")

                # 차량 관련 테이블인지 확인
                if any(keyword in table_name.lower() for keyword in ['vehicle', 'car', '차량', 'auto', 'listing']):
                    vehicle_records += count_result
                    print(f"      🚗 차량 관련 테이블!")

                    # 샘플 데이터도 확인
                    sample = await connection.fetchrow(f"SELECT * FROM {table_name} LIMIT 1")
                    if sample:
                        print(f"      📝 샘플: {dict(sample)}")

            except Exception as e:
                print(f"  ❌ {table_name} 조회 실패: {e}")

        print("\n" + "=" * 50)
        print("🎯 **최종 결과**")
        print(f"📊 전체 테이블: {len(tables_result)}개")
        print(f"📈 전체 레코드: {total_records:,}개")
        print(f"🚗 차량 관련 레코드: {vehicle_records:,}개")
        print("=" * 50)

        # 성공 상태 저장
        with open("rds_check_result.txt", "w", encoding="utf-8") as f:
            f.write(f"RDS 연결 성공!\n")
            f.write(f"전체 테이블: {len(tables_result)}개\n")
            f.write(f"전체 레코드: {total_records:,}개\n")
            f.write(f"차량 관련 레코드: {vehicle_records:,}개\n")
            f.write(f"테이블 목록: {[t['table_name'] for t in tables_result]}\n")

        print("✅ RDS 차량 데이터 확인 완료!")

    except Exception as e:
        print(f"❌ 데이터 조회 중 오류: {e}")

    finally:
        if connection:
            await connection.close()
            print("🔌 연결 종료")

if __name__ == "__main__":
    asyncio.run(check_rds_data())