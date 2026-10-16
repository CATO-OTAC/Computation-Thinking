# Lab 01: Exercise 3 - Individual Proposal for the Course Project

**Proposer:** Nguyễn Bạch Thành Nhân  
**Student ID:** `25127111`  
**Proposed Title:** DynamicCommute: Adaptive Multi-Modal Commute Assistant with Real-Time Traffic & Dynamic Constraint Reasoning  
**Target Track:** Personal Productivity / University Life Assistant (Spatial-Temporal Optimization)

---

### 1. Problem Statement & Motivation
In rapidly growing metropolitan areas such as Ho Chi Minh City, commuters face unpredictable traffic delays caused by sudden downpours, localized tidal flooding (triều cường), and erratic road congestion. 

Standard navigation tools (such as Google Maps) provide point-to-point shortest routes based on static distance or general speed estimates. However, they frequently fail when users must accommodate **complex, multi-layered real-world constraints**:
- *"Find me the fastest route home on a scooter, but avoid flood-prone streets because water levels are rising."*
- *"I have a meeting at 8:30 AM; calculate when I need to leave, route me past a refueling station, and automatically recommend switching to a bus/metro if major arteries are blocked for over 20 minutes."*

Existing systems treat route planning as a pure search problem, lacking the conversational capability to extract implicit constraints, weigh dynamic environmental variables, and transparently explain why a specific detour was chosen.

---

### 2. Independent Contribution & Distinct Approach
While conventional group proposals often focus on simple $A \to B$ graph searches with basic traffic inputs, this proposal introduces three major engineering differentiators:
1. **Multi-Attribute Dynamic Cost Function:** The routing graph does not rely solely on static edge lengths ($L$). It computes edge weights dynamically:
   $$W(e, t) = \frac{L(e)}{V_{real}(e, t)} \times \alpha_{congestion} + \beta_{flood}(e, t) + \gamma_{user\_penalty}$$
   where flood levels, vehicle types, and user preferences (e.g., avoiding narrow alleys) are modeled as deterministic penalties.
2. **Conversational Constraint Orchestration:** An LLM is not used to compute the path. Instead, it serves as an **Intent & Constraint Parser**, transforming messy natural language into a strict JSON-schema query.
3. **Transparent Reasoning & Explanations:** The assistant returns both the spatial trajectory and a natural language justification of trade-offs made (e.g., *"Selected Route B: 4 minutes longer, but bypasses severe water accumulation on Nguyen Huu Canh street"*).

---

### 3. Application of the Four Pillars of Computational Thinking

#### A. Decomposition (Phân rã)
The system is divided into modular, decoupled pipelines:
- **Natural Language Parsing Module:** Extracts origin, destination, departure/arrival deadlines, vehicle type, and negative constraints (*"avoid highway"*, *"stay clear of flooded intersections"*).
- **Traffic & Environmental Data Ingestion Service:** Fetches real-time sensor/crowdsourced traffic speeds, meteorological warnings, and local flood reports.
- **Dynamic Graph Routing Engine:** Maintains the road network topology and evaluates optimal paths based on current edge costs.
- **Explainability & Verification Unit:** Validates whether the generated path violates hard constraints and synthesizes a concise travel brief.

#### B. Pattern Recognition (Nhận diện mẫu)
- **Temporal Congestion Patterns:** Correlates historical congestion data with time windows (e.g., peak morning bottlenecks near university campuses between 06:45 AM and 07:30 AM).
- **Rain-to-Flood Correlation:** Maps severe weather alerts to predefined topographical low-points, automatically pre-weighting vulnerable segments before traffic grind completely stalls.

#### C. Abstraction (Trừu tượng hóa)
- The physical urban street grid is modeled as a directed graph $G = (V, E)$, where vertices $V$ represent key intersections and edges $E$ represent road segments.
- Extraneous real-world details (building types, sidewalk widths, roadside scenery) are discarded.
- Roads are abstracted into metadata tuples: `(segment_id, base_distance, speed_limit, current_speed, flood_risk_level, vehicle_permissions)`.

#### D. Algorithm Design (Thiết kế thuật toán)
1. **Constraint Extraction Algorithm:** Parse unstructured chat into structured constraints with strict schema fallbacks.
2. **Time-Dependent Dijkstra / Constrained A\* Search:**
   - Heuristic function $h(u) = \frac{\text{EuclideanDistance}(u, \text{Destination})}{V_{max}}$.
   - Dynamically checks edge admissibility (e.g., if vehicle is a scooter and `flood_risk_level > 2`, prune the edge from the search frontier).
3. **Fallback & Graceful Degradation:** If live traffic APIs become unreachable or time out, the orchestrator triggers an automatic fallback to static historical averages and issues an explicit data staleness alert to the user.

---

### 4. Mapping to Course Project Requirements (R1 – R8)

| Requirement ID | System Architecture Implementation |
| :--- | :--- |
| **R1: Problem Boundary** | Target: Urban student/worker commuters. Non-goals: Turn-by-turn live GPS navigation during driving; focuses strictly on pre-trip and dynamic replanning. |
| **R2: Deterministic Capability** | Constrained A\* routing algorithm with rigorous, reproducible path cost outputs and verifiable constraint checks. |
| **R3: Data / Retrieval** | OpenStreetMap (OSM) topological graph combined with mock/live real-time traffic condition JSON streams. |
| **R4: AI-Enabled Capability** | Few-shot LLM agent dedicated to extracting temporal conditions, user preferences, and negative constraints from vague text queries. |
| **R5: Routing & Orchestration** | Intent router directs general transit questions to knowledge base, route queries to the graph engine, and incomplete prompts to a clarification dialogue. |
| **R6: End-to-End Interface** | Web-based chat interface displaying a responsive chat panel alongside an interactive Leaflet/Mapbox route visualization. |
| **R7: Reliability & Safeguards** | Input sanitization, out-of-boundary coordinate detection, route validity assertion, and graceful fallback when external APIs fail. |
| **R8: Evaluation Plan** | Evaluated across 50 benchmark commute scenarios measuring: (1) Constraint satisfaction rate, (2) Routing computation latency ($< 250$ms), and (3) Route validity under dynamic road closures. |