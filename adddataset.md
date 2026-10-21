### 4.3.2. Dataset Direction: Building the Tourism Database

#### A. Data Sources and Collection

The proposed travel planning assistant requires tourism data collected from multiple sources to support destination recommendation, budget management, and itinerary generation. Following our presentation, the team plans to build the tourism database using two primary sources: Google Maps Platform API and web scraping.

**1. Google Maps Platform API**

The Google Maps Platform API will be considered a primary source for geographic and place-related information. Depending on the selected API and the fields available through it, the system may obtain information such as place names, coordinates, addresses, and place categories.

This information supports the identification of tourist attractions and provides geographic data for itinerary planning. If the scheduling algorithm uses travel time rather than straight-line distance, an appropriate routing service or another documented estimation method will also be required.

**2. Web Scraping**

Web scraping will be explored to collect additional tourism information that may not be available through the selected mapping API. Potential information includes estimated entrance fees, attraction descriptions, category information, and recommended visit durations.

The team will prioritize official attraction websites and reliable tourism sources. Data will only be extracted when permitted by the relevant website terms and access restrictions. If automated extraction is unavailable or inappropriate, the team may collect the information manually from permitted sources.

Because information from different websites may use inconsistent formats or may not be up to date, collected data will be checked before being added to the database. The system will retain source references for important information so that values can be reviewed when necessary.

#### B. AI-Based Data Processing

Raw information collected from APIs and web pages may contain unstructured descriptions, inconsistent formats, and different representations of the same information. As described in our presentation, an AI model is proposed to process this raw information and transform it into structured fields that can be used by the recommendation and itinerary-generation algorithms.

The initial dataset will focus on four core attributes:

1. **Coordinates (latitude and longitude):** Used to identify the geographic location of each attraction and support location-based calculations.
2. **Estimated Cost:** Used to estimate attraction expenses and support budget control.
3. **Category Tags:** Used to classify attractions and match them with users’ preferred travel styles or activities.
4. **Average Visit Duration:** Used to estimate the time needed for each attraction and construct daily schedules.

These four attributes represent the main data fields highlighted in the presentation. The implementation-ready dataset may include additional fields, such as place names, operating hours, and source references, to support data identification and schedule validation.

The AI model will assist with extracting, classifying, and normalizing information from the collected sources. However, AI-generated values will not automatically be treated as verified facts. Important information, particularly costs, coordinates, and operating hours, must be checked against available sources. Missing or uncertain values will be marked for further verification rather than filled with unsupported estimates.

#### C. Dataset Structure

For the initial prototype, each point of interest (POI) will be stored as a structured record. The proposed schema is designed to support the requirements of the project’s recommendation, budget-control, and scheduling algorithms.

| Attribute | Description | Purpose |
|---|---|---|
| POI ID | Unique identifier for each attraction | Identifies each record |
| POI Name | Name of the attraction | Displays and identifies the destination |
| Coordinates | Latitude and longitude | Supports geographic calculations |
| Estimated Cost | Estimated entrance fee or activity cost | Supports budget estimation |
| Cost Basis | Cost per person, ticket, group, or other unit, when known | Prevents inconsistent cost calculations |
| Category Tags | Categories and vibe-related labels | Supports preference matching |
| Operating Hours | Opening and closing times, when available | Supports schedule feasibility |
| Average Visit Duration | Estimated visit time in minutes | Supports daily itinerary generation |
| Source Reference | URL or identifier of the information source | Supports traceability |
| Last Verified | Date when the information was last checked | Supports data freshness monitoring |

The four core attributes from the presentation form the foundation of the dataset, while the additional fields provide the information needed to use and maintain the records more reliably.

#### D. Data Cleaning and Quality Control

Before the dataset is used by the algorithms, the team will apply basic data-quality checks.

- **Completeness:** Identify missing values in fields required for a particular algorithm.
- **Validity:** Check whether coordinates, costs, and visit durations use acceptable formats and values.
- **Consistency:** Standardize cost units, category tags, and time representations.
- **Deduplication:** Identify repeated records referring to the same attraction.
- **Source verification:** Review important information against its recorded source when possible.
- **Freshness:** Record when information was last checked, especially for costs and operating hours that may change over time.

If a value cannot be verified, it will be marked as unknown or estimated, depending on the available evidence. The system should not present uncertain information as confirmed. Records missing essential information may be excluded from specific calculations until the required fields are available.

#### E. Initial Dataset Construction

The team plans to construct an initial dataset of approximately 30–50 points of interest in Da Lat as a manageable test case for the prototype.

The dataset will be stored in a structured format, such as JSON or CSV, so that the recommendation and itinerary-generation modules can process it consistently. The initial records will be used to test preference matching, estimated attraction costs, geographic planning, and daily scheduling.

The team will evaluate whether the collected data are sufficiently complete and consistent for these tasks. The results will help identify missing fields, unreliable values, and areas requiring improvement before expanding the database to additional destinations.

This staged approach allows the team to develop and test the core functionality with a limited dataset before considering larger-scale data collection.