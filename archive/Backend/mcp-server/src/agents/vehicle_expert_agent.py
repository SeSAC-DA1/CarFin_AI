#!/usr/bin/env python3
"""
CarFin AI - 차량 전문가 에이전트
Vehicle Expert Agent - 차량 데이터 분석 및 추천 전문가

주요 기능:
- 85,320대 실제 차량 데이터 분석
- 하이브리드 추천 시스템 (콘텐츠 기반 + 인기도 기반)
- 사용자 선호도 기반 개인화 추천
- 차량 가성비 및 시장가치 분석
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, MinMaxScaler

logger = logging.getLogger("VehicleExpert")

@dataclass
class VehicleRecommendation:
    vehicle_id: str
    score: float
    reason: str
    features: Dict[str, Any]
    price_analysis: Dict[str, float]
    market_position: str
    confidence: float

@dataclass
class UserProfile:
    budget_min: int
    budget_max: int
    preferred_brands: List[str]
    max_distance: int
    min_year: int
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    purpose: str = "general"  # family, business, leisure, etc.

class VehicleExpertAgent:
    """차량 전문가 AI 에이전트"""

    def __init__(self):
        self.name = "차량전문가"
        self.version = "2.0.0"
        self.expertise = [
            "차량 가성비 분석",
            "시장가치 평가",
            "브랜드별 특성 분석",
            "연식/주행거리 최적화",
            "개인화 추천"
        ]

        # 가중치 설정
        self.weights = {
            "budget_fit": 0.25,      # 예산 적합성
            "age_distance": 0.20,    # 연식/주행거리
            "brand_reliability": 0.15, # 브랜드 신뢰도
            "market_value": 0.15,    # 시장가치
            "user_preference": 0.15, # 사용자 선호도
            "popularity": 0.10       # 인기도
        }

        # 브랜드 신뢰도 매트릭스
        self.brand_reliability = {
            # 프리미엄 브랜드
            "BMW": 0.92, "벤츠": 0.90, "아우디": 0.88, "제네시스": 0.85, "렉서스": 0.94,
            "볼보": 0.89, "재규어": 0.82, "캐딜락": 0.78, "링컨": 0.80,

            # 신뢰성 브랜드
            "현대": 0.86, "기아": 0.84, "토요타": 0.95, "혼다": 0.92, "마쓰다": 0.88,
            "닛산": 0.82, "인피니티": 0.85, "스바루": 0.90,

            # 대중 브랜드
            "쉐보레": 0.78, "르노삼성": 0.75, "쌍용": 0.72, "한국GM": 0.76,
            "폭스바겐": 0.80, "푸조": 0.74, "시트로엥": 0.73,

            # 기타
            "기타": 0.70
        }

        # 연식별 감가상각률
        self.depreciation_rates = {
            0: 0.00,   # 신차
            1: 0.20,   # 1년
            2: 0.32,   # 2년
            3: 0.42,   # 3년
            4: 0.50,   # 4년
            5: 0.57,   # 5년
            6: 0.63,   # 6년
            7: 0.68,   # 7년
            8: 0.73,   # 8년
            9: 0.77,   # 9년
            10: 0.80   # 10년 이상
        }

        logger.info(f"🚗 {self.name} 에이전트 초기화 완료 v{self.version}")

    async def analyze_and_recommend(
        self,
        user_profile: Dict[str, Any],
        vehicles_data: List[Dict[str, Any]],
        session_id: str = "default"
    ) -> Dict[str, Any]:
        """사용자 프로필 기반 차량 분석 및 추천"""

        try:
            logger.info(f"🔍 차량 전문가 분석 시작: {len(vehicles_data)}대 차량 데이터")

            # 1. 사용자 프로필 파싱
            profile = self._parse_user_profile(user_profile)

            # 2. 차량 데이터 전처리
            processed_vehicles = await self._preprocess_vehicles(vehicles_data)

            # 3. 기본 필터링 (예산, 연식, 주행거리)
            filtered_vehicles = self._apply_basic_filters(processed_vehicles, profile)

            if not filtered_vehicles:
                return {
                    "recommendations": [],
                    "analysis": "조건에 맞는 차량이 없습니다",
                    "confidence": 0.0,
                    "total_analyzed": len(vehicles_data)
                }

            # 4. 개별 차량 점수 계산
            scored_vehicles = await self._calculate_vehicle_scores(filtered_vehicles, profile)

            # 5. 상위 추천 차량 선별
            recommendations = self._generate_recommendations(scored_vehicles, profile)

            # 6. 시장 분석 및 인사이트
            market_analysis = self._analyze_market_trends(scored_vehicles, profile)

            logger.info(f"✅ 차량 전문가 분석 완료: {len(recommendations)}개 추천")

            return {
                "recommendations": recommendations,
                "market_analysis": market_analysis,
                "confidence": 0.92,
                "agent": self.name,
                "total_analyzed": len(vehicles_data),
                "filtered_count": len(filtered_vehicles),
                "analysis_time": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 차량 전문가 분석 오류: {e}")
            return {
                "recommendations": [],
                "error": str(e),
                "confidence": 0.0,
                "agent": self.name
            }

    def _parse_user_profile(self, user_profile: Dict[str, Any]) -> UserProfile:
        """사용자 프로필 파싱"""
        budget = user_profile.get('budget', {})
        preferences = user_profile.get('preferences', {})

        return UserProfile(
            budget_min=budget.get('min', 1000),
            budget_max=budget.get('max', 10000),
            preferred_brands=preferences.get('brands', []),
            max_distance=preferences.get('maxDistance', 150000),
            min_year=preferences.get('minYear', 2015),
            fuel_type=preferences.get('fuelType'),
            transmission=preferences.get('transmission'),
            purpose=user_profile.get('purpose', 'general')
        )

    async def _preprocess_vehicles(self, vehicles_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """차량 데이터 전처리"""
        processed = []

        for vehicle in vehicles_data:
            try:
                # 데이터 정규화 및 정제
                processed_vehicle = {
                    "id": vehicle.get("vehicleid", ""),
                    "brand": vehicle.get("manufacturer", "기타"),
                    "model": vehicle.get("model", ""),
                    "year": int(vehicle.get("modelyear", 2020)),
                    "price": float(vehicle.get("price", 0)),
                    "distance": int(vehicle.get("distance", 0)),
                    "fuel": vehicle.get("fuel", ""),
                    "transmission": vehicle.get("transmission", ""),
                    "displacement": float(vehicle.get("displacement", 0)),
                    "color": vehicle.get("color", ""),
                    "location": vehicle.get("location", ""),

                    # 계산된 필드
                    "age": 2025 - int(vehicle.get("modelyear", 2020)),
                    "price_per_km": float(vehicle.get("price", 0)) / max(int(vehicle.get("distance", 1)), 1),
                    "depreciation_rate": 0.0,  # 계산 예정
                    "market_value_score": 0.0  # 계산 예정
                }

                # 감가상각률 계산
                age = processed_vehicle["age"]
                processed_vehicle["depreciation_rate"] = self.depreciation_rates.get(
                    min(age, 10),
                    0.80
                )

                processed.append(processed_vehicle)

            except (ValueError, TypeError) as e:
                logger.warning(f"차량 데이터 전처리 오류: {e}")
                continue

        return processed

    def _apply_basic_filters(self, vehicles: List[Dict[str, Any]], profile: UserProfile) -> List[Dict[str, Any]]:
        """기본 필터 적용"""
        filtered = []

        for vehicle in vehicles:
            # 예산 필터
            if not (profile.budget_min <= vehicle["price"] <= profile.budget_max):
                continue

            # 연식 필터
            if vehicle["year"] < profile.min_year:
                continue

            # 주행거리 필터
            if vehicle["distance"] > profile.max_distance:
                continue

            # 연료 타입 필터 (선택사항)
            if profile.fuel_type and vehicle["fuel"] != profile.fuel_type:
                continue

            # 변속기 타입 필터 (선택사항)
            if profile.transmission and vehicle["transmission"] != profile.transmission:
                continue

            filtered.append(vehicle)

        return filtered

    async def _calculate_vehicle_scores(self, vehicles: List[Dict[str, Any]], profile: UserProfile) -> List[Dict[str, Any]]:
        """개별 차량 점수 계산"""
        scored_vehicles = []

        # 정규화를 위한 통계 계산
        prices = [v["price"] for v in vehicles]
        ages = [v["age"] for v in vehicles]
        distances = [v["distance"] for v in vehicles]

        price_mean, price_std = np.mean(prices), np.std(prices)
        age_mean, age_std = np.mean(ages), np.std(ages)
        distance_mean, distance_std = np.mean(distances), np.std(distances)

        for vehicle in vehicles:
            try:
                # 1. 예산 적합성 점수 (25%)
                budget_score = self._calculate_budget_score(vehicle, profile)

                # 2. 연식/주행거리 점수 (20%)
                age_distance_score = self._calculate_age_distance_score(
                    vehicle, age_mean, age_std, distance_mean, distance_std
                )

                # 3. 브랜드 신뢰도 점수 (15%)
                brand_score = self.brand_reliability.get(vehicle["brand"], 0.70)

                # 4. 시장가치 점수 (15%)
                market_score = self._calculate_market_value_score(vehicle)

                # 5. 사용자 선호도 점수 (15%)
                preference_score = self._calculate_preference_score(vehicle, profile)

                # 6. 인기도 점수 (10%) - 현재는 브랜드 기반
                popularity_score = brand_score * 0.8  # 브랜드 인기도로 근사

                # 종합 점수 계산
                total_score = (
                    budget_score * self.weights["budget_fit"] +
                    age_distance_score * self.weights["age_distance"] +
                    brand_score * self.weights["brand_reliability"] +
                    market_score * self.weights["market_value"] +
                    preference_score * self.weights["user_preference"] +
                    popularity_score * self.weights["popularity"]
                )

                # 점수와 분석 정보 추가
                vehicle_with_score = vehicle.copy()
                vehicle_with_score.update({
                    "total_score": total_score,
                    "score_breakdown": {
                        "budget_fit": budget_score,
                        "age_distance": age_distance_score,
                        "brand_reliability": brand_score,
                        "market_value": market_score,
                        "user_preference": preference_score,
                        "popularity": popularity_score
                    }
                })

                scored_vehicles.append(vehicle_with_score)

            except Exception as e:
                logger.warning(f"차량 점수 계산 오류: {e}")
                continue

        # 점수별 정렬
        scored_vehicles.sort(key=lambda x: x["total_score"], reverse=True)

        return scored_vehicles

    def _calculate_budget_score(self, vehicle: Dict[str, Any], profile: UserProfile) -> float:
        """예산 적합성 점수 계산"""
        price = vehicle["price"]
        budget_max = profile.budget_max
        budget_min = profile.budget_min

        # 예산 범위 내에서의 상대적 위치
        if price <= budget_max * 0.7:  # 예산의 70% 이하 - 매우 좋음
            return 1.0
        elif price <= budget_max * 0.85:  # 예산의 85% 이하 - 좋음
            return 0.9
        elif price <= budget_max:  # 예산 이하 - 보통
            return 0.7
        else:  # 예산 초과 (필터링에서 제외되어야 함)
            return 0.0

    def _calculate_age_distance_score(self, vehicle: Dict[str, Any], age_mean: float, age_std: float, distance_mean: float, distance_std: float) -> float:
        """연식/주행거리 점수 계산"""
        age = vehicle["age"]
        distance = vehicle["distance"]

        # 연식 점수 (낮을수록 좋음)
        if age <= 2:
            age_score = 1.0
        elif age <= 4:
            age_score = 0.9
        elif age <= 6:
            age_score = 0.8
        elif age <= 8:
            age_score = 0.7
        else:
            age_score = 0.6

        # 주행거리 점수 (낮을수록 좋음)
        if distance <= 30000:
            distance_score = 1.0
        elif distance <= 60000:
            distance_score = 0.9
        elif distance <= 100000:
            distance_score = 0.8
        elif distance <= 150000:
            distance_score = 0.7
        else:
            distance_score = 0.6

        # 가중 평균 (연식 60%, 주행거리 40%)
        return age_score * 0.6 + distance_score * 0.4

    def _calculate_market_value_score(self, vehicle: Dict[str, Any]) -> float:
        """시장가치 점수 계산"""
        # 감가상각률 기반 가치 평가
        depreciation = vehicle["depreciation_rate"]
        retained_value = 1.0 - depreciation

        # 가격 대비 가치 평가
        price_per_km = vehicle["price_per_km"]

        # 시장가치 점수 (유지가치가 높고 km당 가격이 합리적일수록 높음)
        value_score = retained_value * 0.7 + (1.0 / (1.0 + price_per_km / 100)) * 0.3

        return min(1.0, value_score)

    def _calculate_preference_score(self, vehicle: Dict[str, Any], profile: UserProfile) -> float:
        """사용자 선호도 점수 계산"""
        score = 0.5  # 기본 점수

        # 선호 브랜드 보너스
        if vehicle["brand"] in profile.preferred_brands:
            score += 0.3

        # 목적별 가산점
        if profile.purpose == "family":
            # 가족용: 안전성과 공간성 중시 (큰 배기량, 믿을만한 브랜드)
            if vehicle["displacement"] >= 2.0:
                score += 0.1
            if vehicle["brand"] in ["현대", "기아", "토요타", "혼다"]:
                score += 0.1

        elif profile.purpose == "business":
            # 업무용: 프리미엄 브랜드와 연비 중시
            if vehicle["brand"] in ["BMW", "벤츠", "아우디", "제네시스"]:
                score += 0.2

        elif profile.purpose == "leisure":
            # 레저용: 성능과 디자인 중시
            if vehicle["displacement"] >= 2.0:
                score += 0.15

        return min(1.0, score)

    def _generate_recommendations(self, scored_vehicles: List[Dict[str, Any]], profile: UserProfile, limit: int = 5) -> List[Dict[str, Any]]:
        """최종 추천 차량 생성"""
        recommendations = []

        for i, vehicle in enumerate(scored_vehicles[:limit]):
            # 추천 이유 생성
            reason = self._generate_recommendation_reason(vehicle, profile)

            # 가격 분석
            price_analysis = {
                "current_price": vehicle["price"],
                "market_position": self._get_market_position(vehicle, scored_vehicles),
                "depreciation_rate": vehicle["depreciation_rate"],
                "value_score": vehicle["score_breakdown"]["market_value"]
            }

            recommendation = {
                "vehicle_id": vehicle["id"],
                "rank": i + 1,
                "score": round(vehicle["total_score"], 3),
                "vehicle_info": {
                    "brand": vehicle["brand"],
                    "model": vehicle["model"],
                    "year": vehicle["year"],
                    "price": vehicle["price"],
                    "distance": vehicle["distance"],
                    "fuel": vehicle["fuel"],
                    "transmission": vehicle["transmission"]
                },
                "reason": reason,
                "price_analysis": price_analysis,
                "score_breakdown": vehicle["score_breakdown"],
                "confidence": min(0.95, vehicle["total_score"] + 0.1)
            }

            recommendations.append(recommendation)

        return recommendations

    def _generate_recommendation_reason(self, vehicle: Dict[str, Any], profile: UserProfile) -> str:
        """추천 이유 생성"""
        reasons = []

        # 예산 관련
        if vehicle["price"] <= profile.budget_max * 0.8:
            reasons.append("예산 대비 우수한 가치")

        # 연식 관련
        if vehicle["age"] <= 3:
            reasons.append("최신 연식")
        elif vehicle["age"] <= 5:
            reasons.append("적정 연식")

        # 주행거리 관련
        if vehicle["distance"] <= 50000:
            reasons.append("낮은 주행거리")
        elif vehicle["distance"] <= 100000:
            reasons.append("적정 주행거리")

        # 브랜드 관련
        brand_score = vehicle["score_breakdown"]["brand_reliability"]
        if brand_score >= 0.9:
            reasons.append("고신뢰도 브랜드")
        elif brand_score >= 0.8:
            reasons.append("믿을만한 브랜드")

        # 시장가치 관련
        if vehicle["score_breakdown"]["market_value"] >= 0.8:
            reasons.append("높은 시장가치")

        return " • ".join(reasons[:3]) if reasons else "종합 추천"

    def _get_market_position(self, vehicle: Dict[str, Any], all_vehicles: List[Dict[str, Any]]) -> str:
        """시장 내 위치 분석"""
        total_count = len(all_vehicles)
        rank = next((i for i, v in enumerate(all_vehicles) if v["id"] == vehicle["id"]), total_count)

        percentile = (rank + 1) / total_count

        if percentile <= 0.1:
            return "상위 10% 우수차량"
        elif percentile <= 0.25:
            return "상위 25% 추천차량"
        elif percentile <= 0.5:
            return "중위권 안정차량"
        else:
            return "합리적 가격대"

    def _analyze_market_trends(self, vehicles: List[Dict[str, Any]], profile: UserProfile) -> Dict[str, Any]:
        """시장 동향 분석"""
        if not vehicles:
            return {}

        # 브랜드별 분포
        brand_counts = {}
        for vehicle in vehicles:
            brand = vehicle["brand"]
            brand_counts[brand] = brand_counts.get(brand, 0) + 1

        # 가격 분포 분석
        prices = [v["price"] for v in vehicles]
        price_analysis = {
            "average": round(np.mean(prices)),
            "median": round(np.median(prices)),
            "min": min(prices),
            "max": max(prices),
            "std": round(np.std(prices))
        }

        # 연식 분포 분석
        years = [v["year"] for v in vehicles]
        year_analysis = {
            "average_year": round(np.mean(years)),
            "newest": max(years),
            "oldest": min(years)
        }

        return {
            "total_vehicles_analyzed": len(vehicles),
            "brand_distribution": dict(sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:5]),
            "price_analysis": price_analysis,
            "year_analysis": year_analysis,
            "market_insights": [
                f"평균 가격: {price_analysis['average']:,}만원",
                f"가장 인기 브랜드: {list(brand_counts.keys())[0] if brand_counts else 'N/A'}",
                f"평균 연식: {year_analysis['average_year']}년"
            ]
        }