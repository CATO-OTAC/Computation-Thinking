# CLARIFICATIONS AND REVISIONS TO PROJECT ANALYSIS, SYSTEM DESIGN, AND FEATURE SPECIFICATIONS

**Course:** CSC10014 – Computational Thinking (2026)  
**Group ID:** Group 02  
**Project:** Smart Travel Planner Assistant  

Following our MVP demonstration and feedback session with the instructor, our team thoroughly reviewed the project documentation to fix inconsistencies, align everything with the actual running application, and introduce improvements that make the product **easier to use, more visually appealing, financially transparent, and genuinely persuasive**.

---

## 1. CLARIFICATIONS AND REVISIONS TO PROJECT ANALYSIS

1. **Clarifying the Actual Data Scope of the Product:**
   * *Previous Inconsistency:* Earlier draft sections mentioned exploratory ideas that were not part of the implemented MVP, such as live automated scraping from Google Maps, suggesting a Top-5 list of cities when no destination is chosen, or storing data in a complex multi-table SQL database.
   * *Revision:* We updated the project analysis to match our actual implementation 100%: the system currently operates on a **curated, verified dataset of 64 Points of Interest (POIs)** across **Da Lat (29 POIs)** and **Nha Trang (35 POIs)**, organized into four familiar categories (*Attractions, Restaurants, Cafés, and Accommodations*). Travelers can generate itineraries for a single city or **combine both cities (Da Lat + Nha Trang)** in one seamless trip.

2. **Benchmarking Real-World Commercial Tours and Reputable Travel Websites:**
   * *Addition:* Acting on the instructor's recommendation, our team studied popular tour packages from commercial travel agencies (such as standard 2-day/1-night and 3-day/2-night Da Lat and Nha Trang tours) alongside the presentation style of well-known travel websites.
   * *Practical Value:* From these real-world tours, we extracted **realistic daily pacing patterns** (avoiding overcrowded schedules and always protecting time for lunch and afternoon hotel rest) as well as **realistic baseline prices** (for lodging, dining, and inter-city bus transfers). These benchmarks serve as our reference floor for budget validation and form the foundation for our **curated sample itineraries**.

3. **Shifting from "Purely Calculating Accurately" to "Vivid and Persuasive Advisory":**
   * *Revision:* Previously, our documentation focused heavily on mathematical optimization—finding the shortest route and keeping costs under budget—while overlooking the fact that travelers need to feel **excited and confident** about their trip. We therefore expanded our analysis to require **real destination photography**, **engaging short descriptions of on-site experiences**, and **persuasive explanations** that prove the trip is both fun to experience and logically planned.

---

## 2. REVISIONS TO SYSTEM DESIGN

To make the architecture easy for any reader to understand, our system is organized into **three main layers** working smoothly together:

1. **User Interface Layer (What Users See and Interact With):**
   * Consists of clean, responsive web pages that work seamlessly on both desktop and mobile devices: Home Page, Login / Register / Forgot Password pages, Personal Dashboard, Interactive Trip Planner with Map View, Evaluation Survey Page, and the Manager Admin Dashboard.
2. **Central Processing Layer (The Calculation and Advisory Brain):**
   * Receives user inputs, catches unrealistic entries, matches destinations to travel styles, splits the budget into 5 safe categories, groups nearby stops into the same day, swaps outdoor spots when rain is simulated, and writes persuasive explanations.
3. **Data Storage Layer (Where Information Is Kept):**
   * Stores the 64 verified Da Lat and Nha Trang POIs, user accounts, survey questions, and user feedback in clean, structured data files that are easy to back up and simple to expand to new provinces in the future.

**Four Key Data & Feature Design Upgrades After the Presentation:**

* **Synonym Search & Custom Vibe Proposal Box:** Instead of forcing users to guess the meaning of dry category tags, the system now includes a synonym dictionary (for example, typing *"peaceful"* or *"pine forest view"* automatically matches *Chill* and *Nature*) along with an open input box where users can propose a brand-new travel style if none of the existing options fit.
* **Destination Photographs & Short Activity Descriptions:** Every place in the dataset is enriched with a **real photograph** and a **concise introductory paragraph** highlighting its atmosphere, signature charm, and memorable activities travelers can enjoy there.
* **Separating Mandatory vs. Optional Costs with Clear Pricing Units:** The estimated cost at each stop is split into two transparent parts: **mandatory baseline expenses** (such as entrance tickets or basic meals) and **estimated optional expenses** (such as souvenirs, extra snacks, or add-on rentals), clearly labeled as **per person**, **per group**, or **per turn**.
* **Sample Itinerary Library & Locking Reviews Until After Trip Completion:** Added a library of ready-to-use sample itineraries modeled on real travel-agency tours, and implemented a date-check rule that **unlocks star ratings and reviews only after the user's trip end date has passed**.

---

## 3. COMPLETE SPECIFICATION OF ALL 12 FEATURES AND OUTPUT REQUIREMENTS (INCLUDING AESTHETICS, APPEAL, AND PERSUASIVENESS)

Below is the complete specification of all **12 features (F01 – F12)**—covering both **features upgraded based on instructor feedback** and **existing MVP features retained for stability**—along with explicit output requirements for functionality, visual aesthetics, user appeal, and persuasiveness:

### Group 1: Account & System Management

| Feature ID & Name | Status | Plain-Language How It Works | Output Requirements (Functional, Aesthetic & Persuasive) |
| :--- | :---: | :--- | :--- |
| **F01. Role-Based Login, Password Recovery & Quick Demo** | *Design retained (password recovery completed)* | Allows Travelers and Managers to log in securely (with encrypted passwords), recover forgotten passwords via email reset, and explore immediately using 1-click **"Quick Demo"** buttons. | • **Functional:** Accurate role-based login and smooth password reset.<br>• **User Experience:** Prominent 1-click Demo buttons let evaluators test both roles immediately without tedious registration. |
| **F11. Manager Analytics & POI Repository Dashboard** | *Design retained* | Displays an overview of system metrics (total POIs, average ratings, survey results) and lets Managers easily add, edit, or delete places with automatic coordinate presets by area. | • **Functional:** Accurate place updates and real-time summary metrics.<br>• **Aesthetic:** Clean, organized table with instant city and category filtering. |

### Group 2: Core Recommendation & Smart Scheduling Engine

| Feature ID & Name | Status | Plain-Language How It Works | Output Requirements (Functional, Aesthetic & Persuasive) |
| :--- | :---: | :--- | :--- |
| **F02. Descriptive Vibe Selection, Synonym Search, Custom Vibe Proposal & Input Validation** | **Revised & Expanded per Feedback** | • Replaces bare tag labels with **easy-to-read scenario descriptions**.<br>• Includes a **keyword search box** that finds synonymous or equivalent tags automatically.<br>• Provides a **custom vibe proposal box** if users cannot find a tag that fits.<br>• Automatically catches invalid dates (return date before departure) or budgets set below realistic tour floors. | • **Functional:** Accurately captures user preferences, logs custom vibe proposals, and blocks unrealistic inputs early.<br>• **Aesthetic & UX:** Intuitive description cards and instant synonym suggestions ensure users never feel stuck looking for tags. |
| **F03. Visual POI Recommendations, Descriptions & Itemized Pricing** | **Revised & Expanded per Feedback** | Scores and ranks places that best match the user's style. Each POI card displays a **real photograph**, a **short description** of on-site activities, and **separates mandatory ticket prices from optional shopping estimates** (labeled *per person / per group / per turn*). | • **Functional:** Accurate preference ranking with transparent, unit-labeled itemized pricing.<br>• **Aesthetic & Appeal:** Attractive visual cards with crisp photos and vivid descriptions help travelers picture the experience and feel excited to visit. |
| **F04. Smart 5-Bucket Hard-Ceiling Budget Allocation** | **Revised per Feedback** | Automatically divides total available funds into 5 clear buckets (*Accommodation, Transportation, Dining, Sightseeing/Activities, and Safety Contingency*), guaranteeing total mandatory costs never exceed $B_{max}$ while separating **mandatory expenses** from **optional shopping estimates**. | • **Functional:** Total mandatory spending strictly stays $\le B_{max}$.<br>• **Visual & Persuasive:** Color-coded badges and charts clearly separate *"Must-Have Expenses"* from *"Optional Shopping Estimates"*, giving users financial peace of mind. |
| **F05. Spatial Area Clustering & Balanced Daily Scheduling** | *Pacing calibrated to real tours* | Groups nearby places in the same area into the same day to prevent zigzagging across town, arranging a balanced **6-slot daily timeline** from morning to evening (with dedicated lunch and afternoon hotel rest breaks) aligned with venue opening hours. | • **Functional:** Conflict-free schedule that respects opening hours and minimizes travel distance.<br>• **User Experience:** Comfortable pacing modeled on professional tours so travelers never feel exhausted. |

### Group 3: User Experience, Sample Itineraries & Extended Utilities

| Feature ID & Name | Status | Plain-Language How It Works | Output Requirements (Functional, Aesthetic & Persuasive) |
| :--- | :---: | :--- | :--- |
| **F06. Interactive Day-by-Day Route Map** | *Design retained* | Plots the entire trip on an interactive map, giving each day its own color and numbering every stop (`1, 2, 3...`) in visiting order. | • **Functional:** Accurately displays coordinates and travel sequence.<br>• **Aesthetic & Visual:** Clean, color-coded cluster paths visually prove at a glance that the route avoids backtracking. |
| **F07. Smart Packing Checklist & "Simulate Rainy Day" Toggle** | *Design retained* | Generates a checkable packing list tailored to the destination's climate (warm layers for Da Lat, sun protection for Nha Trang) and includes a **"Simulate Rainy Day"** switch that instantly swaps outdoor stops for indoor cafés or museums. | • **Functional:** Interactive checklist and instant indoor itinerary replacement when rain is toggled.<br>• **Persuasive:** Demonstrates thoughtfulness and keeps travelers prepared for sudden weather changes. |
| **F08. Dual-Angle Persuasive Explanation Panel** | **Revised & Upgraded per Feedback** | Replaces dry technical numbers with a friendly, persuasive summary explaining two things clearly: **(1) Why this trip is exciting and memorable**, and **(2) Why the route and budget are logically optimized**. | • **Functional:** Displays distance saved via clustering, preference match %, and remaining safety reserve.<br>• **Persuasiveness:** Engaging, human-centered wording builds both emotional excitement and logical trust in the plan. |
| **F09. Live POI Swapping & Instant Budget Re-Balancing** | *Design retained* | Lets users swap out any suggested place for another option or drag a budget slider to immediately recalculate schedules and expenses without starting over. | • **Functional:** Smooth, real-time schedule and budget recalculation.<br>• **User Experience:** Gives travelers full control to personalize every detail of their trip. |
| **F10. Sample Tour Itineraries, Survey & Post-Trip Review Gate** | **Revised & Expanded per Feedback** | • Offers a **library of sample itineraries** modeled on real commercial tours for users to browse and clone.<br>• Includes a 10-question usability survey.<br>• **Enforces a date rule that unlocks star ratings only after the trip's end date has passed.** | • **Functional:** One-click tour template cloning, survey logging, and locked/unlocked review access based on trip end date.<br>• **Appeal & Trust:** Real tour templates inspire confidence, while post-trip review gating ensures authentic ratings. |
| **F12. Offline Print-Ready PDF Itinerary Export** | *Design retained* | Compiles the daily schedule, itemized mandatory/optional cost table, and packing checklist into a clean, print-ready PDF file for offline viewing on the go. | • **Functional:** Complete, well-formatted PDF export with no broken layouts.<br>• **Aesthetic:** Clean, magazine-style layout that reads like a personal travel guidebook. |