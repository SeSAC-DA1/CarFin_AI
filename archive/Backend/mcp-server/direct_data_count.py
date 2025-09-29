#!/usr/bin/env python3
"""
직접 RDS 데이터베이스에 연결해서 차량 데이터 개수 확인
"""

import asyncio
import asyncpg
import os
import logging
from typing import Dict, Any

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DirectDataCounter:
    def __init__(self):
        # 환경변수에서 데이터베이스 설정 로드
        self.db_config = {
            "host": os.getenv("DB_HOST", "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com"),
            "port": int(os.getenv("DB_PORT", "5432")),
            "database": os.getenv("DB_NAME", "carfin"),
            "user": os.getenv("DB_USER", "carfin_admin"),
            "password": os.getenv("DB_PASSWORD", "carfin_password"),
            "ssl": "require"  # AWS RDS는 SSL 필수
        }

        logger.info(f"🔗 DB 연결 설정: {self.db_config['host']}:{self.db_config['port']}")
        logger.info(f"👤 사용자: {self.db_config['user']}")
        logger.info(f"🗄️ 데이터베이스: {self.db_config['database']}")

    async def test_connection_and_count(self):
        """데이터베이스 연결 테스트 및 데이터 개수 확인"""
        connection = None
        try:
            logger.info("🚀 RDS 데이터베이스 연결 시도 중...")

            # 연결 시도
            connection = await asyncpg.connect(**self.db_config)
            logger.info("✅ 데이터베이스 연결 성공!")

            # 테이블 목록 확인
            logger.info("📋 테이블 목록 확인 중...")
            tables_query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
            """
            tables = await connection.fetch(tables_query)

            if tables:
                logger.info(f"📊 발견된 테이블: {len(tables)}개")
                for table in tables:
                    logger.info(f"  - {table['table_name']}")
            else:
                logger.warning("⚠️ public 스키마에 테이블이 없습니다")

            # 각 테이블의 데이터 개수 확인
            total_records = 0
            vehicle_count = 0

            for table in tables:
                table_name = table['table_name']
                try:
                    count_query = f"SELECT COUNT(*) as count FROM {table_name};"
                    result = await connection.fetchrow(count_query)
                    count = result['count']
                    total_records += count

                    logger.info(f"📈 {table_name}: {count:,}개")

                    # 차량 관련 테이블인지 확인
                    if any(keyword in table_name.lower() for keyword in ['vehicle', 'car', '차량', 'auto']):
                        vehicle_count += count
                        logger.info(f"🚗 차량 관련 테이블 {table_name}: {count:,}개")

                except Exception as e:
                    logger.error(f"❌ {table_name} 테이블 조회 실패: {e}")

            logger.info("=" * 50)
            logger.info(f"🎯 **최종 결과**")
            logger.info(f"📊 전체 레코드: {total_records:,}개")
            logger.info(f"🚗 차량 데이터: {vehicle_count:,}개")
            logger.info("=" * 50)

            # 차량 테이블이 있다면 샘플 데이터도 확인
            for table in tables:
                table_name = table['table_name']
                if any(keyword in table_name.lower() for keyword in ['vehicle', 'car', '차량', 'auto']):
                    try:
                        sample_query = f"SELECT * FROM {table_name} LIMIT 3;"
                        samples = await connection.fetch(sample_query)

                        if samples:
                            logger.info(f"🔍 {table_name} 샘플 데이터:")
                            for i, sample in enumerate(samples, 1):
                                logger.info(f"  {i}. {dict(sample)}")

                    except Exception as e:
                        logger.error(f"❌ {table_name} 샘플 조회 실패: {e}")

            return {
                "success": True,
                "total_tables": len(tables),
                "total_records": total_records,
                "vehicle_records": vehicle_count,
                "tables": [t['table_name'] for t in tables]
            }

        except asyncpg.exceptions.InvalidPasswordError:
            logger.error("❌ 패스워드가 잘못되었습니다")
            return {"success": False, "error": "Invalid password"}

        except asyncpg.exceptions.InvalidAuthorizationSpecificationError:
            logger.error("❌ 사용자 인증 실패")
            return {"success": False, "error": "Authentication failed"}

        except asyncpg.exceptions.PostgresConnectionError as e:
            logger.error(f"❌ PostgreSQL 연결 실패: {e}")
            return {"success": False, "error": f"Connection failed: {e}"}

        except Exception as e:
            logger.error(f"❌ 예상치 못한 오류: {e}")
            return {"success": False, "error": str(e)}

        finally:
            if connection:
                await connection.close()
                logger.info("🔌 데이터베이스 연결 종료")

async def main():
    """메인 실행 함수"""
    logger.info("🚀 CarFin RDS 데이터 개수 확인 시작")

    counter = DirectDataCounter()
    result = await counter.test_connection_and_count()

    if result["success"]:
        logger.info("✅ 데이터 확인 완료!")
    else:
        logger.error(f"❌ 데이터 확인 실패: {result['error']}")

    return result

if __name__ == "__main__":
    asyncio.run(main())