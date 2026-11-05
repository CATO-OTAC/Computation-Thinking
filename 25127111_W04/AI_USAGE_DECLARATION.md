# AI Usage Declaration & Human-AI Collaboration Log

**Project:** Smart Travel Assistant (AI Route Suggestion & Evaluation Framework)
**Date:** March 2025
**Policy Compliance:** Academic & Industry AI Usage Transparency Standards

---

## 1. Overview of AI Assistance

In accordance with transparent software development practices, this document declares the scope, tools, prompts, and verification procedures used in creating the Smart Travel Assistant codebase and its associated features.

The team used Large Language Models (LLMs) as **pair-programming assistants** and **architectural sounding boards**. All core business logic, schema specifications, algorithmic designs, and final integrations were verified, modified, and validated by human engineers.

---

## 2. Tools and Models Used

- **Primary AI Assistant:** Anthropic Claude / OpenAI GPT-4 architecture
- **Environment:** Visual Studio Code / Terminal
- **Domain of Interaction:** Algorithmic boilerplate generation, Haversine/Jaccard math routines, CSS/HTML responsive layout refinement, and mock dataset scaffolding.

---

## 3. Granular Breakdown of AI vs. Human Contributions

### 3.1 Feature 1: Dynamic Multi-Constraint Itinerary Planner

| Component / Task | AI Contribution | Human Contribution & Validation |
|---|---|---|
| **Mathematical Implementations** | Generated initial implementations of the Haversine trigonometric formula and Jaccard similarity index. | Verified numerical outputs against Google Maps road distances; added safeguards for empty vibe sets to prevent `ZeroDivisionError`. |
| **Budget Feasibility Logic** | Proposed threshold heuristics for hotel/food allocation. | Adjusted pricing formulas to reflect Vietnamese tourist market realities (rooms = ⌈party / 2⌉, daily food allowance of 150,000 VNĐ/person). |
| **Lifespan Migration** | Identified FastAPI deprecation of `@app.on_event("startup")` and suggested `asynccontextmanager` lifespan syntax. | Implemented background task cancellation handling (`sync_task.cancel()`) on server shutdown. |
| **UI Layout & Form Binding** | Provided CSS grid and flexbox boilerplate for the side-by-side view (Input vs. Results). | Engineered the dynamic per-day vibe rendering logic (`updateDailyPrefUI`) and interactive category badge colors. |

### 3.2 Feature 2: Survey & Algorithmic Quality Feedback Loop

| Component / Task | AI Contribution | Human Contribution & Validation |
|---|---|---|
| **Survey Question Formulation** | Drafted initial Likert questions covering software usability and quality. | Categorized questions into 3 technical evaluation groups; assigned discrete tags (`Cost`, `Rest_Time`, `Destination`) to match algorithmic metrics. |
| **Data Persistence Strategy** | Generated a sample Python snippet for CSV writing using `csv.writer`. | Added UTF-8 BOM encoding (`utf-8-sig`) so Vietnamese accents render correctly in Microsoft Excel; structured atomic write operations. |
| **Port Separation Architecture** | Suggested separating frontend ports or assigning explicit distinct backend ports. | Configured server instances on ports `8000` and `8001` with explicit CORS settings to prevent development port collisions. |

---

## 4. Specific Prompt Logs & Engineering Iterations

### Example 1: Spatial & Similarity Logic

- **User/Developer Prompt:**
  > *"Write a Python function to compute Jaccard similarity between two lists of string tags, and a Haversine formula to find distance in kilometers between two latitude/longitude pairs."*
- **AI Output:** Provided standard mathematical implementations.
- **Human Verification & Modification:** Wrapped outputs in defensive type-casting, handled edge cases (such as identical origin and destination coordinates returning `0.0`), and rounded distances to 2 decimal places.

### Example 2: Budget Guardrail Engineering

- **User/Developer Prompt:**
  > *"Users are submitting unrealistic budgets (e.g., 500k VNĐ for 4 people for 3 days). How can we catch this early in FastAPI before generating the route?"*
- **AI Output:** Suggested raising an HTTP 400 Bad Request exception.
- **Human Decision/Adjustment:** Replaced the hard HTTP 400 error with a non-breaking status object (`{"status": "warning", "message": ...}`) so the frontend can render an informative warning card (`.warning-box`) without breaking the user interface.

---

## 5. Potential Risks, Limitations, and Ethical Safeguards

1. **Hallucination Mitigation in Geo-Data:**
   AI models can hallucinate non-existent POIs, coordinates, or incorrect closing hours. To eliminate this risk, all location records (`places_dalat.json` and `places_nhatrang.json`) were populated with curated ground-truth coordinates and real addresses, complemented by the Google Places API synchronization worker.

2. **Code Security & Privacy:**
   No proprietary credentials or private API keys were provided to the AI. Credentials are read only from environment variables (`os.getenv("GOOGLE_MAPS_API_KEY")`). Survey responses store an anonymous ID (`USR_xxxx`) and do not record personally identifiable information (PII).

---

## 6. Verification Statement

The undersigned engineering team confirms that all AI-assisted code blocks have been read line by line, debugged, load-tested, and integrated into the final deliverables with complete human oversight and accountability.
