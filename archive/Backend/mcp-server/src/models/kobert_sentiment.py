"""
실제 KoBERT 기반 한국어 감정분석 모델
Korean Sentiment Analysis using KoBERT
"""

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
import numpy as np
from typing import List, Dict, Any, Tuple
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os

logger = logging.getLogger("KoBERT-Sentiment")

class KoBERTSentimentClassifier(nn.Module):
    """KoBERT 기반 감정분석 분류기"""

    def __init__(self, n_classes=3, dropout=0.1):
        super().__init__()
        self.kobert = AutoModel.from_pretrained('monologg/kobert')
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(768, n_classes)  # 긍정, 중립, 부정

    def forward(self, input_ids, attention_mask):
        outputs = self.kobert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        output = self.dropout(pooled_output)
        return self.classifier(output)

class RealKoBERTSentimentAnalyzer:
    """실제 KoBERT 모델을 사용한 감정분석기"""

    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = None
        self.model = None
        self.max_length = 512
        self.executor = ThreadPoolExecutor(max_workers=4)

        # 감정 레이블 매핑
        self.sentiment_labels = {
            0: 'negative',   # 부정
            1: 'neutral',    # 중립
            2: 'positive'    # 긍정
        }

        logger.info(f"🤖 KoBERT 감정분석기 초기화 시작 (Device: {self.device})")

    async def initialize(self):
        """모델 초기화 (비동기)"""
        try:
            # KoBERT 토크나이저 로드
            self.tokenizer = AutoTokenizer.from_pretrained('monologg/kobert', trust_remote_code=True)

            # 모델 로드
            self.model = KoBERTSentimentClassifier(n_classes=3)

            # 사전 훈련된 가중치 로드 (실제 환경에서는 fine-tuned 모델 사용)
            checkpoint_path = os.path.join(os.path.dirname(__file__), 'kobert_sentiment.pth')
            if os.path.exists(checkpoint_path):
                self.model.load_state_dict(torch.load(checkpoint_path, map_location=self.device))
                logger.info("✅ 사전 훈련된 감정분석 모델 로드 완료")
            else:
                logger.warning("⚠️ 사전 훈련된 모델 없음, 기본 모델 사용")

            self.model.to(self.device)
            self.model.eval()

            logger.info("✅ KoBERT 감정분석기 초기화 완료")

        except Exception as e:
            logger.error(f"❌ KoBERT 모델 초기화 실패: {e}")
            raise

    def _preprocess_text(self, text: str) -> str:
        """텍스트 전처리"""
        # 기본 정제
        text = text.strip()
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = ' '.join(text.split())  # 연속 공백 제거

        return text[:1000]  # 최대 길이 제한

    def _tokenize_text(self, text: str) -> Dict[str, torch.Tensor]:
        """텍스트 토크나이징"""
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].to(self.device),
            'attention_mask': encoding['attention_mask'].to(self.device)
        }

    def _predict_single(self, text: str) -> Dict[str, Any]:
        """단일 텍스트 감정 예측"""
        try:
            # 텍스트 전처리
            cleaned_text = self._preprocess_text(text)

            # 토크나이징
            inputs = self._tokenize_text(cleaned_text)

            # 예측
            with torch.no_grad():
                outputs = self.model(inputs['input_ids'], inputs['attention_mask'])
                probabilities = torch.nn.functional.softmax(outputs, dim=-1)
                predicted_class = torch.argmax(probabilities, dim=-1).item()
                confidence = probabilities.max().item()

            # 결과 반환
            sentiment_label = self.sentiment_labels[predicted_class]

            return {
                'text': text[:100] + '...' if len(text) > 100 else text,
                'sentiment': sentiment_label,
                'confidence': float(confidence),
                'probabilities': {
                    'negative': float(probabilities[0][0]),
                    'neutral': float(probabilities[0][1]),
                    'positive': float(probabilities[0][2])
                },
                'score': self._convert_to_score(predicted_class, confidence)
            }

        except Exception as e:
            logger.error(f"❌ 감정분석 예측 실패: {e}")
            return {
                'text': text[:100] + '...' if len(text) > 100 else text,
                'sentiment': 'neutral',
                'confidence': 0.5,
                'probabilities': {'negative': 0.33, 'neutral': 0.34, 'positive': 0.33},
                'score': 3.0,
                'error': str(e)
            }

    def _convert_to_score(self, predicted_class: int, confidence: float) -> float:
        """감정 클래스를 1-5 점수로 변환"""
        base_scores = {0: 2.0, 1: 3.0, 2: 4.0}  # 부정: 2, 중립: 3, 긍정: 4
        base_score = base_scores[predicted_class]

        # 신뢰도에 따른 점수 조정
        if predicted_class == 0:  # 부정
            return max(1.0, base_score - (confidence - 0.5) * 2)
        elif predicted_class == 2:  # 긍정
            return min(5.0, base_score + (confidence - 0.5) * 2)
        else:  # 중립
            return base_score

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """단일 텍스트 비동기 감정분석"""
        if not self.model:
            await self.initialize()

        # GPU 연산을 별도 스레드에서 실행
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor,
            self._predict_single,
            text
        )

        return result

    async def analyze_multiple_sentiments(self, texts: List[str]) -> List[Dict[str, Any]]:
        """다중 텍스트 배치 감정분석"""
        if not self.model:
            await self.initialize()

        tasks = [self.analyze_sentiment(text) for text in texts]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"❌ 텍스트 {i} 분석 실패: {result}")
                processed_results.append({
                    'text': texts[i][:100] + '...' if len(texts[i]) > 100 else texts[i],
                    'sentiment': 'neutral',
                    'confidence': 0.5,
                    'probabilities': {'negative': 0.33, 'neutral': 0.34, 'positive': 0.33},
                    'score': 3.0,
                    'error': str(result)
                })
            else:
                processed_results.append(result)

        return processed_results

    def calculate_overall_sentiment(self, individual_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """개별 감정분석 결과를 종합하여 전체 감정 계산"""
        valid_results = [r for r in individual_results if 'error' not in r]

        if not valid_results:
            return {
                'average_score': 3.0,
                'sentiment_distribution': {'negative': 0.33, 'neutral': 0.34, 'positive': 0.33},
                'total_analyzed': 0,
                'confidence': 0.5,
                'dominant_sentiment': 'neutral'
            }

        # 평균 점수 계산
        scores = [r['score'] for r in valid_results]
        average_score = np.mean(scores)

        # 감정 분포 계산
        sentiment_counts = {'negative': 0, 'neutral': 0, 'positive': 0}
        confidence_sum = 0

        for result in valid_results:
            sentiment_counts[result['sentiment']] += 1
            confidence_sum += result['confidence']

        total_count = len(valid_results)
        sentiment_distribution = {
            k: v / total_count for k, v in sentiment_counts.items()
        }

        # 주요 감정 결정
        dominant_sentiment = max(sentiment_distribution, key=sentiment_distribution.get)

        return {
            'average_score': float(average_score),
            'sentiment_distribution': sentiment_distribution,
            'total_analyzed': total_count,
            'confidence': float(confidence_sum / total_count) if total_count > 0 else 0.5,
            'dominant_sentiment': dominant_sentiment,
            'score_std': float(np.std(scores)) if len(scores) > 1 else 0.0
        }

# 전역 인스턴스
kobert_analyzer = RealKoBERTSentimentAnalyzer()

async def analyze_korean_sentiment(text: str) -> Dict[str, Any]:
    """한국어 텍스트 감정분석 API"""
    return await kobert_analyzer.analyze_sentiment(text)

async def analyze_korean_sentiments_batch(texts: List[str]) -> List[Dict[str, Any]]:
    """한국어 텍스트 배치 감정분석 API"""
    return await kobert_analyzer.analyze_multiple_sentiments(texts)