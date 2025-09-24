'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Car,
  Brain,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { CarTermTooltip, HelpIcon } from '@/components/ui/car-term-tooltip';

interface WelcomePhaseProps {
  onStartConsultation: () => void;
}

export function WelcomePhase({ onStartConsultation }: WelcomePhaseProps) {
  return (
    <div className="min-h-screen gradient-bg particle-system texture-noise flex items-center justify-center p-4 relative overflow-hidden">
      {/* Professional background overlay */}
      <div className="absolute inset-0 bg-white/40 z-0"></div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="mb-12">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-luxury border-4 border-primary neon-glow animate-morph">
            <Car className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 tracking-tight">
            CarFin AI
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            차량 구매 전문 컨설턴트
          </h2>
          <p className="text-xl md:text-2xl text-foreground mb-4 max-w-4xl mx-auto leading-relaxed">
            자동차 지식이 부족해도 걱정마세요. AI 전문가 3명이 신뢰할 수 있는 상담을 제공합니다
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            85,000+ 실제 데이터 기반 객관적 분석 • 완전 무료 • 3분 완료
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 card-3d">
          <Card className="bg-white/90 border-2 border-primary/20 hover:border-primary/40 glass-card toss-card micro-bounce shadow-premium">
            <CardHeader className="text-center card-inner">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-toss-pulse">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">차량 전문가 AI</CardTitle>
              <p className="text-sm text-primary font-medium">Vehicle Expert</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center leading-relaxed">
                85,000+ 실제 매물 데이터 분석으로 당신에게 가장 적합한 차량을 찾아드립니다
              </p>
              <div className="mt-4 flex justify-center">
                <CarTermTooltip term="하이브리드">
                  <span className="bg-secondary text-primary px-3 py-1 rounded-full text-sm font-medium cursor-help">
                    하이브리드 추천 시스템 <HelpIcon term="하이브리드" className="inline ml-1" />
                  </span>
                </CarTermTooltip>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-2 border-[var(--toss-success)]/20 hover:border-[var(--toss-success)]/40 glass-card toss-card micro-bounce shadow-premium">
            <CardHeader className="text-center card-inner">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-toss-pulse">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">금융 전문가 AI</CardTitle>
              <p className="text-sm text-[var(--toss-success)] font-medium">Finance Expert</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center leading-relaxed">
                <CarTermTooltip term="LSTM">LSTM</CarTermTooltip>+<CarTermTooltip term="XGBoost">XGBoost</CarTermTooltip> 모델로 차량 가치 예측 및 최적의 <CarTermTooltip term="금리">금융 조건</CarTermTooltip>을 제안합니다
              </p>
              <div className="mt-4 flex justify-center">
                <CarTermTooltip term="TCO">
                  <span className="bg-secondary text-[var(--toss-success)] px-3 py-1 rounded-full text-sm font-medium cursor-help">
                    TCO 분석 포함 <HelpIcon term="TCO" className="inline ml-1" />
                  </span>
                </CarTermTooltip>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-2 border-accent/20 hover:border-accent/40 glass-card toss-card micro-bounce shadow-premium">
            <CardHeader className="text-center card-inner">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-toss-pulse">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">리뷰 분석가 AI</CardTitle>
              <p className="text-sm text-accent font-medium">Review Analyst</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center leading-relaxed">
                <CarTermTooltip term="KoBERT">KoBERT</CarTermTooltip> 한국어 감정분석으로 실제 구매자들의 솔직한 만족도를 분석합니다
              </p>
              <div className="mt-4 flex justify-center">
                <CarTermTooltip term="KoBERT">
                  <span className="bg-secondary text-accent px-3 py-1 rounded-full text-sm font-medium cursor-help">
                    한국어 감정분석 AI <HelpIcon term="KoBERT" className="inline ml-1" />
                  </span>
                </CarTermTooltip>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={onStartConsultation}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl font-bold rounded-lg shadow-xl border-2 border-primary hover:border-primary/80 transition-all duration-300 hover:scale-105"
        >
          무료 전문 상담 시작하기 <ArrowRight className="ml-3 w-6 h-6" />
        </Button>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full shadow-premium glass-effect floating">
            <CheckCircle className="w-4 h-4 text-[var(--toss-success)]" />
            <span className="text-foreground font-medium">완전 무료</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full shadow-premium glass-effect floating">
            <CheckCircle className="w-4 h-4 text-[var(--toss-success)]" />
            <span className="text-foreground font-medium">개인정보 수집 없음</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full shadow-premium glass-effect floating">
            <CheckCircle className="w-4 h-4 text-[var(--toss-success)]" />
            <span className="text-foreground font-medium">3분 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
}