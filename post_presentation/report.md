# INDIVIDUAL PROJECT REPORT: ALGORITHM DESIGN & DATASET ENGINEERING FOR AI TRAVEL PLANNER

**Course:** Computational Thinking & Algorithms  
**Project Module:** Algorithmic Workflow, Heuristic Routing, Dataset Pipeline & Implementation Roadmap  
**Coverage:** Presentation Slides 27 to 46  

---

## 1. Executive Summary

This report documents the design, theoretical formulation, and implementation blueprint of the algorithmic core and data architecture developed for the **AI-Powered Travel Planner**. The project addresses the real-world challenge of multi-constraint itinerary planning—a task traditionally burdened by cognitive overload, suboptimal scheduling, and budget mismanagement.

Within the project division of labor, my primary responsibilities encompassed:
1. **End-to-End Algorithmic Architecture:** Defining the operational workflows for both deterministic planning (where the destination is predetermined) and vibe/discovery-based destination recommendation.
2. **Heuristic Route Optimization:** Resolving the NP-hard Traveling Salesperson Problem (TSP) in daily scheduling using an adapted Greedy Nearest Neighbor heuristic.
3. **Selection & Ranking Mechanics:** Formulating Top-$N$ ranking and similarity metrics based on high-dimensional category/vibe tags.
4. **Data Engineering:** Designing the schema and ingestion pipeline (integrating the Google Maps API, web scraping, and AI enrichment) to build the core tourism database.
5. **Project Milestone Synthesis:** Documenting research deliverables and drafting the step-by-step roadmap for software development.

---

## 2. Computational Thinking Foundations

The module was constructed directly upon the four fundamental pillars of Computational Thinking:

```
+---------------------------------------------------------------------------------+
|                               COMPUTATIONAL THINKING                            |
+-------------------+-------------------+-------------------+---------------------+
|   Decomposition   |Pattern Recognition|    Abstraction    |  Algorithm Design   |
+-------------------+-------------------+-------------------+---------------------+
| Splitting n-day   | Matching user     | Reducing physical | Staged pipelines:   |
| itinerary into    | vibe tags with    | places to coords, | Input validation -> |
| independent daily | destination tag   | avg visit time,   | Filtering ->        |
| scheduling blocks | clusters          | cost, & category  | Heuristic Routing   |
+-------------------+-------------------+-------------------+---------------------+
```

* **Decomposition:** A complex 6-day travel itinerary with global budget and time constraints is broken down into modular sub-problems: input validation, candidate pool filtering, daily route sequencing, budget verification, and secondary downtime insertion.
* **Pattern Recognition:** Identifying commonalities between user semantic preferences (e.g., `#cool`, `#natural`, `#peaceful`) and destination attribute vectors to perform classification and match-scoring.
* **Abstraction:** Removing extraneous real-world complexities and reducing geographic locations to actionable data tuples: $\text{POI} = \langle \text{Latitude}, \text{Longitude}, \text{Cost}, \text{Duration}, \text{Tags}, \text{OpeningHours} \rangle$.
* **Algorithm Design:** Constructing deterministic, multi-stage pipelines combining boolean validation, multi-criteria filtering, Top-$N$ sorting ($O(n \log n)$), and greedy spatial traversal ($O(n^2)$).

---

## 3. Algorithm Design — Part 1: Destination-Known Pipeline

When the user specifies an explicit destination (e.g., Da Nang), the planning pipeline executes as a sequential 5-step state machine:

```
[START: Destination Known]
          │
          ▼
   ┌──────────────┐
   │ 1. Collect   │ ◄─── (Invalid Inputs) ───┐
   │  User Info   │                          │
   └──────┬───────┘                          │
          ▼                                  │
   ┌──────────────┐    [Validation Fail]     │
   │ 2. Validate  ├──────────────────────────┘
   │     Data     │
   └──────┬───────┘
          │ [Validation Pass]
          ▼
   ┌──────────────┐
   │ 3. Filter &  │
   │  Sort Places │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ 4. Generate  │
   │  Itinerary   │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ 5. Recommend │
   │   Extras     │
   └──────┬───────┘
          │
          ▼
[END: Itinerary + Extras Ready]
```

### Step 1: User Information Ingestion
The system collects an explicit parameter set from the client interface:
* **Destination:** Target geographical entity (e.g., Da Nang).
* **Budget ($B_{total}$):** Total monetary allocation in USD (e.g., $\$800$).
* **Trip Window ($T$):** Start date, end date, and duration (e.g., March 10 – March 15; 6 days).
* **Companion Type ($C$):** Social structure ($\text{Alone}, \text{Couple}, \text{Friends}, \text{Family}$).
* **Accommodation Preference ($A$):** Lodging category ($\text{Homestay}, \text{Hotel}$).

### Step 2: Input Validation State Machine
To guarantee downstream algorithmic stability and eliminate invalid execution states, the data is passed through validation gates:
* **Numerical Bounds Checking:** Ensures $B_{total} > 0$.
* **Chronological Integrity:** Asserts $\text{Date}_{end} \ge \text{Date}_{start}$, computing total days $D = (\text{Date}_{end} - \text{Date}_{start}) + 1$.
* **Completeness:** Asserts $C \ne \emptyset$ and $A \ne \emptyset$.

**Exception Handling:** If any constraint fails, the pipeline aborts the transition to Step 3, flags the specific error (e.g., `"Unusual data detected: End date occurs prior to start date"`), and initiates a feedback loop requiring user correction.

### Step 3: Candidate Filtering and Multi-Criteria Sorting
Given a raw candidate pool of Points of Interest (POIs) within the destination region:
1. **Hard Filtering (Constraint Satisfaction):**
   * Exclude POIs that exceed the maximum individual activity cost allocation: $\text{Cost}(p) \le B_{threshold}$.
   * Exclude POIs inappropriate for the selected companion type (e.g., filtering out nightlife venues if $C = \text{Family}$).
2. **Multi-Criteria Ranking:**
   The remaining pool is ordered based on a composite fitness function:
   $$\text{Score}(p) = w_1 \cdot \text{NormalizedRating}(p) - w_2 \cdot \text{NormalizedCost}(p) - w_3 \cdot \text{NormalizedDistance}(p, A_{loc})$$
   where $w_1, w_2, w_3$ are balancing weights.

### Step 4: Daily Itinerary Generation
The filtered pool is partitioned across the trip duration (6 days), dividing each day into canonical slots: **Morning**, **Noon (Lunch & Activity)**, and **Evening**.
* The daily cost is accumulated:
  $$C_{day} = \sum \text{Cost}(\text{Activities}) + \text{Cost}(\text{Meals}) + \frac{\text{Cost}(A)}{D}$$
* **Budget Control Check:**
  $$C_{trip} = \sum_{d=1}^{D} C_{day}$$
  *Example Output:* Total calculated expenditure of $\$760 \text{ USD} \le \$800 \text{ USD}$ budget ceiling.

### Step 5: Proximity Downtime Recommendations
To accommodate unscheduled intervals (e.g., early returns to accommodation or leisure gaps), a secondary spatial query evaluates places within walking radius of the user's accommodation base:
* **Micro-Distances:** Cafes ($\le 300\text{m}$), Local dining ($\le 400\text{m}$), Scenic/Photo spots ($\le 500\text{m}$), Parks ($\le 600\text{m}$).
* **Execution:** Radial distance computation ($r \le 600\text{m}$) using Haversine or Euclidean metrics relative to the lodging coordinates.

---

## 4. Algorithm Design — Part 2: Vibe/Discovery-Based Recommendation

When the user has no predefined destination, the system initializes a semantic recommendation flow to determine optimal target locations:

```
[START: User has only a vibe]
             │
             ▼
      ┌──────────────┐
      │ 1. Collect   │ (Selects tags: #cool, #natural, #peaceful)
      │   the Vibe   │
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │  2. Pattern  │ (Vector comparison: User Tags vs. Destination Tags)
      │   Matching   │
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │ 3. Suggest   │ (Top-5 selection ranked by Match Score)
      │    Top 5     │
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │  4. Pick &   │ (User chooses 1 destination)
      │  Fall Back   │
      └──────┬───────┘
             │
             ▼
  [Transition to Part 1: Step 1]
```

### Step 1: Vibe Tag Ingestion
The system presents a curated ontological vocabulary of travel characteristics:
$$\mathcal{V} = \{\text{Cool}, \text{Natural}, \text{Vibrant}, \text{Peaceful}, \text{Romantic}, \text{Adventurous}, \text{Cultural}, \text{Foodie}, \text{Nightlife}\}$$
The user selects a subset $U_{tags} \subseteq \mathcal{V}$ (e.g., $U_{tags} = \{\#\text{cool}, \#\text{natural}, \#\text{peaceful}\}$).

### Step 2: Pattern Matching & Similarity Scoring
Each candidate destination $j$ in the database maintains a predefined set of tags $D_{tags}^{(j)}$. The system computes a normalized intersection score (Jaccard-like or overlap ratio):
$$\text{MatchScore}(j) = \frac{|U_{tags} \cap D_{tags}^{(j)}|}{|U_{tags}|} \times 100\%$$

* **Demonstration Matrix:**
  * **Da Lat:** Tags = $\{\#\text{cool}, \#\text{natural}, \#\text{peaceful}\} \implies \frac{3}{3} = \mathbf{100\%}$
  * **Sapa:** Tags = $\{\#\text{cool}, \#\text{natural}, \#\text{adventurous}\} \implies \frac{2}{3} = \mathbf{66.7\%}$
  * **Hoi An:** Tags = $\{\#\text{peaceful}, \#\text{romantic}, \#\text{cultural}\} \implies \frac{1}{3} = \mathbf{33.3\%}$
  * **Ho Chi Minh City:** Tags = $\{\#\text{vibrant}, \#\text{foodie}, \#\text{nightlife}\} \implies \frac{0}{3} = \mathbf{0\%}$

### Step 3: Top-$N$ Selection & Presentation
The similarity scores are ranked descendingly to extract the top 5 candidates with context descriptions (e.g., Da Lat: 98%, Sapa: 94%, Moc Chau: 91%, Ha Giang: 88%, Mai Chau: 85%).

### Step 4: Fall Back to Parameterized Pipeline
Upon the user selecting their preferred destination card (e.g., "Da Lat"), the state transitions back to **Part 1 (Step 1)** with the `Destination` field pre-populated, allowing remaining constraints (budget, dates, companion) to be completed.

---

## 5. Detailed Algorithmic Direction & Complexity Analysis

```
Daily Route Scheduling Complexity Trade-off:
+-------------------------------------------------------------------------------+
|  Exhaustive TSP Search (n!)              Greedy Nearest Neighbor (n^2)        |
+-------------------------------------------------------------------------------+
|  n = 10 stops                            n = 10 stops                         |
|  10! = 3,628,800 route evaluations      ~100 comparisons                     |
|  Computationally intractable for web app Near-optimal, deterministic, ms-speed|
+-------------------------------------------------------------------------------+
```

### 5.1 Heuristic Routing: Daily Scheduling via Nearest Neighbor
Finding the absolute shortest or lowest-cost closed route visiting $n$ locations is a formal instance of the **Traveling Salesperson Problem (TSP)**, classified as NP-hard.

* **The Combinatorial Explosion of Exact Approaches:**
  An exact brute-force search evaluates permutations:
  $$\Omega(n!) \implies \text{For } n = 10 \text{ stops}, \quad 10! = 3,628,800 \text{ paths.}$$
  Evaluating $3.6 \times 10^6$ routing combinations per day across a 6-day itinerary within an interactive web request causes severe system latency.

* **Greedy Nearest Neighbor Variation:**
  We implement a greedy approximation algorithm run independently for each day's subset of POIs.
  
  ```
  Algorithm: Greedy Daily Route Scheduling
  Input    : Accommodation H, Set of chosen daily POIs P, Travel Time Matrix T
  Output   : Ordered schedule with temporal arrival slots

  1. Initialize: CurrentLocation <- H, Route <- [H], Unvisited <- P
  2. While Unvisited is not empty:
  3.     Find p_next in Unvisited that minimizes TravelTime(CurrentLocation, p_next)
  4.     Validate: Check if EstimatedArrival(p_next) falls within OpeningHours(p_next)
  5.     If valid:
  6.         Append p_next to Route
  7.         CurrentLocation <- p_next
  8.         Remove p_next from Unvisited
  9.     Else:
  10.        Evaluate next closest candidate in Unvisited
  11. Slot Route into temporal schedule: Visit Time + Transit Time
  12. Return Route
  ```

* **Complexity Justification:**
  At step $k$, finding the minimum distance requires comparing $(n - k)$ unvisited elements. Total comparisons:
  $$\sum_{k=1}^{n} (n - k) = \frac{n(n - 1)}{2} = \mathcal{O}(n^2)$$
  For $n = 10$, $\approx 45\text{ to } 100$ basic operations are required—executing in sub-millisecond real-time while yielding an acceptable near-optimal route.

### 5.2 Selection Algorithm: Top-$N$ Selection
For the vibe recommendation engine, sorting and selecting the best matching destinations from a candidate pool of size $M$:

```
[Scored List (Step 2)]
         │
         ▼
 ┌───────────────┐      [Size < 5]
 │ Check Pool    ├─────────────────────┐
 │  Size >= 5?   │                     │
 └───────┬───────┘                     │
         │ [Yes]                       │
         ▼                             ▼
 ┌───────────────┐             ┌───────────────┐
 │Sort Descending│             │ Keep All Pool │
 │  O(M log M)   │             └───────┬───────┘
 └───────┬───────┘                     │
         │                             │
         ▼                             │
 ┌───────────────┐                     │
 │ Slice First 5 │                     │
 └───────┬───────┘                     │
         │                             │
         ▼ ◄───────────────────────────┘
 ┌───────────────┐
 │ Output Top-5  │
 └───────────────┘
```

* **Algorithmic Complexity:**
  Sorting the scored array takes $\mathcal{O}(M \log M)$ using standard Quicksort/Timsort. Slicing the first $N$ elements requires $\mathcal{O}(N)$ where $N = 5 \ll M$.
* **Tie-Breaking Rule:**
  If two destinations exhibit identical vibe match percentages, ties are resolved deterministically using aggregate user ratings:
  $$\text{Priority}(A, B) = \begin{cases} A, & \text{if } \text{MatchScore}(A) > \text{MatchScore}(B) \\ A, & \text{if } \text{MatchScore}(A) = \text{MatchScore}(B) \land \text{Rating}(A) \ge \text{Rating}(B) \\ B, & \text{otherwise} \end{cases}$$

---

## 6. Dataset Engineering & Schema Design

To drive the filtering, sorting, and routing algorithms, an automated ingestion and standardization pipeline was developed.

```
       DATA EXTRACTION                         DATA ENRICHMENT / STRUCTURING
┌────────────────────────┐              ┌────────────────────────────────────────┐
│    Google Maps API     ├───┐          │ 1. Coordinates: Latitude & Longitude   │
└────────────────────────┘   │          ├────────────────────────────────────────┤
                             ├──►[ AI ]─┼─► 2. Financial: Estimated Cost (USD)   │
┌────────────────────────┐   │  ENGINE  ├────────────────────────────────────────┤
│ Targeted Web Scraping  ├───┘          │ 3. Semantic: Category / Vibe Tags      │
│(Travel Blogs, Reviews) │              ├────────────────────────────────────────┤
└────────────────────────┘              │ 4. Temporal: Average Visit Duration    │
                                        └────────────────────────────────────────┘
```

### Data Acquisition Layers:
1. **Google Maps API:** Ingests official place entities, precise geographic coordinates (Latitude, Longitude), operational hours, and raw review scores.
2. **Web Scraping:** Targets travel blogs, regional guidebooks, and tourism forums to collect descriptive context and popular community sentiment.
3. **AI Normalization Engine:** Processes unstructured scrapings and API metadata to generate structured entity records:

```json
{
  "place_id": "POI_DN_0042",
  "name": "Marble Mountains",
  "destination": "Da Nang",
  "coordinates": {
    "latitude": 16.0042,
    "longitude": 108.2639
  },
  "estimated_cost_usd": 4.50,
  "category_tags": ["#natural", "#cultural", "#scenic", "#walking"],
  "average_visit_duration_hours": 2.5,
  "opening_hours": {
    "open": "07:00",
    "close": "17:30"
  },
  "rating": 4.6
}
```

---

## 7. Project Progress & Implementation Roadmap

### Phase 1: Completed Work (Research & Design Phase)
* [x] **Competitive UI/UX Analysis:** Benchmarked how commercial travel platforms manage query filters, budget warnings, and multi-day itinerary displays.
* [x] **Problem Formulation:** Structured the core travel planning bottlenecks into formal computational constraints (temporal bounds, financial limits, geographic proximity).
* [x] **I/O Mapping:** Specified all system inputs ($\text{Budget}, \text{Dates}, \text{Preferences}, \text{Accommodations}$) and expected structured outputs ($6\text{-day daily timetable} + \text{cumulative budget analysis}$).
* [x] **Computational Thinking Abstraction:** Formalized problem reduction, tag classification, and heuristic routing.
* [x] **AI Model Justification:** Proved the necessity of an AI/heuristic optimization model to resolve conflicting multi-variable trade-offs where manual scheduling is inefficient.
* [x] **Interface Prototyping:** Completed UI wireframes for parameter collection and itinerary rendering.

### Phase 2: Planned Implementation Roadmap
The scheduled development tasks translate the algorithmic models into production software:

```
[Phase 2 Implementation Timeline]
┌────────────────────────────────────────────────────────┐
│ Step 01: Build responsive web UI from wireframe models │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 02: Implement client-side input validation form   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 03: Connect backend API to AI & heuristic models  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 04: Generate structured 6-day daily schedules     │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 05: Integrate real-time budget tracking & alerts  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 06: Execute test suites, user trials & refinement │
└────────────────────────────────────────────────────────┘
```

1. **Step 01 — UI Construction:** Implement accessible, responsive frontend components translating designed layouts into code.
2. **Step 02 — Form & Validation Logic:** Build the client input validation state machine to intercept negative values, illogical date ranges, and missing criteria before API dispatch.
3. **Step 03 — Model Integration:** Connect frontend parameters to the backend orchestration service hosting the routing and ranking algorithms.
4. **Step 04 — Itinerary Generator:** Generate full 6-day morning-noon-evening schedules with transit allowances.
5. **Step 05 — Financial Tracking Logic:** Compute categorical cost breakdowns ($\text{Transport}, \text{Stay}, \text{Food}, \text{Entry Fees}$) and trigger threshold alerts if $C_{trip} > B_{total}$.
6. **Step 06 — Testing, Verification & Optimization:** Conduct integration testing using realistic user profiles to optimize response latency and heuristic path accuracy.

---

## 8. Conclusion

The work delivered from Slide 27 through Slide 46 defines a coherent algorithmic system for automated travel planning. By framing the problem through **Computational Thinking**, we transformed an overwhelming, open-ended problem into a solvable pipeline of validation checks, tag-based pattern recognition, Top-$N$ sorting, and $\mathcal{O}(n^2)$ Nearest Neighbor routing. Supported by a standardized tourism dataset schema and a concrete six-stage implementation plan, this foundation provides the technical baseline required to build an efficient, production-ready AI travel planner.