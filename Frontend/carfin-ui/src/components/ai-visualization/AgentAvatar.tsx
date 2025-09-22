'use client';

import { motion } from 'framer-motion';
import { Car, DollarSign, Brain, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type AgentType = 'vehicle_expert' | 'finance_expert' | 'gemini_multi_agent';

export type AgentStatus = 'idle' | 'thinking' | 'active' | 'speaking' | 'processing';

interface AgentAvatarProps {
  type: AgentType;
  status: AgentStatus;
  confidenceScore?: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const AGENT_CONFIG = {
  vehicle_expert: {
    name: '차량전문가',
    icon: Car,
    emoji: '🚗',
    colors: {
      primary: 'bg-green-500',
      secondary: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      glow: 'shadow-green-500/30',
    }
  },
  finance_expert: {
    name: '금융전문가',
    icon: DollarSign,
    emoji: '💰',
    colors: {
      primary: 'bg-yellow-500',
      secondary: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      glow: 'shadow-yellow-500/30',
    }
  },
  gemini_multi_agent: {
    name: '총괄 AI',
    icon: Brain,
    emoji: '🧠',
    colors: {
      primary: 'bg-purple-500',
      secondary: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-300',
      glow: 'shadow-purple-500/30',
    }
  }
};

const SIZE_CONFIG = {
  small: { avatar: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xs' },
  medium: { avatar: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-sm' },
  large: { avatar: 'w-24 h-24', icon: 'w-12 h-12', text: 'text-base' }
};

export function AgentAvatar({
  type,
  status,
  confidenceScore,
  className = '',
  size = 'medium',
  onClick
}: AgentAvatarProps) {
  const config = AGENT_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = config.icon;

  const getStatusAnimation = () => {
    switch (status) {
      case 'thinking':
        return {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        };
      case 'active':
        return {
          scale: [1, 1.2, 1],
          boxShadow: [
            `0 0 0 0 ${config.colors.primary.replace('bg-', 'rgba(')}`,
            `0 0 0 10px rgba(59, 130, 246, 0)`,
            `0 0 0 0 rgba(59, 130, 246, 0)`
          ],
          transition: {
            duration: 1.5,
            repeat: Infinity
          }
        };
      case 'speaking':
        return {
          y: [0, -5, 0],
          transition: {
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }
        };
      case 'processing':
        return {
          rotate: [0, 360],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }
        };
      default:
        return {};
    }
  };

  const getGlowIntensity = () => {
    switch (status) {
      case 'active':
      case 'speaking':
        return 'shadow-2xl';
      case 'thinking':
      case 'processing':
        return 'shadow-lg';
      default:
        return 'shadow-md';
    }
  };

  return (
    <div className={`relative flex flex-col items-center space-y-2 ${className}`}>
      {/* 아바타 원형 */}
      <motion.div
        className={`
          ${sizeConfig.avatar}
          ${config.colors.primary}
          ${config.colors.glow}
          ${getGlowIntensity()}
          rounded-full
          flex items-center justify-center
          cursor-pointer
          relative
          overflow-hidden
          border-2 border-white
        `}
        animate={getStatusAnimation()}
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

        {/* 아이콘 */}
        {status === 'processing' ? (
          <Loader2 className={`${sizeConfig.icon} text-white animate-spin`} />
        ) : (
          <IconComponent className={`${sizeConfig.icon} text-white drop-shadow-sm`} />
        )}

        {/* 상태 표시 점 */}
        <motion.div
          className={`
            absolute -top-1 -right-1 w-4 h-4 rounded-full
            ${status === 'active' ? 'bg-green-400' :
              status === 'thinking' ? 'bg-blue-400' :
              status === 'speaking' ? 'bg-red-400' :
              status === 'processing' ? 'bg-orange-400' : 'bg-gray-400'}
            border-2 border-white shadow-sm
          `}
          animate={status !== 'idle' ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>

      {/* 에이전트 이름 */}
      <div className="text-center">
        <p className={`${sizeConfig.text} font-medium text-gray-700`}>
          {config.name}
        </p>

        {/* 신뢰도 점수 */}
        {confidenceScore !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1"
          >
            <Badge
              variant="outline"
              className={`
                ${config.colors.secondary}
                ${config.colors.text}
                ${config.colors.border}
                text-xs px-2 py-1
              `}
            >
              신뢰도 {confidenceScore}%
            </Badge>
          </motion.div>
        )}
      </div>

      {/* 상태 텍스트 */}
      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 text-center"
        >
          {status === 'thinking' && '🤔 분석 중...'}
          {status === 'active' && '⚡ 활성화'}
          {status === 'speaking' && '💬 의견 제시'}
          {status === 'processing' && '⚙️ 처리 중...'}
        </motion.div>
      )}
    </div>
  );
}