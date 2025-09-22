'use client';

import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

// 차알못 친화적 용어 사전
export const CAR_TERMS = {
  // 기본 차량 용어
  '연비': {
    simple: '기름값 절약 정도',
    detail: '1리터의 기름으로 몇 킬로미터를 갈 수 있는지를 나타내는 지표입니다. 높을수록 기름값을 절약할 수 있어요.',
    example: '연비 15km/L = 기름 1리터로 15km 이동 가능'
  },
  '할부금': {
    simple: '매달 내는 차값',
    detail: '차량 구매 시 매달 지불하는 금액입니다. 보험료, 유지비는 별도예요.',
    example: '월 할부금 30만원 = 매달 30만원씩 지불'
  },
  '하이브리드': {
    simple: '기름+전기 차량',
    detail: '기름과 전기를 모두 사용하는 친환경 차량입니다. 연비가 좋아 기름값을 절약할 수 있어요.',
    example: '도심에서는 전기, 고속도로에서는 기름 사용'
  },
  'TCO': {
    simple: '총 소유비용',
    detail: 'Total Cost of Ownership의 줄임말로, 차량을 구매부터 처분까지 드는 모든 비용을 말해요.',
    example: '차값 + 보험료 + 유지비 + 기름값 등 모든 비용'
  },
  'SUV': {
    simple: '높고 큰 차',
    detail: 'Sport Utility Vehicle의 줄임말로, 승용차보다 높고 넓어서 가족 여행이나 짐 운반에 좋아요.',
    example: '투싼, 싸넷피, 팰리세이드 등'
  },
  '세단': {
    simple: '일반적인 승용차',
    detail: '4개 문과 독립된 트렁크가 있는 가장 기본적인 승용차 형태입니다.',
    example: '아반떼, 쏘나타, 그랜저 등'
  },
  '안전도': {
    simple: '사고 시 보호 수준',
    detail: '차량이 사고 났을 때 탑승자를 얼마나 잘 보호하는지를 나타내는 등급입니다. 5성급이 최고예요.',
    example: '5성급 = 매우 안전, 1성급 = 보통'
  },
  '주행거리': {
    simple: '지금까지 달린 거리',
    detail: '그 차가 지금까지 총 몇 킬로미터를 달렸는지를 나타냅니다. 적을수록 좋아요.',
    example: '5만km = 서울↔부산 약 25번 왕복'
  },
  // 기술 용어
  'LSTM': {
    simple: 'AI 예측 기술',
    detail: 'Long Short-Term Memory의 줄임말로, 과거 데이터를 학습해서 미래를 예측하는 AI 기술입니다.',
    example: '과거 중고차 가격 변화를 학습해서 미래 가치 예측'
  },
  'XGBoost': {
    simple: '고급 분석 기술',
    detail: '여러 요소를 종합적으로 분석해서 정확한 예측을 하는 머신러닝 기술입니다.',
    example: '연식, 주행거리, 사고이력 등을 종합해서 가격 예측'
  },
  'KoBERT': {
    simple: '한국어 이해 AI',
    detail: '한국어로 된 리뷰나 댓글의 감정(좋음/나쁨)을 분석하는 AI 기술입니다.',
    example: '"연비가 정말 좋아요" → 긍정적 평가로 분석'
  },
  // 금융 용어
  '잔존가치': {
    simple: '나중에 팔 때 받을 금액',
    detail: '몇 년 후 그 차를 중고차로 팔 때 받을 수 있는 예상 금액입니다.',
    example: '3년 후 잔존가치 70% = 처음 가격의 70%로 판매 가능'
  },
  '금리': {
    simple: '돈 빌리는 수수료',
    detail: '할부로 차를 살 때 은행에 내는 이자율입니다. 낮을수록 좋아요.',
    example: '금리 3% = 빌린 돈의 3%를 추가로 이자로 지불'
  }
};

interface CarTermTooltipProps {
  term: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export function CarTermTooltip({ term, children, className = '', showIcon = false }: CarTermTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const termData = CAR_TERMS[term as keyof typeof CAR_TERMS];

  if (!termData) {
    return <span className={className}>{children}</span>;
  }

  return (
    <div className="relative inline-block">
      <span
        className={`cursor-help border-b border-dashed border-blue-400 ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {showIcon && <HelpCircle className="inline w-4 h-4 ml-1 text-blue-500" />}
      </span>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm text-gray-900 mb-1">
                  {term}
                </div>
                <div className="text-blue-600 text-xs font-medium mb-2">
                  📝 {termData.simple}
                </div>
                <div className="text-gray-600 text-xs leading-relaxed mb-2">
                  {termData.detail}
                </div>
                {termData.example && (
                  <div className="text-gray-500 text-xs bg-gray-50 p-2 rounded">
                    💡 예시: {termData.example}
                  </div>
                )}
              </div>
            </div>
            {/* 말풍선 꼬리 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 간단한 도움말 아이콘 컴포넌트
interface HelpIconProps {
  term: string;
  className?: string;
}

export function HelpIcon({ term, className = '' }: HelpIconProps) {
  return (
    <CarTermTooltip term={term} className={className}>
      <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-help" />
    </CarTermTooltip>
  );
}

// 여러 용어가 포함된 텍스트를 자동으로 툴팁으로 변환하는 컴포넌트
interface SmartTextProps {
  children: string;
  className?: string;
}

export function SmartText({ children, className = '' }: SmartTextProps) {
  const terms = Object.keys(CAR_TERMS);
  let processedText: React.ReactNode[] = [children];

  terms.forEach((term) => {
    processedText = processedText.flatMap((part) => {
      if (typeof part !== 'string') return [part];

      const regex = new RegExp(`(${term})`, 'gi');
      const splits = part.split(regex);

      return splits.map((split, index) => {
        if (split.toLowerCase() === term.toLowerCase()) {
          return (
            <CarTermTooltip key={`${term}-${index}`} term={term}>
              {split}
            </CarTermTooltip>
          );
        }
        return split;
      });
    });
  });

  return <span className={className}>{processedText}</span>;
}