'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Zap, Calculator, ArrowRight, Eye, X } from 'lucide-react';
import { NCFEngine, NCFResult } from '@/lib/inference-engines/NCFEngine';
import { UserData, VehicleData } from '@/lib/inference-engines/RealAgentEngine';

interface NCFBrainVisualizationProps {
  userData: UserData;
  vehicleData: VehicleData;
  onClose?: () => void;
}

export function NCFBrainVisualization({
  userData,
  vehicleData,
  onClose
}: NCFBrainVisualizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ncfResult, setNCFResult] = useState<NCFResult | null>(null);
  const [showBrainView, setShowBrainView] = useState(true);

  useEffect(() => {
    startAnalysis();
  }, []);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(0);

    // 단계별로 분석 진행
    for (let i = 0; i <= 5; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // 실제 NCF 계산 수행
    const result = NCFEngine.predict(userData, vehicleData);
    setNCFResult(result);
    setIsAnalyzing(false);
  };

  const getBrainRegionColor = (step: number) => {
    if (currentStep < step) return "fill-gray-300";
    if (currentStep === step) return "fill-blue-500 animate-pulse";
    return "fill-green-500";
  };

  const getStepDescription = (step: number) => {
    const descriptions = [
      "분석 시작",
      "사용자 임베딩 생성",
      "차량 임베딩 생성",
      "GMF 직관적 매칭",
      "MLP 복잡한 학습",
      "NeuMF 최종 융합"
    ];
    return descriptions[step] || "";
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 뇌 구조 시각화 */}
      {showBrainView && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                AI 두뇌 해부학 - NCF 딥러닝 모델
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  He et al. 2017 논문 기반
                </Badge>
              </CardTitle>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {isAnalyzing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">분석 진행률</span>
                  <span className="text-sm text-gray-500">{Math.round((currentStep / 5) * 100)}%</span>
                </div>
                <Progress value={(currentStep / 5) * 100} className="h-2" />
                <p className="text-sm text-purple-600 mt-2">{getStepDescription(currentStep)}</p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* SVG 뇌 구조 */}
            <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8">
              <svg
                width="100%"
                height="400"
                viewBox="0 0 800 400"
                className="overflow-visible"
              >
                {/* 사용자 임베딩 영역 */}
                <g transform="translate(50, 50)">
                  <ellipse
                    cx="80" cy="60" rx="70" ry="50"
                    className={getBrainRegionColor(1)}
                    stroke="#6366f1" strokeWidth="2"
                  />
                  <text x="80" y="65" textAnchor="middle" className="text-sm font-medium fill-white">
                    사용자 임베딩
                  </text>
                  {ncfResult && (
                    <text x="80" y="85" textAnchor="middle" className="text-xs fill-white">
                      [{ncfResult.userEmbedding.age_norm.toFixed(2)}, {ncfResult.userEmbedding.income_norm.toFixed(2)}, ...]
                    </text>
                  )}
                </g>

                {/* 차량 임베딩 영역 */}
                <g transform="translate(650, 50)">
                  <ellipse
                    cx="80" cy="60" rx="70" ry="50"
                    className={getBrainRegionColor(2)}
                    stroke="#10b981" strokeWidth="2"
                  />
                  <text x="80" y="65" textAnchor="middle" className="text-sm font-medium fill-white">
                    차량 임베딩
                  </text>
                  {ncfResult && (
                    <text x="80" y="85" textAnchor="middle" className="text-xs fill-white">
                      [{ncfResult.itemEmbedding.price_norm.toFixed(2)}, {ncfResult.itemEmbedding.year_norm.toFixed(2)}, ...]
                    </text>
                  )}
                </g>

                {/* GMF 경로 */}
                <g transform="translate(150, 180)">
                  <rect
                    x="0" y="0" width="140" height="80" rx="10"
                    className={getBrainRegionColor(3)}
                    stroke="#f59e0b" strokeWidth="2"
                  />
                  <text x="70" y="30" textAnchor="middle" className="text-sm font-bold fill-white">
                    GMF
                  </text>
                  <text x="70" y="45" textAnchor="middle" className="text-xs fill-white">
                    직관적 매칭
                  </text>
                  {ncfResult && (
                    <text x="70" y="65" textAnchor="middle" className="text-lg font-bold fill-white">
                      {ncfResult.gmfScore}%
                    </text>
                  )}
                </g>

                {/* MLP 경로 */}
                <g transform="translate(510, 180)">
                  <rect
                    x="0" y="0" width="140" height="80" rx="10"
                    className={getBrainRegionColor(4)}
                    stroke="#ef4444" strokeWidth="2"
                  />
                  <text x="70" y="30" textAnchor="middle" className="text-sm font-bold fill-white">
                    MLP
                  </text>
                  <text x="70" y="45" textAnchor="middle" className="text-xs fill-white">
                    복잡한 학습
                  </text>
                  {ncfResult && (
                    <text x="70" y="65" textAnchor="middle" className="text-lg font-bold fill-white">
                      {ncfResult.mlpScore}%
                    </text>
                  )}
                </g>

                {/* NeuMF 최종 융합 */}
                <g transform="translate(330, 320)">
                  <ellipse
                    cx="70" cy="40" rx="90" ry="35"
                    className={getBrainRegionColor(5)}
                    stroke="#8b5cf6" strokeWidth="3"
                  />
                  <text x="70" y="30" textAnchor="middle" className="text-sm font-bold fill-white">
                    NeuMF 융합
                  </text>
                  {ncfResult && (
                    <text x="70" y="50" textAnchor="middle" className="text-xl font-bold fill-white">
                      {ncfResult.neuMFScore}%
                    </text>
                  )}
                </g>

                {/* 연결선들 */}
                {currentStep > 2 && (
                  <>
                    {/* 사용자 → GMF */}
                    <motion.path
                      d="M 130 120 Q 200 150 220 180"
                      fill="none" stroke="#6366f1" strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8 }}
                      markerEnd="url(#arrowhead)"
                    />

                    {/* 사용자 → MLP */}
                    <motion.path
                      d="M 130 120 Q 400 100 580 180"
                      fill="none" stroke="#6366f1" strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      markerEnd="url(#arrowhead)"
                    />

                    {/* 차량 → GMF */}
                    <motion.path
                      d="M 670 120 Q 600 150 580 180"
                      fill="none" stroke="#10b981" strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      markerEnd="url(#arrowhead)"
                    />

                    {/* 차량 → MLP */}
                    <motion.path
                      d="M 670 120 Q 600 150 580 180"
                      fill="none" stroke="#10b981" strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      markerEnd="url(#arrowhead)"
                    />
                  </>
                )}

                {currentStep > 4 && (
                  <>
                    {/* GMF → NeuMF */}
                    <motion.path
                      d="M 220 260 Q 300 290 330 340"
                      fill="none" stroke="#f59e0b" strokeWidth="4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8 }}
                      markerEnd="url(#arrowhead)"
                    />

                    {/* MLP → NeuMF */}
                    <motion.path
                      d="M 580 260 Q 500 290 470 340"
                      fill="none" stroke="#ef4444" strokeWidth="4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      markerEnd="url(#arrowhead)"
                    />
                  </>
                )}

                {/* 화살표 마커 정의 */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#374151"
                    />
                  </marker>
                </defs>

                {/* 전기 신호 효과 */}
                {currentStep > 2 && (
                  <>
                    {Array.from({ length: 5 }, (_, i) => (
                      <motion.circle
                        key={`spark-${i}`}
                        r="3"
                        fill="#fbbf24"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          cx: [130, 220, 330, 400],
                          cy: [120, 180, 320, 360]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </>
                )}
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 단계별 상세 설명 */}
      {ncfResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 분석 과정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                단계별 계산 과정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ncfResult.step_by_step.map((step, index) => (
                  <motion.div
                    key={step.step}
                    className="border-l-4 border-blue-500 pl-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-blue-100 text-blue-800">
                        Step {step.step}
                      </Badge>
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                      {step.calculation}
                    </code>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 최종 설명 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                AI 판단 근거
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* GMF 설명 */}
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-500 text-white">GMF {ncfResult.gmfScore}%</Badge>
                    <span className="font-medium">직관적 매칭</span>
                  </div>
                  <p className="text-sm text-gray-700">{ncfResult.explanation.gmf_reasoning}</p>
                </div>

                {/* MLP 설명 */}
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500 text-white">MLP {ncfResult.mlpScore}%</Badge>
                    <span className="font-medium">복잡한 학습</span>
                  </div>
                  <p className="text-sm text-gray-700">{ncfResult.explanation.mlp_reasoning}</p>
                </div>

                {/* 최종 결론 */}
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-500 text-white">최종 {ncfResult.neuMFScore}%</Badge>
                    <span className="font-medium">NeuMF 종합 판단</span>
                  </div>
                  <p className="text-sm text-gray-700">{ncfResult.explanation.final_reasoning}</p>
                </div>

                {/* 재분석 버튼 */}
                <div className="text-center pt-4">
                  <Button
                    onClick={startAnalysis}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    다시 분석하기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// "왜 추천?" 버튼이 있는 트리거 컴포넌트
export function NCFExplainButton({ userData, vehicleData }: { userData: UserData; vehicleData: VehicleData }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-purple-300"
        >
          <Brain className="w-4 h-4 mr-2" />
          왜 이 차를 추천했나요?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI 추천 근거 상세 분석</DialogTitle>
        </DialogHeader>
        <NCFBrainVisualization userData={userData} vehicleData={vehicleData} />
      </DialogContent>
    </Dialog>
  );
}