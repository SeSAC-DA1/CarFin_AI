'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Car,
  Zap,
  Brain,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Users,
  Star
} from 'lucide-react';

interface OnboardingPageProps {
  onStartService: () => void;
}

export function OnboardingPage({ onStartService }: OnboardingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      id: 'welcome',
      icon: <Car className="w-16 h-16 text-primary" />,
      title: '차량 구매, 이제 3초면 충분해요',
      subtitle: '복잡한 차량 선택을 토스처럼 간단하게',
      description: '차에 대해 아무것도 몰라도 괜찮아요.\n딱 3초만 투자하면 완벽한 차량을 찾아드릴게요.',
      gradient: 'toss-gradient-family'
    },
    {
      id: 'innovation',
      icon: <Zap className="w-16 h-16 text-[var(--toss-warning)]" />,
      title: '혁신이 시작되는 곳',
      subtitle: '토스가 금융을 바꾼 것처럼, 우리는 차량 구매를 바꿉니다',
      description: '복잡한 스펙 비교는 그만!\n카테고리 하나만 선택하면\nAI가 모든 것을 알아서 처리합니다.',
      gradient: 'toss-gradient-hobby'
    },
    {
      id: 'data',
      icon: <Brain className="w-16 h-16 text-[var(--toss-success)]" />,
      title: '111,841대 실제 데이터',
      subtitle: '가짜 정보는 NO, 진짜 데이터만 YES',
      description: 'AWS 클라우드에 저장된\n실제 중고차 매물 데이터로\n가장 정확한 추천을 제공합니다.',
      gradient: 'toss-gradient-economy'
    },
    {
      id: 'ai',
      icon: <TrendingUp className="w-16 h-16 text-primary" />,
      title: 'AI 멀티에이전트가 분석',
      subtitle: '차량 전문가, 금융 전문가, 리뷰 분석가가 협력',
      description: '3명의 AI 전문가가 동시에 분석하여\n당신만을 위한 맞춤 추천을\n3초 만에 완성합니다.',
      gradient: 'toss-gradient-family'
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, slides.length]);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen gradient-bg particle-system texture-noise flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">CarFin AI</span>
        </div>
        <Button
          variant="ghost"
          onClick={onStartService}
          className="text-primary hover:bg-secondary"
        >
          바로 시작하기 →
        </Button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 pb-20">
        <div className="max-w-md mx-auto text-center">
          {/* 슬라이드 아이콘과 콘텐츠 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              {/* 아이콘 */}
              <motion.div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${currentSlideData.gradient} shadow-luxury neon-glow animate-morph`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentSlideData.icon}
              </motion.div>

              {/* 타이틀 */}
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {currentSlideData.title}
              </h1>

              {/* 서브타이틀 */}
              <h2 className="text-lg font-semibold text-primary mb-4">
                {currentSlideData.subtitle}
              </h2>

              {/* 설명 */}
              <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line">
                {currentSlideData.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* 페이지 인디케이터 */}
          <div className="flex justify-center space-x-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-primary w-6'
                    : 'bg-muted hover:bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          {/* CTA 버튼 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={onStartService}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg font-bold rounded-xl shadow-luxury liquid-button toss-button"
            >
              <Clock className="w-5 h-5 mr-2" />
              3초 차량 매칭 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* 신뢰도 배지들 */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
            <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-premium border glass-effect micro-bounce">
              <CheckCircle className="w-4 h-4 text-[var(--toss-success)]" />
              <span className="text-foreground font-medium">완전 무료</span>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-premium border glass-effect micro-bounce">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">111,841대 실제 데이터</span>
            </div>
            <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-premium border glass-effect micro-bounce">
              <Star className="w-4 h-4 text-[var(--toss-warning)]" />
              <span className="text-foreground font-medium">3초 완료</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex justify-between items-center p-6 bg-white border-t premium-blur">
        <Button
          variant="ghost"
          onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="text-muted-foreground"
        >
          이전
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentSlide + 1} / {slides.length}
        </span>

        {currentSlide === slides.length - 1 ? (
          <Button
            onClick={onStartService}
            className="bg-primary hover:bg-primary/90 text-white toss-button liquid-button"
          >
            시작하기
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => handleSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
            className="text-primary"
          >
            다음
          </Button>
        )}
      </div>
    </div>
  );
}