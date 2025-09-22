-- CarFin AI 실제 차량 데이터베이스 스키마
-- 실제 중고차 매물 데이터를 저장하기 위한 테이블 구조

-- 차량 브랜드 테이블
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    country VARCHAR(50),
    premium_tier INTEGER DEFAULT 1, -- 1: 대중차, 2: 프리미엄, 3: 럭셔리
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 차량 모델 테이블
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(id),
    name VARCHAR(100) NOT NULL,
    body_type VARCHAR(20) CHECK (body_type IN ('sedan', 'suv', 'hatchback', 'coupe', 'wagon', 'convertible')),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('gasoline', 'diesel', 'hybrid', 'electric', 'lpg')),
    segment VARCHAR(20) CHECK (segment IN ('compact', 'midsize', 'fullsize', 'luxury')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 실제 차량 매물 테이블 (핵심)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,

    -- 기본 정보
    brand_id INTEGER REFERENCES brands(id),
    model_id INTEGER REFERENCES models(id),
    year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2025),
    price INTEGER NOT NULL CHECK (price > 0), -- 만원 단위
    mileage INTEGER NOT NULL CHECK (mileage >= 0), -- km

    -- 차량 사양
    body_type VARCHAR(20) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic', 'cvt')),
    engine_displacement INTEGER, -- cc
    fuel_efficiency DECIMAL(4,1), -- km/L 또는 km/kWh
    seating_capacity INTEGER CHECK (seating_capacity BETWEEN 2 AND 9),

    -- 안전 및 등급
    safety_rating DECIMAL(2,1) CHECK (safety_rating BETWEEN 1.0 AND 5.0),
    emission_grade INTEGER CHECK (emission_grade BETWEEN 1 AND 6),

    -- 상태 정보
    accident_history BOOLEAN DEFAULT FALSE,
    flood_damage BOOLEAN DEFAULT FALSE,
    owner_count INTEGER DEFAULT 1 CHECK (owner_count >= 1),

    -- 위치 및 판매자
    region VARCHAR(50) NOT NULL,
    dealer_type VARCHAR(20) CHECK (dealer_type IN ('individual', 'dealer', 'certified')),

    -- 추가 기능 (JSON으로 저장)
    features JSONB DEFAULT '[]',

    -- 메타데이터
    listing_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_available BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,

    -- 인덱스용 계산 컬럼
    value_score DECIMAL(5,2), -- 가성비 점수 (0-100)
    popularity_score DECIMAL(5,2), -- 인기도 점수 (0-100)

    -- 제약조건
    CONSTRAINT valid_price_year CHECK (
        (year >= 2020 AND price >= 1000) OR
        (year >= 2015 AND price >= 500) OR
        (year >= 2010 AND price >= 200)
    )
);

-- 사용자 선호도 및 검색 이력 테이블
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,

    -- 기본 조건
    budget_min INTEGER,
    budget_max INTEGER,
    preferred_brands INTEGER[] DEFAULT '{}',
    preferred_body_types VARCHAR(20)[] DEFAULT '{}',
    preferred_fuel_types VARCHAR(20)[] DEFAULT '{}',

    -- 우선순위 (0.0-1.0)
    price_priority DECIMAL(3,2) DEFAULT 0.4,
    fuel_efficiency_priority DECIMAL(3,2) DEFAULT 0.3,
    safety_priority DECIMAL(3,2) DEFAULT 0.2,
    performance_priority DECIMAL(3,2) DEFAULT 0.05,
    design_priority DECIMAL(3,2) DEFAULT 0.05,

    -- 사용자 정보
    family_size INTEGER,
    age INTEGER,
    income INTEGER, -- 만원 단위
    region VARCHAR(50),
    credit_score INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 실제 차량 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_body_type ON vehicles(body_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_region ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_composite ON vehicles(price, body_type, fuel_type, is_available);

-- 사용자 맞춤 추천을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_vehicles_recommendation ON vehicles(
    price, body_type, fuel_type, year, safety_rating, fuel_efficiency
) WHERE is_available = true;

-- 가성비 점수 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_value_score()
RETURNS TRIGGER AS $$
BEGIN
    -- 단순한 가성비 점수 계산 (년도, 가격, 주행거리 기반)
    NEW.value_score := (
        (NEW.year - 2000) * 2 +  -- 년도 점수 (최대 50점)
        CASE
            WHEN NEW.price <= 1000 THEN 30
            WHEN NEW.price <= 3000 THEN 25
            WHEN NEW.price <= 5000 THEN 20
            ELSE 10
        END + -- 가격 점수 (최대 30점)
        CASE
            WHEN NEW.mileage <= 30000 THEN 20
            WHEN NEW.mileage <= 100000 THEN 15
            WHEN NEW.mileage <= 200000 THEN 10
            ELSE 5
        END -- 주행거리 점수 (최대 20점)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_value_score
    BEFORE INSERT OR UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_value_score();

-- 기본 브랜드 데이터 삽입
INSERT INTO brands (name, country, premium_tier) VALUES
('현대', '한국', 1),
('기아', '한국', 1),
('제네시스', '한국', 3),
('삼성', '한국', 2),
('쌍용', '한국', 1),
('BMW', '독일', 3),
('벤츠', '독일', 3),
('아우디', '독일', 3),
('폭스바겐', '독일', 2),
('토요타', '일본', 2),
('혼다', '일본', 2),
('닛산', '일본', 2),
('테슬라', '미국', 3),
('쉐보레', '미국', 1),
('포드', '미국', 2)
ON CONFLICT (name) DO NOTHING;

-- 인기 모델 데이터 삽입
INSERT INTO models (brand_id, name, body_type, fuel_type, segment) VALUES
-- 현대
(1, '아반떼', 'sedan', 'gasoline', 'compact'),
(1, '쏘나타', 'sedan', 'gasoline', 'midsize'),
(1, '그랜저', 'sedan', 'gasoline', 'fullsize'),
(1, '투싼', 'suv', 'gasoline', 'compact'),
(1, '싼타페', 'suv', 'gasoline', 'midsize'),
(1, '팰리세이드', 'suv', 'gasoline', 'fullsize'),

-- 기아
(2, 'K3', 'sedan', 'gasoline', 'compact'),
(2, 'K5', 'sedan', 'gasoline', 'midsize'),
(2, 'K9', 'sedan', 'gasoline', 'luxury'),
(2, '스포티지', 'suv', 'gasoline', 'compact'),
(2, '쏘렌토', 'suv', 'gasoline', 'midsize'),
(2, '모하비', 'suv', 'gasoline', 'fullsize'),

-- 제네시스
(3, 'G70', 'sedan', 'gasoline', 'luxury'),
(3, 'G80', 'sedan', 'gasoline', 'luxury'),
(3, 'G90', 'sedan', 'gasoline', 'luxury'),
(3, 'GV70', 'suv', 'gasoline', 'luxury'),
(3, 'GV80', 'suv', 'gasoline', 'luxury'),

-- BMW
(6, '3시리즈', 'sedan', 'gasoline', 'luxury'),
(6, '5시리즈', 'sedan', 'gasoline', 'luxury'),
(6, 'X3', 'suv', 'gasoline', 'luxury'),
(6, 'X5', 'suv', 'gasoline', 'luxury'),

-- 테슬라
(13, 'Model 3', 'sedan', 'electric', 'luxury'),
(13, 'Model S', 'sedan', 'electric', 'luxury'),
(13, 'Model Y', 'suv', 'electric', 'luxury')
ON CONFLICT DO NOTHING;