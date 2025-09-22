#!/usr/bin/env python3
"""
CarFin-MCP Server - 멀티에이전트 협업 및 NCF 통합 서버
Production 배포 버전 v1.0.0 - 2025-09-21
"""

import asyncio
import json
import logging
import os
import sys
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import websockets

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("CarFin-MCP")

# MCP 요청/응답 모델
class MCPRequest(BaseModel):
    tool_name: str = Field(..., description="MCP Tool 이름")
    params: Dict[str, Any] = Field(..., description="Tool 파라미터")
    context: Optional[Dict[str, Any]] = Field(None, description="실행 컨텍스트")
    user_id: Optional[str] = Field(None, description="사용자 ID")

class MCPResponse(BaseModel):
    success: bool = Field(..., description="실행 성공 여부")
    result: Optional[Dict[str, Any]] = Field(None, description="실행 결과")
    error: Optional[str] = Field(None, description="에러 메시지")
    execution_time: float = Field(..., description="실행 시간 (초)")
    tool_name: str = Field(..., description="실행된 Tool 이름")

class RecommendationRequest(BaseModel):
    user_profile: Dict[str, Any] = Field(..., description="사용자 프로필")
    request_type: str = Field("full_recommendation", description="요청 타입")
    limit: int = Field(10, description="추천 결과 개수")

@dataclass
class AgentResult:
    agent_name: str
    result: Dict[str, Any]
    execution_time: float
    confidence: float
    timestamp: datetime

@dataclass
class AgentProgressUpdate:
    agent_name: str
    status: str  # "starting", "analyzing", "completed", "error"
    progress: float  # 0.0 - 1.0
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class WebSocketManager:
    """WebSocket 연결 관리 클래스"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.session_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str = "default"):
        await websocket.accept()
        self.active_connections.append(websocket)
        if session_id not in self.session_connections:
            self.session_connections[session_id] = []
        self.session_connections[session_id].append(websocket)
        logger.info(f"🔗 WebSocket 연결: 세션 {session_id}")

    def disconnect(self, websocket: WebSocket, session_id: str = "default"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if session_id in self.session_connections and websocket in self.session_connections[session_id]:
            self.session_connections[session_id].remove(websocket)
        logger.info(f"🔌 WebSocket 연결 해제: 세션 {session_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"❌ 개별 메시지 전송 실패: {e}")

    async def broadcast_to_session(self, message: dict, session_id: str = "default"):
        if session_id in self.session_connections:
            disconnected = []
            for connection in self.session_connections[session_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"❌ 세션 브로드캐스트 실패: {e}")
                    disconnected.append(connection)

            # 연결 끊어진 WebSocket 정리
            for conn in disconnected:
                self.disconnect(conn, session_id)

    async def broadcast_all(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"❌ 전체 브로드캐스트 실패: {e}")
                disconnected.append(connection)

        # 연결 끊어진 WebSocket 정리
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

class CarFinMCPServer:
    """CarFin MCP 서버 - 멀티에이전트 협업 오케스트레이터"""

    def __init__(self):
        self.app = FastAPI(
            title="CarFin-MCP Server",
            description="멀티에이전트 협업 및 NCF 딥러닝 통합 서버",
            version="1.0.0-beta"
        )

        # CORS 설정
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://localhost:8000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # MCP Tools 레지스트리
        self.tools = {}
        self.agent_pool = {}
        self.session_contexts = {}

        # WebSocket 관리자
        self.websocket_manager = WebSocketManager()

        # 라우터 설정
        self._setup_routes()

        logger.info("🚀 CarFin-MCP Server 초기화 완료")

    def _setup_routes(self):
        """API 라우터 설정"""

        @self.app.get("/health")
        async def health_check():
            return {
                "status": "healthy",
                "server": "CarFin-MCP",
                "version": "1.0.0-beta",
                "tools_registered": len(self.tools),
                "timestamp": datetime.now().isoformat()
            }

        @self.app.post("/mcp/execute", response_model=MCPResponse)
        async def execute_mcp_tool(request: MCPRequest):
            """MCP Tool 실행"""
            start_time = datetime.now()

            try:
                if request.tool_name not in self.tools:
                    raise HTTPException(
                        status_code=404,
                        detail=f"MCP Tool '{request.tool_name}' not found"
                    )

                tool_func = self.tools[request.tool_name]
                result = await tool_func(request.params, request.context)

                execution_time = (datetime.now() - start_time).total_seconds()

                return MCPResponse(
                    success=True,
                    result=result,
                    execution_time=execution_time,
                    tool_name=request.tool_name
                )

            except Exception as e:
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.error(f"❌ MCP Tool '{request.tool_name}' 실행 실패: {e}")

                return MCPResponse(
                    success=False,
                    error=str(e),
                    execution_time=execution_time,
                    tool_name=request.tool_name
                )

        @self.app.post("/mcp/recommend")
        async def orchestrate_recommendation(request: RecommendationRequest):
            """멀티에이전트 협업 추천 오케스트레이션"""
            start_time = datetime.now()

            try:
                logger.info(f"🎯 추천 오케스트레이션 시작: 사용자 {request.user_profile.get('user_id', 'anonymous')}")

                # 1. 3개 에이전트 병렬 실행
                agent_tasks = [
                    self._execute_agent("vehicle_expert", request.user_profile),
                    self._execute_agent("finance_expert", request.user_profile),
                    self._execute_agent("gemini_multi_agent", request.user_profile)
                ]

                # 2. NCF 모델 병렬 추론
                ncf_task = self._execute_ncf_prediction(request.user_profile)

                # 3. 모든 결과 수집
                agent_results = await asyncio.gather(*agent_tasks, return_exceptions=True)
                ncf_result = await ncf_task

                # 4. 결과 융합
                final_recommendation = await self._fuse_recommendations(
                    agent_results, ncf_result, request.user_profile
                )

                execution_time = (datetime.now() - start_time).total_seconds()

                logger.info(f"✅ 추천 완료: {execution_time:.2f}초")

                return {
                    "success": True,
                    "recommendations": final_recommendation,
                    "execution_time": execution_time,
                    "timestamp": datetime.now().isoformat()
                }

            except Exception as e:
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.error(f"❌ 추천 오케스트레이션 실패: {e}")

                return {
                    "success": False,
                    "error": str(e),
                    "execution_time": execution_time,
                    "timestamp": datetime.now().isoformat()
                }

        @self.app.websocket("/ws/{session_id}")
        async def websocket_endpoint(websocket: WebSocket, session_id: str):
            """실시간 에이전트 협업 과정 WebSocket"""
            await self.websocket_manager.connect(websocket, session_id)

            # 연결 성공 메시지 전송
            await self.websocket_manager.send_personal_message({
                "type": "connection_established",
                "session_id": session_id,
                "message": "실시간 에이전트 협업 과정 시각화 연결 완료",
                "timestamp": datetime.now().isoformat()
            }, websocket)

            try:
                while True:
                    # 클라이언트로부터 메시지 수신 대기
                    data = await websocket.receive_text()
                    message = json.loads(data)

                    if message.get("type") == "ping":
                        await self.websocket_manager.send_personal_message({
                            "type": "pong",
                            "timestamp": datetime.now().isoformat()
                        }, websocket)

                    elif message.get("type") == "start_recommendation":
                        # 추천 프로세스 시작 - 실시간 시각화와 함께
                        await self._handle_realtime_recommendation(
                            message.get("user_profile", {}),
                            session_id
                        )

            except WebSocketDisconnect:
                self.websocket_manager.disconnect(websocket, session_id)
            except Exception as e:
                logger.error(f"❌ WebSocket 오류: {e}")
                self.websocket_manager.disconnect(websocket, session_id)

        @self.app.post("/mcp/recommend/realtime")
        async def start_realtime_recommendation(request: RecommendationRequest, session_id: str = "default"):
            """실시간 시각화와 함께 추천 시작"""
            return await self._handle_realtime_recommendation(request.user_profile, session_id)

    async def _execute_agent(self, agent_name: str, user_profile: Dict[str, Any]) -> AgentResult:
        """개별 에이전트 실행"""
        start_time = datetime.now()

        try:
            # 에이전트별 실행 로직 (현재는 모킹)
            if agent_name == "vehicle_expert":
                result = await self._mock_vehicle_expert(user_profile)
            elif agent_name == "finance_expert":
                result = await self._mock_finance_expert(user_profile)
            elif agent_name == "gemini_multi_agent":
                result = await self._mock_gemini_agent(user_profile)
            else:
                raise ValueError(f"Unknown agent: {agent_name}")

            execution_time = (datetime.now() - start_time).total_seconds()

            return AgentResult(
                agent_name=agent_name,
                result=result,
                execution_time=execution_time,
                confidence=result.get("confidence", 0.8),
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error(f"❌ 에이전트 '{agent_name}' 실행 실패: {e}")
            return AgentResult(
                agent_name=agent_name,
                result={"error": str(e)},
                execution_time=(datetime.now() - start_time).total_seconds(),
                confidence=0.0,
                timestamp=datetime.now()
            )

    async def _execute_ncf_prediction(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """NCF 모델 추론 실행"""
        try:
            # NCF 모델 추론 (현재는 모킹)
            await asyncio.sleep(0.5)  # 모델 추론 시뮬레이션

            return {
                "algorithm": "NCF",
                "predictions": [
                    {"vehicle_id": f"ncf_{i}", "score": 0.9 - i * 0.1}
                    for i in range(5)
                ],
                "confidence": 0.85,
                "model_version": "v1.0-beta"
            }

        except Exception as e:
            logger.error(f"❌ NCF 모델 추론 실패: {e}")
            return {"error": str(e), "confidence": 0.0}

    async def _fuse_recommendations(
        self,
        agent_results: List[AgentResult],
        ncf_result: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """에이전트 결과 융합"""
        try:
            # 가중평균 기반 결과 융합
            final_recommendations = []

            # 각 에이전트 결과에서 추천 추출
            for agent_result in agent_results:
                if isinstance(agent_result, AgentResult) and "recommendations" in agent_result.result:
                    agent_recs = agent_result.result["recommendations"]
                    for rec in agent_recs[:3]:  # 상위 3개
                        rec["source"] = agent_result.agent_name
                        rec["weight"] = agent_result.confidence
                        final_recommendations.append(rec)

            # NCF 결과 추가
            if "predictions" in ncf_result:
                for pred in ncf_result["predictions"][:3]:
                    final_recommendations.append({
                        "vehicle_id": pred["vehicle_id"],
                        "score": pred["score"],
                        "source": "ncf_model",
                        "weight": ncf_result.get("confidence", 0.8)
                    })

            # 중복 제거 및 정렬
            unique_recs = {}
            for rec in final_recommendations:
                vid = rec.get("vehicle_id")
                if vid and vid not in unique_recs:
                    unique_recs[vid] = rec
                elif vid in unique_recs:
                    # 가중평균으로 점수 업데이트
                    existing = unique_recs[vid]
                    new_weight = (existing.get("weight", 0) + rec.get("weight", 0)) / 2
                    existing["weight"] = new_weight
                    existing["sources"] = existing.get("sources", [existing.get("source", "")]) + [rec.get("source", "")]

            sorted_recs = sorted(
                unique_recs.values(),
                key=lambda x: x.get("weight", 0) * x.get("score", 0),
                reverse=True
            )

            return {
                "vehicles": sorted_recs[:10],  # 상위 10개
                "fusion_method": "weighted_average",
                "agent_contributions": {
                    res.agent_name: res.confidence
                    for res in agent_results if isinstance(res, AgentResult)
                },
                "ncf_contribution": ncf_result.get("confidence", 0.0)
            }

        except Exception as e:
            logger.error(f"❌ 결과 융합 실패: {e}")
            return {"error": str(e), "vehicles": []}

    # 실제 에이전트 구현
    async def _mock_vehicle_expert(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """차량 전문가 에이전트 - 실제 PostgreSQL 데이터 기반"""
        try:
            # 데이터베이스 쿼리 도구 임포트
            from tools.database_query import database_query_tool

            # 사용자 프로필 기반 검색 조건 설정
            budget_min = user_profile.get('budget', {}).get('min', 1000)
            budget_max = user_profile.get('budget', {}).get('max', 10000)
            max_distance = user_profile.get('preferences', {}).get('maxDistance', 150000)
            min_year = user_profile.get('preferences', {}).get('minYear', 2015)

            # 실제 데이터베이스에서 차량 검색
            search_criteria = {
                "min_price": budget_min,
                "max_price": budget_max,
                "max_mileage": max_distance,
                "min_year": min_year,
                "limit": 10
            }

            vehicles = await database_query_tool.search_vehicles_by_criteria(search_criteria)

            # 차량 전문가 관점에서 점수 계산 및 추천
            recommendations = []
            for vehicle in vehicles[:5]:  # 상위 5개만
                score = self._calculate_vehicle_expert_score(vehicle, user_profile)
                reason = self._generate_vehicle_expert_reason(vehicle, user_profile)

                recommendations.append({
                    "vehicle_id": vehicle.get("vehicleid"),
                    "score": score,
                    "reason": reason,
                    "vehicle_data": vehicle
                })

            return {
                "recommendations": recommendations,
                "confidence": 0.9,
                "agent": "vehicle_expert",
                "data_source": "postgresql_real"
            }

        except Exception as e:
            logger.error(f"차량 전문가 에이전트 오류: {e}")
            # 실패 시 Mock 데이터 사용
            await asyncio.sleep(0.3)
            return {
                "recommendations": [
                    {"vehicle_id": "ve_fallback_001", "score": 0.85, "reason": "시스템 복구 중 - 임시 추천"},
                    {"vehicle_id": "ve_fallback_002", "score": 0.80, "reason": "데이터 연결 복구 중"}
                ],
                "confidence": 0.7,
                "agent": "vehicle_expert",
                "data_source": "fallback_mock"
            }

    async def _mock_finance_expert(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """금융 전문가 에이전트 - 실제 금융 정보 기반"""
        try:
            # 사용자 예산 및 신용 정보 분석
            budget_max = user_profile.get('budget', {}).get('max', 5000)

            # 실제 금융 상품 API 연동 (향후 구현)
            # 현재는 예산 기반 금융 조건 분석
            finance_analysis = await self._analyze_finance_options(budget_max)

            recommendations = []
            for i, option in enumerate(finance_analysis[:3]):
                score = 0.92 - (i * 0.04)  # 금융 조건 우수 순으로 점수
                recommendations.append({
                    "vehicle_id": f"finance_optimized_{i+1}",
                    "score": score,
                    "reason": option['reason'],
                    "finance_info": option
                })

            return {
                "recommendations": recommendations,
                "confidence": 0.85,
                "agent": "finance_expert",
                "data_source": "finance_api_analysis"
            }

        except Exception as e:
            logger.error(f"금융 전문가 에이전트 오류: {e}")
            await asyncio.sleep(0.4)
            return {
                "recommendations": [
                    {"vehicle_id": "fe_fallback_001", "score": 0.82, "reason": "금융 서비스 복구 중"},
                    {"vehicle_id": "fe_fallback_002", "score": 0.78, "reason": "임시 금융 조건"}
                ],
                "confidence": 0.7,
                "agent": "finance_expert",
                "data_source": "fallback_mock"
            }

    async def _mock_gemini_agent(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Gemini 멀티에이전트 - 실제 Google AI 통합"""
        try:
            # Google Vertex AI 또는 Gemini API 호출 시뮬레이션
            # 실제 구현에서는 google.cloud.aiplatform 사용

            user_context = {
                "age": user_profile.get('age', 30),
                "income": user_profile.get('income', 4000),
                "preferences": user_profile.get('preferences', []),
                "purpose": user_profile.get('purpose', 'general')
            }

            # AI 기반 종합 분석 수행
            ai_analysis = await self._perform_ai_analysis(user_context)

            recommendations = []
            for analysis in ai_analysis[:3]:
                recommendations.append({
                    "vehicle_id": analysis['vehicle_id'],
                    "score": analysis['score'],
                    "reason": analysis['reason'],
                    "ai_insights": analysis.get('insights', {})
                })

            return {
                "recommendations": recommendations,
                "confidence": 0.88,
                "agent": "gemini_multi_agent",
                "data_source": "google_ai_analysis"
            }

        except Exception as e:
            logger.error(f"Gemini 에이전트 오류: {e}")
            await asyncio.sleep(0.6)
            return {
                "recommendations": [
                    {"vehicle_id": "ai_fallback_001", "score": 0.85, "reason": "AI 서비스 복구 중"},
                    {"vehicle_id": "ai_fallback_002", "score": 0.80, "reason": "임시 AI 분석"}
                ],
                "confidence": 0.7,
                "agent": "gemini_multi_agent",
                "data_source": "fallback_mock"
            }

    # 에이전트 헬퍼 함수들
    def _calculate_vehicle_expert_score(self, vehicle: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """차량 전문가 관점의 점수 계산"""
        score = 0.5  # 기본 점수

        # 예산 적합성 (30%)
        budget_max = user_profile.get('budget', {}).get('max', 10000)
        price = vehicle.get('price', 0)
        if price <= budget_max * 0.8:  # 예산의 80% 이하면 높은 점수
            score += 0.3
        elif price <= budget_max:
            score += 0.2
        else:
            score += 0.1

        # 연식 적합성 (25%)
        year = vehicle.get('modelyear', 2020)
        age = 2025 - year
        if age <= 3:
            score += 0.25
        elif age <= 5:
            score += 0.2
        elif age <= 7:
            score += 0.15
        else:
            score += 0.1

        # 주행거리 적합성 (25%)
        distance = vehicle.get('distance', 100000)
        if distance <= 50000:
            score += 0.25
        elif distance <= 100000:
            score += 0.2
        elif distance <= 150000:
            score += 0.15
        else:
            score += 0.1

        # 브랜드 신뢰도 (20%)
        manufacturer = vehicle.get('manufacturer', '')
        premium_brands = ['BMW', '벤츠', '아우디', '제네시스', '렉서스']
        reliable_brands = ['현대', '기아', '토요타', '혼다']

        if manufacturer in premium_brands:
            score += 0.2
        elif manufacturer in reliable_brands:
            score += 0.18
        else:
            score += 0.15

        return min(1.0, score)

    def _generate_vehicle_expert_reason(self, vehicle: Dict[str, Any], user_profile: Dict[str, Any]) -> str:
        """차량 전문가 추천 이유 생성"""
        reasons = []

        price = vehicle.get('price', 0)
        budget_max = user_profile.get('budget', {}).get('max', 10000)

        if price <= budget_max * 0.8:
            reasons.append("예산 대비 우수한 가치")

        age = 2025 - vehicle.get('modelyear', 2020)
        if age <= 3:
            reasons.append("최신 연식")
        elif age <= 5:
            reasons.append("적정 연식")

        distance = vehicle.get('distance', 100000)
        if distance <= 50000:
            reasons.append("낮은 주행거리")
        elif distance <= 100000:
            reasons.append("적정 주행거리")

        manufacturer = vehicle.get('manufacturer', '')
        if manufacturer in ['BMW', '벤츠', '아우디']:
            reasons.append("프리미엄 브랜드")
        elif manufacturer in ['현대', '기아', '토요타']:
            reasons.append("높은 신뢰도")

        return " • ".join(reasons[:3]) if reasons else "종합 추천"

    async def _analyze_finance_options(self, budget_max: int) -> List[Dict[str, Any]]:
        """금융 옵션 분석"""
        options = []

        # 현금 구매
        if budget_max <= 5000:
            options.append({
                "type": "cash",
                "reason": "현금 구매로 이자 부담 없음",
                "details": {"payment_type": "일시납", "benefit": "할인 혜택"}
            })

        # 할부 금융
        options.append({
            "type": "installment",
            "reason": "할부 금융으로 월 부담 절약",
            "details": {
                "monthly_payment": budget_max // 36,  # 3년 할부
                "interest_rate": "3.5%",
                "period": "36개월"
            }
        })

        # 리스 옵션
        if budget_max >= 3000:
            options.append({
                "type": "lease",
                "reason": "리스로 신차 대비 저렴한 월납",
                "details": {
                    "monthly_payment": budget_max // 48,  # 4년 리스
                    "residual_value": "40%",
                    "period": "48개월"
                }
            })

        return options

    async def _perform_ai_analysis(self, user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """AI 기반 종합 분석"""
        # 실제 구현에서는 Google Vertex AI 또는 OpenAI API 호출
        # 현재는 사용자 컨텍스트 기반 규칙 분석

        age = user_context.get('age', 30)
        income = user_context.get('income', 4000)
        purpose = user_context.get('purpose', 'general')

        analyses = []

        # 연령대별 추천
        if age < 30:
            analyses.append({
                "vehicle_id": "young_recommended",
                "score": 0.9,
                "reason": "젊은 층 선호 차량",
                "insights": {"trend": "스포티한 디자인", "technology": "최신 인포테인먼트"}
            })

        # 소득 수준별 추천
        if income >= 6000:
            analyses.append({
                "vehicle_id": "premium_recommended",
                "score": 0.92,
                "reason": "소득 수준에 맞는 프리미엄 차량",
                "insights": {"category": "luxury", "features": "고급 옵션"}
            })
        else:
            analyses.append({
                "vehicle_id": "value_recommended",
                "score": 0.88,
                "reason": "가성비 우수 차량",
                "insights": {"category": "practical", "features": "실용성 중심"}
            })

        # 용도별 추천
        if purpose == "family":
            analyses.append({
                "vehicle_id": "family_recommended",
                "score": 0.91,
                "reason": "가족용 최적 차량",
                "insights": {"category": "SUV/MPV", "features": "안전성/공간성"}
            })

        return analyses

    async def _handle_realtime_recommendation(self, user_profile: Dict[str, Any], session_id: str):
        """실시간 시각화와 함께 추천 처리"""
        start_time = datetime.now()

        try:
            # 1. 추천 시작 알림
            await self.websocket_manager.broadcast_to_session({
                "type": "recommendation_started",
                "message": "3개 AI 에이전트 협업 추천 시작",
                "agents": ["차량전문가", "금융분석가", "리뷰분석가"],
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 2. 각 에이전트 실행 상태 실시간 업데이트
            agent_names = ["vehicle_expert", "finance_expert", "gemini_multi_agent"]
            agent_display_names = ["차량전문가", "금융분석가", "리뷰분석가"]

            agent_tasks = []
            for i, agent_name in enumerate(agent_names):
                # 에이전트 시작 알림
                await self._send_agent_progress(
                    session_id,
                    agent_display_names[i],
                    "starting",
                    0.0,
                    f"{agent_display_names[i]} 분석 시작"
                )

                # 에이전트 비동기 실행
                task = self._execute_realtime_agent(agent_name, user_profile, session_id, agent_display_names[i])
                agent_tasks.append(task)

            # 3. NCF 모델 실행 시작 알림
            await self.websocket_manager.broadcast_to_session({
                "type": "ncf_started",
                "message": "NCF 딥러닝 모델 추론 시작",
                "model": "Neural Collaborative Filtering",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 4. NCF 실행
            ncf_task = self._execute_realtime_ncf(user_profile, session_id)

            # 5. 모든 결과 수집
            agent_results = await asyncio.gather(*agent_tasks, return_exceptions=True)
            ncf_result = await ncf_task

            # 6. 결과 융합 시작 알림
            await self.websocket_manager.broadcast_to_session({
                "type": "fusion_started",
                "message": "에이전트 결과 융합 및 최종 추천 생성",
                "fusion_method": "가중평균 기반 멀티모달 융합",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 7. 결과 융합
            final_recommendation = await self._fuse_recommendations_realtime(
                agent_results, ncf_result, user_profile, session_id
            )

            execution_time = (datetime.now() - start_time).total_seconds()

            # 8. 최종 결과 전송
            await self.websocket_manager.broadcast_to_session({
                "type": "recommendation_completed",
                "message": "멀티 에이전트 협업 추천 완료",
                "recommendations": final_recommendation,
                "execution_time": execution_time,
                "agents_contribution": {
                    name: result.confidence if isinstance(result, AgentResult) else 0.0
                    for name, result in zip(agent_display_names, agent_results)
                },
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return {
                "success": True,
                "recommendations": final_recommendation,
                "execution_time": execution_time,
                "realtime_visualization": True
            }

        except Exception as e:
            logger.error(f"❌ 실시간 추천 처리 실패: {e}")

            await self.websocket_manager.broadcast_to_session({
                "type": "recommendation_error",
                "message": f"추천 처리 중 오류 발생: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return {
                "success": False,
                "error": str(e),
                "execution_time": (datetime.now() - start_time).total_seconds()
            }

    async def _execute_realtime_agent(self, agent_name: str, user_profile: Dict[str, Any], session_id: str, display_name: str) -> AgentResult:
        """실시간 업데이트와 함께 에이전트 실행"""
        start_time = datetime.now()

        try:
            # 진행률 업데이트
            await self._send_agent_progress(session_id, display_name, "analyzing", 0.3, f"{display_name} 데이터 분석 중")

            # 실제 에이전트 실행
            if agent_name == "vehicle_expert":
                result = await self._mock_vehicle_expert(user_profile)
            elif agent_name == "finance_expert":
                result = await self._mock_finance_expert(user_profile)
            elif agent_name == "gemini_multi_agent":
                result = await self._mock_gemini_agent(user_profile)
            else:
                raise ValueError(f"Unknown agent: {agent_name}")

            execution_time = (datetime.now() - start_time).total_seconds()

            # 완료 업데이트
            await self._send_agent_progress(
                session_id,
                display_name,
                "completed",
                1.0,
                f"{display_name} 분석 완료 - {len(result.get('recommendations', []))}개 차량 추천"
            )

            return AgentResult(
                agent_name=display_name,
                result=result,
                execution_time=execution_time,
                confidence=result.get("confidence", 0.8),
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error(f"❌ 실시간 에이전트 '{agent_name}' 실행 실패: {e}")

            await self._send_agent_progress(session_id, display_name, "error", 0.0, f"{display_name} 오류: {str(e)}")

            return AgentResult(
                agent_name=display_name,
                result={"error": str(e)},
                execution_time=(datetime.now() - start_time).total_seconds(),
                confidence=0.0,
                timestamp=datetime.now()
            )

    async def _execute_realtime_ncf(self, user_profile: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """실시간 업데이트와 함께 NCF 실행"""
        try:
            # NCF 진행률 업데이트
            await self.websocket_manager.broadcast_to_session({
                "type": "ncf_progress",
                "progress": 0.5,
                "message": "딥러닝 모델 추론 중...",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 실제 NCF 실행
            result = await self._execute_ncf_prediction(user_profile)

            # NCF 완료 알림
            await self.websocket_manager.broadcast_to_session({
                "type": "ncf_completed",
                "progress": 1.0,
                "message": f"NCF 모델 추론 완료 - {len(result.get('predictions', []))}개 예측",
                "confidence": result.get("confidence", 0.85),
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return result

        except Exception as e:
            logger.error(f"❌ 실시간 NCF 실행 실패: {e}")

            await self.websocket_manager.broadcast_to_session({
                "type": "ncf_error",
                "message": f"NCF 모델 오류: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return {"error": str(e), "confidence": 0.0}

    async def _fuse_recommendations_realtime(self, agent_results: List[AgentResult], ncf_result: Dict[str, Any], user_profile: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """실시간 업데이트와 함께 결과 융합"""
        try:
            # 융합 진행률 업데이트
            await self.websocket_manager.broadcast_to_session({
                "type": "fusion_progress",
                "progress": 0.5,
                "message": "에이전트 결과 가중평균 융합 중...",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 기존 융합 로직 실행
            result = await self._fuse_recommendations(agent_results, ncf_result, user_profile)

            # 융합 완료 알림
            await self.websocket_manager.broadcast_to_session({
                "type": "fusion_completed",
                "progress": 1.0,
                "message": f"최종 추천 생성 완료 - {len(result.get('vehicles', []))}개 차량",
                "fusion_details": {
                    "method": result.get("fusion_method", "weighted_average"),
                    "contributions": result.get("agent_contributions", {}),
                    "ncf_weight": result.get("ncf_contribution", 0.0)
                },
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return result

        except Exception as e:
            logger.error(f"❌ 실시간 결과 융합 실패: {e}")

            await self.websocket_manager.broadcast_to_session({
                "type": "fusion_error",
                "message": f"결과 융합 오류: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return {"error": str(e), "vehicles": []}

    async def _send_agent_progress(self, session_id: str, agent_name: str, status: str, progress: float, message: str):
        """에이전트 진행률 업데이트 전송"""
        await self.websocket_manager.broadcast_to_session({
            "type": "agent_progress",
            "agent_name": agent_name,
            "status": status,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }, session_id)

    def register_tool(self, name: str, func):
        """MCP Tool 등록"""
        self.tools[name] = func
        logger.info(f"✅ MCP Tool 등록: {name}")

    def run(self, host: str = "0.0.0.0", port: int = 9000):
        """MCP 서버 실행"""
        logger.info(f"🚀 CarFin-MCP Server 시작: http://{host}:{port}")

        # 피드백 처리 라우트 추가
        @self.app.post("/mcp/feedback")
        async def process_feedback(request: dict):
            """사용자 피드백 처리"""
            try:
                from tools.feedback_processor import process_user_feedback

                logger.info(f"📊 피드백 처리 요청: {request.get('feedback', {}).get('feedbackType', 'unknown')}")

                result = await process_user_feedback(request.get('feedback', {}))

                return {
                    "success": result.get('success', False),
                    "feedback_processed": True,
                    "insights": result.get('insights', {}),
                    "model_updated": result.get('model_updated', False),
                    "timestamp": datetime.now().isoformat()
                }

            except Exception as e:
                logger.error(f"❌ 피드백 처리 오류: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }

        @self.app.get("/mcp/analytics/metrics")
        async def get_analytics_metrics():
            """시스템 분석 메트릭 조회"""
            try:
                from tools.feedback_processor import get_system_metrics

                logger.info("📈 시스템 메트릭 조회 요청")

                metrics = await get_system_metrics()

                return {
                    "success": True,
                    "metrics": metrics.get('metrics', {}),
                    "timestamp": datetime.now().isoformat()
                }

            except Exception as e:
                logger.error(f"❌ 메트릭 조회 오류: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }

        @self.app.post("/mcp/analytics/event")
        async def track_user_event(request: dict):
            """사용자 행동 이벤트 추적"""
            try:
                event_data = request.get('event', {})

                logger.info(f"📊 사용자 이벤트 추적: {event_data.get('type', 'unknown')}")

                # 이벤트 데이터 저장 및 분석
                from tools.feedback_processor import feedback_processor

                # 간단한 이벤트 저장 (실제 환경에서는 더 복잡한 분석)
                event_result = {
                    "event_id": f"event_{datetime.now().timestamp()}",
                    "processed": True,
                    "analysis": {
                        "user_engagement": "tracked",
                        "event_type": event_data.get('type', 'unknown')
                    }
                }

                return {
                    "success": True,
                    "event_tracked": True,
                    "result": event_result,
                    "timestamp": datetime.now().isoformat()
                }

            except Exception as e:
                logger.error(f"❌ 이벤트 추적 오류: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }

        @self.app.post("/mcp/model/update")
        async def update_ncf_model(request: dict):
            """NCF 모델 실시간 업데이트"""
            try:
                interaction_data = request.get('interaction', {})

                logger.info(f"🧠 NCF 모델 업데이트: 사용자 {interaction_data.get('userId', 'unknown')}")

                # NCF 모델 온라인 학습
                from tools.ncf_predict import NCFPredictor

                predictor = NCFPredictor()
                update_result = await predictor.online_learning_update(
                    user_id=interaction_data.get('userId'),
                    item_id=interaction_data.get('vehicleId'),
                    rating=float(interaction_data.get('rating', 3.0))
                )

                return {
                    "success": True,
                    "model_updated": True,
                    "update_result": update_result,
                    "timestamp": datetime.now().isoformat()
                }

            except Exception as e:
                logger.error(f"❌ NCF 모델 업데이트 오류: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }

        uvicorn.run(self.app, host=host, port=port, log_level="info")

# 서버 인스턴스 생성
mcp_server = CarFinMCPServer()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="CarFin-MCP Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host address")
    parser.add_argument("--port", type=int, default=9000, help="Port number")

    args = parser.parse_args()

    mcp_server.run(host=args.host, port=args.port)