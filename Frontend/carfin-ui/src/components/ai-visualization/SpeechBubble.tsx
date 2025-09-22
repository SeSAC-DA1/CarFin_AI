'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AgentType } from './AgentAvatar';

interface SpeechBubbleProps {
  isVisible: boolean;
  agentType: AgentType;
  message: string;
  score?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  autoHide?: boolean;
  duration?: number;
}

const AGENT_COLORS = {
  vehicle_expert: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    accent: 'bg-green-500',
  },
  finance_expert: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    accent: 'bg-yellow-500',
  },
  gemini_multi_agent: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    accent: 'bg-purple-500',
  }
};

const TAIL_POSITIONS = {
  top: {
    tailClass: 'bottom-full left-1/2 transform -translate-x-1/2',
    borderClass: 'border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent',
  },
  bottom: {
    tailClass: 'top-full left-1/2 transform -translate-x-1/2',
    borderClass: 'border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent',
  },
  left: {
    tailClass: 'right-full top-1/2 transform -translate-y-1/2',
    borderClass: 'border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent',
  },
  right: {
    tailClass: 'left-full top-1/2 transform -translate-y-1/2',
    borderClass: 'border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent',
  }
};

export function SpeechBubble({
  isVisible,
  agentType,
  message,
  score,
  position = 'top',
  className = '',
  autoHide = true,
  duration = 3000
}: SpeechBubbleProps) {
  const colors = AGENT_COLORS[agentType];
  const tailConfig = TAIL_POSITIONS[position];

  const bubbleVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 20 : position === 'bottom' ? -20 : 0,
      x: position === 'left' ? 20 : position === 'right' ? -20 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1,
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`absolute z-50 ${className}`}
          variants={bubbleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          {...(autoHide && {
            animate: [
              "visible",
              "visible",
              "exit"
            ],
            transition: {
              times: [0, 0.8, 1],
              duration: duration / 1000
            }
          })}
        >
          {/* 말풍선 본체 */}
          <div className={`
            relative
            ${colors.bg}
            ${colors.border}
            border-2
            rounded-lg
            px-4 py-3
            shadow-lg
            max-w-xs
            min-w-[120px]
          `}>

            {/* 말풍선 꼬리 */}
            <div
              className={`
                absolute
                ${tailConfig.tailClass}
                w-0 h-0
                ${tailConfig.borderClass}
                ${colors.border.replace('border-', 'border-b-').replace('200', '200')}
              `}
            />

            {/* 메시지 내용 */}
            <motion.div
              variants={textVariants}
              className="space-y-2"
            >
              <p className={`${colors.text} text-sm font-medium leading-relaxed`}>
                {message}
              </p>

              {/* 점수 표시 */}
              {score !== undefined && (
                <div className="flex items-center justify-between">
                  <Badge
                    className={`
                      ${colors.accent}
                      text-white
                      text-xs
                      px-2 py-1
                      shadow-sm
                    `}
                  >
                    {score}%
                  </Badge>

                  {/* 점수 바 */}
                  <div className="flex-1 ml-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`${colors.accent} h-2 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 반짝임 효과 */}
            <motion.div
              className="absolute inset-0 bg-white rounded-lg"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.1, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* 타이핑 애니메이션 점들 */}
          <motion.div
            className="absolute bottom-2 right-2 flex space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-1 h-1 ${colors.accent} rounded-full`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}