'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Star, Shield, DollarSign, Clock, Settings } from 'lucide-react';

interface VehicleInsight {
  vehicleId: string;
  overallScore: number; // 0-100
  priceCompetitiveness: number; // 백분위 점수
  mileageVsAge: number; // 연식 대비 주행거리
  ageCompetitiveness: number; // 연식 경쟁력
  optionCompetitiveness: number; // 옵션 경쟁력
  peerGroupSize: number; // 동질집단 크기
  keyStrengths: string[]; // 주요 장점
  keyWeaknesses: string[]; // 주요 약점
  optionHighlights: {
    owned: string[]; // 보유 주요 옵션
    popular: Array<{ name: string; popularity: number }>; // 인기 옵션
    missing: string[]; // 미보유 인기 옵션
  };
  userReviews: {
    sentiment: number; // -1 to 1
    commonPositives: string[];
    commonNegatives: string[];
    sampleReviews: string[];
  };
  recommendation: string; // 종합 추천 의견
}

interface Props {
  vehicleId: string;
  insight: VehicleInsight;
  compact?: boolean;
}

export default function VehicleInsightDashboard({ vehicleId, insight, compact = false }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'options' | 'reviews'>('overview');

  // 스코어에 따른 색상/아이콘
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    if (score >= 60) return <Star className="w-4 h-4" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const ScoreBar = ({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2 text-sm">
          {icon}
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-bold px-2 py-1 rounded ${getScoreColor(score)}`}>
          {score.toFixed(0)}점
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-blue-500' :
            score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-800">차량 종합 분석</h4>
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${getScoreColor(insight.overallScore)}`}>
            {getScoreIcon(insight.overallScore)}
            <span className="font-bold">{insight.overallScore.toFixed(0)}점</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-bold text-green-600">{insight.priceCompetitiveness.toFixed(0)}점</div>
            <div className="text-gray-600">가격 경쟁력</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-bold text-blue-600">{insight.optionCompetitiveness.toFixed(0)}점</div>
            <div className="text-gray-600">옵션 경쟁력</div>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <div className="flex justify-between">
            <span>동질집단 비교</span>
            <span className="font-medium">{insight.peerGroupSize}대 기준</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">차량 인사이트 분석</h3>
            <p className="text-sm text-gray-600">{insight.peerGroupSize}대 동질집단 대비 분석</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${getScoreColor(insight.overallScore)}`}>
            {getScoreIcon(insight.overallScore)}
            <span className="text-lg font-bold">{insight.overallScore.toFixed(0)}점</span>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-100">
        {[
          { id: 'overview', label: '종합 분석', icon: <Award className="w-4 h-4" /> },
          { id: 'options', label: '옵션 분석', icon: <Settings className="w-4 h-4" /> },
          { id: 'reviews', label: '사용자 리뷰', icon: <Star className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 종합 점수 분석 */}
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4">🎯 종합 경쟁력 분석</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <ScoreBar
                    label="가격 경쟁력"
                    score={insight.priceCompetitiveness}
                    icon={<DollarSign className="w-4 h-4" />}
                  />
                  <ScoreBar
                    label="연식 경쟁력"
                    score={insight.ageCompetitiveness}
                    icon={<Clock className="w-4 h-4" />}
                  />
                </div>
                <div>
                  <ScoreBar
                    label="연식 대비 주행거리"
                    score={insight.mileageVsAge}
                    icon={<Shield className="w-4 h-4" />}
                  />
                  <ScoreBar
                    label="옵션 경쟁력"
                    score={insight.optionCompetitiveness}
                    icon={<Settings className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            {/* 강점/약점 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-bold text-green-800 mb-2">✅ 주요 강점</h5>
                <ul className="space-y-1">
                  {insight.keyStrengths.map((strength, i) => (
                    <li key={i} className="text-sm text-green-700">• {strength}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h5 className="font-bold text-orange-800 mb-2">⚠️ 개선 포인트</h5>
                <ul className="space-y-1">
                  {insight.keyWeaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm text-orange-700">• {weakness}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 추천 의견 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-bold text-blue-800 mb-2">💡 종합 추천</h5>
              <p className="text-sm text-blue-700 leading-relaxed">{insight.recommendation}</p>
            </div>
          </div>
        )}

        {activeTab === 'options' && (
          <div className="space-y-6">
            {/* 보유 주요 옵션 */}
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-3">🚗 보유 주요 옵션</h4>
              <div className="flex flex-wrap gap-2">
                {insight.optionHighlights.owned.map((option, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {option}
                  </span>
                ))}
              </div>
            </div>

            {/* 인기 옵션 비교 */}
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-3">📊 동질집단 인기 옵션 TOP 5</h4>
              <div className="space-y-2">
                {insight.optionHighlights.popular.map((option, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{i + 1}. {option.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${option.popularity}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-600">{option.popularity.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 미보유 인기 옵션 */}
            {insight.optionHighlights.missing.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3">⚠️ 미보유 인기 옵션</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.optionHighlights.missing.map((option, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* 감정 분석 */}
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-800 mb-3">😊 사용자 만족도</h4>
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
                insight.userReviews.sentiment > 0.3 ? 'bg-green-50 text-green-800' :
                insight.userReviews.sentiment > -0.3 ? 'bg-yellow-50 text-yellow-800' :
                'bg-red-50 text-red-800'
              }`}>
                <span className="text-2xl">
                  {insight.userReviews.sentiment > 0.3 ? '😊' :
                   insight.userReviews.sentiment > -0.3 ? '😐' : '😞'}
                </span>
                <span className="font-bold">
                  {insight.userReviews.sentiment > 0.3 ? '매우 만족' :
                   insight.userReviews.sentiment > -0.3 ? '보통' : '불만족'}
                </span>
              </div>
            </div>

            {/* 긍정/부정 리뷰 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-bold text-green-800 mb-2">👍 공통 긍정 요소</h5>
                <ul className="space-y-1">
                  {insight.userReviews.commonPositives.map((positive, i) => (
                    <li key={i} className="text-sm text-green-700">• {positive}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h5 className="font-bold text-red-800 mb-2">👎 공통 개선 요구</h5>
                <ul className="space-y-1">
                  {insight.userReviews.commonNegatives.map((negative, i) => (
                    <li key={i} className="text-sm text-red-700">• {negative}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 실제 리뷰 샘플 */}
            <div>
              <h5 className="font-bold text-gray-800 mb-3">💬 실제 사용자 리뷰</h5>
              <div className="space-y-3">
                {insight.userReviews.sampleReviews.map((review, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-700 italic">"{review}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}