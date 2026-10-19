# **1. Identifying Real-World Problems** 

Nowadays, when planning a trip, users often have to search for and compile information from multiple sources, such as Google Maps, transportation booking websites, hotel booking platforms, destination reviews, and weather forecasts. This process leads to several problems: 

Problem 1: Difficulty Finding Destinations That Match Personal Preferences 

Users may find numerous tourist destinations but struggle to determine which ones best suit their preferences, group size, travel duration, and trip objectives. For example, people who enjoy adventure and exploration have different travel needs from those who prefer relaxation or family-friendly activities. 

Problem 2: Difficulty Managing the Travel Budget 

Transportation, accommodation, food, and sightseeing expenses are often researched separately. Users may find individual services at reasonable prices, but the total cost of the trip can still exceed their budget. 

Problem 3: Poorly Connected Itineraries That Waste Time and Money 

Tourist attractions, restaurants, and accommodations may be located far from one another. Without proper planning, users may have to travel back and forth frequently, resulting in additional expenses and insufficient time to fully enjoy their experiences. 

Problem 4: Insufficient Preparation for Actual Conditions at the Destination 

Users may not be familiar with the weather, terrain, or specific characteristics of their intended destinations. For instance, watching clouds form in the early morning requires appropriate clothing for low temperatures, while hiking in forests requires consideration of insects, terrain conditions, and essential equipment. 

Problem 5: Difficulty Evaluating and Choosing Between Different Travel Options 

Users often have to compare multiple routes, transportation methods, hotels, and activities on their own. A cheaper option may require more travel time, while an itinerary covering many destinations may not be suitable for those who prefer a relaxing trip. 

Problem 6: Lack of Transparency and Personalization in Travel Recommendations 

Existing lists of destinations and pre-designed itineraries often fail to explain why they are suitable for particular users. As a result, users may find it difficult to determine whether a recommendation genuinely meets their requirements or simply features popular tourist destinations. 

Based on these problems, our team proposes developing a personalized virtual travel assistant website to support users in planning their trips. Users can provide information about their desired destination, departure location, travel dates, group size, budget, preferences, and other specific requirements. 

The system will analyze the input data and retrieve relevant travel information from multiple sources. It will then generate several itinerary options, compare their advantages and disadvantages, and explain how well each option satisfies the user's requirements. This approach aims to help users make informed travel decisions and create itineraries that are personalized, practical, and aligned with their budgets and preferences. 

# **2. Proposing Multiple Solutions for Each Problem** 

The key point is that each problem does not necessarily have only one solution. The virtual assistant should consider different approaches depending on the situation and then select the most suitable solution based on the user's needs. 

**Problem 1: Difficulty Finding Destinations That Match Personal Preferences** 

**Example input:** The user wants to visit Da Lat for 3 days and 2 nights with a group of 4 people. They enjoy nature and experiential activities but prefer to avoid overcrowded places. 

|**Solution**|**Approach**|**Suitability**|
|---|---|---|
|A. Filter by mandatory<br>constraints|Eliminate destinations that do not meet<br>requirements regarding time, distance, or<br>accessibility.|When the user has specific<br>requirements that cannot<br>be violated.|
|B. Score destinations<br>based on preferences|Assign scores to destinations according to<br>their suitability for nature, experiential<br>activities, crowd levels, and other<br>preferences.|When multiple destinations<br>satisfy the mandatory<br>constraints.|
|C. Recommend a<br>combination of<br>activity types|Combine cloud hunting, nature sightseeing,<br>local experiences, and relaxation.|When the user wants a<br>diverse travel experience.|
|D. Suggest alternative<br>destinations|If the preferred destination is unsuitable due<br>to weather conditions or excessive travel<br>distance, find similar alternatives.|When the initial option is<br>not feasible.|



**Optimal solution:** Combine A + B + D. First, eliminate destinations that do not meet mandatory requirements. Then, rank the remaining destinations based on the user's preferences and prepare alternative options when necessary. 

**Problem 2: Difficulty Managing the Total Travel Budget** 

|**Solution**|**Approach**|**Trade-offs**|
|---|---|---|
|A. Choose the<br>cheapest options|Prioritize low-cost transportation,<br>accommodation, and activities.|Saves money but may reduce comfort.|
|B. Allocate the budget<br>by category|Divide the budget among transportation,<br>accommodation, food, sightseeing, and<br>contingency expenses.|Maintains an overall balance<br>and prevents overspending in<br>one category.|
|C. Optimize spending<br>based on experience<br>value|Preserve activities the user enjoys while<br>reducing costs in less important categories.|Provides a more suitable<br>experience but requires clear<br>priorities.|
|D. Create multiple<br>budget scenarios|Offer budget-friendly, balanced, and<br>comfort-oriented itineraries for<br>comparison.|Provides more choices but<br>requires calculations for<br>multiple alternatives.|



**Optimal solution:** Combine B + C, while using D when the user has not clearly defined their priorities. The system must treat the maximum budget as a constraint when evaluating options rather than simply selecting individual services with low prices. 

For example, if the user particularly enjoys cloud hunting but does not consider luxury accommodation essential, the system should prioritize keeping the cloud-hunting experience while finding affordable accommodation. 

If no option satisfies all requirements within the budget, the system must clearly inform the user and suggest possible adjustments for them to choose from, rather than exceeding the budget without permission. 

**Problem 3: Poorly Connected Itineraries That Waste Time and Money** 

**Example:** The user wants to visit six destinations, eat at local restaurants, and have sufficient time to rest over two days. 

|**Solution**|**Approach**|**Suitability**|
|---|---|---|
|A. Arrange destinations by proximity|Prioritize the next destination that is closest to the current location.|When minimizing travel distance is important.|
|B. Group destinations by area|Divide attractions into geographical<br>f clusters and assign them to different<br>days.|When destinations are spread across several areas.|
|C. Arrange activities according to operating<br>hours|Consider openinghours,visit urations, and suitable time slots.|When certain destinations are only available during specific<br>hours.|
|D. Balance activities and<br>relaxation|Limit the number of activities per day<br>and allocate sufficient time for meals<br>and rest.|When the user does not want<br>an overly packed itinerary.|



**Optimal solution:** Combine B + C + D, then use A to determine an efficient travel order within each area. The system should not simply select the nearest destination, as this could result in conflicts with opening hours or repeated trips to the same area. Effective optimization must consider location, time, and user preferences simultaneously. 

**Problem 4: Insufficient Preparation for Actual Conditions at the Destination** 

**Example:** The user plans to go cloud hunting early in the morning or visit a forested area. 

|**Solution**|**Approach**|**Suitability**|
|---|---|---|
|A. Provide recommendations<br>based on destination<br>characteristics|Use information about terrain, activities,<br>and typical conditions to suggest<br>necessary items.|When basic<br>preparation is needed.|
|B. Provide recommendations<br>based on weather forecasts|Adjust clothing recommendations,<br>itineraries, and activities according to the<br>forecast for the travel dates.|When the trip depends<br>heavily on weather<br>conditions.|
|C. Provide risk-based warnings|Warn users about heavy rain, slippery<br>roads, difficult terrain, or potentially<br>unsafe activities.|When unfavorable<br>conditions may occur.|
|D. Suggest alternative<br>activities|Replace outdoor activities with indoor<br>alternatives when the weather is<br>unsuitable.|When the original plan<br>may not be feasible.|



**Optimal solution:** Combine A + B + C + D. The system should not only provide a packing checklist but also adjust the plan when actual conditions change. 

For example, if rain is forecast during the planned cloud-hunting period, the system should explain the potential impact, recommend checking the forecast closer to the departure date, and suggest alternative activities. It should not guarantee that users will see clouds simply because a destination is well known for this activity. 

**Problem 5: Difficulty Comparing Different Transportation, Accommodation, and Dining Options** 

**Example:** The user is traveling from Ho Chi Minh City to Da Lat and is deciding between taking a coach and using a private vehicle. 

|**Solution**|**Approach**|**Priority**|
|---|---|---|
|A. Optimize for cost|Compare the total cost for the entire group.|Users with limited budgets.|
|B. Optimize for time|Compare travel time and waiting time.|Users with limited vacation time.|
|C. Optimize for comfort|Consider rest requirements, group size,luggage, and driving ability.|Families or groups seeking convenient transportation.|
|D. Optimize for flexibility|Consider the ability to change destinations, departure times, and routes independently.|Users who enjoy exploring multiple places.|

**Optimal solution:** The system should not apply a single criterion to every user. Instead, it should assign scores based on the priority weights provided by the user. 

For example, if the user prioritizes saving money, cost should receive a higher weight. If the user is traveling with elderly people, comfort and sufficient rest time may be more important. 

For the same destination, the system can provide two or three alternative options, clearly presenting estimated costs, travel times, and trade-offs so that users can make informed decisions. 

**Problem 6: Lack of Transparency and Personalization in Recommendations** 

**Example:** The system recommends a restaurant and a tourist attraction. 

|**Solution**|**Approach**|**Priority**|
|---|---|---|
|A. Explain recommendations based on individual requirements|Clarify how each destination matches the user's preferences,<br> budget, or location requirements.|Helps users understand why<br>a recommendation was made.|
|B. Provide information<br>sources|Attach sources for prices, maps,<br>weather forecasts, and destination<br>information.|Allows users to verify the<br>accuracy of the information.|
|C. Identify unmet<br>requirements|Clearly explain which requirements a<br>destination satisfies and where it<br>has limitations.|Prevents exaggerated claims<br>and unrealistic expectations.|
|D. Allow feedback and<br>adjustments|Let users request cheaper options,<br>less walking, or alternative restaurants.|Makes the itinerary<br>increasingly suitable for the user's needs.|

**Optimal solution:** Combine all four approaches. Each recommendation should identify the relevant user requirements, explain the reasons for the selection, provide supporting information sources, and disclose any limitations. When the user changes their requirements, the system should recalculate the affected parts of the itinerary. 

# **Selected Overall Solution** 

Based on the analysis above, our team selects an integrated solution that combines constraint filtering, suitability scoring, itinerary optimization, budget management, and explainable recommendations. 

**Proposed workflow:** 

1. **Collect user information:** Destination, travel dates, group size, budget, preferences, and special requirements. 

2. **Analyze and classify requirements:** Distinguish mandatory constraints from preference-based criteria. 

3. **Collect and evaluate data:** Gather information about destinations, service prices, maps, weather forecasts, and operating hours. 

4. **Generate and compare alternatives:** Create budget-friendly, balanced, and experience-oriented itineraries. 

5. **Check feasibility:** Evaluate the budget, routes, available time, and actual conditions. 

6. **Present results and explanations:** Provide the itinerary, estimated costs, reasons for recommendations, reference sources, and important notes. 

The virtual assistant should be capable of answering the following questions: 

- Which destinations best match the group's needs? 

- What transportation options provide the best balance between cost and time? 

- How should the itinerary be arranged to minimize unnecessary travel? 

- What should be changed if the budget is exceeded or the weather is unfavorable? 

- Why does the system select one option over the alternatives? 

