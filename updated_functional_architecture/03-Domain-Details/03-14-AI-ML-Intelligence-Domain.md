# Domain 14 — AI/ML Intelligence Platform

> **Status**: Planned
> **Last Updated**: February 2026
> **Owner**: Data Science & Platform Team
> **Dependencies**: Service Discovery (1), Booking & Scheduling (3), Payment Processing (4), User Management (5), Profile Management (6), Review & Rating (8), AI Conversational Experience (13)

---

## 1. Purpose and Business Value

### The Vision

Domain 14 is Welpco's silent engine of intelligence. While Domain 13 is the face the customer sees, Domain 14 is the brain that makes every interaction smarter, every search more relevant, every suggestion more accurate, and every suspicious activity more visible.

Over time, Welpco doesn't just serve users — it **learns** them. It learns that Marie books cleaning every other Friday. That Jean-Luc prefers morning appointments. That demand for snow removal spikes 48 hours before a forecasted storm in Montreal. That a cluster of suspiciously similar 5-star reviews appeared overnight.

This domain transforms raw platform data into actionable intelligence that benefits every stakeholder:

| Stakeholder | Value Delivered |
|-------------|----------------|
| **Customers** | Better search results, personalized recommendations, fewer bad experiences |
| **Welpers** | Demand insights, pricing guidance, schedule optimization, reputation analytics |
| **Platform** | Fraud prevention, churn reduction, operational efficiency, data-driven decisions |
| **Admins** | Real-time anomaly alerts, platform health dashboards, A/B experiment tracking |

### Business Metrics

| Metric | Target | Capability |
|--------|--------|-----------|
| Search relevance (NDCG@10) | > 0.75 | Smart Matching Engine |
| Booking conversion improvement | +20% vs. baseline | Smart Matching + Pricing |
| Fraud detection rate | > 95% of synthetic fraud | Fraud & Anomaly Detection |
| Customer churn reduction | -30% among at-risk users | Churn Prediction |
| Welper earnings increase | +12% for users of pricing suggestions | Dynamic Pricing |
| Schedule efficiency | -25% travel time between jobs | Smart Scheduling |
| Demand forecast accuracy (MAPE) | < 15% | Demand Forecasting |

---

## 2. Core Capabilities

### 2.1 Smart Matching Engine

**Problem:** Simple keyword + location search returns relevant results, but doesn't account for the subtle preferences and patterns that make a match truly great.

**Solution:** An ML ranking model that re-ranks search results based on rich signals about both the customer and the welper.

#### Feature Set

| Feature Category | Features | Source |
|-----------------|----------|--------|
| **Customer history** | Past booking categories, frequency, preferred times, repeat welpers | Booking domain |
| **Welper performance** | Completion rate, response time, average rating, rating trend | Profile + Review domains |
| **Match signals** | Category match score, distance, price compatibility, language match | Search + Profile domains |
| **Temporal** | Day of week, time of day, seasonality, urgency signals | Request context |
| **Behavioral** | Click-through rates on past search results, profile view duration | Analytics events |
| **Social proof** | Number of bookings, repeat customer rate, review sentiment score | Booking + Review domains |

#### Model Architecture

```
┌──────────────────────────────────────────────────┐
│            Smart Matching Pipeline                │
│                                                   │
│  Raw Search Results (text + location match)       │
│         ↓                                         │
│  Feature Engineering                              │
│  ┌─────────────────────────────────────────────┐  │
│  │ Customer features  ←  Feature Store (PG)    │  │
│  │ Welper features    ←  Feature Store (PG)    │  │
│  │ Context features   ←  Real-time request     │  │
│  │ Interaction feats  ←  Analytics events      │  │
│  └─────────────────────────────────────────────┘  │
│         ↓                                         │
│  ML Ranking Model (LightGBM / XGBoost)            │
│  - Learning-to-rank objective (LambdaRank)        │
│  - ~50 features per (customer, welper) pair       │
│  - Trained weekly on booking outcomes             │
│         ↓                                         │
│  Re-ranked Results                                │
│  - Score = P(successful_booking | features)       │
│  - Diversity injection (avoid showing only 5★)    │
│  - New welper boost (cold-start fairness)         │
│         ↓                                         │
│  Returned to Service Discovery Domain             │
└──────────────────────────────────────────────────┘
```

#### Training Pipeline

| Aspect | Detail |
|--------|--------|
| **Positive label** | Customer booked the welper AND left a 4+ star review |
| **Negative label** | Customer viewed but didn't book, OR booked but left < 3 star review |
| **Training frequency** | Weekly batch retrain |
| **Evaluation** | Offline: NDCG@10, MAP. Online: A/B test booking rate |
| **Cold start** | New welpers get a boosted prior based on category average; decays after 10 bookings |
| **Fairness** | Diversity constraint ensures no single welper dominates results; geographic balance |

#### Model Variants

| Model | Use Case | Trade-off |
|-------|----------|-----------|
| **LightGBM (primary)** | General ranking | Fast inference (~2ms), good with tabular features |
| **Neural Collaborative Filtering** | Users with rich history | Captures latent preferences, slower inference |
| **Hybrid** | Production ensemble | Weighted blend based on user history depth |

---

### 2.2 Demand Forecasting

**Problem:** Welpers don't know when demand will spike. Customers search at peak times and find no one available. The platform can't proactively balance supply and demand.

**Solution:** A time-series forecasting model that predicts demand by category, location, and time window — giving welpers and the platform foresight.

#### Forecast Dimensions

| Dimension | Granularity | Example |
|-----------|------------|---------|
| **Category** | Service category | "Cleaning", "Plumbing", "Snow Removal" |
| **Location** | FSA (Forward Sortation Area) | "H9R" (Pointe-Claire), "H3A" (Downtown MTL) |
| **Time** | Daily + 4-hour blocks | "Saturday 8am-12pm" |
| **Horizon** | 1 day, 7 days, 30 days | Next week forecast updated daily |

#### Input Signals

| Signal | Source | Rationale |
|--------|--------|-----------|
| Historical bookings | Booking domain | Base demand pattern |
| Search volume | Service Discovery | Leading indicator (searches precede bookings) |
| Seasonal patterns | Calendar + history | Holiday cleaning surge, spring landscaping, winter snow removal |
| Weather forecast | External API (Environment Canada) | Rain → fewer outdoor jobs, snow → removal demand spike |
| Local events | External API | Festivals, school breaks, moving season (July 1 in Quebec) |
| Day of week / time | Calendar | Weekend vs. weekday patterns |

#### Model Architecture

**Primary: Facebook Prophet**
- Handles seasonality (weekly, monthly, yearly) natively
- Robust to missing data and outliers
- Interpretable components (trend, seasonality, holidays)
- Fast training per (category, location) pair

**Secondary: LSTM (Long Short-Term Memory)**
- For categories with complex non-linear patterns
- Better at capturing sudden trend shifts
- Used when Prophet's residuals are consistently high

#### Welper-Facing Dashboard

```
┌─────────────────────────────────────────────────┐
│  📊 Demand Forecast — Your Area (Laval, H7T)   │
│                                                  │
│  🔥 HIGH DEMAND predicted:                      │
│  ┌───────────────────────────────────────────┐   │
│  │ Cleaning   │ Next Saturday    │ +45% ↑    │   │
│  │ Snow Removal│ Next Tuesday   │ +120% ↑   │   │
│  │ Handyman   │ This Weekend    │ +15% ↑    │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  💡 Tip: Open your Saturday availability to      │
│     capture demand. Welpers who do earn 30%      │
│     more on high-demand days.                    │
│                                                  │
│  [View Full Forecast] [Update Availability]      │
└─────────────────────────────────────────────────┘
```

---

### 2.3 Dynamic Pricing Recommendations

**Problem:** Many welpers struggle to price their services optimally. Too high and they lose bookings; too low and they leave money on the table.

**Solution:** AI-powered pricing suggestions that consider supply, demand, competition, experience, and market conditions. **Welpers always retain full control — suggestions are advisory only.**

#### Pricing Signal Matrix

| Signal | Weight | Description |
|--------|--------|-------------|
| **Demand forecast** | High | Higher demand → higher suggested price |
| **Supply density** | High | Fewer available welpers in area → higher price |
| **Welper experience** | Medium | More bookings + higher ratings → premium pricing justified |
| **Category benchmark** | Medium | Median price in the category/location |
| **Time premium** | Medium | Weekends, evenings, and rush requests carry premiums |
| **Competitor pricing** | Low | What similar welpers charge (anonymized aggregation) |
| **Welper's current rate** | Anchor | Suggestions are relative to current rate ("adjust by +15%") |

#### Suggestion UX

```
┌─────────────────────────────────────────────────┐
│  💰 Pricing Insight — Deep Cleaning (Laval)     │
│                                                  │
│  Your current rate: $30/hr                       │
│                                                  │
│  📈 AI Suggestion: $35/hr for weekends           │
│                                                  │
│  Why? Demand for cleaning in your area is 40%    │
│  higher on weekends, and only 3 welpers are      │
│  available. Similar welpers with your rating      │
│  charge $33-38/hr on weekends.                   │
│                                                  │
│  Estimated impact: +$60/week in additional       │
│  earnings based on your typical booking volume.  │
│                                                  │
│  [Apply Suggestion] [Dismiss] [Customize]        │
│                                                  │
│  ⓘ You always set your own rates. This is just   │
│    a data-driven suggestion.                     │
└─────────────────────────────────────────────────┘
```

#### Model

- Supply-demand optimization using elasticity estimation
- Trained on historical booking acceptance rates at various price points
- Outputs: suggested rate, confidence interval, estimated impact on booking volume
- Constraints: suggestions never exceed ±30% of current rate (to avoid jarring changes)

---

### 2.4 Fraud & Anomaly Detection

**Problem:** As the platform grows, bad actors will attempt to game the system — fake reviews, booking manipulation, payment fraud, and sybil attacks.

**Solution:** A multi-layered anomaly detection system that scores every transaction in real-time and flags suspicious patterns for admin review.

#### Detection Targets

| Fraud Type | Detection Method | Example Pattern |
|-----------|-----------------|-----------------|
| **Fake reviews** | Linguistic analysis + behavioral clustering | Burst of 5-star reviews with similar wording from new accounts |
| **Rating manipulation** | Statistical anomaly detection | Welper's rating jumps from 3.2 to 4.8 in one week |
| **Booking fraud** | Temporal pattern analysis | Same customer creates and cancels bookings repeatedly |
| **Payment fraud** | Transaction scoring + Stripe Radar | Unusual payment amounts, stolen card patterns |
| **Sybil accounts** | Device/IP fingerprinting + behavioral similarity | Multiple accounts from same device, similar behavior patterns |
| **Service delivery fraud** | Check-in/out anomalies | Welper checks in and out within 5 minutes for a 3-hour job |

#### Model Architecture

**Real-Time Scoring Pipeline:**

```
Event (booking, review, payment)
    ↓
Feature extraction (real-time)
  - User history features
  - Event-specific features
  - Network features (IP, device)
    ↓
┌─────────────────────────────────────┐
│  Ensemble Anomaly Detector          │
│                                     │
│  ├── Isolation Forest               │
│  │   (unsupervised, catches novel   │
│  │    fraud patterns)               │
│  │                                  │
│  ├── Autoencoder                    │
│  │   (reconstruction error flags    │
│  │    unusual behavior)             │
│  │                                  │
│  └── Rule Engine                    │
│      (expert rules for known        │
│       fraud patterns)               │
│                                     │
│  Combined score: 0.0 - 1.0         │
└─────────────────────────────────────┘
    ↓
Score > 0.7 → Block + Alert Admin
Score 0.4 - 0.7 → Flag for Review
Score < 0.4 → Allow (log for training)
```

#### Fraud Alert Entity

```typescript
interface FraudAlert {
  id: string;                    // UUID
  entityType: 'booking' | 'review' | 'payment' | 'user';
  entityId: string;              // ID of flagged entity
  fraudType: string;             // e.g., 'fake_review', 'sybil_account'
  score: number;                 // 0.0 - 1.0 anomaly score
  features: Record<string, any>; // Feature values that triggered the alert
  explanation: string;           // Human-readable explanation
  status: 'pending' | 'confirmed_fraud' | 'false_positive' | 'dismissed';
  reviewedBy: string | null;     // Admin who reviewed
  reviewedAt: Date | null;
  createdAt: Date;
}
```

---

### 2.5 Customer Churn Prediction

**Problem:** Losing a customer is expensive — acquiring a replacement costs 5-7x more than retention. By the time a customer stops booking, it's too late.

**Solution:** Predict churn risk before it happens, then trigger proactive retention actions via the Notification domain.

#### Feature Engineering

| Feature | Description | Signal Strength |
|---------|-------------|----------------|
| **Booking frequency delta** | Change in booking frequency over last 30/60/90 days | Very High |
| **Days since last booking** | Time elapsed since last completed booking | High |
| **Last review sentiment** | NLP sentiment score of most recent review | High |
| **Support ticket count** | Number of support tickets in last 90 days | High |
| **Booking cancellation rate** | Percentage of bookings cancelled recently | Medium |
| **App session frequency** | How often the user opens the platform | Medium |
| **Search-to-book ratio** | Are they searching but not booking? | Medium |
| **Average rating given** | Consistently low ratings = dissatisfaction | Medium |
| **Referral activity** | Active referrers are less likely to churn | Low |
| **Payment issues** | Failed payments, disputes | Medium |

#### Model

**Primary: Gradient Boosted Trees (XGBoost)**
- Binary classification: will churn in next 30 days? (yes/no)
- Probability output used for risk scoring (0.0 - 1.0)
- Trained on historical churn data (customers inactive for 90+ days = churned)
- Weekly batch scoring of all active customers

**Feature importance (expected):**

```
Booking frequency delta    ████████████████████ 28%
Days since last booking    ███████████████      21%
Support tickets (90d)      ████████████         17%
Search-to-book ratio       ████████             11%
Last review sentiment      ██████               8%
Cancellation rate          █████                7%
Session frequency delta    ████                 5%
Other features             ██                   3%
```

#### Retention Actions

| Churn Risk | Action | Channel |
|-----------|--------|---------|
| **High (> 0.8)** | Personal outreach from support + discount offer | Email + In-app |
| **Medium (0.5 - 0.8)** | "We miss you!" campaign + featured welpers | Push + Email |
| **Low-Medium (0.3 - 0.5)** | Gentle re-engagement: "New welpers in your area" | Push notification |
| **Low (< 0.3)** | Standard marketing cadence | Normal channels |

---

### 2.6 Review Sentiment Analysis

**Problem:** Star ratings are coarse (5 levels). The real insights are buried in review text — but no one reads all their reviews systematically.

**Solution:** NLP that extracts fine-grained sentiment, topics, and actionable insights from review text.

#### Analysis Pipeline

```
Review Text
    ↓
Preprocessing
  - Language detection (en/fr)
  - Text normalization
  - Translation to English (if French, for model consistency)
    ↓
Aspect-Based Sentiment Analysis
    ↓
┌────────────────────────────────────────┐
│  Extracted Aspects:                    │
│                                        │
│  Punctuality    → Positive (0.92)      │
│  Quality        → Positive (0.85)      │
│  Communication  → Negative (0.31)      │
│  Pricing        → Neutral (0.55)       │
│  Professionalism→ Positive (0.88)      │
└────────────────────────────────────────┘
    ↓
Aggregation (across all reviews for a welper)
    ↓
Reputation Insights Dashboard
```

#### Model Options

| Model | Approach | Trade-off |
|-------|----------|-----------|
| **GPT-4o-mini (primary)** | Prompt-based extraction | High quality, higher cost, flexible |
| **Fine-tuned BERT** | Aspect-sentiment classification | Lower cost, requires training data |
| **Hybrid** | BERT for classification, GPT for summarization | Best balance |

#### Welper Reputation Insights

```
┌─────────────────────────────────────────────────┐
│  🌟 Reputation Insights — Marie-Claire D.       │
│  Based on 127 reviews                           │
│                                                  │
│  STRENGTHS:                                      │
│  ✅ Punctuality ██████████████████████ 95%       │
│  ✅ Quality     █████████████████████  92%       │
│  ✅ Friendliness████████████████████   89%       │
│                                                  │
│  IMPROVEMENT AREAS:                              │
│  ⚠️ Communication █████████████        68%       │
│    → "Customers mention they'd love a heads-up   │
│       text when you're on the way"               │
│                                                  │
│  ⚠️ Cleanup      ████████████          62%       │
│    → "A few reviews mention leaving cleaning     │
│       supplies out after the job"                │
│                                                  │
│  📈 TREND: Your ratings improved +0.3 stars      │
│     over the last 3 months. Keep it up!          │
│                                                  │
│  💡 TOP TIP: Send an ETA text before arriving    │
│     — welpers who do this rate 12% higher.       │
└─────────────────────────────────────────────────┘
```

---

### 2.7 Smart Scheduling Optimization

**Problem:** Welpers with multiple bookings in a day often travel inefficiently between jobs, wasting time and fuel.

**Solution:** An optimization engine that suggests the best booking order to minimize total travel time, considering appointment windows, travel time, and break preferences.

#### How It Works

```
Input:
  - Welper's bookings for the day (with addresses and time windows)
  - Welper's home/start location
  - Break preferences (lunch time, minimum gap between jobs)
  - Travel mode (car / public transit / bike)

    ↓

Google Maps Distance Matrix API
  - Get travel times between all location pairs
  - Account for time-of-day traffic patterns

    ↓

Vehicle Routing Optimization (Google OR-Tools)
  - Variant: Travelling Salesman with Time Windows (TSPTW)
  - Constraints: appointment windows, break time, buffer between jobs
  - Objective: minimize total travel time

    ↓

Output:
  - Optimized booking order
  - Suggested departure times
  - Estimated total travel time (vs. naive order)
  - Map visualization with route
```

#### Optimization Example

```
Before optimization:
  9:00 AM  — Job A (Pointe-Claire)
  11:00 AM — Job B (Downtown Montreal)     ← 35 min drive
  1:00 PM  — Job C (Laval)                 ← 40 min drive
  3:00 PM  — Job D (Dorval)                ← 45 min drive
  Total travel: 120 minutes

After optimization:
  9:00 AM  — Job A (Pointe-Claire)
  11:00 AM — Job D (Dorval)                ← 10 min drive
  1:00 PM  — Job B (Downtown Montreal)     ← 20 min drive
  3:00 PM  — Job C (Laval)                 ← 25 min drive
  Total travel: 55 minutes

  ✅ Saved: 65 minutes of travel time (-54%)
```

#### Welper-Facing UX

```
┌─────────────────────────────────────────────────┐
│  🗓️ Optimized Schedule — Tuesday, Feb 10        │
│                                                  │
│  AI suggests reordering your bookings to save    │
│  65 minutes of travel time:                      │
│                                                  │
│  🟢 9:00 AM  — Deep Clean @ Pointe-Claire       │
│     ↓ 10 min drive                               │
│  🟢 11:00 AM — Maintenance @ Dorval              │
│     ↓ 20 min drive                               │
│  🟡 12:30 PM — Lunch break (30 min)              │
│     ↓ 15 min drive                               │
│  🟢 1:15 PM  — Organization @ Downtown MTL       │
│     ↓ 25 min drive                               │
│  🟢 3:00 PM  — Move-out Clean @ Laval            │
│                                                  │
│  Total travel: 55 min (was 120 min)              │
│  ⏱️ You save: 1 hour 5 minutes                   │
│                                                  │
│  [Apply This Schedule] [Keep Original] [Adjust]  │
│                                                  │
│  🗺️ [View Route on Map]                          │
└─────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Welpco Platform                           │
│                                                              │
│  ┌──────────────────┐    ┌───────────────────┐              │
│  │   Next.js Web    │    │   NestJS BFF      │              │
│  │   (Frontend)     │◄──►│   (Backend)       │              │
│  └──────────────────┘    └───────┬───────────┘              │
│                                  │                           │
│                          ┌───────┴───────────┐              │
│                          │  Domain 14 Module  │              │
│                          │  (ML Gateway)      │              │
│                          └───────┬───────────┘              │
│                                  │                           │
│            ┌─────────────────────┼─────────────────────┐    │
│            │                     │                     │    │
│     ┌──────▼──────┐     ┌───────▼───────┐     ┌───────▼──┐ │
│     │ Feature     │     │  ML Models    │     │ Scheduled│ │
│     │ Store (PG)  │     │  (SageMaker)  │     │ Jobs     │ │
│     └─────────────┘     └───────────────┘     └──────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Training Pipeline (Offline)              │   │
│  │  Python · scikit-learn · XGBoost · PyTorch · Prophet │   │
│  │  AWS SageMaker Training Jobs                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **ML Gateway (NestJS)** | NestJS module in BFF | Routes ML requests, caches predictions, feature lookup |
| **Feature Store** | PostgreSQL tables | Precomputed features for all models |
| **Model Serving** | AWS SageMaker endpoints | Real-time inference for complex models |
| **Lightweight Models** | In-process (NestJS) | Simple models embedded directly (e.g., rule-based fraud) |
| **Training Pipeline** | Python + SageMaker | Offline model training and evaluation |
| **Scheduled Jobs** | NestJS `@Cron()` | Feature computation, batch predictions, model refresh |
| **A/B Framework** | Feature flags + metrics | Test ML vs. baseline, compare model versions |
| **Monitoring** | CloudWatch + custom dashboards | Model performance, prediction latency, data drift |

### 3.3 Feature Store Schema

```sql
-- Precomputed customer features (updated daily)
CREATE TABLE ml_customer_features (
  customer_id     UUID PRIMARY KEY REFERENCES users(id),
  total_bookings  INTEGER NOT NULL DEFAULT 0,
  avg_rating_given DECIMAL(3,2),
  preferred_categories JSONB,          -- {"cleaning": 0.6, "plumbing": 0.2, ...}
  preferred_times  JSONB,              -- {"morning": 0.4, "afternoon": 0.5, ...}
  booking_frequency_30d INTEGER,
  booking_frequency_90d INTEGER,
  last_booking_date DATE,
  churn_risk_score DECIMAL(4,3),       -- 0.000 - 1.000
  computed_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Precomputed welper features (updated daily)
CREATE TABLE ml_welper_features (
  welper_id       UUID PRIMARY KEY REFERENCES users(id),
  total_jobs      INTEGER NOT NULL DEFAULT 0,
  completion_rate DECIMAL(4,3),        -- 0.000 - 1.000
  avg_response_time_hours DECIMAL(5,2),
  avg_rating      DECIMAL(3,2),
  rating_trend_30d DECIMAL(4,3),       -- positive = improving
  repeat_customer_rate DECIMAL(4,3),
  sentiment_scores JSONB,              -- {"punctuality": 0.92, "quality": 0.85, ...}
  demand_in_area  DECIMAL(5,2),        -- normalized demand score
  computed_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Demand forecasts (updated daily, stored per category/location/date)
CREATE TABLE ml_demand_forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES categories(id),
  fsa_code        VARCHAR(3) NOT NULL, -- Forward Sortation Area (e.g., "H9R")
  forecast_date   DATE NOT NULL,
  time_block      VARCHAR(10),         -- "morning", "afternoon", "evening", or NULL (full day)
  predicted_demand DECIMAL(8,2),       -- predicted number of bookings
  confidence_low  DECIMAL(8,2),        -- 95% CI lower bound
  confidence_high DECIMAL(8,2),        -- 95% CI upper bound
  model_version   VARCHAR(50),
  computed_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, fsa_code, forecast_date, time_block)
);

-- A/B experiment tracking
CREATE TABLE ml_ab_experiments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, running, completed, cancelled
  model_a         VARCHAR(100) NOT NULL,  -- control (e.g., "baseline_search_v1")
  model_b         VARCHAR(100) NOT NULL,  -- treatment (e.g., "lightgbm_ranking_v3")
  traffic_split   DECIMAL(3,2) DEFAULT 0.50, -- fraction of traffic to model_b
  primary_metric  VARCHAR(100) NOT NULL,  -- e.g., "booking_conversion_rate"
  start_date      DATE,
  end_date        DATE,
  results         JSONB,                  -- final analysis results
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Model metadata and versioning
CREATE TABLE ml_models (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  version         VARCHAR(50) NOT NULL,
  model_type      VARCHAR(50) NOT NULL,   -- "lightgbm", "xgboost", "prophet", etc.
  capability      VARCHAR(50) NOT NULL,   -- "ranking", "demand", "pricing", "fraud", "churn", "sentiment", "scheduling"
  endpoint_url    VARCHAR(500),           -- SageMaker endpoint (NULL if in-process)
  metrics         JSONB,                  -- {"ndcg@10": 0.78, "auc": 0.91, ...}
  status          VARCHAR(20) DEFAULT 'training', -- training, deployed, retired
  trained_at      TIMESTAMP,
  deployed_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, version)
);

-- Model prediction log (for monitoring and retraining)
CREATE TABLE ml_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID REFERENCES ml_models(id),
  input_hash      VARCHAR(64),           -- SHA-256 of input features (deduplication)
  prediction      JSONB NOT NULL,        -- model output
  latency_ms      INTEGER,               -- inference time
  outcome         JSONB,                 -- actual outcome (filled async for training)
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_model_created ON ml_predictions(model_id, created_at);
CREATE INDEX idx_demand_forecast_lookup ON ml_demand_forecasts(category_id, fsa_code, forecast_date);
CREATE INDEX idx_customer_features_churn ON ml_customer_features(churn_risk_score DESC);
```

### 3.4 Training Pipeline

```
┌─────────────────────────────────────────────────────┐
│              Offline Training Pipeline               │
│              (Weekly / On-Demand)                    │
│                                                      │
│  1. DATA EXTRACTION                                  │
│     NestJS cron job → SQL queries → CSV/Parquet      │
│     Upload to S3 training bucket                     │
│                                                      │
│  2. FEATURE ENGINEERING                              │
│     Python script on SageMaker Processing Job        │
│     - Join bookings, reviews, profiles               │
│     - Compute derived features                       │
│     - Split train/validation/test (time-based)       │
│                                                      │
│  3. MODEL TRAINING                                   │
│     SageMaker Training Job                           │
│     - Algorithm: LightGBM / XGBoost / Prophet        │
│     - Hyperparameter tuning (Bayesian optimization)  │
│     - Track with SageMaker Experiments               │
│                                                      │
│  4. EVALUATION                                       │
│     - Compute metrics on held-out test set            │
│     - Compare against current production model       │
│     - Generate evaluation report                     │
│                                                      │
│  5. DEPLOYMENT (if metrics improve)                  │
│     - Deploy to SageMaker endpoint                   │
│     - Update ml_models table                         │
│     - Route traffic via A/B experiment               │
│                                                      │
│  6. MONITORING                                       │
│     - Track prediction distribution drift            │
│     - Alert if accuracy drops below threshold        │
│     - Auto-trigger retrain if drift detected         │
└─────────────────────────────────────────────────────┘
```

---

## 4. Data Entities

### Entity Summary

| Entity | Description | Storage |
|--------|-------------|---------|
| `MLModel` | Model metadata, version, endpoint, metrics | PostgreSQL |
| `FeatureVector` | Precomputed features per customer/welper | PostgreSQL (feature store tables) |
| `Prediction` | Logged model predictions for monitoring | PostgreSQL |
| `ABExperiment` | A/B test configuration and results | PostgreSQL |
| `DemandForecast` | Predicted demand per category/location/time | PostgreSQL |
| `FraudAlert` | Flagged suspicious activity | PostgreSQL |
| `ChurnRisk` | Customer churn risk scores | PostgreSQL (in customer features) |
| `ModelMetrics` | Training and production performance metrics | PostgreSQL (in models JSONB) |
| `ReputationInsight` | Aggregated sentiment analysis per welper | PostgreSQL |
| `ScheduleOptimization` | Optimized route suggestions | Computed on-demand (not persisted) |

---

## 5. API Endpoints

### 5.1 Search Ranking (Internal)

#### `GET /api/ml/search-ranking`

Re-rank search results using the ML matching model. Called internally by the Service Discovery domain — not exposed to clients directly.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `customerId` | UUID | Yes | Current customer |
| `welperIds` | UUID[] | Yes | Candidate welpers from text search |
| `category` | string | No | Service category for context |
| `urgency` | string | No | `low`, `medium`, `high` |

**Response:**
```json
{
  "rankedResults": [
    {
      "welperId": "uuid-1",
      "score": 0.94,
      "explanation": {
        "topFactors": ["repeat_customer", "high_rating", "close_distance"]
      }
    },
    {
      "welperId": "uuid-2",
      "score": 0.87,
      "explanation": {
        "topFactors": ["category_specialist", "fast_response", "available_now"]
      }
    }
  ],
  "modelVersion": "lightgbm_ranking_v3",
  "experimentId": "ab-exp-12",
  "latencyMs": 12
}
```

### 5.2 Demand Forecast

#### `GET /api/ml/demand-forecast`

Get demand forecast for a location and category.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `fsaCode` | string | Yes | Forward Sortation Area (e.g., "H9R") |
| `categoryId` | UUID | No | Filter by category (or all) |
| `startDate` | ISO date | No | Forecast start (default: today) |
| `endDate` | ISO date | No | Forecast end (default: 7 days) |

**Response:**
```json
{
  "forecasts": [
    {
      "date": "2026-02-07",
      "category": "cleaning",
      "timeBlock": "morning",
      "predictedDemand": 12.5,
      "confidence": { "low": 8.2, "high": 16.8 },
      "demandLevel": "high",
      "vsLastWeek": "+45%"
    }
  ],
  "modelVersion": "prophet_demand_v2"
}
```

### 5.3 Pricing Suggestion

#### `GET /api/ml/pricing-suggestion`

Get AI-powered pricing recommendation for a welper.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `welperId` | UUID | Yes | Welper requesting suggestion |
| `serviceOfferingId` | UUID | Yes | Specific service offering |
| `dayType` | string | No | `weekday`, `weekend`, `holiday` |

**Response:**
```json
{
  "currentRate": 30.00,
  "suggestedRate": 35.00,
  "confidence": 0.82,
  "reasoning": "Demand for cleaning in your area is 40% higher on weekends. Only 3 welpers with your rating are available. Similar welpers charge $33-38/hr.",
  "estimatedImpact": {
    "weeklyEarningsChange": "+$60",
    "bookingVolumeChange": "-5%",
    "netBenefit": "+$45/week"
  },
  "marketContext": {
    "categoryMedian": 33.00,
    "demandLevel": "high",
    "supplyLevel": "low",
    "competitorRange": { "low": 28.00, "high": 42.00 }
  },
  "modelVersion": "pricing_opt_v1"
}
```

### 5.4 Schedule Optimization

#### `GET /api/ml/schedule-optimization`

Get optimized daily schedule for a welper.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `welperId` | UUID | Yes | Welper ID |
| `date` | ISO date | Yes | Date to optimize |
| `travelMode` | string | No | `driving` (default), `transit`, `bicycling` |

**Response:**
```json
{
  "date": "2026-02-10",
  "originalSchedule": [
    { "bookingId": "uuid-a", "time": "09:00", "address": "Pointe-Claire", "travelToNext": 35 },
    { "bookingId": "uuid-b", "time": "11:00", "address": "Downtown MTL", "travelToNext": 40 },
    { "bookingId": "uuid-c", "time": "13:00", "address": "Laval", "travelToNext": 45 },
    { "bookingId": "uuid-d", "time": "15:00", "address": "Dorval", "travelToNext": 0 }
  ],
  "optimizedSchedule": [
    { "bookingId": "uuid-a", "time": "09:00", "address": "Pointe-Claire", "travelToNext": 10 },
    { "bookingId": "uuid-d", "time": "11:00", "address": "Dorval", "travelToNext": 20 },
    { "bookingId": "uuid-b", "time": "13:00", "address": "Downtown MTL", "travelToNext": 25 },
    { "bookingId": "uuid-c", "time": "15:00", "address": "Laval", "travelToNext": 0 }
  ],
  "savings": {
    "travelTimeMinutes": 65,
    "travelTimePercent": 54,
    "estimatedFuelSavings": "$8.50"
  },
  "routeMapUrl": "https://maps.welpco.com/route/abc123",
  "modelVersion": "ortools_routing_v1"
}
```

### 5.5 Reputation Insights

#### `GET /api/ml/reputation-insights/:welperId`

Get AI-generated reputation insights from review sentiment analysis.

**Response:**
```json
{
  "welperId": "uuid",
  "totalReviews": 127,
  "overallSentiment": 0.88,
  "strengths": [
    { "aspect": "punctuality", "score": 0.95, "mentions": 84 },
    { "aspect": "quality", "score": 0.92, "mentions": 101 },
    { "aspect": "friendliness", "score": 0.89, "mentions": 67 }
  ],
  "improvementAreas": [
    {
      "aspect": "communication",
      "score": 0.68,
      "mentions": 23,
      "suggestion": "Customers would appreciate a text message when you're on your way — welpers who do this receive 12% higher ratings."
    }
  ],
  "trend": {
    "direction": "improving",
    "ratingChange30d": +0.15,
    "ratingChange90d": +0.30
  },
  "topReviewExcerpts": [
    { "text": "Marie was punctual, thorough, and left the house spotless!", "rating": 5, "date": "2026-01-28" },
    { "text": "Great work but wish she texted before arriving", "rating": 4, "date": "2026-01-15" }
  ],
  "modelVersion": "sentiment_gpt4o_mini_v1"
}
```

### 5.6 Fraud Check (Internal)

#### `POST /api/ml/fraud-check`

Real-time fraud scoring. Called internally by Booking, Review, and Payment domains — not exposed to clients.

**Request:**
```json
{
  "entityType": "review",
  "entityId": "review-uuid",
  "userId": "user-uuid",
  "features": {
    "reviewText": "Amazing service! Best ever! 10/10 would recommend!!!",
    "rating": 5,
    "bookingDuration": "00:05:00",
    "userAccountAge": 2,
    "userReviewCount": 1,
    "ipAddress": "192.168.1.1",
    "deviceFingerprint": "fp-abc123"
  }
}
```

**Response:**
```json
{
  "score": 0.78,
  "decision": "flag_for_review",
  "fraudType": "suspicious_review",
  "explanation": "New account (2 days), first review, very short booking duration (5 min for a 3-hour service), generic superlative language pattern.",
  "alertId": "alert-uuid",
  "modelVersion": "fraud_ensemble_v2"
}
```

---

## 6. Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `ComputeCustomerFeatures` | Daily at 2:00 AM | Update `ml_customer_features` table |
| `ComputeWelperFeatures` | Daily at 2:30 AM | Update `ml_welper_features` table |
| `RunDemandForecasts` | Daily at 3:00 AM | Generate 7-day demand forecasts |
| `ScoreChurnRisk` | Weekly (Monday 4:00 AM) | Batch churn prediction for all active customers |
| `TriggerRetentionCampaigns` | Weekly (Monday 6:00 AM) | Send retention actions based on churn scores |
| `UpdateSentimentAnalysis` | Daily at 3:30 AM | Process new reviews through sentiment pipeline |
| `MonitorModelDrift` | Daily at 5:00 AM | Check prediction distributions for drift |
| `ExportTrainingData` | Weekly (Sunday 1:00 AM) | Extract fresh training data to S3 |
| `RetrainModels` | Weekly (Sunday 3:00 AM) | Trigger SageMaker training jobs |

---

## 7. A/B Testing Framework

Every ML capability launches behind an A/B experiment:

```
┌──────────────────────────────────────────────────┐
│               A/B Testing Flow                    │
│                                                   │
│  1. New model trained and evaluated offline        │
│     → Metrics improve over current production     │
│                                                   │
│  2. Create ABExperiment record                    │
│     → model_a: current production                 │
│     → model_b: new candidate                      │
│     → traffic_split: 0.10 (10% to new model)     │
│                                                   │
│  3. ML Gateway routes requests                    │
│     → Hash(userId) % 100 < split*100 → model_b   │
│     → Else → model_a                             │
│                                                   │
│  4. Log all predictions with experiment_id        │
│     → Track primary metric (e.g., booking rate)   │
│                                                   │
│  5. After sufficient sample size:                 │
│     → Statistical significance test               │
│     → If model_b wins: ramp to 50% → 100%        │
│     → If model_b loses: roll back                 │
│                                                   │
│  6. Update experiment status and results           │
└──────────────────────────────────────────────────┘
```

---

## 8. Integration Points

### Domain Dependencies

```
Domain 14 (AI/ML Intelligence)
    ├── Domain 1  (Service Discovery) — provides search results for re-ranking
    ├── Domain 3  (Booking)           — booking data for training, fraud scoring on new bookings
    ├── Domain 4  (Payment)           — payment events for fraud detection
    ├── Domain 5  (User Management)   — user data for feature engineering
    ├── Domain 6  (Profile)           — welper profiles, availability for features
    ├── Domain 8  (Review & Rating)   — reviews for sentiment analysis, fraud detection
    ├── Domain 11 (Notification)      — delivers retention campaigns, demand alerts
    └── Domain 13 (AI Chat)           — provides ranking signals, smart suggestions
```

### Data Flow

```
All Domains → [Events/Data] → Feature Store → ML Models → Predictions
                                                              ↓
                                                    Domain 1: Better search rankings
                                                    Domain 3: Fraud-scored bookings
                                                    Domain 6: Pricing suggestions
                                                    Domain 8: Sentiment insights
                                                    Domain 11: Churn retention campaigns
                                                    Domain 13: Smart chat suggestions
```

---

## 9. Privacy & Ethics

### Data Privacy

| Principle | Implementation |
|-----------|---------------|
| **Minimal data** | Models use only the minimum features necessary |
| **Anonymization** | Training data is anonymized — no PII in feature vectors |
| **Consent** | Users agree to data usage for platform improvement in ToS |
| **Right to opt out** | Users can opt out of ML personalization (reverts to baseline) |
| **Data retention** | Prediction logs retained for 90 days, then aggregated |
| **PIPEDA compliance** | All data practices comply with Canadian privacy law |

### Algorithmic Fairness

| Concern | Mitigation |
|---------|-----------|
| **Search ranking bias** | Diversity constraints prevent any welper from being systematically suppressed; new welper boost ensures cold-start fairness |
| **Pricing fairness** | Suggestions never discriminate by protected characteristics; based only on market signals |
| **Churn prediction** | Model audited for demographic bias; retention campaigns are the same regardless of user demographics |
| **Fraud false positives** | Human review required before any action; false positive rate monitored by demographic segment |
| **Transparency** | All ML-powered features are labeled ("AI suggestion", "Powered by AI") so users know |

---

## 10. Rollout Strategy

| Phase | Timeline | Capabilities | Notes |
|-------|----------|-------------|-------|
| **Phase 0** | Foundation | Feature store tables, ML gateway module, A/B framework | Infrastructure only |
| **Phase 1** | Month 1-2 | Smart Matching Engine | Highest ROI — improves core search |
| **Phase 2** | Month 2-3 | Fraud Detection (reviews + bookings) | Trust & safety critical |
| **Phase 3** | Month 3-4 | Review Sentiment Analysis | Enriches welper experience |
| **Phase 4** | Month 4-5 | Demand Forecasting + Dynamic Pricing | Supply-side intelligence |
| **Phase 5** | Month 5-6 | Customer Churn Prediction | Retention optimization |
| **Phase 6** | Month 6-7 | Smart Scheduling Optimization | Operational efficiency |

Each capability launches in A/B mode with 10% traffic, ramping to 100% after statistical validation.

---

## 11. Future Enhancements

| Enhancement | Description | Phase |
|-------------|-------------|-------|
| **Real-time feature streaming** | Replace batch feature computation with event-driven streaming (Kafka) | v2.0 |
| **Graph Neural Networks** | Model customer-welper relationships as a graph for better recommendations | v2.0 |
| **Image quality scoring** | Score welper profile and portfolio photos for listing quality | v2.1 |
| **Natural language search** | Semantic search using embeddings instead of keyword matching | v2.1 |
| **Automated scheduling** | AI books recurring services automatically based on learned preferences | v2.2 |
| **Multi-objective optimization** | Balance customer satisfaction, welper earnings, and platform revenue simultaneously | v3.0 |

---

> *"Domain 14 is the invisible hand that makes Welpco feel like it was built just for you. Every search feels uncannily relevant. Every suggestion feels perfectly timed. Every welper gets the insights they need to thrive. The platform doesn't just connect people — it understands them."*
