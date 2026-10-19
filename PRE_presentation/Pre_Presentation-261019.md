# PHASE 1 DIRECTION REPORT
## Category: Dataset & Algorithms Direction

---

### 1. SYSTEM OBJECTIVE
The purpose of this section is to define how we collect the "raw materials" (Tourism dataset) and build the processing logic (Algorithms) so the AI can transform user inputs into a practical, realistic travel itinerary.

---

### 2. DATASET DIRECTION
The system will not store long, descriptive text data. Instead, it will focus purely on technical parameters that the computer can easily calculate.

#### 2.1. Proposed Data Sources
- **Geographical & Distance Data:** Utilizing Google Maps API / OpenStreetMap.
- **Ratings & Pricing Data:** Basic Web Scraping from travel platforms like TripAdvisor and Traveloka.

#### 2.2. Core Data Features
Every tourist attraction in the database will be standardized into the following data fields:
1. **Coordinates (Lat, Long):** Mandatory for the AI to calculate travel distances.
2. **Estimated Cost:** Used for the user's budget filter.
3. **Category Tags:** E.g., Beach, Mountain, Historical, Food... Used to match with user preferences.
4. **Average Visit Duration:** (e.g., 1.5 hours) Used by the AI to fit locations perfectly into a daily schedule.

---

### 3. ALGORITHMS DIRECTION
The core processing workflow of the AI, from receiving the Input to generating the Output, is designed to go through 2 main steps:

#### Step 1: Filtering & Scoring Algorithm
- **Hard Filter:** The system instantly eliminates locations that are not in the requested city or exceed the user's maximum budget.
- **Preference Scoring:** For the remaining locations, the AI matches the location's "Category Tags" with the user's inputted hobbies. Locations with the highest match rate will be pushed to the top (Top Recommendations).

#### Step 2: Routing & Scheduling Algorithm
Once the top locations are selected, the system must organize them into the travel days.
- **The Problem:** Preventing inefficient travel routes where the user has to travel back and forth across the city.
- **The Solution:** Implementing shortest-path algorithms (such as the Greedy approach). The AI will pick a starting point and find the nearest next location, aiming to group geographically close attractions into the same morning or afternoon session.

---

### 4. NEXT STEPS (PHASE 2)
- Generate a small Mock Dataset for a specific city (e.g., Da Lat or Da Nang) for testing.
- Design detailed Flowcharts for the two algorithm steps mentioned above.