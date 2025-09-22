#!/usr/bin/env python3
"""
CarFin AI - 금융 분석가 에이전트
Finance Expert Agent - 차량 금융 및 경제성 분석 전문가

주요 기능:
- 차량 구매 금융 옵션 분석 (현금/할부/리스)
- 총 소유비용(TCO) 계산
- 감가상각 및 미래가치 예측
- 개인 재정 상황 기반 맞춤 금융 솔루션
- 리스크 분석 및 투자 수익률 계산
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from enum import Enum

logger = logging.getLogger("FinanceExpert")

class FinanceOption(Enum):
    CASH = "현금구매"
    INSTALLMENT = "할부금융"
    LEASE = "리스"
    LOAN = "대출"

@dataclass
class FinancialProfile:
    monthly_income: int
    existing_debt: int
    credit_score: int
    savings: int
    monthly_expense: int
    investment_appetite: str  # conservative, moderate, aggressive

@dataclass
class FinanceAnalysis:
    option_type: FinanceOption
    total_cost: float
    monthly_payment: float
    interest_rate: float
    loan_term: int
    down_payment: float
    residual_value: Optional[float]
    roi: float
    risk_score: float
    recommendation_score: float

class FinanceExpertAgent:
    """금융 분석가 AI 에이전트"""

    def __init__(self):
        self.name = "금융분석가"
        self.version = "2.0.0"
        self.expertise = [
            "차량 금융 옵션 분석",
            "총 소유비용(TCO) 계산",
            "감가상각 예측",
            "개인 재정 맞춤 솔루션",
            "투자 수익률 분석"
        ]

        # 금융 상품 기본 금리 (2025년 기준)
        self.interest_rates = {
            FinanceOption.CASH: 0.0,
            FinanceOption.INSTALLMENT: 0.045,  # 4.5%
            FinanceOption.LEASE: 0.038,        # 3.8%
            FinanceOption.LOAN: 0.055          # 5.5%
        }

        # 신용등급별 금리 할인/할증
        self.credit_adjustments = {
            "excellent": -0.01,    # 1% 할인
            "good": 0.0,          # 기본
            "fair": 0.01,         # 1% 할증
            "poor": 0.025         # 2.5% 할증
        }

        # 브랜드별 잔존가치율 (3년 후)
        self.residual_values = {
            "렉서스": 0.65, "토요타": 0.62, "제네시스": 0.58, "BMW": 0.60,
            "벤츠": 0.58, "아우디": 0.56, "현대": 0.55, "기아": 0.53,
            "볼보": 0.54, "혼다": 0.57, "마쓰다": 0.52, "닛산": 0.50,
            "쉐보레": 0.45, "르노삼성": 0.42, "쌍용": 0.40, "기타": 0.45
        }

        # 차량 유지비 (월간, 만원)
        self.maintenance_costs = {
            "premium": 15,      # 프리미엄 브랜드
            "standard": 10,     # 일반 브랜드
            "economy": 8        # 경제형 브랜드
        }

        logger.info(f"💰 {self.name} 에이전트 초기화 완료 v{self.version}")

    async def analyze_and_recommend(
        self,
        user_profile: Dict[str, Any],
        vehicle: Dict[str, Any],
        session_id: str = "default"
    ) -> Dict[str, Any]:
        """차량별 금융 분석 및 추천"""

        try:
            logger.info(f"💳 금융 분석 시작: {vehicle.get('brand', 'Unknown')} {vehicle.get('model', '')}")

            # 1. 사용자 재정 프로필 파싱
            financial_profile = self._parse_financial_profile(user_profile)

            # 2. 차량 정보 분석
            vehicle_info = self._analyze_vehicle_financials(vehicle)

            # 3. 금융 옵션별 분석
            finance_options = await self._analyze_finance_options(
                vehicle_info, financial_profile
            )

            # 4. 총 소유비용(TCO) 계산
            tco_analysis = self._calculate_tco(vehicle_info, finance_options)

            # 5. 리스크 분석
            risk_analysis = self._analyze_financial_risks(
                vehicle_info, financial_profile, finance_options
            )

            # 6. 최적 금융 솔루션 추천
            recommendations = self._generate_finance_recommendations(
                finance_options, tco_analysis, risk_analysis, financial_profile
            )

            logger.info(f"✅ 금융 분석 완료: {len(recommendations)}개 옵션 분석")

            return {
                "vehicle_id": vehicle.get("id", ""),
                "financial_analysis": {
                    "options": finance_options,
                    "tco_analysis": tco_analysis,
                    "risk_analysis": risk_analysis,
                    "recommendations": recommendations
                },
                "user_suitability": self._assess_user_suitability(financial_profile, vehicle_info),
                "confidence": 0.89,
                "agent": self.name,
                "analysis_time": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 금융 분석 오류: {e}")
            return {
                "vehicle_id": vehicle.get("id", ""),
                "error": str(e),
                "confidence": 0.0,
                "agent": self.name
            }

    def _parse_financial_profile(self, user_profile: Dict[str, Any]) -> FinancialProfile:
        """사용자 재정 프로필 파싱"""
        return FinancialProfile(
            monthly_income=user_profile.get('income', 400),  # 월 소득 (만원)
            existing_debt=user_profile.get('existing_debt', 0),
            credit_score=user_profile.get('credit_score', 700),
            savings=user_profile.get('savings', 1000),
            monthly_expense=user_profile.get('monthly_expense', 200),
            investment_appetite=user_profile.get('investment_appetite', 'moderate')
        )

    def _analyze_vehicle_financials(self, vehicle: Dict[str, Any]) -> Dict[str, Any]:
        """차량 금융 정보 분석"""
        brand = vehicle.get("brand", "기타")
        price = vehicle.get("price", 0)
        year = vehicle.get("year", 2020)
        age = 2025 - year

        # 브랜드 카테고리 분류
        premium_brands = ["BMW", "벤츠", "아우디", "제네시스", "렉서스"]
        standard_brands = ["현대", "기아", "토요타", "혼다", "볼보"]

        if brand in premium_brands:
            category = "premium"
        elif brand in standard_brands:
            category = "standard"
        else:
            category = "economy"

        return {
            "price": price,
            "brand": brand,
            "category": category,
            "age": age,
            "residual_value_rate": self.residual_values.get(brand, 0.45),
            "maintenance_cost": self.maintenance_costs[category],
            "depreciation_rate": self._calculate_depreciation_rate(age, brand)
        }

    def _calculate_depreciation_rate(self, age: int, brand: str) -> float:
        """연간 감가상각률 계산"""
        base_rates = {
            "premium": 0.15,    # 프리미엄 브랜드
            "standard": 0.18,   # 일반 브랜드
            "economy": 0.22     # 경제형 브랜드
        }

        premium_brands = ["BMW", "벤츠", "아우디", "제네시스", "렉서스"]
        standard_brands = ["현대", "기아", "토요타", "혼다", "볼보"]

        if brand in premium_brands:
            base_rate = base_rates["premium"]
        elif brand in standard_brands:
            base_rate = base_rates["standard"]
        else:
            base_rate = base_rates["economy"]

        # 연식이 높을수록 감가상각률 증가
        age_factor = 1 + (age * 0.02)  # 연식 1년당 2% 추가
        return min(base_rate * age_factor, 0.30)  # 최대 30%

    async def _analyze_finance_options(
        self,
        vehicle_info: Dict[str, Any],
        financial_profile: FinancialProfile
    ) -> List[Dict[str, Any]]:
        """금융 옵션별 분석"""

        price = vehicle_info["price"]
        options = []

        # 신용등급 평가
        credit_tier = self._get_credit_tier(financial_profile.credit_score)
        credit_adjustment = self.credit_adjustments[credit_tier]

        # 1. 현금 구매
        if financial_profile.savings >= price:
            cash_option = {
                "type": FinanceOption.CASH.value,
                "total_cost": price,
                "monthly_payment": 0,
                "interest_rate": 0.0,
                "down_payment": price,
                "loan_term": 0,
                "pros": ["이자 부담 없음", "소유권 즉시 획득", "협상력 향상"],
                "cons": ["유동성 부족", "기회비용 발생"],
                "suitability_score": self._calculate_cash_suitability(financial_profile, price)
            }
            options.append(cash_option)

        # 2. 할부 금융 (3년, 5년)
        for term in [36, 60]:
            interest_rate = self.interest_rates[FinanceOption.INSTALLMENT] + credit_adjustment
            down_payment = price * 0.2  # 20% 다운페이먼트

            if financial_profile.savings >= down_payment:
                loan_amount = price - down_payment
                monthly_payment = self._calculate_monthly_payment(loan_amount, interest_rate, term)
                total_cost = down_payment + (monthly_payment * term)

                installment_option = {
                    "type": f"할부금융 ({term//12}년)",
                    "total_cost": total_cost,
                    "monthly_payment": monthly_payment,
                    "interest_rate": interest_rate,
                    "down_payment": down_payment,
                    "loan_term": term,
                    "total_interest": total_cost - price,
                    "pros": ["월 부담 분산", "신용도 향상 기회"],
                    "cons": ["이자 부담", "소유권 제한"],
                    "suitability_score": self._calculate_installment_suitability(
                        financial_profile, monthly_payment
                    )
                }
                options.append(installment_option)

        # 3. 리스 (3년, 4년)
        for term in [36, 48]:
            lease_rate = self.interest_rates[FinanceOption.LEASE] + credit_adjustment
            residual_value = price * vehicle_info["residual_value_rate"]
            depreciation = price - residual_value
            monthly_payment = (depreciation / term) + ((price + residual_value) * lease_rate / 24)

            lease_option = {
                "type": f"리스 ({term//12}년)",
                "total_cost": monthly_payment * term,
                "monthly_payment": monthly_payment,
                "interest_rate": lease_rate,
                "down_payment": price * 0.1,  # 10% 다운
                "loan_term": term,
                "residual_value": residual_value,
                "pros": ["낮은 월 납입금", "최신 차량 이용", "유지비 절약"],
                "cons": ["소유권 없음", "주행거리 제한", "조기 해지 수수료"],
                "suitability_score": self._calculate_lease_suitability(
                    financial_profile, monthly_payment
                )
            }
            options.append(lease_option)

        return options

    def _calculate_monthly_payment(self, loan_amount: float, annual_rate: float, term_months: int) -> float:
        """월 납입금 계산"""
        monthly_rate = annual_rate / 12
        if monthly_rate == 0:
            return loan_amount / term_months

        numerator = loan_amount * monthly_rate * (1 + monthly_rate) ** term_months
        denominator = (1 + monthly_rate) ** term_months - 1
        return numerator / denominator

    def _get_credit_tier(self, credit_score: int) -> str:
        """신용등급 분류"""
        if credit_score >= 750:
            return "excellent"
        elif credit_score >= 650:
            return "good"
        elif credit_score >= 550:
            return "fair"
        else:
            return "poor"

    def _calculate_cash_suitability(self, profile: FinancialProfile, price: float) -> float:
        """현금 구매 적합성 점수"""
        # 구매 후 잔여 자금 비율
        remaining_ratio = (profile.savings - price) / profile.savings if profile.savings > 0 else 0

        # 월 소득 대비 적정성
        income_months = price / profile.monthly_income if profile.monthly_income > 0 else float('inf')

        if remaining_ratio >= 0.5 and income_months <= 12:
            return 0.9
        elif remaining_ratio >= 0.3 and income_months <= 18:
            return 0.7
        elif remaining_ratio >= 0.1:
            return 0.5
        else:
            return 0.2

    def _calculate_installment_suitability(self, profile: FinancialProfile, monthly_payment: float) -> float:
        """할부 적합성 점수"""
        # DTI (Debt to Income) 계산
        total_monthly_debt = (profile.existing_debt / 12) + monthly_payment
        dti_ratio = total_monthly_debt / profile.monthly_income if profile.monthly_income > 0 else 1

        if dti_ratio <= 0.3:
            return 0.9
        elif dti_ratio <= 0.4:
            return 0.7
        elif dti_ratio <= 0.5:
            return 0.5
        else:
            return 0.2

    def _calculate_lease_suitability(self, profile: FinancialProfile, monthly_payment: float) -> float:
        """리스 적합성 점수"""
        # 월 소득 대비 비율
        payment_ratio = monthly_payment / profile.monthly_income if profile.monthly_income > 0 else 1

        # 투자 성향 고려
        appetite_bonus = {
            "conservative": 0.0,
            "moderate": 0.05,
            "aggressive": 0.1
        }

        base_score = 0.8 if payment_ratio <= 0.15 else 0.6 if payment_ratio <= 0.2 else 0.4
        return min(0.9, base_score + appetite_bonus.get(profile.investment_appetite, 0))

    def _calculate_tco(self, vehicle_info: Dict[str, Any], options: List[Dict[str, Any]]) -> Dict[str, Any]:
        """총 소유비용(TCO) 계산"""
        tco_analysis = {}

        for option in options:
            option_type = option["type"]
            term_years = max(3, option.get("loan_term", 36) // 12)

            # 기본 비용
            purchase_cost = option["total_cost"]

            # 유지비 (월간 유지비 * 12개월 * 기간)
            maintenance_total = vehicle_info["maintenance_cost"] * 12 * term_years

            # 보험료 (연간 100만원 기준)
            insurance_total = 100 * term_years

            # 세금 (취득세, 자동차세)
            tax_total = vehicle_info["price"] * 0.02 + (5 * term_years)  # 취득세 2% + 연간 자동차세 5만원

            # 연료비 (월 15만원 기준)
            fuel_total = 15 * 12 * term_years

            # 감가상각 (리스는 제외)
            if "리스" not in option_type:
                current_value = vehicle_info["price"]
                future_value = current_value * (1 - vehicle_info["depreciation_rate"]) ** term_years
                depreciation_cost = current_value - future_value
            else:
                depreciation_cost = 0

            total_tco = (
                purchase_cost + maintenance_total + insurance_total +
                tax_total + fuel_total + depreciation_cost
            )

            tco_analysis[option_type] = {
                "total_tco": total_tco,
                "breakdown": {
                    "purchase_cost": purchase_cost,
                    "maintenance": maintenance_total,
                    "insurance": insurance_total,
                    "tax": tax_total,
                    "fuel": fuel_total,
                    "depreciation": depreciation_cost
                },
                "monthly_tco": total_tco / (term_years * 12),
                "cost_per_km": total_tco / (15000 * term_years)  # 연간 15,000km 기준
            }

        return tco_analysis

    def _analyze_financial_risks(
        self,
        vehicle_info: Dict[str, Any],
        profile: FinancialProfile,
        options: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """금융 리스크 분석"""

        risk_analysis = {}

        for option in options:
            option_type = option["type"]

            # 유동성 리스크
            liquidity_risk = self._assess_liquidity_risk(profile, option)

            # 금리 리스크
            interest_risk = self._assess_interest_risk(option)

            # 시장 리스크 (차량 가치 변동)
            market_risk = self._assess_market_risk(vehicle_info)

            # 신용 리스크
            credit_risk = self._assess_credit_risk(profile)

            # 종합 리스크 점수 (낮을수록 안전)
            total_risk = (
                liquidity_risk * 0.3 +
                interest_risk * 0.2 +
                market_risk * 0.3 +
                credit_risk * 0.2
            )

            risk_analysis[option_type] = {
                "total_risk_score": total_risk,
                "risk_level": self._get_risk_level(total_risk),
                "breakdown": {
                    "liquidity_risk": liquidity_risk,
                    "interest_risk": interest_risk,
                    "market_risk": market_risk,
                    "credit_risk": credit_risk
                },
                "risk_mitigation": self._get_risk_mitigation_advice(option_type, total_risk)
            }

        return risk_analysis

    def _assess_liquidity_risk(self, profile: FinancialProfile, option: Dict[str, Any]) -> float:
        """유동성 리스크 평가"""
        if option["type"] == FinanceOption.CASH.value:
            remaining_savings = profile.savings - option["total_cost"]
            emergency_fund = profile.monthly_expense * 6  # 6개월 비상자금

            if remaining_savings >= emergency_fund:
                return 0.2
            elif remaining_savings >= emergency_fund * 0.5:
                return 0.5
            else:
                return 0.8
        else:
            # 할부/리스의 경우 월 납입금 대비 여유 자금
            monthly_surplus = profile.monthly_income - profile.monthly_expense - option["monthly_payment"]

            if monthly_surplus >= profile.monthly_expense * 0.3:
                return 0.3
            elif monthly_surplus >= 0:
                return 0.6
            else:
                return 0.9

    def _assess_interest_risk(self, option: Dict[str, Any]) -> float:
        """금리 리스크 평가"""
        interest_rate = option.get("interest_rate", 0)

        if interest_rate == 0:
            return 0.1
        elif interest_rate <= 0.04:
            return 0.3
        elif interest_rate <= 0.06:
            return 0.5
        else:
            return 0.7

    def _assess_market_risk(self, vehicle_info: Dict[str, Any]) -> float:
        """시장 리스크 평가"""
        # 브랜드별 시장 안정성
        stable_brands = ["토요타", "렉서스", "현대", "기아"]
        volatile_brands = ["쌍용", "르노삼성"]

        brand = vehicle_info["brand"]

        if brand in stable_brands:
            return 0.3
        elif brand in volatile_brands:
            return 0.7
        else:
            return 0.5

    def _assess_credit_risk(self, profile: FinancialProfile) -> float:
        """신용 리스크 평가"""
        credit_score = profile.credit_score

        if credit_score >= 750:
            return 0.2
        elif credit_score >= 650:
            return 0.4
        elif credit_score >= 550:
            return 0.6
        else:
            return 0.8

    def _get_risk_level(self, risk_score: float) -> str:
        """리스크 수준 분류"""
        if risk_score <= 0.3:
            return "낮음"
        elif risk_score <= 0.6:
            return "보통"
        else:
            return "높음"

    def _get_risk_mitigation_advice(self, option_type: str, risk_score: float) -> List[str]:
        """리스크 완화 조언"""
        advice = []

        if risk_score > 0.6:
            advice.append("충분한 비상자금 확보 필요")
            advice.append("보험 가입 검토")

        if "할부" in option_type:
            advice.append("금리 변동 모니터링")
            advice.append("조기 상환 계획 수립")

        if "리스" in option_type:
            advice.append("주행거리 관리 필요")
            advice.append("차량 관리 상태 유지")

        return advice

    def _generate_finance_recommendations(
        self,
        options: List[Dict[str, Any]],
        tco_analysis: Dict[str, Any],
        risk_analysis: Dict[str, Any],
        profile: FinancialProfile
    ) -> List[Dict[str, Any]]:
        """최적 금융 솔루션 추천"""

        recommendations = []

        for option in options:
            option_type = option["type"]

            # 종합 점수 계산
            suitability = option.get("suitability_score", 0.5)
            tco = tco_analysis.get(option_type, {})
            risk = risk_analysis.get(option_type, {})

            # 정규화된 점수들
            tco_score = 1.0 - min(1.0, tco.get("monthly_tco", 100) / 100)  # TCO가 낮을수록 높은 점수
            risk_score = 1.0 - risk.get("total_risk_score", 0.5)  # 리스크가 낮을수록 높은 점수

            # 가중 평균으로 종합 점수 계산
            overall_score = (
                suitability * 0.4 +
                tco_score * 0.35 +
                risk_score * 0.25
            )

            recommendation = {
                "option_type": option_type,
                "overall_score": round(overall_score, 3),
                "monthly_payment": option.get("monthly_payment", 0),
                "total_cost": option.get("total_cost", 0),
                "suitability_score": suitability,
                "tco_score": tco_score,
                "risk_score": risk_score,
                "recommendation_reason": self._generate_recommendation_reason(option, overall_score),
                "pros": option.get("pros", []),
                "cons": option.get("cons", []),
                "best_for": self._get_best_for_profile(option_type)
            }

            recommendations.append(recommendation)

        # 점수별 정렬
        recommendations.sort(key=lambda x: x["overall_score"], reverse=True)

        return recommendations

    def _generate_recommendation_reason(self, option: Dict[str, Any], score: float) -> str:
        """추천 이유 생성"""
        if score >= 0.8:
            return f"{option['type']} - 매우 적합한 금융 옵션"
        elif score >= 0.6:
            return f"{option['type']} - 적합한 금융 옵션"
        elif score >= 0.4:
            return f"{option['type']} - 보통 수준의 적합성"
        else:
            return f"{option['type']} - 신중한 검토 필요"

    def _get_best_for_profile(self, option_type: str) -> str:
        """옵션별 최적 프로필"""
        mapping = {
            "현금구매": "충분한 유동성과 안정적 소득이 있는 고객",
            "할부금융 (3년)": "빠른 소유권 획득을 원하는 고객",
            "할부금융 (5년)": "월 부담을 최소화하려는 고객",
            "리스 (3년)": "최신 차량을 선호하는 고객",
            "리스 (4년)": "장기간 낮은 월납입을 원하는 고객"
        }
        return mapping.get(option_type, "일반 고객")

    def _assess_user_suitability(self, profile: FinancialProfile, vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
        """사용자-차량 적합성 평가"""

        # 소득 대비 차량 가격 비율
        price_to_income_ratio = vehicle_info["price"] / (profile.monthly_income * 12) if profile.monthly_income > 0 else float('inf')

        # 적정 구매 가능 여부
        affordable = price_to_income_ratio <= 0.5  # 연소득의 50% 이하

        # DTI 기반 위험도 평가
        risk_level = "낮음" if price_to_income_ratio <= 0.3 else "보통" if price_to_income_ratio <= 0.5 else "높음"

        return {
            "affordable": affordable,
            "price_to_income_ratio": round(price_to_income_ratio, 2),
            "risk_level": risk_level,
            "recommended_max_price": profile.monthly_income * 12 * 0.5,
            "financial_advice": self._generate_financial_advice(profile, vehicle_info)
        }

    def _generate_financial_advice(self, profile: FinancialProfile, vehicle_info: Dict[str, Any]) -> List[str]:
        """맞춤 금융 조언 생성"""
        advice = []

        price = vehicle_info["price"]
        annual_income = profile.monthly_income * 12

        if price > annual_income * 0.5:
            advice.append("차량 가격이 연소득 대비 높습니다. 더 저렴한 차량 고려를 권장합니다.")

        if profile.savings < price * 0.2:
            advice.append("다운페이먼트를 위한 충분한 자금 확보가 필요합니다.")

        if profile.existing_debt > annual_income * 0.3:
            advice.append("기존 부채를 줄인 후 차량 구매를 고려하세요.")

        if profile.credit_score < 650:
            advice.append("신용점수 개선 후 더 유리한 금리로 대출 가능합니다.")

        advice.append("차량 구매 전 비상자금(6개월 생활비)을 확보하세요.")
        advice.append("다양한 금융기관의 금리를 비교 검토하세요.")

        return advice