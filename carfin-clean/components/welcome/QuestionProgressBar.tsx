'use client';

import { useState, useEffect } from 'react';

interface QuestionProgressBarProps {
  questionCount: number;
  className?: string;
  showMilestones?: boolean;
  animateProgress?: boolean;
}

interface MilestoneInfo {
  value: number;
  label: string;
  emoji: string;
  achieved: boolean;
}

export default function QuestionProgressBar({
  questionCount,
  className = "",
  showMilestones = true,
  animateProgress = true
}: QuestionProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // 마일스톤 정의
  const milestones: MilestoneInfo[] = [
    { value: 1, label: "첫 질문", emoji: "🌟", achieved: questionCount >= 1 },
    { value: 5, label: "단골", emoji: "⭐", achieved: questionCount >= 5 },
    { value: 10, label: "VIP", emoji: "👑", achieved: questionCount >= 10 },
    { value: 25, label: "마니아", emoji: "🏆", achieved: questionCount >= 25 },
    { value: 50, label: "명예", emoji: "💎", achieved: questionCount >= 50 },
    { value: 100, label: "전설", emoji: "🎖️", achieved: questionCount >= 100 }
  ];

  // 현재 마일스톤과 다음 마일스톤 계산
  const currentMilestone = milestones.find(m => questionCount < m.value) || milestones[milestones.length - 1];
  const previousMilestone = milestones[milestones.indexOf(currentMilestone) - 1];

  // 진행률 계산
  const calculateProgress = () => {
    if (questionCount >= 100) {
      return 100; // 최대 달성
    }

    if (!previousMilestone) {
      // 첫 번째 마일스톤까지의 진행률
      return (questionCount / currentMilestone.value) * 100;
    }

    // 현재 구간에서의 진행률
    const currentProgress = questionCount - previousMilestone.value;
    const totalSegment = currentMilestone.value - previousMilestone.value;
    return (currentProgress / totalSegment) * 100;
  };

  const progress = calculateProgress();
  const remaining = Math.max(0, currentMilestone.value - questionCount);

  // 애니메이션 효과
  useEffect(() => {
    if (animateProgress) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animateProgress]);

  // 다음 달성 가능한 마일스톤들 (최대 3개)
  const upcomingMilestones = milestones
    .filter(m => !m.achieved && m.value <= questionCount + 20)
    .slice(0, 3);

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">질문 진행도</h3>
          <p className="text-sm text-gray-600">
            {questionCount >= 100 ? "최고 레벨 달성!" : `다음 마일스톤까지 ${remaining}번 남음`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{questionCount}</div>
          <div className="text-sm text-gray-500">번째 질문</div>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {previousMilestone ? `${previousMilestone.value}` : '0'} → {currentMilestone.value}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {Math.round(animatedProgress)}%
          </span>
        </div>

        <div className="relative">
          {/* 배경 바 */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            {/* 진행률 바 */}
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${Math.min(animatedProgress, 100)}%` }}
            >
              {/* 반짝임 효과 */}
              {animateProgress && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
              )}
            </div>
          </div>

          {/* 현재 위치 표시 */}
          {animatedProgress > 5 && animatedProgress < 95 && (
            <div
              className="absolute -top-6 transform -translate-x-1/2 text-xs font-medium text-blue-600"
              style={{ left: `${animatedProgress}%` }}
            >
              {questionCount}
            </div>
          )}
        </div>
      </div>

      {/* 마일스톤 표시 */}
      {showMilestones && (
        <div className="space-y-3">
          {/* 달성된 마일스톤들 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">달성한 마일스톤</h4>
            <div className="flex flex-wrap gap-2">
              {milestones.filter(m => m.achieved).map(milestone => (
                <div
                  key={milestone.value}
                  className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                >
                  <span>{milestone.emoji}</span>
                  <span>{milestone.label}</span>
                  <span className="text-green-600">({milestone.value})</span>
                </div>
              ))}
              {milestones.filter(m => m.achieved).length === 0 && (
                <span className="text-sm text-gray-500">아직 달성한 마일스톤이 없습니다</span>
              )}
            </div>
          </div>

          {/* 다가오는 마일스톤들 */}
          {upcomingMilestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">다가오는 마일스톤</h4>
              <div className="space-y-2">
                {upcomingMilestones.map((milestone, index) => {
                  const questionsToGo = milestone.value - questionCount;
                  const isNext = index === 0;

                  return (
                    <div
                      key={milestone.value}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isNext
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{milestone.emoji}</span>
                        <span className={`text-sm font-medium ${
                          isNext ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {milestone.label} ({milestone.value}번째)
                        </span>
                      </div>
                      <div className={`text-xs font-medium ${
                        isNext ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {questionsToGo}번 남음
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 완료 상태 */}
          {questionCount >= 100 && (
            <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
              <div className="text-3xl mb-2">🎖️</div>
              <div className="text-lg font-bold text-purple-800">전설 등급 달성!</div>
              <div className="text-sm text-purple-600">CarFin AI의 진정한 전문가가 되셨습니다</div>
            </div>
          )}
        </div>
      )}

      {/* 현재 상태 요약 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {milestones.filter(m => m.achieved).length}
            </div>
            <div className="text-xs text-gray-600">달성 마일스톤</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {currentMilestone.value}
            </div>
            <div className="text-xs text-gray-600">다음 목표</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {Math.round((questionCount / 100) * 100)}%
            </div>
            <div className="text-xs text-gray-600">전체 진행률</div>
          </div>
        </div>
      </div>
    </div>
  );
}