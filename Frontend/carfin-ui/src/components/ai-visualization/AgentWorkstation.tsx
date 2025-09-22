'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Terminal, Globe, Brain } from 'lucide-react';
import { AgentAvatar, AgentType, AgentStatus } from './AgentAvatar';
import { UserData, VehicleData } from '@/lib/utils/dataMapping';
import {
  VehicleExpertEngine,
  FinanceExpertEngine,
  CoordinatorEngine
} from '@/lib/inference-engines/RealAgentEngine';

interface AgentWorkstationProps {
  agentType: AgentType;
  status: AgentStatus;
  confidenceScore?: number;
  isShowingScreen?: boolean;
  className?: string;
  position: { x: number; y: number };
  userData?: UserData;
  vehicleData?: VehicleData[];
  currentStep?: number;
}

interface WorkScreen {
  type: 'terminal' | 'browser' | 'neural';
  content: string[];
  progress: number;
  isActive: boolean;
}

// Dynamic content generation functions
const generateVehicleExpertContent = (userData?: UserData, vehicleData?: VehicleData[], currentStep?: number): string[] => {
  if (!userData) {
    return [
      'postgres=# -- Waiting for user data...',
      'System ready for vehicle analysis',
      'Database connection: ✓ Active',
      'Indices optimized: ✓ Ready'
    ];
  }

  const query = VehicleExpertEngine.generateDynamicQuery(userData);
  const queryLines = query.split('\n');

  const baseLines = [
    'postgres=# -- Real-time vehicle analysis',
    ...queryLines,
    '',
    `✓ Budget range: ${userData.budget[0]}-${userData.budget[1]}만원`,
    `✓ Family size: ${userData.familySize}인 가족`,
    userData.bodyType ? `✓ Body type: ${userData.bodyType.toUpperCase()}` : '✓ All body types included',
    userData.fuelType ? `✓ Fuel preference: ${userData.fuelType}` : '',
  ];

  if (vehicleData && vehicleData.length > 0) {
    const analysis = VehicleExpertEngine.analyzeVehicles(userData, vehicleData);
    const topVehicles = analysis.calculations.topMatches;

    return [
      ...baseLines,
      '',
      `✓ Found ${vehicleData.length} vehicles`,
      '✓ Applying scoring algorithm...',
      '✓ Ranking by compatibility...',
      '',
      ...topVehicles.slice(0, 4).map((v: any) =>
        `${v.vehicle.brand} ${v.vehicle.model} ${v.vehicle.year} - ${v.vehicle.price}만원 - Score: ${v.score}/100`
      ),
      '',
      `→ Top ${Math.min(5, topVehicles.length)} matches identified`,
      `→ Average score: ${analysis.calculations.averageScore}/100`,
      '→ Analysis complete!'
    ];
  }

  return [...baseLines, '', '⏳ Loading vehicle database...'];
};

const generateFinanceExpertContent = (userData?: UserData, vehiclePrice?: number, currentStep?: number): string[] => {
  if (!userData) {
    return [
      '[은행포털] 금융상품 검색 준비',
      '',
      '🏦 연결 상태:',
      '• 신한은행: 대기중',
      '• 국민은행: 대기중',
      '• 하나은행: 대기중',
      '• 현대캐피탈: 대기중'
    ];
  }

  const defaultPrice = vehiclePrice || 3000;
  const result = FinanceExpertEngine.calculateLoanOptions(userData, defaultPrice);
  const { creditScore, loanOptions, bestOption } = result.calculations;

  return [
    '[금융상품비교] 실시간 금리 조회',
    '',
    `👤 신용점수 추정: ${creditScore}점`,
    `💰 차량가격: ${defaultPrice.toLocaleString()}만원`,
    `📊 월소득: ${userData.income.toLocaleString()}만원`,
    '',
    '🔍 금리 비교 결과:',
    ...loanOptions.map(option =>
      `✓ ${option.bank}: ${option.rate.toFixed(1)}% (수수료 ${option.fees}만원)`
    ),
    '',
    '💡 최적 조건:',
    `• ${bestOption.bank} ${bestOption.rate.toFixed(1)}%`,
    `• 60개월: 월 ${bestOption.monthly60.toLocaleString()}만원`,
    `• 72개월: 월 ${bestOption.monthly72.toLocaleString()}만원`,
    '',
    `📈 소득대비 비율: ${result.calculations.affordabilityRatio.toFixed(1)}%`,
    result.calculations.affordabilityRatio < 30 ? '✅ 승인 가능성 높음' : '⚠️ 부채비율 검토 필요'
  ];
};

const generateCoordinatorContent = (userData?: UserData, vehicleData?: VehicleData[], currentStep?: number): string[] => {
  if (!userData || !vehicleData) {
    return [
      '🧠 Multi-Agent Coordinator AI',
      '🔄 Initializing neural pathways...',
      '',
      '📡 Agent Status:',
      '• Vehicle Expert: Standby',
      '• Finance Expert: Standby',
      '• NCF Engine: Loading...',
      '',
      '⏳ Waiting for agent data...'
    ];
  }

  // Get real analysis results
  const vehicleResult = VehicleExpertEngine.analyzeVehicles(userData, vehicleData);
  const financeResult = FinanceExpertEngine.calculateLoanOptions(userData, vehicleData[0]?.price || 3000);
  const synthesis = CoordinatorEngine.synthesizeRecommendations(userData, vehicleResult, financeResult);

  const finalRecs = synthesis.calculations.finalRecommendations;
  const topRec = finalRecs[0];

  return [
    '🧠 Neural Network Processing...',
    `[████████${currentStep === 4 ? '██' : '░░'}] ${currentStep === 4 ? '100' : '87'}% Complete`,
    '',
    '📊 Multi-Agent 종합분석:',
    `• 차량전문가 신뢰도: ${vehicleResult.confidence.toFixed(1)}%`,
    `• 금융전문가 신뢰도: ${financeResult.confidence.toFixed(1)}%`,
    `• 가족구성: ${userData.familySize}인 → Weight: 0.9`,
    `• 예산적합도: ${userData.budget[0]}-${userData.budget[1]}만원`,
    '',
    '🎯 최종 추천 결과:',
    topRec ? `• ${topRec.vehicle.brand} ${topRec.vehicle.model}: ${topRec.finalScore}점 (최적)` : '• 분석 중...',
    ...finalRecs.slice(1, 3).map((rec: any) =>
      `• ${rec.vehicle.brand} ${rec.vehicle.model}: ${rec.finalScore}점`
    ),
    '',
    '⚡ 실시간 계산 완료!',
    `✓ 종합 신뢰도: ${synthesis.confidence}%`
  ];
};

export function AgentWorkstation({
  agentType,
  status,
  confidenceScore,
  isShowingScreen = false,
  className = '',
  position,
  userData,
  vehicleData,
  currentStep
}: AgentWorkstationProps) {
  // Generate dynamic content based on agent type and real data
  const generateContent = () => {
    switch (agentType) {
      case 'vehicle_expert':
        return generateVehicleExpertContent(userData, vehicleData, currentStep);
      case 'finance_expert':
        const avgPrice = vehicleData && vehicleData.length > 0
          ? vehicleData.reduce((sum, v) => sum + v.price, 0) / vehicleData.length
          : undefined;
        return generateFinanceExpertContent(userData, avgPrice, currentStep);
      case 'gemini_multi_agent':
        return generateCoordinatorContent(userData, vehicleData, currentStep);
      default:
        return ['System ready...'];
    }
  };

  const screenContent = {
    type: agentType === 'vehicle_expert' ? 'terminal' :
          agentType === 'finance_expert' ? 'browser' : 'neural',
    lines: generateContent()
  } as const;

  const getScreenStyle = () => {
    switch (screenContent.type) {
      case 'terminal':
        return {
          bg: 'bg-gray-900',
          text: 'text-green-400',
          header: 'PostgreSQL Terminal',
          icon: Terminal
        };
      case 'browser':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          header: 'Finance Search',
          icon: Globe
        };
      case 'neural':
        return {
          bg: 'bg-purple-900',
          text: 'text-purple-100',
          header: 'AI Processing',
          icon: Brain
        };
    }
  };

  const screenStyle = getScreenStyle();
  const IconComponent = screenStyle.icon;

  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        left: position.x - 50,
        top: position.y - 50,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Agent Avatar */}
      <div className="relative">
        <AgentAvatar
          type={agentType}
          status={status}
          confidenceScore={confidenceScore}
          size="large"
        />

        {/* Work Screen */}
        <AnimatePresence>
          {isShowingScreen && (
            <motion.div
              className="absolute -right-72 top-0 z-10"
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {/* Monitor Frame */}
              <div className="relative">
                {/* Screen Border */}
                <div className="w-80 h-64 bg-gray-800 rounded-lg p-2 shadow-2xl border-4 border-gray-700">
                  {/* Screen Header */}
                  <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-gray-700 rounded">
                    <IconComponent className="w-4 h-4 text-gray-300" />
                    <span className="text-xs font-medium text-gray-300">
                      {screenStyle.header}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className={`w-full h-48 ${screenStyle.bg} rounded p-3 overflow-hidden`}>
                    <div className={`${screenStyle.text} font-mono text-xs leading-relaxed`}>
                      {screenContent.lines.map((line, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: index * 0.1,
                            duration: 0.3
                          }}
                          className="whitespace-pre-wrap"
                        >
                          {line}
                        </motion.div>
                      ))}

                      {/* Typing Cursor */}
                      <motion.span
                        className={`${screenStyle.text} opacity-75`}
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        ▋
                      </motion.span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {status === 'active' && (
                    <motion.div
                      className="absolute bottom-1 left-2 right-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <motion.div
                          className="bg-blue-500 h-1 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Connection Line to Avatar */}
                <motion.div
                  className="absolute right-full top-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{ transformOrigin: 'right' }}
                />

                {/* Screen Glow Effect */}
                <motion.div
                  className="absolute inset-0 bg-blue-500/20 rounded-lg blur-xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monitor Icon Indicator */}
        {!isShowingScreen && status !== 'idle' && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Monitor className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}