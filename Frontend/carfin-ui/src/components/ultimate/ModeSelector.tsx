'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, CheckCircle, Car, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onSelectMode: (mode: 'basic' | 'superclaude' | 'persona') => void;
}

export function ModeSelector({ onSelectMode }: Props) {
  // 차알못을 위해 페르소나 모드를 자동으로 선택
  const handleGetStarted = () => {
    onSelectMode('persona');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">

        {/* 메인 헤더 - 심플하고 친근하게 */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-white">
            🚗 내게 딱 맞는 차 찾기
          </h1>
          <p className="text-2xl text-green-200 mb-4">
            3분이면 충분해요!
          </p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            차에 대해 잘 몰라도 괜찮아요.
            최신 AI 추천 시스템이 당신에게 딱 맞는 차를 찾아드릴게요.
          </p>
        </div>

        {/* 메인 시작 카드 */}
        <Card className="glass-card max-w-3xl mx-auto mb-12">
          <CardContent className="p-12 text-center">

            {/* 신뢰 지표들 */}
            <div className="flex justify-center items-center gap-8 mb-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-white">12,000명이 만족</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-green-400" />
                <span className="text-white">110만 대 실제 매물</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">무료 추천</span>
              </div>
            </div>

            {/* 메인 시작 버튼 */}
            <Button
              onClick={handleGetStarted}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-6 px-12 text-xl font-bold rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
            >
              <Car className="w-6 h-6 mr-3" />
              지금 바로 AI 추천 받기
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            <p className="text-sm text-gray-400 mt-4">
              📊 빅데이터 + AI 분석으로 정확한 추천을 해드려요
            </p>

            {/* 간단한 작동 방식 설명 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">간단한 질문</h3>
                <p className="text-gray-300 text-sm">어떤 용도로 사용하는지 물어봐요</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">AI가 분석</h3>
                <p className="text-gray-300 text-sm">당신에게 딱 맞는 차를 찾아요</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">추천 완료</h3>
                <p className="text-gray-300 text-sm">실제 매물과 가격까지 알려드려요</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 간단한 FAQ 섹션 */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">
            💡 이용료는 완전 무료예요!
          </p>
          <p className="text-gray-500 text-xs">
            실제 매물 정보만 보여드리고, 광고나 수수료는 없습니다.
          </p>
        </div>

      </div>
    </div>
  );
}