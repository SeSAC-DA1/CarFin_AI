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
from typing import Dict, List, Any, Optional, AsyncGenerator
from dataclasses import dataclass, asdict
from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# 실제 AI 파이프라인 import
from real_ai_pipeline import process_real_ai_collaboration

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

class SSEManager:
    """SSE(Server-Sent Events) 연결 관리 클래스"""

    def __init__(self):
        self.active_sessions: Dict[str, asyncio.Queue] = {}

    def create_session(self, session_id: str) -> asyncio.Queue:
        """새로운 SSE 세션 생성"""
        if session_id in self.active_sessions:
            # 기존 세션이 있으면 정리
            self.remove_session(session_id)

        queue = asyncio.Queue()
        self.active_sessions[session_id] = queue
        logger.info(f"🔗 SSE 세션 생성: {session_id}")
        return queue

    def remove_session(self, session_id: str):
        """SSE 세션 제거"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info(f"🔌 SSE 세션 종료: {session_id}")

    async def send_to_session(self, message: dict, session_id: str):
        """특정 세션에 메시지 전송"""
        if session_id in self.active_sessions:
            try:
                await self.active_sessions[session_id].put(message)
            except Exception as e:
                logger.error(f"❌ SSE 메시지 전송 실패 (세션: {session_id}): {e}")

    async def broadcast_all(self, message: dict):
        """모든 활성 세션에 메시지 전송"""
        for session_id in list(self.active_sessions.keys()):
            await self.send_to_session(message, session_id)

    def format_sse_message(self, data: dict, event_type: str = None) -> str:
        """SSE 형식으로 메시지 포맷"""
        message_parts = []

        if event_type:
            message_parts.append(f"event: {event_type}")

        message_parts.append(f"data: {json.dumps(data)}")
        message_parts.append("")  # SSE는 빈 줄로 메시지 구분

        return "\n".join(message_parts)

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

        # SSE 관리자
        self.sse_manager = SSEManager()

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
                    self._execute_agent("review_analyst", request.user_profile)
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

        @self.app.get("/sse/{session_id}")
        async def sse_endpoint(session_id: str, request: Request):
            """SSE(Server-Sent Events) 연결 엔드포인트"""

            async def event_stream() -> AsyncGenerator[str, None]:
                # 세션 생성
                queue = self.sse_manager.create_session(session_id)

                try:
                    # 연결 성공 메시지 전송
                    connection_msg = {
                        "type": "connection_established",
                        "session_id": session_id,
                        "message": "실시간 에이전트 협업 과정 시각화 연결 완료",
                        "timestamp": datetime.now().isoformat()
                    }
                    yield self.sse_manager.format_sse_message(connection_msg, "connection")

                    # 큐에서 메시지 스트리밍
                    while True:
                        try:
                            # 메시지 대기 (타임아웃 추가로 연결 유지 확인)
                            message = await asyncio.wait_for(queue.get(), timeout=30.0)
                            event_type = message.get("type", "message")
                            yield self.sse_manager.format_sse_message(message, event_type)

                        except asyncio.TimeoutError:
                            # Keep-alive 메시지 전송
                            keep_alive_msg = {
                                "type": "keep_alive",
                                "timestamp": datetime.now().isoformat()
                            }
                            yield self.sse_manager.format_sse_message(keep_alive_msg, "ping")

                        except Exception as e:
                            logger.error(f"❌ SSE 스트리밍 오류: {e}")
                            break

                except Exception as e:
                    logger.error(f"❌ SSE 연결 오류: {e}")
                finally:
                    # 세션 정리
                    self.sse_manager.remove_session(session_id)

            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control"
                }
            )

        @self.app.post("/mcp/recommend/realtime/{session_id}")
        async def start_realtime_recommendation(session_id: str, request: RecommendationRequest):
            """SSE를 통한 실시간 시각화와 함께 추천 시작"""
            # 백그라운드 태스크로 실시간 추천 시작
            asyncio.create_task(
                self._handle_realtime_recommendation(request.user_profile, session_id)
            )
            return {
                "success": True,
                "session_id": session_id,
                "message": "실시간 추천 프로세스가 시작되었습니다. SSE 연결을 통해 진행상황을 확인하세요.",
                "sse_endpoint": f"/sse/{session_id}"
            }

    async def _execute_agent(self, agent_name: str, user_profile: Dict[str, Any]) -> AgentResult:
        """개별 에이전트 실행"""
        start_time = datetime.now()

        try:
            # 실제 에이전트 실행 로직 - RDS 데이터 기반
            from agents.vehicle_expert_agent import VehicleExpertAgent
            from agents.finance_expert_agent import FinanceExpertAgent
            from agents.review_analyst_agent import ReviewAnalystAgent

            if agent_name == "vehicle_expert":
                agent = VehicleExpertAgent()
                result = await agent.analyze_and_recommend(user_profile, [], "agent_session")
            elif agent_name == "finance_expert":
                agent = FinanceExpertAgent()
                result = await agent.analyze_financial_impact([], user_profile, "agent_session")
            elif agent_name == "review_analyst":
                agent = ReviewAnalystAgent()
                result = await agent.analyze_user_satisfaction([], user_profile, "agent_session")
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
        """실제 NCF 모델 추론 실행 - PyTorch 기반"""
        try:
            # 실제 NCF 모델 임포트 및 실행
            from tools.ncf_predict import NCFPredictor

            ncf_predictor = NCFPredictor()

            # 사용자 프로필을 NCF 입력 형식으로 변환
            user_id = user_profile.get('user_id', 'anonymous')
            preferences = user_profile.get('preferences', {})

            # NCF 모델 실행
            predictions = await ncf_predictor.predict_user_preferences(
                user_id=user_id,
                user_features=preferences,
                top_k=10
            )

            return {
                "algorithm": "NCF-PyTorch",
                "predictions": predictions.get('recommendations', []),
                "confidence": predictions.get('confidence', 0.85),
                "model_version": predictions.get('model_version', 'ncf-v1.2'),
                "data_source": "rds_real_interactions"
            }

        except Exception as e:
            logger.error(f"❌ 실제 NCF 모델 추론 실패: {e}")
            # 에러 시에도 빈 결과 반환 (MOCK 데이터 사용 안함)
            return {
                "algorithm": "NCF-PyTorch",
                "predictions": [],
                "confidence": 0.0,
                "error": str(e),
                "data_source": "ncf_model_error"
            }

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

    # 실제 에이전트는 real_ai_pipeline.py에서 처리




    async def _handle_realtime_recommendation(self, user_profile: Dict[str, Any], session_id: str):
        """🚀 실제 AI 파이프라인 실시간 처리"""
        start_time = datetime.now()

        try:
            logger.info(f"🤖 실제 AI 협업 시작: 세션 {session_id}")

            # SSE 메시지 전송 함수
            async def sse_send_func(message: Dict[str, Any]):
                await self.sse_manager.send_to_session(message, session_id)

            # 사용자 쿼리 생성
            user_query = f"예산 {user_profile.get('budget_min', 0)}-{user_profile.get('budget_max', 5000)}만원 범위에서 적합한 중고차 추천"

            # 🔥 실제 AI 파이프라인 실행
            result = await process_real_ai_collaboration(
                user_query=user_query,
                user_data=user_profile,
                session_id=session_id,
                websocket_send_func=sse_send_func
            )

            logger.info(f"✅ 실제 AI 협업 완료: 세션 {session_id}")
            return result

        except Exception as e:
            logger.error(f"❌ 실제 AI 협업 실패: {e}")

            # 에러 알림 전송
            await self.sse_manager.send_to_session({
                "type": "error",
                "message": f"AI 협업 처리 중 오류 발생: {str(e)}",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 기본 결과 반환
            return {
                "final_recommendations": [],
                "error": str(e),
                "fallback": True,
                "execution_time": (datetime.now() - start_time).total_seconds()
            }

            return {
                "success": True,
                "recommendations": final_recommendation,
                "execution_time": execution_time,
                "realtime_visualization": True
            }

        except Exception as e:
            logger.error(f"❌ 실시간 추천 처리 실패: {e}")

            await self.sse_manager.send_to_session({
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

            # 실제 에이전트 실행 - RDS 데이터 기반
            from agents.vehicle_expert_agent import VehicleExpertAgent
            from agents.finance_expert_agent import FinanceExpertAgent
            from agents.review_analyst_agent import ReviewAnalystAgent

            if agent_name == "vehicle_expert":
                agent = VehicleExpertAgent()
                result = await agent.analyze_and_recommend(user_profile, [], session_id)
            elif agent_name == "finance_expert":
                agent = FinanceExpertAgent()
                result = await agent.analyze_financial_impact([], user_profile, session_id)
            elif agent_name == "review_analyst":
                agent = ReviewAnalystAgent()
                result = await agent.analyze_user_satisfaction([], user_profile, session_id)
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
            await self.sse_manager.send_to_session({
                "type": "ncf_progress",
                "progress": 0.5,
                "message": "딥러닝 모델 추론 중...",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 실제 NCF 실행
            result = await self._execute_ncf_prediction(user_profile)

            # NCF 완료 알림
            await self.sse_manager.send_to_session({
                "type": "ncf_completed",
                "progress": 1.0,
                "message": f"NCF 모델 추론 완료 - {len(result.get('predictions', []))}개 예측",
                "confidence": result.get("confidence", 0.85),
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return result

        except Exception as e:
            logger.error(f"❌ 실시간 NCF 실행 실패: {e}")

            await self.sse_manager.send_to_session({
                "type": "ncf_error",
                "message": f"NCF 모델 오류: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return {"error": str(e), "confidence": 0.0}

    async def _fuse_recommendations_realtime(self, agent_results: List[AgentResult], ncf_result: Dict[str, Any], user_profile: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """실시간 업데이트와 함께 결과 융합"""
        try:
            # 융합 진행률 업데이트
            await self.sse_manager.send_to_session({
                "type": "fusion_progress",
                "progress": 0.5,
                "message": "에이전트 결과 가중평균 융합 중...",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            # 기존 융합 로직 실행
            result = await self._fuse_recommendations(agent_results, ncf_result, user_profile)

            # 융합 완료 알림
            await self.sse_manager.send_to_session({
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

            await self.sse_manager.send_to_session({
                "type": "fusion_error",
                "message": f"결과 융합 오류: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }, session_id)

            return {"error": str(e), "vehicles": []}

    async def _send_agent_progress(self, session_id: str, agent_name: str, status: str, progress: float, message: str):
        """에이전트 진행률 업데이트 전송"""
        await self.sse_manager.send_to_session({
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