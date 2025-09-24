'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleDatabaseStatus } from '@/components/demo/SimpleDatabaseStatus';
import {
  Car,
  ArrowRight,
  Users,
  CheckCircle,
  Sparkles,
  Heart,
  Clock,
  Shield
} from 'lucide-react';

interface Props {
  onStartJourney: () => void;
}

export function SimpleLanding({ onStartJourney }: Props) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: Users, text: "3명의 AI 전문가 협업", color: "text-white" },
    { icon: Clock, text: "단 3분만에 완성", color: "text-white" },
    { icon: Shield, text: "차알못도 안전하게", color: "text-white" },
    { icon: Sparkles, text: "실시간 분석 과정 공개", color: "text-white" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-16 text-center max-w-6xl">

        {/* 메인 헤딩 - 임팩트 있는 제목 */}
        <div className="space-y-8">
          <div className="relative">
            <h1 className="hero-title">
              차 몰라도 괜찮아요
            </h1>
            <h2 className="hero-title" style={{ color: 'var(--primary)' }}>
              전문가 수준으로 분석해드려요
            </h2>

            {/* 간단한 부제목 */}
            <div className="mt-6 mb-8">
              <p className="text-large text-muted-foreground">
                3명의 AI 전문가가 협업하여 투명하고 정확한 분석을 제공합니다
              </p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-large">
              딜러 영업 없이, <span style={{ color: 'var(--primary)', fontWeight: 600 }}>객관적 데이터</span>만으로 안전한 차량 선택을 도와드려요
            </p>
          </div>
        </div>

        {/* 메인 CTA - 핵심 액션 */}
        <div className="mb-12">
          <button
            onClick={onStartJourney}
            className="btn-primary mx-auto mb-4"
          >
            <Sparkles className="w-5 h-5" />
            전문가 수준 분석 받기
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-small">
            투명한 분석 과정 • 완전 무료 • 검증된 데이터
          </p>
        </div>

        {/* 실시간 데이터 증명 - 단순하게 */}
        <div className="mb-12">
          <SimpleDatabaseStatus
            className="max-w-4xl mx-auto"
            showDetailedStats={true}
          />
        </div>

        {/* 신뢰도 지표 - 핵심 정보 */}
        <Card className="simple-card max-w-3xl mx-auto mb-12">
          <CardContent className="p-6">
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="text-regular font-medium">111,841개 실제 매물</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="text-regular font-medium">12,847명 이용</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="text-regular font-medium">완전 무료</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 서비스 소개 - 깔끔한 디자인 */}
        <div className="mb-12">
          <h3 className="section-title mb-6">
            3명의 전문가가 함께 분석해요
          </h3>

          {/* 핵심 가치 제안 - 통일된 디자인 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="simple-card text-center">
              <div className="simple-avatar mx-auto mb-4">
                🚗
              </div>
              <h4 className="card-title">차량 전문가</h4>
              <p className="text-regular">
                111,841대 중고차를 모두 기억하고<br />
                당신 취향에 맞는 차량을 찾아줘요
              </p>
            </Card>

            <Card className="simple-card text-center">
              <div className="simple-avatar mx-auto mb-4">
                💰
              </div>
              <h4 className="card-title">금융 전문가</h4>
              <p className="text-regular">
                차량 가격부터 유지비까지<br />
                모든 비용을 정확히 계산해줘요
              </p>
            </Card>

            <Card className="simple-card text-center">
              <div className="simple-avatar mx-auto mb-4">
                📝
              </div>
              <h4 className="card-title">리뷰 분석가</h4>
              <p className="text-regular">
                수천 개 실제 후기를 읽고<br />
                핵심만 쉽게 요약해줘요
              </p>
            </Card>
          </div>
        </div>

        {/* 간단한 과정 설명 - 사용법 안내 */}
        <Card className="simple-card max-w-4xl mx-auto mb-12">
          <CardContent className="p-8">
            <h3 className="section-title mb-8">
              전문가 수준의 체계적 분석
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary)' }}>
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h4 className="card-title">개인화 질문</h4>
                <p className="text-regular">
                  당신의 라이프스타일과<br />
                  필요를 정확히 파악해요
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary)' }}>
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h4 className="card-title">전문가 협업</h4>
                <p className="text-regular">
                  3명의 전문가가 각각 다른<br />
                  관점에서 심층 분석해요
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary)' }}>
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h4 className="card-title">투명한 결론</h4>
                <p className="text-regular">
                  분석 근거와 함께<br />
                  검증된 추천을 받아보세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 안심 문구 - 부가 정보 */}
        <div className="text-center">
          <p className="text-regular mb-2">
            💡 딜러 영업이 아닌 객관적 데이터로, 안전한 차량 선택
          </p>
          <p className="text-small">
            완전 무료 • 검증된 데이터 • 투명한 분석 근거
          </p>
        </div>
      </div>
    </div>
  );
}