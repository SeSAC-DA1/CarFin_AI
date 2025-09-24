'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface TossStyleHomeProps {
  onCategorySelect: (category: 'economy' | 'family' | 'hobby') => void;
  userName?: string;
}

export function TossStyleHome({ onCategorySelect, userName = "반가워요" }: TossStyleHomeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: 'economy' | 'family' | 'hobby') => {
    setSelectedCategory(category);
    setTimeout(() => onCategorySelect(category), 200);
  };

  const categories = [
    {
      id: 'economy' as const,
      emoji: '🚗',
      title: '출퇴근용 경제차',
      subtitle: '연비 좋고 경제적인',
      description: '매일 출퇴근하는 당신을 위해\n연료비 절약하는 똑똑한 선택',
      color: 'toss-gradient-economy',
      bgColor: 'toss-card-economy',
      borderColor: 'border-[var(--toss-success)]',
      textColor: 'text-[var(--toss-success)]'
    },
    {
      id: 'family' as const,
      emoji: '👨‍👩‍👧‍👦',
      title: '가족용 안전차',
      subtitle: '넓고 안전한',
      description: '소중한 가족과 함께\n안전하고 편안한 드라이브',
      color: 'toss-gradient-family',
      bgColor: 'toss-card-family',
      borderColor: 'border-[var(--toss-info)]',
      textColor: 'text-[var(--toss-info)]'
    },
    {
      id: 'hobby' as const,
      emoji: '🏎️',
      title: '취미용 멋진차',
      subtitle: '드라이빙의 즐거움',
      description: '주말이 기다려지는\n운전하는 재미가 있는 차',
      color: 'toss-gradient-hobby',
      bgColor: 'toss-card-hobby',
      borderColor: 'border-[var(--toss-warning)]',
      textColor: 'text-[var(--toss-warning)]'
    }
  ];

  return (
    <div className="min-h-screen gradient-bg particle-system">
      {/* 상단 인사말 */}
      <div className="pt-16 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {userName}! 👋
          </h1>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            어떤 차가 필요하세요?
          </h2>
          <p className="text-muted-foreground text-lg">
            3초만에 딱 맞는 차를 찾아드릴게요
          </p>
        </motion.div>
      </div>

      {/* 카테고리 카드들 */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="w-full"
            >
              <motion.button
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full p-6 bg-white rounded-2xl shadow-premium border-2 ${category.borderColor} focus:outline-none focus:ring-4 focus:ring-primary/20 ${category.bgColor} glass-card toss-card micro-bounce`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
                disabled={selectedCategory !== null}
              >
                <div className="flex items-center space-x-4">
                  {/* 이모지 아이콘 */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${category.color} animate-morph shadow-luxury`}>
                    <span className="text-3xl">{category.emoji}</span>
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {category.title}
                    </h3>
                    <p className={`text-sm font-semibold ${category.textColor} mb-2`}>
                      {category.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {category.description}
                    </p>
                  </div>

                  {/* 화살표 */}
                  <div className={`w-8 h-8 bg-white/50 rounded-full flex items-center justify-center border border-white/30`}>
                    <svg
                      className={`w-4 h-4 ${category.textColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* 선택시 로딩 효과 */}
                {selectedCategory === category.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center justify-center"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 하단 추가 정보 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="px-6 pb-8"
      >
        <div className="max-w-md mx-auto">
          <div className="bg-secondary rounded-2xl p-4 border border-border glass-card floating">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center neon-glow animate-toss-pulse">
                <span className="text-primary-foreground font-bold">AI</span>
              </div>
              <div className="flex-1">
                <p className="text-primary font-semibold text-sm">
                  실제 111,841대 차량 데이터 기반
                </p>
                <p className="text-muted-foreground text-xs">
                  AI가 당신만을 위한 최적의 차량을 찾아드려요
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}