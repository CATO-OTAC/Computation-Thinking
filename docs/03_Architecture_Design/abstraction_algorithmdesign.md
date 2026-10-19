## ALGORITHM DESIGN

**Part 1: User has clearly destination**

Step 1: Collect user information like: destination, budget, duration, (alone/ couple/ friends/ family), and (homestay/ hotel)

Step 2: Find and check if some unusual data (100.000 VND for 7 days?...) and require user to input again (if need)

Step 3: Filter places matching constraints (budget, duration, companion,..) and apply sorting alogorithm to arrange and optimize the plan 

Step 4: Generate day-by-day itinerary to user 

Step 5: Recommend some other check-in places, local foods nearby his/her accomodation to user if he/she has downtime

**Part 2: Rely on tag/ vibe-based recommendation**

Step 1: Collect user vibe-based (cool, natural, vibrant, ... )

Step 2: Pattern matching with user's vibe

Step 3: Suggest top 5 destinations meet with user's vibe and provide some small description

Step 4: After he/ she pick a destination, **fallback to part 1**

---

## ABSTRACTION

-Extract keywords from user's text and matching with necessary information from `User's destination` to `Places`

**A. User's destination**

1. Destination (string): target location (e.g "Da Lat") or NULL if doesn't have specific target

2. Budget (double): total money that can spend to travel 

3. Duration (int): total days that can stay 

4. Vibes (list of strings): (e.g ['Cool', 'Natural', 'Trending'..])

5. Companion type (string): (e.g ['Solo', 'Couple', 'Friends', 'Family', 'Business trip'])

6. Accomodation (string): (e.g ['Homestay', 'Hotel', 'Resort'])


**B. Places**

1. Name of the place (string): official name of the location (e.g "Langbiang Land")

2. Vibes (list of strings): (e.g ['Cool', 'Natural', 'Trending'..])

3. The average cost, ticket to travel (double): Average expenditure per person (entry tickets, foods, or room rates)

4. Location of the place (string): Address or coordinates used to calculate distances between spots

