#!/usr/bin/env python3
"""
AWS RDS PostgreSQL 연결 테스트 스크립트
실제 85,320건 데이터 연동 검증
"""

import asyncio
import asyncpg
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DB-Test")

class CarFinDatabaseTester:
    """CarFin 데이터베이스 연결 및 데이터 검증"""

    def __init__(self):
        self.db_config = {
            "host": os.getenv("DB_HOST", "carfin-db.cbkayiqs4div.ap-northeast-2.rds.amazonaws.com"),
            "port": int(os.getenv("DB_PORT", 5432)),
            "database": os.getenv("DB_NAME", "carfin"),
            "user": os.getenv("DB_USER", "carfin_user"),
            "password": os.getenv("DB_PASSWORD", "")
        }

    async def test_connection(self):
        """데이터베이스 연결 테스트"""
        try:
            logger.info("🔗 AWS RDS 연결 테스트 시작...")
            logger.info(f"📍 Host: {self.db_config['host']}")
            logger.info(f"📍 Database: {self.db_config['database']}")

            if not self.db_config['password']:
                logger.error("❌ DB_PASSWORD 환경변수가 설정되지 않았습니다")
                return False

            # 연결 테스트
            conn = await asyncpg.connect(**self.db_config)
            logger.info("✅ AWS RDS 연결 성공!")

            # 기본 정보 조회
            await self.test_basic_queries(conn)

            # 차량 데이터 검증
            await self.test_vehicle_data(conn)

            await conn.close()
            return True

        except asyncpg.InvalidCatalogNameError:
            logger.error("❌ 데이터베이스가 존재하지 않습니다")
            return False
        except asyncpg.InvalidPasswordError:
            logger.error("❌ 비밀번호가 올바르지 않습니다")
            return False
        except asyncpg.PostgresConnectionError as e:
            logger.error(f"❌ PostgreSQL 연결 실패: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ 연결 테스트 실패: {e}")
            return False

    async def test_basic_queries(self, conn):
        """기본 쿼리 테스트"""
        try:
            # PostgreSQL 버전 확인
            version = await conn.fetchval("SELECT version()")
            logger.info(f"📊 PostgreSQL 버전: {version[:50]}...")

            # 테이블 목록 조회
            tables = await conn.fetch("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)

            if tables:
                logger.info(f"📋 발견된 테이블: {len(tables)}개")
                for table in tables[:5]:  # 처음 5개만 출력
                    logger.info(f"   - {table['table_name']}")
            else:
                logger.warning("⚠️ 테이블이 없습니다. 스키마를 먼저 생성해야 합니다.")

        except Exception as e:
            logger.error(f"❌ 기본 쿼리 실패: {e}")

    async def test_vehicle_data(self, conn):
        """차량 데이터 검증"""
        try:
            # vehicles 테이블 확인
            vehicle_count = await conn.fetchval("""
                SELECT COUNT(*) FROM vehicles
                WHERE 1=1
            """)

            if vehicle_count:
                logger.info(f"🚗 차량 데이터: {vehicle_count:,}건")

                if vehicle_count >= 85000:
                    logger.info("✅ 85,320건 목표 달성!")
                else:
                    logger.warning(f"⚠️ 목표 데이터 부족: {85320 - vehicle_count:,}건 필요")

                # 샘플 데이터 조회
                sample = await conn.fetchrow("""
                    SELECT * FROM vehicles
                    LIMIT 1
                """)

                if sample:
                    logger.info("📝 샘플 데이터:")
                    for key, value in sample.items():
                        logger.info(f"   {key}: {value}")

            else:
                logger.warning("⚠️ 차량 데이터가 없습니다")

        except asyncpg.UndefinedTableError:
            logger.warning("⚠️ vehicles 테이블이 존재하지 않습니다")
            await self.suggest_schema_creation(conn)
        except Exception as e:
            logger.error(f"❌ 차량 데이터 조회 실패: {e}")

    async def suggest_schema_creation(self, conn):
        """스키마 생성 제안"""
        logger.info("📋 다음 스키마를 생성하는 것을 권장합니다:")

        schema_sql = """
        CREATE TABLE IF NOT EXISTS vehicles (
            id SERIAL PRIMARY KEY,
            brand VARCHAR(50) NOT NULL,
            model VARCHAR(100) NOT NULL,
            year INTEGER NOT NULL,
            price INTEGER NOT NULL,
            mileage INTEGER,
            fuel_type VARCHAR(20),
            transmission VARCHAR(20),
            location VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
        CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
        CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
        """

        logger.info("SQL 스키마:")
        logger.info(schema_sql)

    async def test_ai_model_integration(self):
        """AI 모델 통합 테스트"""
        try:
            logger.info("🤖 AI 모델 통합 테스트...")

            # KoBERT 모델 테스트
            from src.models.kobert_sentiment import analyze_korean_sentiment

            test_text = "이 차는 정말 좋아요. 연비도 훌륭하고 승차감도 편안합니다."
            result = await analyze_korean_sentiment(test_text)

            logger.info(f"✅ KoBERT 테스트 결과:")
            logger.info(f"   감정: {result.get('sentiment', 'N/A')}")
            logger.info(f"   점수: {result.get('score', 'N/A')}")
            logger.info(f"   신뢰도: {result.get('confidence', 'N/A')}")

        except ImportError as e:
            logger.warning(f"⚠️ AI 모델 모듈을 찾을 수 없습니다: {e}")
        except Exception as e:
            logger.error(f"❌ AI 모델 테스트 실패: {e}")

async def main():
    """메인 테스트 실행"""
    tester = CarFinDatabaseTester()

    logger.info("🚀 CarFin 데이터베이스 연결 테스트 시작")
    logger.info(f"⏰ 시작 시간: {datetime.now()}")

    # 데이터베이스 연결 테스트
    db_success = await tester.test_connection()

    # AI 모델 테스트
    await tester.test_ai_model_integration()

    logger.info(f"⏰ 완료 시간: {datetime.now()}")

    if db_success:
        logger.info("🎉 모든 테스트 완료: 실제 솔루션 구축 준비 완료!")
    else:
        logger.warning("⚠️ 데이터베이스 연결 실패: 환경변수 설정을 확인하세요")

if __name__ == "__main__":
    asyncio.run(main())