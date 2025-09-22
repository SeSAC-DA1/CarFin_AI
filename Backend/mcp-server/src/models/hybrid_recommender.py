"""
실제 하이브리드 추천 시스템
Hybrid Recommendation System: Content-based + Collaborative Filtering + Popularity

핵심 구성요소:
1. Content-based Filtering: 차량 특성 기반 추천
2. Collaborative Filtering: NCF (Neural Collaborative Filtering)
3. Popularity-based Filtering: 시장 인기도 기반
4. Price Fairness Analysis: 가격 적정성 분석
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import TruncatedSVD
import torch
import torch.nn as nn
import torch.optim as optim
from datetime import datetime, timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger("HybridRecommender")

class NCFModel(nn.Module):
    """Neural Collaborative Filtering 모델"""

    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 32, hidden_dims: List[int] = [64, 32, 16]):
        super().__init__()

        # 임베딩 레이어
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        # MLP 레이어
        self.mlp_layers = nn.ModuleList()
        input_dim = embedding_dim * 2

        for hidden_dim in hidden_dims:
            self.mlp_layers.append(nn.Linear(input_dim, hidden_dim))
            self.mlp_layers.append(nn.ReLU())
            self.mlp_layers.append(nn.Dropout(0.2))
            input_dim = hidden_dim

        self.output_layer = nn.Linear(hidden_dims[-1], 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)

        # 임베딩 연결
        mlp_input = torch.cat([user_emb, item_emb], dim=1)

        # MLP 통과
        for layer in self.mlp_layers:
            mlp_input = layer(mlp_input)

        output = self.output_layer(mlp_input)
        return self.sigmoid(output)

class ContentBasedRecommender:
    """내용 기반 추천기"""

    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000)
        self.scaler = StandardScaler()
        self.feature_matrix = None
        self.vehicle_features = None

    def fit(self, vehicles_df: pd.DataFrame):
        """차량 데이터로 모델 학습"""
        try:
            # 텍스트 특성 벡터화 (브랜드, 모델, 연료타입 등)
            text_features = vehicles_df.apply(
                lambda x: f"{x['brand']} {x['model']} {x.get('fuel_type', '')} {x.get('transmission', '')}",
                axis=1
            )

            text_matrix = self.tfidf_vectorizer.fit_transform(text_features)

            # 수치 특성 정규화
            numeric_features = ['year', 'price', 'mileage']
            numeric_data = vehicles_df[numeric_features].fillna(0)
            numeric_matrix = self.scaler.fit_transform(numeric_data)

            # 특성 결합
            self.feature_matrix = np.hstack([
                text_matrix.toarray(),
                numeric_matrix
            ])

            self.vehicle_features = vehicles_df.copy()
            logger.info(f"✅ Content-based 모델 학습 완료: {len(vehicles_df)}대 차량")

        except Exception as e:
            logger.error(f"❌ Content-based 학습 실패: {e}")
            raise

    def recommend(self, user_profile: Dict[str, Any], top_k: int = 10) -> List[Tuple[int, float]]:
        """사용자 프로필 기반 추천"""
        try:
            if self.feature_matrix is None:
                raise ValueError("모델이 학습되지 않았습니다")

            # 사용자 프로필을 벡터로 변환
            user_vector = self._create_user_vector(user_profile)

            # 코사인 유사도 계산
            similarities = cosine_similarity([user_vector], self.feature_matrix)[0]

            # 상위 k개 추천
            top_indices = np.argsort(similarities)[::-1][:top_k]
            recommendations = [(idx, float(similarities[idx])) for idx in top_indices]

            logger.info(f"✅ Content-based 추천 완료: {len(recommendations)}개")
            return recommendations

        except Exception as e:
            logger.error(f"❌ Content-based 추천 실패: {e}")
            return []

    def _create_user_vector(self, user_profile: Dict[str, Any]) -> np.ndarray:
        """사용자 프로필을 특성 벡터로 변환"""
        # 선호 브랜드/모델 텍스트 생성
        preferred_text = f"{user_profile.get('preferred_brands', [''])[0]} {user_profile.get('fuel_type', '')} {user_profile.get('transmission', '')}"

        # 텍스트 벡터화
        text_vector = self.tfidf_vectorizer.transform([preferred_text]).toarray()[0]

        # 수치 특성 (예산 중간값, 최신 연도 선호, 낮은 주행거리 선호)
        budget_mid = (user_profile.get('budget_min', 0) + user_profile.get('budget_max', 5000)) / 2
        preferred_year = user_profile.get('min_year', 2018)
        preferred_mileage = 50000  # 기본값

        numeric_vector = self.scaler.transform([[preferred_year, budget_mid, preferred_mileage]])[0]

        # 벡터 결합
        return np.hstack([text_vector, numeric_vector])

class PopularityBasedRecommender:
    """인기도 기반 추천기"""

    def __init__(self):
        self.popularity_scores = {}
        self.trend_weights = {
            'view_count': 0.3,
            'inquiry_count': 0.4,
            'recent_activity': 0.2,
            'price_competitiveness': 0.1
        }

    def calculate_popularity(self, vehicles_df: pd.DataFrame, interaction_data: Optional[pd.DataFrame] = None) -> Dict[int, float]:
        """인기도 점수 계산"""
        try:
            popularity_scores = {}

            for idx, vehicle in vehicles_df.iterrows():
                score = 0.0

                # 기본 인기도 (브랜드별)
                brand_popularity = self._get_brand_popularity(vehicle['brand'])
                score += brand_popularity * 0.3

                # 연식 기반 점수
                year_score = self._calculate_year_score(vehicle['year'])
                score += year_score * 0.2

                # 가격 경쟁력
                price_score = self._calculate_price_competitiveness(vehicle, vehicles_df)
                score += price_score * 0.3

                # 상호작용 데이터가 있으면 활용
                if interaction_data is not None:
                    interaction_score = self._calculate_interaction_score(vehicle['id'], interaction_data)
                    score += interaction_score * 0.2
                else:
                    # 기본 점수
                    score += 0.5 * 0.2

                popularity_scores[idx] = min(1.0, max(0.0, score))

            self.popularity_scores = popularity_scores
            logger.info(f"✅ 인기도 점수 계산 완료: {len(popularity_scores)}대")
            return popularity_scores

        except Exception as e:
            logger.error(f"❌ 인기도 계산 실패: {e}")
            return {}

    def _get_brand_popularity(self, brand: str) -> float:
        """브랜드별 인기도"""
        brand_scores = {
            'hyundai': 0.85, 'kia': 0.82, 'genesis': 0.78,
            'toyota': 0.90, 'honda': 0.85, 'nissan': 0.75,
            'bmw': 0.88, 'mercedes': 0.90, 'audi': 0.85,
            'volkswagen': 0.80, 'volvo': 0.75, 'lexus': 0.88
        }
        return brand_scores.get(brand.lower(), 0.6)

    def _calculate_year_score(self, year: int) -> float:
        """연식 기반 점수"""
        current_year = datetime.now().year
        age = current_year - year

        if age <= 2:
            return 1.0
        elif age <= 5:
            return 0.8
        elif age <= 10:
            return 0.6
        else:
            return 0.3

    def _calculate_price_competitiveness(self, vehicle: pd.Series, vehicles_df: pd.DataFrame) -> float:
        """가격 경쟁력 점수"""
        same_brand_vehicles = vehicles_df[
            (vehicles_df['brand'] == vehicle['brand']) &
            (abs(vehicles_df['year'] - vehicle['year']) <= 2)
        ]

        if len(same_brand_vehicles) < 2:
            return 0.5

        price_percentile = (same_brand_vehicles['price'] <= vehicle['price']).mean()

        # 가격이 낮을수록 높은 점수 (역상관관계)
        return 1.0 - price_percentile

    def _calculate_interaction_score(self, vehicle_id: int, interaction_data: pd.DataFrame) -> float:
        """상호작용 기반 점수"""
        vehicle_interactions = interaction_data[interaction_data['vehicle_id'] == vehicle_id]

        if len(vehicle_interactions) == 0:
            return 0.3

        # 조회수, 문의수, 최근 활동 기반 점수 계산
        view_score = min(1.0, vehicle_interactions['view_count'].sum() / 100)
        inquiry_score = min(1.0, vehicle_interactions['inquiry_count'].sum() / 10)

        return (view_score * 0.6 + inquiry_score * 0.4)

class HybridRecommendationSystem:
    """통합 하이브리드 추천 시스템"""

    def __init__(self):
        self.content_recommender = ContentBasedRecommender()
        self.popularity_recommender = PopularityBasedRecommender()
        self.ncf_model = None
        self.is_trained = False
        self.executor = ThreadPoolExecutor(max_workers=4)

        # 가중치 설정
        self.weights = {
            'content_based': 0.4,
            'collaborative': 0.3,
            'popularity': 0.3
        }

        logger.info("🤖 하이브리드 추천시스템 초기화 완료")

    async def train(self, vehicles_df: pd.DataFrame, interaction_data: Optional[pd.DataFrame] = None):
        """추천 시스템 학습"""
        try:
            logger.info(f"🎯 하이브리드 추천시스템 학습 시작: {len(vehicles_df)}대 차량")

            # Content-based 학습
            await asyncio.get_event_loop().run_in_executor(
                self.executor, self.content_recommender.fit, vehicles_df
            )

            # Popularity 점수 계산
            await asyncio.get_event_loop().run_in_executor(
                self.executor, self.popularity_recommender.calculate_popularity, vehicles_df, interaction_data
            )

            # NCF 모델 학습 (상호작용 데이터가 있을 때)
            if interaction_data is not None and len(interaction_data) > 100:
                await self._train_ncf_model(interaction_data, len(vehicles_df))

            self.is_trained = True
            logger.info("✅ 하이브리드 추천시스템 학습 완료")

        except Exception as e:
            logger.error(f"❌ 하이브리드 추천시스템 학습 실패: {e}")
            raise

    async def recommend(self, user_profile: Dict[str, Any], vehicles_df: pd.DataFrame, top_k: int = 10) -> List[Dict[str, Any]]:
        """하이브리드 추천 실행"""
        try:
            if not self.is_trained:
                await self.train(vehicles_df)

            logger.info(f"🎯 하이브리드 추천 시작: 사용자 프로필 기반")

            # 각 추천기에서 점수 계산
            content_scores = await self._get_content_scores(user_profile, len(vehicles_df))
            popularity_scores = await self._get_popularity_scores(len(vehicles_df))
            collaborative_scores = await self._get_collaborative_scores(user_profile, len(vehicles_df))

            # 점수 결합
            final_scores = self._combine_scores(content_scores, popularity_scores, collaborative_scores)

            # 상위 k개 선택
            top_indices = sorted(final_scores.keys(), key=lambda x: final_scores[x], reverse=True)[:top_k]

            # 추천 결과 생성
            recommendations = []
            for idx in top_indices:
                vehicle = vehicles_df.iloc[idx]
                recommendations.append({
                    'vehicle_id': idx,
                    'vehicle_data': vehicle.to_dict(),
                    'score': final_scores[idx],
                    'content_score': content_scores.get(idx, 0.0),
                    'popularity_score': popularity_scores.get(idx, 0.0),
                    'collaborative_score': collaborative_scores.get(idx, 0.0),
                    'reasoning': self._generate_reasoning(vehicle, user_profile)
                })

            logger.info(f"✅ 하이브리드 추천 완료: {len(recommendations)}개 추천")
            return recommendations

        except Exception as e:
            logger.error(f"❌ 하이브리드 추천 실패: {e}")
            return []

    async def _get_content_scores(self, user_profile: Dict[str, Any], num_vehicles: int) -> Dict[int, float]:
        """Content-based 점수 계산"""
        try:
            recommendations = await asyncio.get_event_loop().run_in_executor(
                self.executor, self.content_recommender.recommend, user_profile, num_vehicles
            )
            return {idx: score for idx, score in recommendations}
        except Exception as e:
            logger.error(f"❌ Content-based 점수 계산 실패: {e}")
            return {}

    async def _get_popularity_scores(self, num_vehicles: int) -> Dict[int, float]:
        """Popularity 점수 반환"""
        return self.popularity_recommender.popularity_scores

    async def _get_collaborative_scores(self, user_profile: Dict[str, Any], num_vehicles: int) -> Dict[int, float]:
        """Collaborative filtering 점수 계산"""
        if self.ncf_model is None:
            # NCF 모델이 없으면 기본 점수 반환
            return {i: 0.5 for i in range(num_vehicles)}

        try:
            # NCF 모델로 예측 (실제 구현에서는 사용자 임베딩 필요)
            scores = {}
            user_id = hash(str(user_profile)) % 1000  # 임시 사용자 ID

            for item_id in range(num_vehicles):
                with torch.no_grad():
                    score = self.ncf_model(
                        torch.tensor([user_id]),
                        torch.tensor([item_id])
                    ).item()
                    scores[item_id] = score

            return scores
        except Exception as e:
            logger.error(f"❌ Collaborative filtering 실패: {e}")
            return {i: 0.5 for i in range(num_vehicles)}

    def _combine_scores(self, content_scores: Dict[int, float], popularity_scores: Dict[int, float], collaborative_scores: Dict[int, float]) -> Dict[int, float]:
        """점수들을 가중 평균으로 결합"""
        all_indices = set(content_scores.keys()) | set(popularity_scores.keys()) | set(collaborative_scores.keys())
        final_scores = {}

        for idx in all_indices:
            content_score = content_scores.get(idx, 0.0)
            popularity_score = popularity_scores.get(idx, 0.0)
            collaborative_score = collaborative_scores.get(idx, 0.0)

            final_score = (
                content_score * self.weights['content_based'] +
                popularity_score * self.weights['popularity'] +
                collaborative_score * self.weights['collaborative']
            )

            final_scores[idx] = final_score

        return final_scores

    def _generate_reasoning(self, vehicle: pd.Series, user_profile: Dict[str, Any]) -> str:
        """추천 이유 생성"""
        reasons = []

        # 예산 매칭
        budget_min = user_profile.get('budget_min', 0)
        budget_max = user_profile.get('budget_max', float('inf'))
        if budget_min <= vehicle['price'] <= budget_max:
            reasons.append(f"예산 범위 내 ({vehicle['price']:,}만원)")

        # 브랜드 선호
        preferred_brands = user_profile.get('preferred_brands', [])
        if vehicle['brand'] in preferred_brands:
            reasons.append(f"선호 브랜드 ({vehicle['brand']})")

        # 연식
        if vehicle['year'] >= user_profile.get('min_year', 2015):
            reasons.append(f"최신 연식 ({vehicle['year']}년)")

        return " • ".join(reasons) if reasons else "종합 분석 결과 추천"

    async def _train_ncf_model(self, interaction_data: pd.DataFrame, num_items: int):
        """NCF 모델 학습"""
        try:
            logger.info("🤖 NCF 모델 학습 시작...")

            num_users = interaction_data['user_id'].nunique()
            self.ncf_model = NCFModel(num_users, num_items)

            # 간단한 학습 루프 (실제로는 더 복잡한 학습 필요)
            optimizer = optim.Adam(self.ncf_model.parameters(), lr=0.001)
            criterion = nn.BCELoss()

            for epoch in range(10):  # 빠른 학습을 위해 10 에포크만
                total_loss = 0
                for _, row in interaction_data.iterrows():
                    user_id = torch.tensor([row['user_id']])
                    item_id = torch.tensor([row['vehicle_id']])
                    rating = torch.tensor([row['rating'] / 5.0])  # 0-1 정규화

                    prediction = self.ncf_model(user_id, item_id)
                    loss = criterion(prediction, rating.unsqueeze(0))

                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()

                    total_loss += loss.item()

            logger.info("✅ NCF 모델 학습 완료")

        except Exception as e:
            logger.error(f"❌ NCF 모델 학습 실패: {e}")

# 전역 인스턴스
hybrid_recommender = HybridRecommendationSystem()

async def get_hybrid_recommendations(user_profile: Dict[str, Any], vehicles_df: pd.DataFrame, top_k: int = 10) -> List[Dict[str, Any]]:
    """하이브리드 추천 API"""
    return await hybrid_recommender.recommend(user_profile, vehicles_df, top_k)