-- 실제 중고차 시장을 반영한 차량 매물 데이터
-- 엔카, 카24 등의 실제 시세를 반영한 현실적인 데이터

-- 실제 차량 매물 데이터 삽입
INSERT INTO vehicles (
    brand_id, model_id, year, price, mileage,
    body_type, fuel_type, transmission, engine_displacement, fuel_efficiency, seating_capacity,
    safety_rating, emission_grade, accident_history, flood_damage, owner_count,
    region, dealer_type, features, listing_date
) VALUES

-- 현대 차량들 (실제 시세 반영)
(1, 1, 2022, 2180, 45000, 'sedan', 'gasoline', 'automatic', 1600, 13.2, 5, 5.0, 5, false, false, 1, '서울', 'dealer',
 '["스마트키", "후방카메라", "블루투스", "에어컨"]', '2024-12-01'),

(1, 2, 2021, 2850, 62000, 'sedan', 'hybrid', 'automatic', 2000, 16.4, 5, 5.0, 4, false, false, 1, '경기', 'certified',
 '["하이브리드", "스마트크루즈", "차선유지", "자동주차"]', '2024-11-28'),

(1, 3, 2020, 3200, 78000, 'sedan', 'gasoline', 'automatic', 3300, 9.8, 5, 5.0, 4, false, false, 2, '인천', 'dealer',
 '["가죽시트", "선루프", "HID헤드램프", "메모리시트"]', '2024-11-25'),

(1, 4, 2023, 2950, 28000, 'suv', 'gasoline', 'automatic', 2000, 11.5, 5, 5.0, 5, false, false, 1, '서울', 'certified',
 '["스마트센스", "LED라이트", "무선충전", "360도카메라"]', '2024-12-02'),

(1, 5, 2022, 3680, 41000, 'suv', 'gasoline', 'automatic', 2500, 10.2, 7, 5.0, 4, false, false, 1, '부산', 'dealer',
 '["7인승", "스마트트렁크", "블라인드스팟", "후측방경보"]', '2024-11-30'),

(1, 6, 2021, 4250, 55000, 'suv', 'gasoline', 'automatic', 3800, 8.9, 8, 5.0, 4, false, false, 1, '경기', 'certified',
 '["8인승", "2열캡틴시트", "프리미엄사운드", "에어서스펜션"]', '2024-11-27'),

-- 기아 차량들
(2, 7, 2022, 2090, 38000, 'sedan', 'gasoline', 'automatic', 1600, 13.8, 5, 5.0, 5, false, false, 1, '서울', 'dealer',
 '["스마트키", "후방카메라", "크루즈컨트롤"]', '2024-12-01'),

(2, 8, 2021, 2750, 59000, 'sedan', 'gasoline', 'automatic', 2000, 11.9, 5, 5.0, 4, false, false, 1, '대구', 'individual',
 '["터보엔진", "스포츠모드", "파노라마선루프"]', '2024-11-29'),

(2, 11, 2020, 2890, 71000, 'suv', 'gasoline', 'automatic', 2000, 10.8, 5, 5.0, 4, false, false, 2, '광주', 'dealer',
 '["AWD", "스마트파워테일게이트", "헤드업디스플레이"]', '2024-11-26'),

(2, 12, 2021, 3980, 47000, 'suv', 'hybrid', 'automatic', 2200, 13.2, 7, 5.0, 4, false, false, 1, '경기', 'certified',
 '["하이브리드", "7인승", "전방충돌방지", "차선변경보조"]', '2024-11-28'),

-- 제네시스 프리미엄 차량들
(3, 15, 2022, 4580, 32000, 'sedan', 'gasoline', 'automatic', 2000, 10.5, 5, 5.0, 4, false, false, 1, '서울', 'certified',
 '["제네시스페이스", "나파가죽", "마크레빈슨", "에어서스펜션"]', '2024-12-01'),

(3, 16, 2021, 5890, 28000, 'sedan', 'gasoline', 'automatic', 3300, 9.2, 5, 5.0, 4, false, false, 1, '서울', 'dealer',
 '["V6터보", "제네시스페이스", "세미아닐린가죽", "12.3인치디스플레이"]', '2024-11-30'),

(3, 18, 2022, 5250, 35000, 'suv', 'gasoline', 'automatic', 2500, 9.8, 5, 5.0, 4, false, false, 1, '경기', 'certified',
 '["프리미엄패키지", "3D클러스터", "뱅앤올룹슨", "에어서스펜션"]', '2024-11-27'),

-- BMW 수입차
(6, 21, 2021, 4890, 42000, 'sedan', 'gasoline', 'automatic', 2000, 11.2, 5, 4.5, 4, false, false, 1, '서울', 'certified',
 '["M스포츠패키지", "하만카돈", "제스처컨트롤", "어댑티브LED"]', '2024-11-29'),

(6, 23, 2020, 5680, 58000, 'suv', 'gasoline', 'automatic', 2000, 10.1, 5, 4.5, 4, false, false, 2, '경기', 'dealer',
 '["xDrive", "M스포츠", "파노라마선루프", "하레드업디스플레이"]', '2024-11-25'),

-- 테슬라 전기차
(13, 25, 2023, 5990, 15000, 'sedan', 'electric', 'automatic', 0, 5.2, 5, 5.0, 1, false, false, 1, '서울', 'certified',
 '["오토파일럿", "슈퍼차징", "프리미엄오디오", "OTA업데이트"]', '2024-12-02'),

(13, 27, 2022, 7450, 22000, 'suv', 'electric', 'automatic', 0, 4.8, 7, 5.0, 1, false, false, 1, '경기', 'dealer',
 '["7인승", "팰컨윙도어", "오토파일럿", "22인치휠"]', '2024-11-28'),

-- 다양한 가격대의 실용적인 차량들 추가
(1, 1, 2019, 1650, 89000, 'sedan', 'gasoline', 'automatic', 1600, 12.8, 5, 5.0, 4, false, false, 2, '부산', 'individual',
 '["기본옵션", "후방카메라", "블루투스"]', '2024-11-24'),

(2, 7, 2018, 1420, 105000, 'sedan', 'gasoline', 'manual', 1600, 14.2, 5, 4.5, 4, false, false, 2, '대구', 'individual',
 '["수동변속기", "기본옵션"]', '2024-11-23'),

(1, 4, 2020, 2380, 67000, 'suv', 'gasoline', 'automatic', 2000, 11.1, 5, 5.0, 4, false, false, 1, '광주', 'dealer',
 '["스마트센스", "루프랙", "사이드스텝"]', '2024-11-26'),

-- 프리미엄 중고차들
(6, 22, 2019, 4250, 68000, 'sedan', 'gasoline', 'automatic', 3000, 9.5, 5, 4.5, 4, false, false, 2, '서울', 'certified',
 '["M스포츠", "하만카돈", "어댑티브크루즈"]', '2024-11-25'),

-- 실용성 위주 차량들
(1, 2, 2020, 2450, 72000, 'sedan', 'gasoline', 'automatic', 2000, 12.4, 5, 5.0, 4, false, false, 1, '인천', 'dealer',
 '["스마트키", "후방카메라", "오토라이트"]', '2024-11-27'),

(2, 11, 2019, 2150, 85000, 'suv', 'gasoline', 'automatic', 2000, 10.5, 5, 5.0, 4, false, false, 2, '경기', 'individual',
 '["AWD", "루프박스", "견인후크"]', '2024-11-24'),

-- 하이브리드 차량들
(1, 2, 2022, 3180, 35000, 'sedan', 'hybrid', 'automatic', 2000, 16.8, 5, 5.0, 4, false, false, 1, '서울', 'certified',
 '["하이브리드", "ECO모드", "회생제동", "디지털클러스터"]', '2024-12-01'),

(2, 12, 2020, 3250, 58000, 'suv', 'hybrid', 'automatic', 2200, 12.8, 7, 5.0, 4, false, false, 1, '부산', 'dealer',
 '["하이브리드", "7인승", "스마트파킹"]', '2024-11-26'),

-- 전기차 추가
(13, 25, 2022, 5280, 28000, 'sedan', 'electric', 'automatic', 0, 5.0, 5, 5.0, 1, false, false, 1, '경기', 'certified',
 '["오토파일럿", "슈퍼차징", "모바일커넥터"]', '2024-11-29'),

-- 경제적인 소형차들
(1, 1, 2021, 1950, 52000, 'sedan', 'gasoline', 'automatic', 1600, 13.5, 5, 5.0, 5, false, false, 1, '대전', 'dealer',
 '["스마트키", "후방카메라", "크루즈컨트롤"]', '2024-11-28'),

(2, 7, 2020, 1780, 63000, 'sedan', 'gasoline', 'automatic', 1600, 13.9, 5, 5.0, 4, false, false, 1, '울산', 'individual',
 '["기본옵션", "에어컨", "파워윈도우"]', '2024-11-25'),

-- SUV 다양화
(1, 5, 2021, 3420, 48000, 'suv', 'gasoline', 'automatic', 2500, 10.0, 7, 5.0, 4, false, false, 1, '서울', 'certified',
 '["7인승", "파노라마선루프", "전방충돌방지"]', '2024-11-30'),

(2, 13, 2019, 4180, 72000, 'suv', 'gasoline', 'automatic', 3000, 8.9, 7, 4.5, 4, false, false, 2, '부산', 'dealer',
 '["7인승", "AWD", "견인능력"]', '2024-11-24'),

-- 사고차량 (투명하게 공개)
(1, 4, 2021, 2180, 55000, 'suv', 'gasoline', 'automatic', 2000, 11.3, 5, 5.0, 4, true, false, 1, '인천', 'individual',
 '["경미한사고이력", "수리완료", "성능점검필"]', '2024-11-23'),

-- 고급 세단들
(3, 17, 2020, 8950, 45000, 'sedan', 'gasoline', 'automatic', 5000, 7.8, 5, 5.0, 4, false, false, 1, '서울', 'certified',
 '["V8엔진", "제네시스페이스", "세미아닐린가죽", "12.3인치네비"]', '2024-11-27'),

-- 실속형 패밀리카
(1, 3, 2019, 2850, 78000, 'sedan', 'gasoline', 'automatic', 2400, 10.5, 5, 5.0, 4, false, false, 2, '경기', 'dealer',
 '["가죽시트", "선루프", "후방모니터"]', '2024-11-26');

-- 인기도 점수 업데이트 (조회수 기반 시뮬레이션)
UPDATE vehicles SET
    views_count = FLOOR(RANDOM() * 500) + 50,
    popularity_score = CASE
        WHEN year >= 2022 THEN RANDOM() * 30 + 70
        WHEN year >= 2020 THEN RANDOM() * 25 + 60
        WHEN year >= 2018 THEN RANDOM() * 20 + 45
        ELSE RANDOM() * 15 + 30
    END;

-- 사용자 선호도 샘플 데이터
INSERT INTO user_preferences (
    user_id, budget_min, budget_max, preferred_brands, preferred_body_types, preferred_fuel_types,
    price_priority, fuel_efficiency_priority, safety_priority, performance_priority, design_priority,
    family_size, age, income, region, credit_score
) VALUES
('user_1701234567890', 2000, 4000, '{1,2}', '{"suv","sedan"}', '{"gasoline","hybrid"}',
 0.4, 0.3, 0.2, 0.05, 0.05, 4, 35, 6000, '서울', 750),

('user_1701234567891', 3000, 6000, '{3,6}', '{"sedan"}', '{"gasoline"}',
 0.2, 0.1, 0.3, 0.3, 0.1, 2, 42, 12000, '경기', 800),

('guest_1701234567892', 1500, 3000, '{1,2}', '{"suv","hatchback"}', '{"gasoline","hybrid"}',
 0.5, 0.3, 0.15, 0.03, 0.02, 3, 28, 4500, '부산', 680);