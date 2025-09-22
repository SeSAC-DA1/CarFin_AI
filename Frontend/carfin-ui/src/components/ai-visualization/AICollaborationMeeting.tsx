'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentAvatar, AgentType, AgentStatus } from './AgentAvatar';
import { SpeechBubble } from './SpeechBubble';
import { AgentWorkstation } from './AgentWorkstation';
import { Users, Zap, Clock, Target, ArrowRight } from 'lucide-react';
import { UserData, VehicleData } from '@/lib/inference-engines/RealAgentEngine';

// SSE 메시지 타입 정의
interface SSEMessage {
  type: string;
  agent_name?: string;
  status?: string;
  progress?: number;
  message?: string;
  session_id?: string;
  timestamp?: string;
  recommendations?: any;
  [key: string]: any;
}

interface AgentState {
  type: AgentType;
  status: AgentStatus;
  confidenceScore: number;
  currentMessage: string;
  isShowingBubble: boolean;
  isShowingScreen: boolean;
}

interface CollaborationStep {
  step: number;
  title: string;
  description: string;
  activeAgent: AgentType;
  duration: number;
  message: string;
  score: number;
}

const COLLABORATION_STEPS: CollaborationStep[] = [
  {
    step: 1,
    title: '사용자 요구사항 분석',
    description: '총괄 AI가 사용자 데이터를 분석합니다',
    activeAgent: 'gemini_multi_agent',
    duration: 800,
    message: '사용자 프로필 분석 완료!',
    score: 92
  },
  {
    step: 2,
    title: '차량 데이터 검색',
    description: '차량전문가가 매물을 분석합니다',
    activeAgent: 'vehicle_expert',
    duration: 1000,
    message: '가성비 우수한 매물 발견!',
    score: 85
  },
  {
    step: 3,
    title: '금융 옵션 분석',
    description: '금융전문가가 최적 조건을 찾습니다',
    activeAgent: 'finance_expert',
    duration: 900,
    message: '할부 조건 양호 90%!',
    score: 90
  },
  {
    step: 4,
    title: '최종 협의',
    description: '3명이 함께 최종 결론을 도출합니다',
    activeAgent: 'gemini_multi_agent',
    duration: 700,
    message: '완벽한 매칭 완료!',
    score: 96
  }
];

interface AICollaborationMeetingProps {
  isActive?: boolean;
  onCollaborationComplete?: (result: any) => void;
  userQuery?: string;
  userData?: UserData | null;
  vehicleData?: VehicleData[];
  className?: string;
}

export function AICollaborationMeeting({
  isActive = false,
  onCollaborationComplete,
  userQuery = "3천만원 예산으로 가족용 SUV 찾고 있어요",
  userData = null,
  vehicleData = [],
  className = ""
}: AICollaborationMeetingProps) {
  const [agents, setAgents] = useState<AgentState[]>([
    {
      type: 'vehicle_expert',
      status: 'idle',
      confidenceScore: 0,
      currentMessage: '',
      isShowingBubble: false,
      isShowingScreen: false
    },
    {
      type: 'finance_expert',
      status: 'idle',
      confidenceScore: 0,
      currentMessage: '',
      isShowingBubble: false,
      isShowingScreen: false
    },
    {
      type: 'gemini_multi_agent',
      status: 'idle',
      confidenceScore: 0,
      currentMessage: '',
      isShowingBubble: false,
      isShowingScreen: false
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [sseStatus, setSseStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const sseRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  // 에이전트 상태 업데이트 함수
  const updateAgentState = (agentName: string, updates: Partial<AgentState>) => {
    setAgents(prev => prev.map(agent => {
      // 에이전트 이름 매핑
      const agentTypeMap: Record<string, AgentType> = {
        '차량전문가': 'vehicle_expert',
        '금융분석가': 'finance_expert',
        '리뷰분석가': 'gemini_multi_agent'
      };

      const mappedType = agentTypeMap[agentName] || agentName as AgentType;

      if (agent.type === mappedType) {
        return { ...agent, ...updates };
      }
      return agent;
    }));
  };

  // SSE 메시지 처리
  const handleSSEMessage = (message: SSEMessage) => {
    console.log('📡 SSE 메시지:', message);

    switch (message.type) {
      case 'connection_established':
        setIsConnected(true);
        setSseStatus('connected');
        break;

      case 'recommendation_started':
        setOverallProgress(0);
        setCurrentStep(0);
        // 모든 에이전트를 준비 상태로
        setAgents(prev => prev.map(agent => ({
          ...agent,
          status: 'thinking' as AgentStatus,
          currentMessage: '분석 준비 중...'
        })));
        break;

      case 'agent_progress':
        if (message.agent_name && message.status && message.message) {
          const status = message.status === 'starting' ? 'thinking' :
                        message.status === 'analyzing' ? 'thinking' :
                        message.status === 'completed' ? 'success' :
                        message.status === 'error' ? 'error' : 'thinking';

          updateAgentState(message.agent_name, {
            status: status as AgentStatus,
            currentMessage: message.message,
            confidenceScore: Math.round((message.progress || 0) * 100),
            isShowingBubble: true
          });

          // 진행률 업데이트
          if (message.progress) {
            setOverallProgress(prev => Math.max(prev, message.progress * 100));
          }
        }
        break;

      case 'ncf_started':
        setCurrentStep(1);
        updateAgentState('gemini_multi_agent', {
          status: 'thinking',
          currentMessage: 'NCF 딥러닝 모델 추론 시작...',
          isShowingBubble: true
        });
        break;

      case 'ncf_progress':
        updateAgentState('gemini_multi_agent', {
          currentMessage: message.message || 'NCF 모델 추론 중...',
          confidenceScore: Math.round((message.progress || 0) * 100)
        });
        break;

      case 'ncf_completed':
        updateAgentState('gemini_multi_agent', {
          status: 'success',
          currentMessage: message.message || 'NCF 모델 추론 완료',
          confidenceScore: Math.round((message.confidence || 0.85) * 100)
        });
        break;

      case 'fusion_started':
        setCurrentStep(3);
        setAgents(prev => prev.map(agent => ({
          ...agent,
          status: 'thinking' as AgentStatus,
          currentMessage: '결과 융합 중...',
          isShowingBubble: true
        })));
        break;

      case 'fusion_completed':
        setCurrentStep(4);
        setOverallProgress(100);
        setAgents(prev => prev.map(agent => ({
          ...agent,
          status: 'success' as AgentStatus,
          currentMessage: '협업 완료!',
          confidenceScore: 95
        })));
        break;

      case 'recommendation_completed':
        if (message.recommendations && onCollaborationComplete) {
          setTimeout(() => {
            onCollaborationComplete(message.recommendations);
          }, 2000);
        }
        break;

      case 'recommendation_error':
        setAgents(prev => prev.map(agent => ({
          ...agent,
          status: 'error' as AgentStatus,
          currentMessage: '오류가 발생했습니다'
        })));
        break;

      case 'keep_alive':
        // Keep-alive 메시지는 무시
        break;
    }
  };

  // SSE 연결 설정
  useEffect(() => {
    if (!isActive) return;

    const connectSSE = async () => {
      try {
        setSseStatus('connecting');
        const sseUrl = `http://localhost:9000/sse/${sessionIdRef.current}`;
        console.log('🔗 SSE 연결 시도:', sseUrl);

        const eventSource = new EventSource(sseUrl);
        sseRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('✅ SSE 연결 성공');
          setSseStatus('connected');
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            handleSSEMessage(message);
          } catch (error) {
            console.error('❌ SSE 메시지 파싱 오류:', error);
          }
        };

        // 특정 이벤트 타입 처리
        eventSource.addEventListener('connection', (event) => {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            handleSSEMessage(message);
          } catch (error) {
            console.error('❌ SSE 연결 메시지 파싱 오류:', error);
          }
        });

        eventSource.addEventListener('agent_progress', (event) => {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            handleSSEMessage(message);
          } catch (error) {
            console.error('❌ SSE 진행상황 메시지 파싱 오류:', error);
          }
        });

        eventSource.addEventListener('ping', (event) => {
          // Keep-alive 메시지는 무시
        });

        eventSource.onerror = (error) => {
          console.error('❌ SSE 오류:', error);
          setSseStatus('error');
          setIsConnected(false);
          // 백엔드가 없을 경우 시뮬레이션 모드로 폴백
          startSimulationMode();
        };

        // SSE 연결 후 추천 프로세스 시작 요청
        if (userData) {
          setTimeout(async () => {
            try {
              const response = await fetch(`http://localhost:9000/mcp/recommend/realtime/${sessionIdRef.current}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_profile: userData,
                  request_type: 'full_recommendation',
                  limit: 10
                })
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const result = await response.json();
              console.log('✅ 추천 프로세스 시작:', result);
            } catch (error) {
              console.error('❌ 추천 프로세스 시작 실패:', error);
              startSimulationMode();
            }
          }, 1000); // SSE 연결 후 1초 대기
        }

      } catch (error) {
        console.error('❌ SSE 연결 실패:', error);
        setSseStatus('error');
        // 백엔드가 없을 경우 시뮬레이션 모드로 폴백
        startSimulationMode();
      }
    };

    connectSSE();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [isActive, userData]);

  // 시뮬레이션 모드 (백엔드 없을 때)
  const startSimulationMode = () => {
    console.log('🎭 시뮬레이션 모드 시작');
    setIsConnected(true);
    setSseStatus('connected');

    // 기존 시뮬레이션 로직 실행
    simulateCollaboration();
  };

  const simulateCollaboration = () => {
    // 기존 시뮬레이션 로직...
  };
  const [progress, setProgress] = useState(0);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collaborationTime, setCollaborationTime] = useState(0);
  const collaborationRef = useRef<NodeJS.Timeout | null>(null);

  // 에이전트 위치 계산 (원형 배치)
  const getAgentPosition = (index: number) => {
    const angle = (index * 120) - 90; // -90도에서 시작해서 120도씩
    const radius = 120;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y, angle };
  };

  // 협업 시작
  const startCollaboration = () => {
    if (isCollaborating) return;

    setIsCollaborating(true);
    setCurrentStep(0);
    setProgress(0);
    setCollaborationTime(0);

    // 타이머 시작
    const timer = setInterval(() => {
      setCollaborationTime(prev => prev + 100);
    }, 100);

    // 협업 단계 실행
    executeCollaborationSteps();

    return () => {
      clearInterval(timer);
    };
  };

  const executeCollaborationSteps = async () => {
    for (let i = 0; i < COLLABORATION_STEPS.length; i++) {
      const step = COLLABORATION_STEPS[i];
      setCurrentStep(i);
      setProgress((i / COLLABORATION_STEPS.length) * 100);

      // 모든 에이전트를 thinking 상태로
      updateAllAgents('thinking', 0, '');

      await new Promise(resolve => setTimeout(resolve, 300));

      // 현재 단계 에이전트 활성화
      updateAgentStatus(step.activeAgent, 'active', step.score, step.message);

      await new Promise(resolve => setTimeout(resolve, step.duration));

      // 말풍선 표시
      showAgentBubble(step.activeAgent, step.message, step.score);

      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 최종 완료
    setProgress(100);
    updateAllAgents('active', 95, 'Complete!');

    setTimeout(() => {
      setIsCollaborating(false);
      onCollaborationComplete?.({
        totalTime: collaborationTime,
        finalScore: 95,
        steps: COLLABORATION_STEPS
      });
    }, 2000);
  };

  const updateAgentStatus = (type: AgentType, status: AgentStatus, score: number, message: string) => {
    setAgents(prev => prev.map(agent =>
      agent.type === type
        ? {
            ...agent,
            status,
            confidenceScore: score,
            currentMessage: message,
            isShowingScreen: status === 'active' || status === 'thinking'
          }
        : agent
    ));
  };

  const updateAllAgents = (status: AgentStatus, score: number, message: string) => {
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status,
      confidenceScore: score,
      currentMessage: message,
      isShowingScreen: status === 'active' || status === 'thinking'
    })));
  };

  const showAgentBubble = (type: AgentType, message: string, score: number) => {
    setAgents(prev => prev.map(agent =>
      agent.type === type
        ? { ...agent, isShowingBubble: true, currentMessage: message, confidenceScore: score }
        : { ...agent, isShowingBubble: false }
    ));

    setTimeout(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        isShowingBubble: false
      })));
    }, 3000);
  };

  // 자동 시작
  useEffect(() => {
    if (isActive && !isCollaborating) {
      const timeout = setTimeout(() => {
        startCollaboration();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          AI 에이전트 협업 회의실

          {/* SSE 연결 상태 */}
          <Badge
            variant="outline"
            className={`${
              sseStatus === 'connected' ? 'bg-green-100 text-green-800' :
              sseStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
              sseStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {sseStatus === 'connected' && '🟢 실시간 연결'}
            {sseStatus === 'connecting' && '🟡 연결 중...'}
            {sseStatus === 'error' && '🔴 시뮬레이션'}
            {sseStatus === 'disconnected' && '⚪ 준비 중'}
          </Badge>

          {isCollaborating && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              협업 중
            </Badge>
          )}
        </CardTitle>

        {/* 사용자 쿼리 */}
        <motion.div
          className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-sm text-blue-800">
            <strong>사용자 요청:</strong> "{userQuery}"
          </p>
        </motion.div>

        {/* 협업 진행률 */}
        {isCollaborating && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">협업 진행률</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">{(collaborationTime / 1000).toFixed(1)}초</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />

            {/* 현재 단계 */}
            {currentStep < COLLABORATION_STEPS.length && (
              <motion.div
                className="text-center p-2 bg-purple-50 rounded"
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm font-medium text-purple-800">
                  Step {COLLABORATION_STEPS[currentStep].step}: {COLLABORATION_STEPS[currentStep].title}
                </p>
                <p className="text-xs text-purple-600">
                  {COLLABORATION_STEPS[currentStep].description}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="relative">
        {/* 회의실 배경 */}
        <div className="relative w-full h-96 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl overflow-hidden">

          {/* 중앙 테이블 */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={isCollaborating ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full shadow-lg border-4 border-white flex items-center justify-center">
              <Target className="w-8 h-8 text-amber-600" />
            </div>
          </motion.div>

          {/* AI 에이전트들 */}
          {agents.map((agent, index) => {
            const position = getAgentPosition(index);
            return (
              <div key={agent.type}>
                {/* 에이전트 워크스테이션 */}
                <AgentWorkstation
                  agentType={agent.type}
                  status={agent.status}
                  confidenceScore={agent.confidenceScore}
                  isShowingScreen={agent.isShowingScreen}
                  position={{
                    x: position.x + 192, // 화면 중앙 기준 조정
                    y: position.y + 192
                  }}
                  userData={userData}
                  vehicleData={vehicleData}
                  currentStep={currentStep + 1}
                  className="transition-all duration-500"
                />

                {/* 말풍선 */}
                <div className="absolute top-1/2 left-1/2" style={{
                  transform: `translate(${position.x - 50}px, ${position.y - 50}px)`
                }}>
                  <SpeechBubble
                    isVisible={agent.isShowingBubble}
                    agentType={agent.type}
                    message={agent.currentMessage}
                    score={agent.confidenceScore}
                    position={index === 0 ? 'bottom' : index === 1 ? 'left' : 'right'}
                    className={`
                      ${index === 0 ? 'top-20' : ''}
                      ${index === 1 ? 'left-20 top-1/2 transform -translate-y-1/2' : ''}
                      ${index === 2 ? 'right-20 top-1/2 transform -translate-y-1/2' : ''}
                    `}
                  />
                </div>

                {/* 연결선 (테이블로) */}
                {isCollaborating && (
                  <motion.div
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `translate(-1px, -1px)`,
                      transformOrigin: 'center'
                    }}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.3 }}
                  >
                    <svg
                      width="200"
                      height="200"
                      className="absolute -top-24 -left-24"
                    >
                      <motion.line
                        x1="100"
                        y1="100"
                        x2={100 + position.x * 0.8}
                        y2={100 + position.y * 0.8}
                        stroke={agent.status === 'active' ? '#10b981' : '#d1d5db'}
                        strokeWidth="2"
                        strokeDasharray={agent.status === 'active' ? '0' : '5,5'}
                        className="drop-shadow-sm"
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* 협업 효과 */}
          {isCollaborating && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
        </div>

        {/* 시작 버튼 */}
        {!isCollaborating && (
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={startCollaboration}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Users className="w-5 h-5" />
              AI 협업 시작하기
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* 협업 완료 메시지 */}
        {!isCollaborating && progress === 100 && (
          <motion.div
            className="text-center mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-green-800 font-medium">
              🎉 AI 협업 완료! 최적의 결과를 도출했습니다.
            </p>
            <p className="text-green-600 text-sm mt-1">
              총 소요시간: {(collaborationTime / 1000).toFixed(1)}초
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}