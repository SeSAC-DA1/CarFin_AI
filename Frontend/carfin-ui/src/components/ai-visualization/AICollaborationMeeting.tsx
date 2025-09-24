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
        {/* 회의실 배경 - Enhanced */}
        <div className="relative w-full h-[500px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 rounded-xl overflow-hidden border-2 border-purple-500/30">
          {/* 배경 파티클 효과 */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* AI 네트워크 그리드 */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
              {[...Array(64)].map((_, i) => (
                <motion.div
                  key={i}
                  className="border border-cyan-500/20"
                  animate={isCollaborating ? {
                    borderColor: [
                      'rgba(6, 182, 212, 0.1)',
                      'rgba(6, 182, 212, 0.3)',
                      'rgba(6, 182, 212, 0.1)'
                    ]
                  } : {}}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                />
              ))}
            </div>
          </div>

          {/* 중앙 AI 코어 - Enhanced */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
            animate={isCollaborating ? {
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            } : { scale: 1 }}
            transition={{
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          >
            <div className="relative">
              {/* 외부 링 */}
              <div className="w-40 h-40 border-4 border-gradient-to-r from-cyan-400 to-purple-500 rounded-full">
                {/* 내부 코어 */}
                <div className="absolute inset-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full shadow-2xl flex items-center justify-center">
                  <motion.div
                    animate={isCollaborating ? {
                      boxShadow: [
                        '0 0 20px rgba(59, 130, 246, 0.5)',
                        '0 0 60px rgba(168, 85, 247, 0.8)',
                        '0 0 20px rgba(59, 130, 246, 0.5)'
                      ]
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur"
                  >
                    <Target className="w-10 h-10 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* 중앙에서 에이전트로 향하는 데이터 빔 */}
              {isCollaborating && agents.map((agent, index) => {
                const position = getAgentPosition(index);
                return (
                  <motion.div
                    key={`beam-${index}`}
                    className="absolute top-1/2 left-1/2 w-1 origin-left"
                    style={{
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0) 100%)',
                      transform: `rotate(${Math.atan2(position.y, position.x) * 180 / Math.PI}deg)`,
                      width: `${Math.sqrt(position.x * position.x + position.y * position.y)}px`
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scaleX: [0, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  />
                );
              })}
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

          {/* Enhanced 협업 효과 */}
          {isCollaborating && (
            <>
              {/* 배경 그라데이션 효과 */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-5"
                animate={{
                  background: [
                    'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                    'radial-gradient(circle at 30% 70%, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
                    'radial-gradient(circle at 70% 30%, rgba(34, 197, 94, 0.2) 0%, transparent 65%)',
                    'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 70%)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* 에너지 파장 */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                animate={{
                  scale: [0, 2, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <div className="w-80 h-80 border-2 border-cyan-400/30 rounded-full" />
              </motion.div>

              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5
                }}
              >
                <div className="w-60 h-60 border-2 border-purple-400/40 rounded-full" />
              </motion.div>

              {/* 내비게이션 버블 */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`bubble-${i}`}
                  className="absolute w-4 h-4 bg-gradient-to-br from-cyan-400/60 to-transparent rounded-full pointer-events-none"
                  style={{
                    left: `${20 + (i * 10)}%`,
                    top: `${30 + Math.sin(i) * 20}%`
                  }}
                  animate={{
                    y: [-20, -40, -20],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}

              {/* 🚀 ENHANCED: 에이전트 간 데이터 플로우 연결선 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 8 }}>
                {/* Vehicle Expert → Finance Expert */}
                <motion.path
                  d={getDataFlowPath(0, 1)}
                  fill="none"
                  stroke="url(#gradient1)"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: 0.5
                  }}
                />

                {/* Finance Expert → Gemini Multi Agent */}
                <motion.path
                  d={getDataFlowPath(1, 2)}
                  fill="none"
                  stroke="url(#gradient2)"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: 1
                  }}
                />

                {/* Gemini Multi Agent → Vehicle Expert */}
                <motion.path
                  d={getDataFlowPath(2, 0)}
                  fill="none"
                  stroke="url(#gradient3)"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: 1.5
                  }}
                />

                {/* 그라데이션 정의 */}
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.8)" />
                    <stop offset="100%" stopColor="rgba(34, 197, 94, 0.4)" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* 🎆 추가 시각 효과: 데이터 패킷 애니메이션 */}
              {[...Array(6)].map((_, i) => {
                const positions = [
                  { from: 0, to: 1 }, // Vehicle → Finance
                  { from: 1, to: 2 }, // Finance → Gemini
                  { from: 2, to: 0 }, // Gemini → Vehicle
                  { from: 1, to: 0 }, // Finance → Vehicle (역방향)
                  { from: 2, to: 1 }, // Gemini → Finance (역방향)
                  { from: 0, to: 2 }  // Vehicle → Gemini (직접)
                ];
                const flow = positions[i];
                const fromPos = getAgentPosition(flow.from);
                const toPos = getAgentPosition(flow.to);

                return (
                  <motion.div
                    key={`data-packet-${i}`}
                    className="absolute w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-lg pointer-events-none"
                    style={{ zIndex: 10 }}
                    animate={{
                      x: [fromPos.x + 192, toPos.x + 192],
                      y: [fromPos.y + 192, toPos.y + 192],
                      scale: [0.5, 1, 0.5],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Enhanced 시작 버튼 */}
        {!isCollaborating && (
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={startCollaboration}
              className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 flex items-center gap-3 mx-auto overflow-hidden"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* 버튼 배경 글로우 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-500/20 blur-xl" />

              {/* 콘텐츠 */}
              <div className="relative flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Users className="w-6 h-6" />
                </motion.div>
                <span className="text-xl">AI 전문가 협업 시작</span>
                <motion.div
                  animate={{
                    x: [0, 5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </div>

              {/* 버튼 파티클 */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/60 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </motion.button>

            {/* 버튼 설명 */}
            <motion.p
              className="text-slate-400 text-sm mt-4 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              🎆 3명의 AI 전문가가 당신의 요구사항을 분석하고 실시간으로 협업합니다
            </motion.p>
          </motion.div>
        )}

        {/* Enhanced 협업 완료 메시지 */}
        {!isCollaborating && progress === 100 && (
          <motion.div
            className="text-center mt-6 p-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl border border-green-400/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl mx-auto">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🎆
                </motion.div>
              </div>
            </motion.div>

            <motion.h3
              className="text-2xl font-bold text-green-300 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              AI 협업 분석 완료!
            </motion.h3>

            <motion.p
              className="text-green-200 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              3명의 전문가가 협업하여 최적의 차량 추천 결과를 도출했습니다.
            </motion.p>

            <motion.div
              className="flex justify-center space-x-6 text-sm text-green-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>총 소요시간: {(collaborationTime / 1000).toFixed(1)}초</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>신뢰도: 95%</span>
              </div>
            </motion.div>

            {/* 성과 배경 효과 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400/40 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// 유틸리티 함수: 에이전트 위치 계산
function getAgentPosition(index: number): { x: number; y: number } {
  const radius = 140; // 중앙에서의 거리
  const angles = [
    -Math.PI / 2,     // 상단 (vehicle_expert)
    -Math.PI * 7 / 6, // 좌하단 (finance_expert)
    -Math.PI / 6      // 우하단 (gemini_multi_agent)
  ];

  const angle = angles[index] || 0;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

// 추가 유틸리티: 데이터 플로우 애니메이션 경로
function getDataFlowPath(fromIndex: number, toIndex: number): string {
  const from = getAgentPosition(fromIndex);
  const to = getAgentPosition(toIndex);

  // 베지어 곡선으로 부드러운 경로 생성
  const controlX = (from.x + to.x) / 2;
  const controlY = (from.y + to.y) / 2 - 50; // 약간 위로 휘어지게

  return `M ${from.x + 192} ${from.y + 192} Q ${controlX + 192} ${controlY + 192} ${to.x + 192} ${to.y + 192}`;
}