# PROJECT DOCUMENTATION: ENGINEERING A SMART TRAVEL PLANNER ASSISTANT

* **Course:** CSC10014 – Computational Thinking (2026)
* **Group ID:** Group 02
* **Domain:** Personalized Smart Travel Planner Assistant
* **Document Version:** Post-MVP Demo Revised Edition

### TEAM MEMBERS

| No. | Full Name | Student ID | Role in Project |
| :--- | :--- | :--- | :--- |
| 1 | Từ Nguyễn Thuận Thiên | 25127146 | Developer & Data/API Handler |
| 2 | Nguyễn Huỳnh Khánh Như | 25127222 | Team Leader & Presenter |
| 3 | Nguyễn Thị Hoàng Châu | 25127022 | Front-end Developer & UI/UX Designer |
| 4 | Nguyễn Bạch Thành Nhân | 25127111 | QA/Tester & Technical Documentation |
| 5 | Nguyễn Bình An | 23127149 | Developer & Core Algorithm Implementer |

---

## 1. PROBLEM STATEMENT & REAL-WORLD CHALLENGES

When planning an independent trip, travelers typically compile information manually across fragmented platforms—maps, accommodation booking portals, review blogs, and weather forecasts. This disjointed process creates six core real-world problems:

1. **Difficulty Discovering Destinations & Activities Aligned with Personal Preferences:** Users struggle to translate their desired travel mood into concrete destinations and activities, or fail to find rigid category tags that match what they have in mind.
2. **Difficulty Controlling Total Trip Budget:** Transportation, lodging, dining, entrance tickets, and incidental shopping are researched separately. Even when individual services appear affordable, hidden or optional expenses frequently push total spending past the user's budget ceiling.
3. **Poorly Connected Itineraries Causing Time and Cost Waste:** Attractions, restaurants, and hotels are often scattered across different zones. Without spatial grouping, travelers zigzag back and forth across a city, wasting transit time and money.
4. **Insufficient Preparation for Local Weather & Terrain:** Travelers often overlook micro-climate conditions (such as chilly early mornings in Da Lat or sudden coastal rain in Nha Trang) and lack contingency plans when outdoor activities become unsafe or unfeasible.
5. **Difficulty Comparing Multi-Criteria Trade-Offs:** Evaluating trade-offs between cost, travel time, rest intervals, and activity density across single-city or multi-city trips is mentally taxing without structured comparisons.
6. **Lack of Transparency, Visual Appeal, and Persuasiveness in Recommendations:** Conventional itinerary generators output plain lists of names and numbers without visual context, itemized pricing, or compelling explanations of why the trip is both exciting to experience and logically structured.

---

## 2. THE PROPOSED SOLUTION

We formulate personalized travel planning as a multi-constraint optimization, spatial scheduling, and persuasive advisory problem:

* **Inputs:** Target destination mode (Đà Lạt, Nha Trang, or combined Đà Lạt + Nha Trang), travel dates (`start_date`, `end_date`), group size (`party_size`), hard budget ceiling ($B_{\max}$), travel preferences (selected via descriptive scenario cards, keyword/synonym search, or custom vibe proposals), weather simulation toggle (`is_rainy`), and special requirements (`vegetarian`, `wheelchairAccessible`, `noEarlyMornings`).
* **Hard & Soft Constraints:** Total projected expenditure must strictly satisfy $\text{Total Cost} \le B_{\max}$; scheduled visits must respect venue operating hours (`open_time`–`close_time`), meal windows, afternoon rest periods, and weather suitability (`Indoor`, `Outdoor`, `Both`).
* **Outputs:** A visually engaging, day-by-day spatially clustered itinerary enriched with POI photographs and vivid activity descriptions, itemized mandatory vs. optional cost breakdowns (clearly labeled per person, per group, or per turn), commercial tour sample templates, an interactive color-coded Leaflet route map, a weather-adaptive packing checklist, and a dual-angle persuasive explanation demonstrating both the excitement and the logical efficiency of the plan.

---

## 3. APPLICATION OF THE FOUR PILLARS OF COMPUTATIONAL THINKING

### 3.1. Decomposition

We decompose the system horizontally into three user-facing subsystems (Account & System Management, Core Recommendation & Scheduling Engine, and User Experience & Advisory) and vertically into six specialized computational modules:

1. **Input Acquisition, Synonym Mapping & Anomaly Validation Module:** Standardizes descriptive vibe selections, resolves user-typed keywords into equivalent system tags, captures custom vibe proposals, and executes `CheckTimeAnomaly` and `CheckCostAnomaly` to reject impossible timelines or under-funded budgets.
2. **Multi-Criteria POI Scoring & Visual Enrichment Module:** Evaluates candidate Points of Interest (POIs) using Jaccard preference similarity combined with community ratings, attaching venue photographs, short narrative descriptions, and itemized cost structures.
3. **Hard-Ceiling 5-Bucket Financial Allocation Module:** Partitions $B_{\max}$ across five functional accounts—Transportation, Accommodation, Dining, Activities/Sightseeing, and Safety Contingency Reserve—while distinguishing mandatory baseline expenses from optional add-on estimates.
4. **Spatial Area Clustering & Chronological TSPTW Scheduling Module:** Groups POIs by geographic zone (`clusterPoisSpatially` using Haversine coordinates and balanced K-Means) so each day stays within a single cluster, then sequences a balanced daily timeline respecting operating hours, meal windows, and indoor backups.
5. **Weather Contingency & Persuasive Advisory Module:** Generates climate-specific packing checklists, swaps `Outdoor` attractions for `Indoor` alternatives under rainy conditions, and synthesizes persuasive explanations highlighting both trip appeal and optimization gains.
6. **Evaluation Survey & Post-Trip Review Loop Module:** Collects structured 10-question Likert (1–5) usability/quality feedback and restricts star-rating reviews until after a trip's scheduled `end_date` has passed.

### 3.2. Pattern Recognition

Through domain analysis of travel behavior, popular travel portals, and commercial tour packages, we identified five core computational patterns:

1. **Keyword-to-Tag Semantic Alignment Pattern (Set Similarity + Synonym Mapping):**
   * *Domain Observation:* Travelers describe desired experiences using varied everyday words (e.g., "yên tĩnh", "không ồn ào", "săn mây") rather than rigid database tags (`Chill`, `View_Hunting`, `Nature`).
   * *Computational Pattern:* Mapping natural keywords and descriptive scenarios via a synonym/equivalence dictionary into a standardized vibe vector $U$, then computing the Jaccard Similarity Coefficient against each POI's tag set $D$:
     $$J(U, D) = \frac{|U \cap D|}{|U \cup D|}$$

2. **Constrained Budget Partitioning & Mandatory-vs.-Optional Cost Pattern (0/1 Knapsack):**
   * *Domain Observation:* Real travel expenses consist of unavoidable core costs (entrance tickets, lodging, base meals, inter-city transit) and discretionary spending (souvenirs, optional rentals). Conflating them causes unexpected overspending.
   * *Computational Pattern:* Separating `includedInEstimate` mandatory items from optional items while selecting POIs to maximize experience score under a strict capacity ceiling $\sum c_i \le B_{\max}$.

3. **Spatial Locality & Cluster-First Route Sequencing Pattern (Area Clustering + TSPTW):**
   * *Domain Observation:* Tourist POIs naturally form geographic clusters (e.g., City Center, Tuyền Lâm, Cầu Đất / Trại Mát in Đà Lạt; Coastal Center, North Nha Trang, South Nha Trang in Nha Trang).
   * *Computational Pattern:* Partitioning attractions into daily regional clusters first to eliminate cross-city zigzagging, then solving a localized Traveling Salesperson Problem with Time Windows (TSPTW) using Haversine great-circle distance and operating-hour checks.

4. **Commercial Tour Template & Pacing Pattern (Domain Pattern Mining):**
   * *Domain Observation:* Reputable travel agencies structure 2D1N, 3D2N, and 4D3N tours around proven pacing rhythms (alternating active sightseeing with midday dining and afternoon rest) and realistic cost baselines.
   * *Computational Pattern:* Extracting structural templates from commercial tours to calibrate daily time slots, minimum budget floors, and reusable sample itineraries.

5. **Deterministic State-Transition Pattern (Weather Fallback & Post-Trip Review Gating):**
   * *Domain Observation:* Rain invalidates outdoor venues, and reviews written before a trip ends are speculative rather than experiential.
   * *Computational Pattern:* Condition-action state rules: `IF is_rainy == True THEN swap_with_indoor_backup()` and `IF current_date >= trip.end_date THEN unlock_review_submission()`.

### 3.3. Abstraction

Abstraction enables the system to strip away overwhelming, unstructured real-world travel noise (such as lengthy blog reviews, unformatted social media posts, or irrelevant municipal details) and retain only the essential attributes required for accurate decision-making, scheduling, and user persuasion.

**Step 1: Abstracting User Intent & Trip Constraints (`TripPlannerRequest` + Vibe Resolver)**
In reality, travelers express their plans through messy, ambiguous sentences (e.g., *"My friends and I want a peaceful, chill trip to Da Lat next weekend without waking up too early or spending over 5 million VND"*). The system abstracts this natural request into a clean set of numerical boundaries, temporal bounds, and standardized preference tags, while filtering out conversational filler. At the same time, to ensure no user intent is lost when rigid tags feel unfamiliar, natural keywords and descriptive scenarios are translated into standardized vibe tags, and any unmapped custom ideas are captured separately.
* **Structured Model:**
  * `destination`: Target city mode (`"Đà Lạt"`, `"Nha Trang"`, or `"BOTH"` / `"Đà Lạt + Nha Trang"`).
  * `start_date`, `end_date`, `days`: Temporal boundary defining the trip duration ($1 \le \text{days} \le 14$).
  * `party_size`: Integer scaling factor used to calculate room counts ($\lceil \text{party\_size} / 2 \rceil$), meal portions, and group ticket costs.
  * `budget_vnd` ($B_{\max}$): Hard upper financial ceiling that total mandatory costs must never exceed.
  * `vibes`: Standardized list of preference tags resolved from descriptive cards or keyword synonym searches, plus `custom_vibe_proposals` for user-suggested tags.
  * `is_rainy` & `special_requirements`: Environmental state flag and accessibility/dietary constraints (`vegetarian`, `wheelchairAccessible`, `noEarlyMornings`).

**Step 2: Abstracting Real-World Venues & Itemized Costs (`POIEntity` + `POIServiceItem`)**
A real tourist venue has hundreds of attributes (staff names, historical trivia, full 50-item restaurant menus, architectural blueprints). For itinerary planning and user persuasion, the system abstracts each Point of Interest into three focused layers: computational scheduling attributes (exact GPS coordinates, area cluster, opening/closing hours, weather resilience) so the algorithm can route and time visits accurately; experiential storytelling attributes (venue photograph, concise narrative description, activity highlights) so users can visualize the space and feel excited to visit; and itemized financial attributes that separate unavoidable baseline fees (entrance tickets) from optional discretionary spending (souvenirs, add-on services) with clear pricing units.
* **Structured Model:**
  * *Identity & Classification:* `stt` (unique ID), `name`, `type` $\in$ `{Attraction, Restaurant, Café, Accommodation}`, `area` (geographic cluster label), `vibes` (characteristic tags), `rating` (1.0–5.0 quality score).
  * *Spatial, Temporal & Weather Constraints:* `lat`, `lng` (for Haversine distance), `open_time`, `close_time` (for TSPTW feasibility), `weather_suitability` $\in$ `{Indoor, Outdoor, Both}`.
  * *Visual & Narrative Presentation:* `image_url` (representative venue photo), `short_description` (concise atmospheric overview), `activity_highlights` (key on-site experiences), `new_address`, `link`.
  * *Itemized Cost Breakdown (`POIServiceItem`):* `item_name`, `price_vnd`, `category` $\in$ `{TICKET, MENU, SERVICE, SOUVENIR}`, `unit` $\in$ `{per_person, per_group, per_turn}`, and `includedInEstimate` (`True` = mandatory baseline cost; `False` = optional shopping/service estimate).

**Step 3: Abstracting Commercial Travel Agency Packages (`TourTemplate`)**
Commercial travel agencies offer multi-page promotional brochures filled with marketing terms, hotel star ratings, and agency-specific clauses. We abstract these real-world tours into standardized, reusable structural blueprints that capture their proven daily pacing, logical geographic groupings, and realistic cost baselines—allowing users to browse and clone battle-tested sample itineraries without agency rigidity.
* **Structured Model:**
  * `template_id`, `title`, `destination`, `duration_days`, `target_vibes`, `estimated_budget_per_person`, `highlights`, and `day_blueprints` (pre-clustered sequence of morning, afternoon, and evening activity slots).

**Step 4: Abstracting a Traveler's Daily Rhythm (`DailySchedule` & Chronological Time Windows)**
Instead of treating a day as an unstructured list of timestamps where a user might rush nonstop from 6:00 AM to midnight, we abstract human travel energy and daily biological needs into structured daily time windows. This guarantees dedicated windows for morning exploration, lunch (11:15–14:00), afternoon relaxation/café, dinner (17:45–20:15), and overnight lodging check-in before 21:30.
* **Structured Model:**
  * `day_number`, `city`, `area_cluster`, `hotel`, and an ordered list of daily activity slots, each recording `place`, `mandatory_cost_vnd`, `optional_cost_vnd`, `distance_km`, `jaccard_match`, `indoor_backup`, and `persuasive_note`.

### 3.4. Algorithm Design

Our automated itinerary generator transforms raw user preferences into a complete, budget-safe, and visually persuasive travel plan through a seven-stage pipeline.

* **Stage 1: Input Standardization, Synonym Resolution & Custom Vibe Capture**
  When the user submits their trip form, the system first translates their human-friendly inputs into machine-readable parameters. If the user selects descriptive travel-style cards or types free-text keywords (such as *"yên tĩnh"* or *"ngắm cảnh"*), the system looks up matching terms in its synonym dictionary to map them to standardized vibe tags. If the user enters a brand-new vibe in the custom proposal box, the system records it for future dataset expansion while ensuring existing tags still guide the current search.
  * *Algorithmic Mechanism:* Resolve $\text{selected\_cards} \cup \text{SynonymLookup}(\text{keyword\_query}) \rightarrow \text{normalized tag set } U$; persist any `custom_vibe_proposal` to the feedback log.

* **Stage 2: Temporal & Financial Feasibility Gate (Anomaly Detection)**
  Before searching for hotels or attractions, the system acts as a realistic travel advisor by checking whether the user's dates and budget make sense in the real world. It ensures the return date is not earlier than the departure date (`CheckTimeAnomaly`) and checks whether the total budget can realistically cover basic lodging, food, transit, and tickets (`CheckCostAnomaly`, calibrated against commercial tour baselines). If the budget is impossibly low, the system stops early and explains the exact minimum budget needed rather than generating a broken plan.
  * *Algorithmic Mechanism:* Reject values $\le 0$; compute reference floor $(\text{min\_cost/person/day} \times \text{days} \times \text{party\_size}) \times 0.5$; verify $\text{end\_date} \ge \text{start\_date}$ ($1 \le \text{days} \le 14$).

* **Stage 3: Hard-Ceiling 5-Bucket Budget Allocation**
  Once the budget passes validation, the system divides the total money into five dedicated "envelopes" so no single expense eats up money needed for food or sightseeing. It first cuts 8% for an emergency safety reserve, calculates inter-city bus fares (320,000 VND/person for two-city trips) within a 22% (two-city) or 15% (single-city) transport cap, and divides the remaining balance across accommodation (42%), dining (36%), and sightseeing (22%), selecting a high-rated hotel within the nightly room cap.
  * *Algorithmic Mechanism:* Reserve $0.08 \cdot B_{\max}$ contingency; allocate transport cap ($0.22 \cdot B_{\max}$ or $0.15 \cdot B_{\max}$, at least $320{,}000 \cdot \text{party\_size}$ if two-city); split remaining funds 42% Lodging / 36% Dining / 22% Activities; pick best `LODGING` POI for $\lceil \text{party\_size}/2 \rceil$ rooms.

* **Stage 4: Spatial Area Clustering (`clusterPoisSpatially`)**
  To prevent travelers from wasting hours crisscrossing a city in taxis, the system divides the trip days between Đà Lạt and Nha Trang (if two-city) and groups attractions into compact regional clusters—one geographic area per day—while ensuring every day receives a balanced number of stops rather than dumping all attractions onto a single day.
  * *Algorithmic Mechanism:* Compute great-circle distances via `haversineKm` and run balanced K-Means spatial clustering minimizing $\text{balancedDist} = \text{distance} + (\text{cluster\_point\_count} \times 0.8)$.

* **Stage 5: Chronological Daily Scheduling & TSPTW Optimization**
  Starting from the hotel at 08:00 AM (or 09:30 AM if `noEarlyMornings` is selected) up to 21:30 PM, the system builds each day step by step. During lunch (11:15–14:00) and dinner (17:45–20:15), it picks the best open restaurant within the remaining dining budget (`pickBestDining`). For sightseeing slots, it evaluates remaining venues in today's cluster, filters out any place that exceeds the budget or closes too early, selects the stop that minimizes travel time and waiting penalties while maximizing preference appeal, and pairs every `OUTDOOR` stop with a nearby `INDOOR` backup ($\text{price} \le \text{original} + 80{,}000\text{ VND}$).
  * *Algorithmic Mechanism:* Select dining via $\min(\text{dist} - \text{finalScore} \times 4)$ and attractions via:
    $$\text{Objective} = \text{travel\_time} + (\text{wait\_penalty} \times 0.4) - (\text{total\_score} \times 20)$$

* **Stage 6: Route Efficiency & Savings Quantification**
  After assembling all days, the system compares the total distance of the newly clustered route against what the traveler would have driven if they visited the same places in an unclustered zigzag order, quantifying exact kilometers saved and clustering efficiency.
  * *Algorithmic Mechanism:* Compute `distanceSavedKm = totalUnclusteredZigzagKm - totalClusteredRouteKm` and `clusterEfficiencyPct`.

* **Stage 7: Persuasive Narrative Synthesis & Interactive Post-Processing**
  Finally, the system packages the schedule into an engaging visual itinerary with destination photos, activity descriptions, itemized mandatory vs. optional costs, a climate-tailored packing list, and a dual-angle explanation convincing the user both of how fun the experiences will be and how smart the route and budget are. Users can then adjust the budget slider (`/rebalance-budget`), swap stops (`/swap-poi`), clone sample tour templates, export a PDF, or submit a verified rating after their trip ends.
  * *Algorithmic Mechanism:* Render enriched JSON payload; expose incremental recalculation endpoints and date-gated review submission ($\text{current\_date} \ge \text{end\_date}$).

---

## 4. DETAILED FEATURE SPECIFICATIONS (CT-DRIVEN ANALYSIS & DESIGN)

Below is the comprehensive architectural and functional specification for all 12 system features (F01–F12), structured around Problem/Purpose, Decomposition, Pattern Recognition, Abstraction, Algorithm & Operational Workflow, Output Requirements (Aesthetics, Engagement & Persuasiveness), and Current Status / Post-Demo Improvements.

### F01 — Role-Based Login, Password Recovery & 1-Click Demo
* **Problem:** Travelers and administrators have distinct operational needs, while mandatory manual registration creates friction for first-time visitors (who may also mistype or forget passwords).
* **Decomposition:** Divided into three sequential steps: (1) verifying account credentials, (2) issuing a time-bound session token, and (3) rendering role-specific navigation and workspace views. Password recovery is further decomposed into: email verification $\rightarrow$ OTP/reset token dispatch $\rightarrow$ new password update.
* **Pattern Recognition:** Travelers access the platform to plan trips, whereas administrators maintain POI datasets. Additionally, users frequently mistype long passwords on mobile devices (motivating a Show/Hide password toggle) or forget credentials over time (motivating a Forgot Password workflow).
* **Abstraction:** Abstracts user accounts into clean identity records (`user_id`, `email`, `hashed_password`, `salt`, `role`), hiding raw credentials behind cryptographic hashes and using a simple boolean state toggle for password visibility.
* **Algorithm & Operational Workflow:**
  * *Login & Role Routing:* Upon email/password submission, the system looks up the user record, hashes the input password with the stored salt using `PBKDF2-HMAC-SHA256`, and compares digests. On match, it issues a session token and redirects to `planner.html` (Traveler) or `manager.html` (Manager). Instant 1-click Demo buttons (`/demo-traveler`, `/demo-manager`) bypass manual typing for rapid evaluation.
  * *Show/Hide Password & Forgot Password:* A UI state toggle switches the password field between `password` (masked) and `text` (visible). Under "Forgot Password" (`/forgot-password` $\rightarrow$ `/reset-password`), the server verifies email existence, generates a short-lived reset token/OTP, and updates the `PBKDF2-HMAC-SHA256` password hash upon verification.
* **Current Status & Post-Demo Enhancements:** Core login, logout, role detection, 1-click Demo accounts, and backend password reset endpoints are implemented and verified; Show/Hide password toggle UI polish is finalized for the Week 10 release.

### F02 — Descriptive Vibe Input, Synonym Search, Custom Vibe Proposal & Smart Anomaly Validation
* **Problem:** Collecting user preferences systematically while preventing frustrating tag searches and immediately catching unfeasible inputs (such as a return date earlier than the departure date or an impossibly low budget for the group size and duration).
* **Decomposition:**
  * *Preference Elicitation:* Breaks down a vague travel wish into independent structured choices: Destination, Dates/Duration, Group Size, Travel Style (Vibes), and Special Notes (`vegetarian`, `wheelchairAccessible`, `noEarlyMornings`).
  * *Anomaly Validation:* Splits validation into two checks: Cost Anomaly (`CheckCostAnomaly`) and Time Anomaly (`CheckTimeAnomaly`).
* **Pattern Recognition:** Although traveler desires vary, they cluster around recurring themes (`Nature`, `Chill`, `Adventure`, `Coffee`, `Photography`, `Beach`, `Romantic`). Moreover, free-text typing introduces typos and synonyms (e.g., typing *"yên tĩnh"* vs. *"không ồn ào"*), while users occasionally enter tiny budgets (a few hundred thousand VND for multi-day trips) or reversed dates.
* **Abstraction:** Standardizes human travel moods into canonical vibe tags $U$ paired with a synonym equivalence dictionary, while abstracting temporal and budget validity into numeric boundary checks.
* **Algorithm & Operational Workflow:**
  * *Descriptive Cards, Keyword Synonym Search & Custom Vibe Box:* Instead of bare tags, the interface presents descriptive travel-style cards, a keyword search box that maps natural words to synonymous/equivalent tags, and a custom vibe proposal field allowing users to suggest new vibes when none match.
  * *Anomaly Checks:* `CheckCostAnomaly` rejects values $\le 0$ and computes a reference floor: $(\text{min\_cost/person/day} \times \text{days} \times \text{party\_size}) \times 0.5$ (calibrated against commercial tours); if $B_{\max}$ falls below this floor, an inline warning and suggested minimum budget appear. `CheckTimeAnomaly` checks for missing dates and verifies $\text{end\_date} \ge \text{start\_date}$, computing total trip days.
* **Aesthetic & UX Output Requirements:** Clean, scannable scenario cards with instant synonym matching so users effortlessly express their travel mood without tag-hunting friction.

### F03 — Visual POI Recommendations, Itemized Pricing & Persuasive Storytelling
* **Problem:** Travelers struggle to evaluate whether recommended venues truly fit their vibe, cannot visualize the atmosphere from plain text, and often misjudge budgets when entrance tickets are lumped together with optional shopping.
* **Decomposition:** Separates candidate filtering, Jaccard preference scoring, visual/narrative enrichment, and per-unit itemized cost breakdown.
* **Pattern Recognition:** Matching traveler preferences to venues is fundamentally measuring set overlap between user vibe tags and venue characteristic tags, while venue expenses consistently divide into mandatory entrance fees (`TICKET`) versus optional add-on purchases (`SOUVENIR`, `SERVICE`).
* **Abstraction:** Each real-world venue is abstracted into a standardized tag vector (e.g., `['Nature', 'Chill', 'Coffee']`), visual/narrative metadata (`image_url`, `short_description`, `activity_highlights`), and typed pricing items (`POIServiceItem`) specifying exact units (`per_person`, `per_group`, `per_turn`) and `includedInEstimate` status.
* **Algorithm & Operational Workflow:**
  * The engine measures tag overlap using the Jaccard Similarity Coefficient:
    $$J(U, D) = \frac{|U \cap D|}{|U \cup D|}$$
    where $U$ is the user's vibe set and $D$ is the POI's attribute set, combined with community ratings and regional proximity.
  * Each recommended card displays a venue photograph, a concise narrative paragraph describing the space, signature features, and on-site activities, and an itemized price breakdown separating mandatory entrance tickets from optional shopping/services clearly labeled per person, per group, or per turn.
* **Aesthetic, Engagement & Persuasive Output Requirements:** Visually inviting cards combining destination imagery with vivid activity descriptions so users can picture themselves at each stop and prepare their budget accurately.

### F04 — Hard-Ceiling 5-Bucket Budget Allocation & Expense Control
* **Problem:** Independent travelers frequently overspend in one category (dining or sightseeing) and exceed their total budget, or struggle to apportion funds sensibly across lodging, transit, food, and activities.
* **Decomposition:** Splits financial management into two parts: (1) allocating $B_{\max}$ across five functional buckets (Transportation, Accommodation, Dining, Activities/Sightseeing, Contingency) and (2) enforcing $\text{Total Mandatory Cost} \le B_{\max}$ while tracking optional expenses separately.
* **Pattern Recognition:** Mirrors the 0/1 Knapsack constrained optimization pattern—maximizing trip experience quality within a strict capacity ceiling $B_{\max}$ while insulating against unexpected price fluctuations.
* **Abstraction:** Consolidates scattered travel expenses into 5 standardized buckets referenced against a single hard ceiling ($B_{\max}$), separating mandatory baseline costs (`includedInEstimate = True`) from optional shopping estimates (`False`).
* **Algorithm & Operational Workflow:**
  1. **Reserve 8% Contingency:** Immediately set aside $8\%$ of $B_{\max}$ as a safety buffer so the trip is never tight to the last dong.
  2. **Compute Transportation:** For two-city trips (Đà Lạt + Nha Trang), allocate inter-city bus transit ($320{,}000\text{ VND} \times \text{party\_size}$) within an initial $22\%$ transport cap ($15\%$ for single-city trips), dividing any remainder evenly across days for local transit (Grab, taxi, motorbike rental).
  3. **Allocate Stay – Food – Play:** Deduct contingency and transport from $B_{\max}$, then partition the remaining balance: **Accommodation: 42%** (divided across nights, minimum 1 night), **Dining: 36%** (divided across days), and **Activities/Sightseeing: remaining 22%** (divided across days).
  4. **Verify Hard Ceiling:** Sum daily mandatory items and verify $\text{Total Mandatory Cost} \le B_{\max}$, displaying optional shopping estimates separately.
* **Aesthetic & Persuasive Output Requirements:** Color-coded budget bars and clear visual badges separating *"Must-Have Expenses"* from *"Optional Shopping Estimates"* so users feel completely confident in their financial plan.

### F05 — Spatially Clustered & Timed Daily Route Scheduling
* **Problem:** Self-planned itineraries often pair distant attractions on the same day or schedule visits during closed hours or meal times, causing exhaustion and wasted transit time.
* **Decomposition:** Divided into two stages: (1) grouping nearby attractions into the same day (`clusterPoisSpatially`) to minimize travel distance, and (2) sequencing daily timestamps to respect opening hours, meal windows, and rest breaks.
* **Pattern Recognition:** Exploits geographic locality (clustering venues by area) and human daily pacing rhythms derived from commercial tour benchmarks.
* **Abstraction:** Represents each venue by GPS coordinates (`lat`, `lng`), operating window (`open_time`–`close_time`), and visit duration, mapping them onto structured daily time windows.
* **Algorithm & Operational Workflow:**
  1. **Split Days by City & Pick Lodging:** Divide days between Đà Lạt and Nha Trang (if `BOTH`, split evenly, rounding up for Đà Lạt first). Select the highest-rated `LODGING` POI whose room cost ($\lceil \text{party\_size}/2 \rceil$ rooms) fits the nightly accommodation cap.
  2. **Spatial Area Clustering (`clusterPoisSpatially`):** Compute true Earth distances via `haversineKm` and run balanced K-Means spatial clustering ($\text{balancedDist} = \text{distance} + \text{cluster\_point\_count} \times 0.8$) so each day stays compact within one area while balancing stop counts across days.
  3. **Daily Chronological Loop (08:00–21:30):** Start from the hotel at 08:00 AM (or 09:30 AM if `noEarlyMornings` is checked; insert a 135 km / ~210 min inter-city transit leg on the city-transfer day). During lunch (11:15–14:00) and dinner (17:45–20:15), `pickBestDining` selects open restaurants within budget minimizing $\text{dist} - \text{finalScore} \times 4$. For sightseeing slots, filter out places exceeding budget or closing before completion (`closeTime` / 21:30), and select the venue minimizing:
     $$\text{Objective} = \text{travel\_time} + (\text{wait\_penalty} \times 0.4) - (\text{total\_score} \times 20)$$
     Pair every `OUTDOOR` stop with a nearby `INDOOR` backup ($\le \text{original\_price} + 80{,}000\text{ VND}$), and append overnight `LODGING` check-in at day's end.
  4. **Quantify Distance Saved:** Compare unclustered zigzag distance (`totalUnclusteredZigzagKm`) against clustered route distance (`totalClusteredRouteKm`) to output `distanceSavedKm` and `clusterEfficiencyPct`.

### F06 — Interactive Color-Coded Route Map
* **Purpose:** Visually plot each day's travel route on an interactive map using distinct daily colors and numbered stop markers so users can immediately verify route efficiency.
* **Decomposition:** Divided into three steps: (1) extracting ordered daily POI lists, (2) retrieving GPS coordinates and constructing connecting polylines, and (3) rendering color-coded day layers with numbered markers (1, 2, 3...).
* **Pattern Recognition:** Travelers struggle to visualize spatial order from text lists alone; color-coded polylines immediately reveal compact clustering versus zigzagging.
* **Abstraction:** Projects complex POI records onto clean 2D map coordinates (`lat`, `lng`, `sequence_order`, `day_color`), hiding secondary details inside clickable popups to keep the map uncluttered.
* **Algorithm & Operational Workflow:** Using Route Construction, the frontend map component (Leaflet / OpenStreetMap) reads the ordered (`lat`, `lng`) list produced by the TSPTW scheduler, assigns a unique color per day, places numbered pins (1, 2, 3...), draws connecting route polylines, and provides day-filter pills.
* **Current Status & Post-Demo Enhancements:** Operational with multi-day color layers and filter controls; can be further enhanced with segment-by-segment transit duration tooltips.

### F07 — Climate-Aware Packing Checklist & "Simulate Rainy Day" Toggle
* **Problem:** Travelers often arrive unprepared for local micro-climates or have their outdoor plans ruined by sudden rain.
* **Decomposition:** Split into two parts: (1) Pre-Trip Preparation (generating a tailored packing checklist and safety advisories) and (2) Dynamic Contingency (a one-click "Simulate Rainy Day" toggle that swaps outdoor stops for indoor backups).
* **Pattern Recognition:** Highland destinations like Đà Lạt experience frequent sudden showers; when rain hits, travelers naturally pivot from outdoor gardens/hills to cozy indoor cafés or museums.
* **Abstraction:** Classifies every venue with a clean weather resilience tag (`Indoor`, `Outdoor`, or `Both`).
* **Algorithm & Operational Workflow:** `generate_packing_checklist` evaluates destination climate rules (warm layers and grip shoes for Đà Lạt; swimwear and SPF 50+ sunscreen for Nha Trang) to build an interactive checklist. When the user toggles "Simulate Rainy Day" (`is_rainy=True`), the planner applies a deterministic condition-action rule (`IF rainy THEN replace Outdoor with pre-matched Indoor backup`) and highlights rainwear (raincoat, compact umbrella, waterproof phone pouch) in the checklist.
* **Current Status & Future Direction:** Completed and running smoothly in the MVP; future iterations can connect to a live Weather Forecast API.

### F08 — Dual-Angle Persuasive Explanation & Transparency Panel
* **Problem:** Conventional travel tools output raw schedules without explaining why the plan is exciting or how it optimizes time and money, leaving users unconvinced.
* **Decomposition:** Organizes the explanation around two persuasive angles and three clear traveler metrics: (1) *Excitement & Experiential Appeal* (why the activities and local flavors fit the user's vibe) and (2) *Logical & Financial Rationality* (preference match %, kilometers saved via spatial clustering, and preserved safety budget buffer).
* **Pattern Recognition:** Travelers need both emotional inspiration (feeling excited about unique experiences) and rational proof (concrete numbers showing saved time and money) before trusting an automated plan.
* **Abstraction:** Distills multi-variable optimization telemetry into human-centered advisory storytelling backed by four digestible indicators (`jaccard_match_pct`, `distance_saved_km`, `clustering_efficiency_pct`, `remaining_buffer_vnd`).
* **Algorithm & Operational Workflow:** The planner aggregates Jaccard match scores, unclustered vs. clustered route savings, and budget buffer figures into a collapsible *"Computational Thinking Insights"* card written in engaging, persuasive advisory language.
* **Persuasive & Aesthetic Output Requirements:** Compelling, natural-sounding guidance that convinces the user both of how enjoyable the trip will be and how smart the route and budget allocation are.

### F09 — Live Budget Re-Balancing & Single-POI Swapping
* **Purpose:** Allow users to swap individual venues or adjust their budget slider and see updated timings and costs immediately without regenerating the entire trip from scratch.
* **Decomposition:** Divided into three steps: (1) capturing the user's edit (new POI or updated $B_{\max}$), (2) recalculating affected distances, timestamps, and bucket totals, and (3) refreshing the UI schedule and budget table.
* **Pattern Recognition:** Even with an optimal initial schedule, travelers frequently want to substitute a specific restaurant or test a slightly higher/lower budget.
* **Abstraction:** Treats a daily schedule as a mutable indexed array of slots, isolating localized mutations from unaffected days.
* **Algorithm & Operational Workflow:** Uses Incremental Recalculation paired with Constraint Checking. When swapping a single stop (`/api/itinerary/swap-poi`), only the affected day's segment distances and totals (`_recalculate_itinerary_totals`) are updated; when adjusting the budget slider (`/api/itinerary/rebalance-budget`), the 5-bucket allocator and constraint checker verify $\text{Total Cost} \le B_{\max}$ in real time.
* **Current Status:** Backend API endpoints (`/rebalance-budget` and `/swap-poi`) are implemented and functional; live UI slider polish is being finalized for Week 10.

### F10 — Commercial Tour Sample Templates, Evaluation Survey & Post-Trip Review Gate
* **Purpose:** Provide proven sample tour templates modeled on real travel-agency packages, collect structured user feedback, and enforce authentic post-trip star ratings.
* **Decomposition:** Divided into three sub-modules: (1) displaying and cloning curated sample tour templates, (2) collecting a 10-question Likert (1–5) evaluation survey, and (3) gating post-trip 1–5 star ratings until after the trip's end date.
* **Pattern Recognition:** Travelers trust itineraries modeled on real commercial tours (2D1N/3D2N Đà Lạt and Nha Trang packages) and rely on verified peer reviews—provided ratings are submitted after a trip actually takes place rather than beforehand.
* **Abstraction:** Abstracts commercial agency tours into reusable `TourTemplate` blueprints, user satisfaction into a 10-criterion Likert vector, and POI quality into a weighted average rating:
  $$\text{Rating}_{\text{avg}} = \frac{\sum_{i=1}^{n} \text{Rating}_i}{n}$$
* **Algorithm & Operational Workflow:**
  * *Commercial Tour Templates:* Users browse and clone battle-tested 2D1N/3D2N sample plans derived from travel-agency patterns and customize dates or budgets.
  * *Survey & Post-Trip Review Gate:* `/api/survey/submit` validates the 10-question Likert responses and logs them simultaneously to JSON and CSV. For trip ratings, the system enforces a temporal check ($\text{current\_date} \ge \text{trip.end\_date}$), locking review submission until the trip is completed before updating $\text{Rating}_{\text{avg}}$ for future F03 recommendations.

### F11 — Manager Analytics & POI Repository Management
* **Problem:** Tourism data (ticket prices, opening hours, new cafés/attractions) evolves constantly; editing raw source files manually is error-prone and makes tracking user trends difficult.
* **Decomposition:** Splits the Manager Dashboard into two panes: (1) *Analytics Overview* (POI counts, average ratings, weather suitability breakdown, and survey metrics) and (2) *POI Management* (city selector, linear search/filter, and Add/Update/Delete controls).
* **Pattern Recognition:** Managing destination data follows a repetitive workflow: select city (Đà Lạt or Nha Trang) $\rightarrow$ search/locate venue $\rightarrow$ add, edit, or remove record.
* **Abstraction:** Represents every POI with unified operational and visual attributes (`name`, `type`, `area`, `lat`, `lng`, `avg_price`, `open_time`, `close_time`, `weather_suitability`, `image_url`, `short_description`), enabling the Manager Dashboard and Planner Engine to share one single source of truth.
* **Algorithm & Operational Workflow:** Uses linear filtering across the selected city's JSON dataset (`places_dalat.json` or `places_nhatrang.json`), auto-fills default coordinates/addresses via `AREA_PRESETS` when adding new venues, computes aggregate counts/averages for analytics, and persists updates atomically.
* **Current Status & Post-Demo Enhancements:** View, search, filter, Add, Delete, and real-time analytics are operational; inline POI editing (`PUT /api/manager/pois`) and role-guard middleware are included in the Week 10 completion update.

### F12 — Print-Ready PDF Itinerary Export
* **Purpose:** Allow travelers to download their complete multi-day schedule, itemized mandatory/optional cost table, and packing checklist as a clean PDF for offline access during their trip.
* **Decomposition:** Divided into three steps: (1) gathering the finalized itinerary state, (2) structuring content into schedule, budget, and packing sections, and (3) formatting and exporting a paginated PDF document.
* **Pattern Recognition:** Travelers frequently lose mobile signal in highland areas (like Cầu Đất or Langbiang) and need an offline, printable travel handbook.
* **Abstraction:** Projects dynamic web UI state onto a clean, static print layout while stripping away interactive web buttons and navigation bars.
* **Algorithm & Operational Workflow:** Uses Data Mapping (mapping `daily_itinerary`, `budget_breakdown`, and `packing_checklist` into print sections) and Pagination (`@media print` page-break rules to prevent awkward text clipping across pages).
* **Current Status & Future Direction:** Print-formatted layout is implemented; future enhancements can embed static route map snapshots and QR codes linking back to interactive Google Maps directions.