'use client';

import { useEffect, useState } from 'react';
import { NthQuestionWelcomeSystem } from '@/lib/nthQuestionWelcome/NthQuestionWelcomeSystem';
import { WelcomeMessage } from '@/lib/nthQuestionWelcome/WelcomeMessageGenerator';
import { UserSession, QuestionEvent } from '@/lib/nthQuestionWelcome/NthQuestionWelcomeSystem';

interface NthQuestionWelcomeBannerProps {
  question: string;
  detectedPersona?: string;
  budget?: { min: number; max: number };
  className?: string;
}

export default function NthQuestionWelcomeBanner({
  question,
  detectedPersona,
  budget,
  className = ""
}: NthQuestionWelcomeBannerProps) {
  const [welcomeData, setWelcomeData] = useState<{
    welcomeMessage: WelcomeMessage;
    userSession: UserSession;
    questionEvent: QuestionEvent;
    progressInfo: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const processWelcome = async () => {
      try {
        setIsLoading(true);
        const welcomeSystem = new NthQuestionWelcomeSystem({
          enablePersonalization: true,
          enableMilestoneTracking: true,
          enableAnalytics: true,
          debugMode: false
        });

        const result = await welcomeSystem.processQuestion(
          question,
          detectedPersona,
          budget
        );

        setWelcomeData(result);

        // 마일스톤 달성 시 애니메이션 표시
        if (result.welcomeMessage.milestone) {
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 3000);
        }
      } catch (error) {
        console.error('환영 시스템 오류:', error);
        // 실패 시 기본 환영 메시지 표시
        setWelcomeData({
          welcomeMessage: {
            message: "CarFin AI에 오신 것을 환영합니다! 완벽한 중고차를 찾아드릴게요.",
            badge: "👋 Welcome",
            emoji: "👋"
          },
          userSession: {
            userId: 'default',
            sessionId: 'default',
            visitCount: 1,
            questionCount: 1,
            firstVisit: new Date(),
            lastVisit: new Date()
          },
          questionEvent: {
            userId: 'default',
            sessionId: 'default',
            questionCount: 1,
            question,
            timestamp: new Date(),
            budget: budget || { min: 1000, max: 10000 }
          },
          progressInfo: { nextMilestone: 2, progress: 50, remaining: 1 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    processWelcome();
  }, [question, detectedPersona, budget]);

  if (isLoading || !welcomeData) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6 border border-blue-200 ${className}`}>
        <div className="flex items-center space-x-4 animate-pulse">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="text-right">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <div className="w-16 h-3 bg-gray-200 rounded mt-1"></div>
          </div>
        </div>
      </div>
    );
  }

  const { welcomeMessage, userSession, questionEvent, progressInfo } = welcomeData;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 마일스톤 축하 애니메이션 */}
      {showAnimation && welcomeMessage.milestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-4 animate-bounce">
            <div className="text-6xl mb-4">{welcomeMessage.emoji || "🎉"}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">축하합니다!</h2>
            <p className="text-lg text-purple-600 font-semibold mb-3">{welcomeMessage.milestone}</p>
            <p className="text-sm text-gray-600">{welcomeMessage.specialOffer}</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAnimation(false)}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 환영 배너 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6 border border-blue-200 transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center space-x-4">
          {/* 이모지 아이콘 */}
          <div className="text-4xl flex-shrink-0 animate-pulse">
            {welcomeMessage.emoji || welcomeMessage.badge?.split(' ')[0] || '👋'}
          </div>

          {/* 메인 메시지 영역 */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2 leading-tight">
              {welcomeMessage.message}
            </h2>

            {/* 개인화된 노트 */}
            {welcomeMessage.personalizedNote && (
              <div className="text-sm text-gray-600 mb-2 bg-white bg-opacity-50 px-3 py-1 rounded-full inline-block">
                💡 {welcomeMessage.personalizedNote}
              </div>
            )}

            {/* 마일스톤 배지 */}
            {welcomeMessage.milestone && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm inline-block mb-2 font-medium">
                🎉 {welcomeMessage.milestone}
              </div>
            )}

            {/* 특별 혜택 */}
            {welcomeMessage.specialOffer && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block font-medium">
                🎁 {welcomeMessage.specialOffer}
              </div>
            )}

            {/* 일반 배지 */}
            {!welcomeMessage.milestone && welcomeMessage.badge && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block font-medium">
                {welcomeMessage.badge}
              </div>
            )}
          </div>

          {/* 질문 카운터 */}
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {userSession.questionCount}
            </div>
            <div className="text-sm text-gray-500 font-medium">번째 질문</div>
            {progressInfo.remaining > 0 && (
              <div className="text-xs text-purple-600 mt-1">
                다음 마일스톤까지 {progressInfo.remaining}번
              </div>
            )}
          </div>
        </div>

        {/* 진행률 바 (마일스톤 추적이 활성화된 경우) */}
        {progressInfo.nextMilestone > userSession.questionCount && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                다음 마일스톤 ({progressInfo.nextMilestone}번째 질문)까지
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(progressInfo.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(progressInfo.progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* 사용자 통계 (마일스톤 달성 시 추가 정보) */}
        {welcomeMessage.milestone && (
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-purple-600">{userSession.visitCount}</div>
                <div className="text-xs text-gray-600">총 방문</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{userSession.questionCount}</div>
                <div className="text-xs text-gray-600">총 질문</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {userSession.firstVisit instanceof Date
                    ? Math.ceil((new Date().getTime() - userSession.firstVisit.getTime()) / (1000 * 60 * 60 * 24))
                    : 1}일
                </div>
                <div className="text-xs text-gray-600">함께한 기간</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// CSS 애니메이션을 위한 스타일 (global.css에 추가 필요)
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
`;