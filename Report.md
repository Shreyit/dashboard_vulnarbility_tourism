# Nainital Tourism Vulnerability Dashboard

Group Assignment (Option 3: Dashboard)
Submitted by Group 8

**Dashboard link:** https://dashboard-vulnarbility-tourism.vercel.app/

## Contribution Table

| Name | Roll no. | Contribution |
|---|---|---|
| Keya Parashar | M2024BSASS014 | Indicators (minor) |
| Shikhar Srivastava | M2024BSASS026 | Indicators (major) |
| Shreyit Sinha | M2024BSASS027 | Analysis, Indicators, Dashboard |
| Yeshashwini Kavikondala | M2024BSASS033 | Report |

## Objective

Nainital is a lake town in the Kumaon hills of Uttarakhand that receives far more tourists than its roads, water supply and waste systems were built for. On the worst peak season weekends, the number of vehicles entering the town is close to 16.7 times the actual road capacity. Instead of talking about this problem in general terms, this project turns real field survey data collected in Nainital into a single measurable score: the Tourism Vulnerability Index (TVI).

The dashboard scores tourism vulnerability across six areas: water stress, waste and sanitation pressure, infrastructure and mobility adequacy, economic dependency and livelihood precarity, socio-cultural pressure on the host community, and visitor experience quality. By putting these six areas on a common 0 to 100 scale, the dashboard makes the pressure of tourism visible and comparable across zones and across the different groups of people who experience it, rather than relying on anecdotal impressions.

## Data Used

Five field surveys were collected: Residents, Enterprises, Workers, Tourists, and a site level infrastructure audit of each zone (called "Location"). Together these cover 1,029 responses across 9 geotagged zones around the lake. Every raw answer from these surveys is converted into a 0 to 1 score, with the direction always fixed so that a higher number means more stress or pressure. These scores are then combined into the six pillars described above, and the six pillars are combined into the final TVI.

## How the Index is Built

We did not copy an existing published "Tourism Vulnerability Index" from a research paper. We built our own composite index, following the method described in the OECD and Joint Research Centre (JRC) Handbook on Constructing Composite Indicators (2008), which is the standard reference for this kind of work. The steps are:

1. Normalise each raw survey answer to a 0 to 1 scale (min-max scaling, with the most extreme 1 percent of values clipped first so outliers do not distort the scale).
2. Align the direction of every indicator so that 1 always means more stress and 0 always means less stress.
3. Group indicators into six pillars.
4. Combine the six pillars using a weighted average into the final 0 to 100 TVI score, calculated both town wide and separately for each of the 9 zones.

The weights are kept in a separate configuration file rather than hard coded into the program, so they can be adjusted later without changing the underlying logic. By default all six pillars are weighted equally.

We also looked at other established frameworks to decide what to measure and how to read the results, without directly copying their formulas. These include the UNWTO and European Parliament definition of overtourism, the ESPON carrying capacity methodology, and the GSTC Destination Criteria, all of which helped decide which questions belong in which pillar. The Triple Bottom Line framework (Elkington, 1997) is used to regroup the six pillars into an Economic, Environmental and Social view for each stakeholder group. Doxey's Irridex (1975) is used to read the gap between how satisfied tourists are and how residents actually feel. Social Exchange Theory (Ap, 1992) is used to test whether residents who benefit financially from tourism report less irritation at its pressure than residents who do not.

## The Six Pillars and What They Are Built From

| Pillar | What it captures | Example indicators used | Direction |
|---|---|---|---|
| Water Stress Index (WSI) | Pressure on water supply | Water shortages during peak season, dependence on tanker water, no rainwater harvesting, hours of piped water supply per day, water access seen as worse than hotels get | Higher = more stress |
| Waste and Sanitation Pressure Index (WSPI) | Pressure on waste and sewage systems | Poor waste segregation by enterprises, sewage overflow in peak season, low dustbins and toilets per zone, tourists rating cleanliness poorly | Higher = more pressure |
| Infrastructure Adequacy Index (IAI) | Quality of physical infrastructure | Footpaths, parking, street lighting, public toilets, ambulance response time, ease of navigation and signage for tourists | Higher = better (reversed before combining into the TVI) |
| Economic Dependency and Precarity Index (EDPI) | How exposed livelihoods are to tourism income | Share of income from tourism, months without work, no health insurance, no other source of household income, non-local hiring by enterprises | Higher = more precarious |
| Socio-Cultural Pressure Index (SCPI) | Pressure felt by the host community | Avoiding crowded areas, difficulty travelling in peak season, price inflation, noise increase, feeling tourism brought no real benefit | Higher = more pressure |
| Visitor Experience Index (VEI) | Quality of the tourist experience | Overall satisfaction, cleanliness rating, ease of navigation, signage sufficiency | Higher = better (reversed before combining into the TVI) |

The final TVI is a weighted combination of all six pillars, scaled from 0 to 100, where a higher number means the town is more vulnerable to tourism pressure.

## How the Dashboard is Organised

Rather than showing six separate, disconnected pages of numbers, the dashboard tells one story. It starts with a Big Picture page showing the town wide TVI and the six pillars. From there it walks through each group affected by tourism in turn:

- **Tourists**, the demand side: how much pressure they feel and how much pressure they create, including how little many of them actually spend in the local economy.
- **Enterprises**, the supply side: water and waste constraints on running a business, and how much of the employment they generate stays local.
- **Locals** (Residents), the only group tied to specific locations. This is the one tab with a map, and it can be switched between average scores per zone and the actual surveyed location of each resident's household.
- **Workers**, tourism linked labour such as guides, boatmen, drivers and hospitality staff. This is honestly the group we have the least data on. No question in the survey asked workers about environmental conditions, so that part of their profile is left blank instead of being filled in with a guess.

Each group's page ends by scoring that group on the Triple Bottom Line: Economic, Environmental and Social pressure. A final Synthesis page brings all four groups together, comparing their scores side by side and overlaying them on one chart. For Residents and Workers, where the survey data allows a fair comparison, we also test whether people who depend on tourism for income report more or less pressure than people who do not, using a Mann-Whitney U test.

## Other Analysis Built on Top of the Six Pillars

A few extra views reuse the same six pillar scores without introducing new raw calculations:

- **Sustainability Triad**: the six pillars regrouped into Economic, Environmental and Social scores, based on the Triple Bottom Line framework.
- **Stakeholder Pressure Comparison**: which respondent group feels the most pressure on which pillar, using the same indicator groupings.
- **Seasonality Amplification**: an average of five peak season indicators (water constraint stress, cost pressure, travel difficulty, sewage overflow, and months without work), showing how much worse things get during peak season based on what respondents actually reported, not a hypothetical scenario.
- **Host-Visitor Perception Gap**: the difference between tourist satisfaction and resident sentiment, read using Doxey's Irridex stages (Euphoria, Apathy, Irritation, Antagonism).

We also built a second, separate framework in the backend based on the Exposure, Sensitivity and Adaptive Capacity structure used in Himalayan tourism vulnerability research. This reuses our own survey data rather than the original study's indicators, and works as a cross-check on the main TVI rather than a replacement for it. It is not currently shown as its own page on the dashboard.

## What We Made Sure Of

Every number on the dashboard traces back to a specific survey question, and every external threshold used for comparison is cited to a real source such as UNWTO, Sphere or GSTC. Where data is genuinely missing, such as the Environmental score for Workers, the dashboard shows it as blank rather than filling in a fabricated zero. The dashboard also includes a small chat assistant, PahadiBot, which answers questions about the dashboard's own computed numbers, such as which zone is most vulnerable. It never has access to raw individual survey responses, only the aggregated scores already shown on the dashboard.

## Conclusion

This dashboard is meant to work less like a static report and more like an instrument. It lets someone look, zone by zone and group by group, at exactly where tourism in Nainital is creating value and where it is creating strain, and for whom.

## References

Ap, J. (1992). Residents' perceptions research on the social exchange theory. *Annals of Tourism Research, 19*(4), 665-690.

Doxey, G. V. (1975). A causation theory of visitor-resident irritants: Methodology and research inferences. In *Proceedings of the Travel Research Association sixth annual conference* (pp. 195-198). Travel Research Association.

Elkington, J. (1997). *Cannibals with forks: The triple bottom line of 21st century business*. Capstone Publishing.

ESPON. (n.d.). *Carrying capacity methodology for tourism: Targeted analysis*. https://archive.espon.eu/sites/default/files/attachments/Tourism_methodology-handbook.pdf

Global Sustainable Tourism Council. (2019). *GSTC destination criteria* (Version 2.0). https://www.gstc.org/wp-content/uploads/GSTC-Destination-Criteria-v2.0.pdf

OECD, & Joint Research Centre. (2008). *Handbook on constructing composite indicators: Methodology and user guide*. OECD Publishing. https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf

Sphere Association. (2018). *The Sphere handbook: Humanitarian charter and minimum standards in humanitarian response* (4th ed.).

Uttarakhand tourism vulnerability assessment using an Exposure-Sensitivity-Adaptive Capacity framework, Shimla district case study. (n.d.). In *Assessing and mapping tourism vulnerability using remote sensing*. Springer. https://link.springer.com/chapter/10.1007/978-981-95-0156-4_11

World Tourism Organization. (2018). *'Overtourism'? Understanding and managing urban tourism growth beyond perceptions*. UNWTO. https://www.e-unwto.org/doi/pdf/10.18111/9789284420070

*Note. The Shimla district chapter's individual author names were not captured in this project's own source notes (RESEARCH_BENCHMARKS.md), only its title, publisher, and link. Please confirm the author names from the original Springer chapter page before final submission, since APA 7 requires them as the entry's first element.*
