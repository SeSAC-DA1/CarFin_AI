'use client';

import { useState, useEffect } from 'react';
import { Heart, Car, Search } from 'lucide-react';

interface CarFinWaitingUIProps {
  isVisible: boolean;
  currentMessage?: string;
  isProcessing: boolean;
  selectedPersona?: any;
}

export default function CarFinWaitingUI({
  isVisible,
  currentMessage,
  isProcessing,
  selectedPersona
}: CarFinWaitingUIProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // 페르소나별 맞춤 메시지
  const getPersonalizedMessages = (persona?: any, message?: string) => {
    const personaName = persona?.name || '고객님';

    const baseMessages = [
      `${personaName}을 위해 특별히 차량을 찾고 있어요...`,
      `3명의 전문가가 117,564대 중에서 딱 맞는 차량을 골라내고 있어요`,
      `${personaName}의 니즈를 꼼꼼히 분석하고 있어요`,
      `곧 완벽한 추천을 드릴게요! 😊`
    ];

    // 페르소나별 맞춤 메시지 추가
    if (persona?.key === 'ceo_executive') {
      return [
        `${personaName}님을 위해 골프백 들어가는 멋진 차를 찾고 있어요...`,
        `브랜드 프리스티지와 법인차 혜택을 고려해서 검토 중이에요`,
        `거래처 미팅에서 부끄럽지 않은 차량들을 선별하고 있어요`,
        `CEO님만을 위한 특별한 추천을 준비할게요! 🏢`
      ];
    } else if (persona?.key === 'working_mom') {
      return [
        `${personaName}님을 위해 아이와 함께 안전한 차를 찾고 있어요...`,
        `유치원 등하원과 주말 나들이에 딱 맞는 차량을 골라내고 있어요`,
        `아이 안전성과 승하차 편의성을 꼼꼼히 검토 중이에요`,
        `가족의 행복을 위한 완벽한 차량을 추천해드릴게요! 👨‍👩‍👧`
      ];
    } else if (persona?.key === 'camping_lover') {
      return [
        `${personaName}님을 위해 캠핑에 최적화된 차량을 찾고 있어요...`,
        `평탄화 기능과 적재공간을 고려해서 검토 중이에요`,
        `오프로드 성능까지 완벽한 캠핑카를 선별하고 있어요`,
        `자연과의 동행을 위한 특별한 추천을 준비할게요! 🌲`
      ];
    }

    return baseMessages;
  };

  const messages = getPersonalizedMessages(selectedPersona, currentMessage);

  // 메시지 순차 표시
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex(prev =>
        prev < messages.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing, messages.length]);

  // 로딩 점 애니메이션
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8 mb-6 shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">😊 잠시만 기다려주세요</h3>
          <p className="text-slate-600">
            전문가들이 {selectedPersona?.name || '고객님'}만을 위해 열심히 찾고 있어요
          </p>
        </div>
        {isProcessing && (
          <div className="ml-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              분석 중{dots}
            </div>
          </div>
        )}
      </div>

      {/* 메인 메시지 */}
      <div className="text-center mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Car className="w-8 h-8 text-blue-500" />
            <Search className="w-6 h-6 text-purple-500" />
          </div>

          <div className="text-lg font-medium text-slate-800 mb-2">
            {messages[currentMessageIndex]}
          </div>

          {currentMessageIndex < messages.length - 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {messages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index <= currentMessageIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 간단한 진행 표시 */}
      {isProcessing && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
            <span>🎯 전문가 3명이 협업 중</span>
            <span>117,564대 매물 분석</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(((currentMessageIndex + 1) / messages.length) * 100, 85)}%`
              }}
            ></div>
          </div>

          <div className="text-center mt-3 text-xs text-slate-500">
            걱정마세요! 완전 무료로 끝까지 함께 해드립니다 💝
          </div>
        </div>
      )}
    </div>
  );
}