'use client';

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
}

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'desktop',
    orientation: 'landscape',
    touchSupported: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width < height ? 'portrait' : 'landscape';
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // 화면 크기 기준 분류
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (isMobile) screenSize = 'mobile';
      else if (isTablet) screenSize = 'tablet';

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
        orientation,
        touchSupported,
      });
    };

    // 초기 검사
    checkDevice();

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      checkDevice();
    };

    // 방향 변경 이벤트 리스너
    const handleOrientationChange = () => {
      // 방향 변경 후 약간의 지연을 두고 다시 검사
      setTimeout(checkDevice, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
}

// 터치 제스처 감지 훅
export function useTouchGesture() {
  const [touchState, setTouchState] = useState({
    isPressed: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState({
      isPressed: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.isPressed) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;

    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
    }));
  };

  const handleTouchEnd = () => {
    setTouchState(prev => ({
      ...prev,
      isPressed: false,
    }));
  };

  return {
    touchState,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// 스크롤 최적화 훅
export function useScrollOptimization() {
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    scrollDirection: 'down' as 'up' | 'down',
    isScrolling: false,
    isNearTop: true,
    isNearBottom: false,
  });

  useEffect(() => {
    let ticking = false;
    let scrollTimeout: NodeJS.Timeout;

    const updateScrollState = () => {
      const scrollY = window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      const isNearTop = scrollY < 100;
      const isNearBottom = scrollY + clientHeight > scrollHeight - 100;
      const scrollDirection = scrollY > scrollState.scrollY ? 'down' : 'up';

      setScrollState({
        scrollY,
        scrollDirection,
        isScrolling: true,
        isNearTop,
        isNearBottom,
      });

      // 스크롤 끝난 후 isScrolling을 false로 설정
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setScrollState(prev => ({ ...prev, isScrolling: false }));
      }, 150);

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollState.scrollY]);

  return scrollState;
}