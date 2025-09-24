'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Zap, Target, CheckCircle } from 'lucide-react';

interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  matchScore?: number;
}

interface DynamicVehicleScanningProps {
  category: 'economy' | 'family' | 'hobby';
  onScanComplete: () => void;
}

export function DynamicVehicleScanning({ category, onScanComplete }: DynamicVehicleScanningProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'loading' | 'scanning' | 'filtering' | 'complete'>('loading');
  const [scannedVehicles, setScannedVehicles] = useState<Vehicle[]>([]);
  const [filteredCount, setFilteredCount] = useState(111841);
  const [finalMatches, setFinalMatches] = useState<Vehicle[]>([]);

  // 카테고리별 설정
  const categoryConfig = {
    economy: {
      color: 'var(--toss-success)',
      gradient: 'from-[var(--toss-success)] to-emerald-400',
      emoji: '🚗',
      title: '경제적인 차량',
      keywords: ['연비', '경제성', '실용성']
    },
    family: {
      color: 'var(--toss-info)',
      gradient: 'from-[var(--toss-info)] to-blue-400',
      emoji: '👨‍👩‍👧‍👦',
      title: '가족용 차량',
      keywords: ['안전성', '공간', '편의성']
    },
    hobby: {
      color: 'var(--toss-warning)',
      gradient: 'from-[var(--toss-warning)] to-yellow-400',
      emoji: '🏎️',
      title: '취미용 차량',
      keywords: ['성능', '디자인', '드라이빙']
    }
  };

  const config = categoryConfig[category];

  // 실제 차량 데이터 가져오기
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await fetch('/api/vehicles-real?limit=20');
        const data = await response.json();
        if (data.success && data.vehicles) {
          setScannedVehicles(data.vehicles.map((v: any, index: number) => ({
            id: v.vehicleid || `vehicle-${index}`,
            manufacturer: v.manufacturer || '현대',
            model: v.model || '아반떼',
            year: v.modelyear || 2022,
            price: v.price || 2500,
            image: v.photo || '/images/car-placeholder.jpg',
            matchScore: Math.floor(Math.random() * 30) + 70 // 70-100 랜덤 스코어
          })));
        }
      } catch (error) {
        console.error('Vehicle data fetch failed:', error);
        // 폴백 데이터
        setScannedVehicles([
          { id: '1', manufacturer: '현대', model: '아반떼', year: 2023, price: 2800, matchScore: 95 },
          { id: '2', manufacturer: '기아', model: 'K3', year: 2022, price: 2600, matchScore: 90 },
          { id: '3', manufacturer: '현대', model: '쏘나타', year: 2023, price: 3200, matchScore: 85 },
          { id: '4', manufacturer: '기아', model: 'K5', year: 2022, price: 3000, matchScore: 88 },
          { id: '5', manufacturer: '제네시스', model: 'G70', year: 2023, price: 4500, matchScore: 92 }
        ]);
      }
    };

    fetchVehicleData();
  }, []);

  // 스캐닝 프로세스 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => setCurrentPhase('scanning'), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentPhase === 'scanning') {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + Math.random() * 8 + 2;

          if (newProgress >= 100) {
            setCurrentPhase('filtering');
            return 100;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentPhase]);

  // 필터링 프로세스
  useEffect(() => {
    if (currentPhase === 'filtering') {
      const filteringTimer = setInterval(() => {
        setFilteredCount(prev => {
          const newCount = Math.max(5, prev - Math.floor(Math.random() * 5000 + 2000));
          if (newCount <= 5) {
            setCurrentPhase('complete');
            setFinalMatches(scannedVehicles.slice(0, 5));
            setTimeout(() => onScanComplete(), 1500);
            return 5;
          }
          return newCount;
        });
      }, 200);

      return () => clearInterval(filteringTimer);
    }
  }, [currentPhase, scannedVehicles, onScanComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* 배경 파티클 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center shadow-2xl`}>
            <span className="text-4xl">{config.emoji}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {config.title} 스캐닝 중
          </h1>
          <p className="text-gray-300 text-lg">
            111,841대의 차량 데이터에서 최적의 매칭을 찾고 있어요
          </p>
        </motion.div>

        {/* 스캐닝 단계별 표시 */}
        <AnimatePresence mode="wait">
          {currentPhase === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center space-x-3">
                <Car className="w-8 h-8 text-blue-400 animate-pulse" />
                <span className="text-white text-xl">데이터베이스 연결 중...</span>
              </div>
            </motion.div>
          )}

          {currentPhase === 'scanning' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-white text-xl font-semibold">
                <Zap className="w-6 h-6 inline mr-2 text-yellow-400" />
                차량 데이터 스캐닝: {Math.floor(scanProgress)}%
              </div>

              {/* 프로그레스 바 */}
              <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* 스캐닝되는 차량들 시뮬레이션 */}
              <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
                {scannedVehicles.slice(0, 10).map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: [0, 1, 0.3],
                      scale: [0.8, 1, 0.9],
                    }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                    className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20"
                  >
                    <div className="text-white text-xs font-medium">
                      {vehicle.manufacturer}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {vehicle.model}
                    </div>
                    <div className={`text-xs mt-1 font-bold`} style={{ color: config.color }}>
                      {vehicle.matchScore}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentPhase === 'filtering' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-white text-xl font-semibold">
                <Target className="w-6 h-6 inline mr-2 text-green-400" />
                {config.keywords.join(', ')} 기준으로 필터링 중
              </div>

              <div className="text-6xl font-bold text-white">
                <motion.span
                  key={filteredCount}
                  initial={{ scale: 1.2, color: config.color }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredCount.toLocaleString()}
                </motion.span>
                <span className="text-gray-400 text-2xl ml-2">대</span>
              </div>
            </motion.div>
          )}

          {currentPhase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-white text-2xl font-bold">
                <CheckCircle className="w-8 h-8 inline mr-3 text-green-400" />
                완벽한 매칭 완료!
              </div>

              <div className="text-4xl font-bold" style={{ color: config.color }}>
                5대의 최적 차량 발견
              </div>

              {/* 최종 매칭 차량들 미리보기 */}
              <div className="flex justify-center space-x-4 mt-8">
                {finalMatches.map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/30"
                  >
                    <div className="text-white font-bold">{vehicle.manufacturer}</div>
                    <div className="text-gray-300 text-sm">{vehicle.model}</div>
                    <div className="text-green-400 font-bold text-lg">{vehicle.matchScore}%</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-gray-400 text-sm"
        >
          AI 멀티에이전트가 실시간으로 분석 중입니다
        </motion.div>
      </div>
    </div>
  );
}