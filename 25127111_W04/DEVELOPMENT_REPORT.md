# Software Development Report: Smart Travel Assistant & Feedback System

**Project:** Smart Travel Assistant (AI/Algorithmic Route Suggestion Engine)
**Version:** 2.0.0
**Stack:** Python (FastAPI, Pydantic, Uvicorn), JavaScript (ES6+ Vanilla), HTML5/CSS3, Google Places API
**Architecture:** Microservice-oriented client-server architecture with RESTful communication

---

## 1. Executive Summary

This report details the design, algorithmic modeling, and architectural implementation of two core features in the **Smart Travel Assistant** ecosystem:

1. **Feature 1: Dynamic Multi-Constraint Itinerary Recommendation Engine**
   (`main.py` [Port 8001], `index.html` [Planner UI], `places_dalat.json`, `places_nhatrang.json`)
   An algorithmic travel planner that generates cost-feasible, geographically clustered, and preference-aligned multi-day schedules using Jaccard content similarity, Haversine spatial routing, and budget viability heuristics.

2. **Feature 2: Closed-Loop Survey & Algorithm Feedback Evaluation System**
   (`main.py` [Port 8000], `index.html` [Survey UI], `questions.json`, `survey_responses.csv/json`)
   A continuous feedback mechanism measuring algorithmic accuracy across dimensions such as UI, Route Feasibility, Time Allocation, Rest Adequacy, and Cost Estimation to drive automated model tuning.

---

## 2. Feature Specification & Engineering Design (Spec-Kit Style)

### 2.1 Feature 1: Multi-Constraint Itinerary Recommendation Engine

#### 2.1.1 Problem Statement

Manual travel planning causes decision paralysis due to fragmented information across pricing, spatial proximity, and personal travel style ("vibes"). Users frequently plan infeasible itineraries that exceed their budgets or require excessive transit time between points.

#### 2.1.2 Algorithmic Architecture & Mathematical Foundations

**1. Budget Viability & Feasibility Guardrail**

Before running recommendation passes, the system validates the budget lower bound $B_{min}$:

$$\text{Rooms Needed} = \left\lceil \frac{\text{Party Size}}{2} \right\rceil$$

$$C_{hotel,\,min} = P_{min\_acc} \times \max(1,\ \text{Days} - 1) \times \text{Rooms Needed}$$

$$C_{food,\,min} = 150{,}000 \times \text{Party Size} \times \text{Days}$$

$$B_{min} = C_{hotel,\,min} + C_{food,\,min}$$

If $\text{Budget} < B_{min}$, an informative warning response is returned without wasting compute cycles.

**2. Preference Alignment via Jaccard Similarity**

To align user-selected aesthetic styles ("Vibes") with point-of-interest (POI) attributes:

$$J(U, P) = \frac{|U \cap P|}{|U \cup P|}$$

Where $U$ is the set of user-selected vibes (e.g., `['Chill', 'Nature']`) and $P$ is the set of POI vibe tags (e.g., `['Nature', 'Romantic', 'Sightseeing']`).

**3. Geographical Distance via Haversine Formula**

Great-circle distances between sequential stops $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ prevent erratic zig-zag routes across the city:

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$d = 2R \cdot \text{atan2}\left(\sqrt{a},\ \sqrt{1-a}\right), \quad R = 6371\ \text{km}$$

**4. Multi-Objective Daily Slot Structuring**

The algorithm provisions a structured itinerary for each day:

| Time Slot | Activity | Category |
|---|---|---|
| 07:30 – 08:30 | Local Breakfast | `Restaurant` |
| 09:00 – 11:30 | Morning Attraction / Exploration | `Attraction` / `Café` |
| 11:30 – 13:30 | Lunch & Midday Recharge | `Restaurant` |
| 14:00 – 16:30 | Afternoon Experience / Scenic Check-in | `Attraction` |
| 16:30 – 18:00 | Dedicated Rest Window (return to accommodation to mitigate travel fatigue) | Hotel |
| 18:30 – 21:00 | Dinner & Nightlife Walk | `Restaurant` |

**5. Algorithm Flow**

```text
┌──────────────────────────────────────────────────────────┐
│                    Input Parameters                      │
│  (Destination, Budget, Days, Party Size, Vibes & Modes)  │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │ Budget Feasibility Check    │
              │ (Party Size, Nights,        │
              │  Min Hotel & Food)          │
              └──────┬───────────────┬──────┘
                     │ Infeasible    │ Feasible
                     ▼               │
         ┌────────────────────┐      │
         │ Early Warning      │      │
         │ Response           │      │
         └────────────────────┘      │
                                     ▼
              ┌─────────────────────────────┐
              │ Accommodation Selection     │
              │ (Cost <= 35% of Budget,     │
              │  Max Rating)                │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │ Daily Slot Sequential Search│
              │ - Score POIs: Jaccard       │
              │   (Vibes) + Rating          │
              │ - Minimize Haversine dist.  │
              │ - De-duplicate via          │
              │   used_attraction_ids       │
              │ - Insert Rest Slot          │
              │   (Hotel loop)              │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │ Final Payload Assembly      │
              │ (Cost & Distance Metrics)   │
              └─────────────────────────────┘
```

#### 2.1.3 Data Synchronization & Lifecycle

- An integrated FastAPI lifespan handler (`@asynccontextmanager`) runs an asynchronous background daemon (`periodic_data_sync`) that syncs Google Places API ratings and verified formatted addresses every 12 hours.

---

### 2.2 Feature 2: Quantitative Survey & Feedback Loop System

#### 2.2.1 Problem Statement

Recommendation engines lack ground-truth validation unless user satisfaction across granular dimensions (route pacing, cost reality, usability) is systematically recorded and mapped back to algorithmic outputs.

#### 2.2.2 System Design

- **Normalized 10-Question Likert Scale:** defined in `questions.json` across 3 evaluation dimensions:
  1. *App Usability & Response Time* (`UI`, `Performance`, `Input_Usability`)
  2. *Algorithmic Accuracy* (`Destination`, `Schedule`, `Rest_Time`, `Cost`)
  3. *User Retention & Loyalty* (`Satisfaction`, `Retention`, `Recommendation`)
- **Dual Persistence Strategy:**
  - **Tabular export (`survey_responses.csv`):** encoded with a UTF-8 BOM (`utf-8-sig`) for Excel/Pandas readiness, dynamically recording question IDs with their tags (e.g., `Q1_UI`, `Q7_Cost`).
  - **Document export (`survey_responses.json`):** full hierarchical payload containing raw timestamps, calculated average score, user ID, and nested question-level attributes.

---

## 3. Implementation Walkthrough

### 3.1 Backend Engineering

- **Modular Ports Configuration:**
  - The Planner Engine runs on `http://127.0.0.1:8001` to decouple resource-intensive route scoring from survey endpoints.
  - The Survey Collection Service operates on `http://127.0.0.1:8000`.
- **Validation Pipeline:** Pydantic schemas (`TripPlannerInput`, `DailyPreference`, `SurveySubmitPayload`) guarantee strict data types, preventing malformed inputs from reaching the calculation engine.

### 3.2 Frontend Engineering

- **Vanilla Modern JavaScript:** no heavy framework dependencies (React/Vue), giving fast render times and zero bundling overhead.
- **Dynamic Mode Toggling:** real-time DOM reconstruction switches between "Whole Trip Preference" and "Per-Day Granular Preference" modes without page reloads.

---

## 4. Verification & Testing

| Test Scenario | Input Vector | Expected Outcome | Result |
|---|---|---|---|
| **Budget Underflow** | 2 days, 4 people, budget = 500k VNĐ | Return `status: "warning"` with minimal cost breakdown | **PASS** |
| **Haversine Distance Accuracy** | Dalat Wonder Resort to Ri 79 | Distance ≈ 6.8 km | **PASS** |
| **Deduplication Validation** | 3-day trip across Dalat attractions | No POI repeated across consecutive morning/afternoon slots | **PASS** |
| **Survey Completeness** | Payload with 9 of 10 answers | HTTP 400: "Vui lòng trả lời đầy đủ tất cả câu hỏi!" | **PASS** |
| **Dual Storage Sync** | Valid survey submission | Consistent entry written to both `.json` and `.csv` files | **PASS** |

---

## 5. Future Extensibility

1. **Graph-based Routing:** replace greedy next-point selection with Dijkstra or TSP (2-opt) path optimization.
2. **Real-time Elevation API:** incorporate terrain difficulty into transit estimates for highland cities like Da Lat.
