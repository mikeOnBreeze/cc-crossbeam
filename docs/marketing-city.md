# CrossBeam — City-Side Market Research & Economics

> **Last updated:** February 12, 2026
> **Purpose:** Understanding how cities make money on permits, how third-party plan review consultants work, and where CrossBeam fits on the city side.

---

## How Cities Make Money on Permits

Cities don't just *process* building permits — they run building departments as **revenue centers**. The fees you pay for a permit are designed to cover (and often slightly exceed) the city's cost of reviewing your plans and inspecting your work.

Here's the basic equation:

```
PERMIT FEE REVENUE ≥ STAFF COST + CONSULTANT COST + OVERHEAD
```

When a city can process permits efficiently, this equation is healthy. When correction cycles pile up, the equation breaks — the city spends more reviewing your plans than they collected in fees.

---

## The Third-Party Consultant Model

### Why Cities Outsource Plan Review

Most California cities don't have enough in-house plan checkers. The staffing crisis is severe:

- Building inspectors require **5+ years** of journeyman-level experience
- Government salaries can't compete with private sector ($80-100K city vs. $120-150K private)
- County vacancy rates run **up to 30%** (UC Berkeley Labor Center)
- Time to hire a government building inspector: **6+ months**
- Plan examiners are aging out — many are 55+ with no pipeline behind them

So cities contract with third-party consulting firms who employ large rosters of plan reviewers across many jurisdictions simultaneously.

### The Big Three Consultants

Three companies dominate California's outsourced building department market:

| Firm | Headquarters | Known City Clients |
|------|-------------|-------------------|
| **CSG Consultants** | San Mateo, CA | Huntington Beach, Long Beach, Alameda, South San Francisco, Culver City, Stanislaus County |
| **Bureau Veritas** | multiple offices | Redondo Beach, Long Beach, Culver City, Emeryville, and many others |
| **West Coast Code Consultants (WC3)** | Pleasanton, CA | Huntington Beach, South San Francisco, Emeryville, CA Energy Commission |

Other firms include 4Leaf, Inc., Willdan Group, and Interwest Consulting Group. But CSG, Bureau Veritas, and WC3 appear on the majority of Southern and Northern California city contracts.

**Important for CrossBeam:** These consultants apply CBC/CRC consistently across jurisdictions. That means correction patterns are similar city-to-city. The same reviewer at CSG might check plans for Huntington Beach on Monday and Alameda on Wednesday — using the same checklist and the same code knowledge. This is why our AI corrections model can generalize.

### How Consultants Bill Cities

Consultants bill cities using **hourly rates against a not-to-exceed contract ceiling**:

| Staff Level | Typical Hourly Rate |
|---|---|
| Principal / Senior Engineer | $185 – $200/hr |
| Senior Consultant / Plan Checker | $150 – $175/hr |
| Engineer / Junior Plan Checker | $135 – $145/hr |
| Inspector (field) | $120 – $145/hr |

The city negotiates a contract amount that sets the spending ceiling. Example contracts from public records:

| City | Consultant | Contract Amount | Term | Avg Annual Spend |
|------|-----------|----------------|------|-----------------|
| **Huntington Beach** | CSG Consultants | $480,000 | 3-year (amended 2025) | ~$160K/yr |
| **Huntington Beach** | WC3 | $364,000 | Multi-year (2021) | ~$120K/yr |
| **South San Francisco** | CSG | $300,000/yr | 2 years + 2 renewal | $300K/yr |
| **South San Francisco** | WC3 | $300,000/yr | 2 years + 2 renewal | $300K/yr |
| **Alameda** | CSG | $2,100,000 total | Multi-year | ~$350K/yr |
| **Redondo Beach** | Bureau Veritas | $387,362 total | Through 2027 | ~$80K/yr |
| **Emeryville** | WC3 | $3,694,526 total | Multi-year | ~$500K+/yr |
| **Stanislaus County** | CSG | $1,250,000 | 5 years | ~$97K/yr (actual) |
| **Long Beach** | CSG + Bureau Veritas | Up to $3,500,000/yr | Annual | $3.5M/yr |

**Key insight:** Huntington Beach spends roughly **$250,000-$300,000/year** on outsourced plan review and inspection across CSG + WC3. That's real, public, verifiable money.

---

## Case Study: Huntington Beach ADU Permit Economics

### What a Homeowner Pays

Let's walk through a real ADU permit. A **500 sq ft detached ADU** in Huntington Beach, valued at ~$120,000 (using $240/sq ft construction valuation):

| Fee | Calculation | Amount |
|-----|-------------|--------|
| Building Inspection Fee | $1,339 (first $100K) + $6.50 × 20 | **$1,469** |
| Plan Review Fee | 61% of inspection fee | **$896** |
| Permit Processing | Flat fee | **$40** |
| 6% Automation Fee | On all fees | **$144** |
| **Total Permit Cost** | | **~$2,549** |

The homeowner writes one check for ~$2,549. That's the "retail price" of getting their ADU plans reviewed and permitted.

### Where That Money Goes

Now here's the internal economics the homeowner never sees:

```
HOMEOWNER PAYS:  $2,549

CITY ALLOCATES:
  ├── Plan Review Fee ($896)
  │     ├── To Consultant (WC3/CSG): ~$525-$700  (3-4 hrs @ $150-$175/hr)
  │     └── City Keeps: ~$200-$370  (admin overhead, intake staff, filing)
  │
  ├── Inspection Fee ($1,469)
  │     ├── To Consultant (inspections): ~$400-$600  (3-4 field visits @ ~$135/hr)
  │     └── City Keeps: ~$870-$1,070  (scheduling, records, overhead)
  │
  └── Processing + Automation ($184)
        └── City Keeps: $184  (tech systems, counter staff)
```

**On a clean permit with no corrections, the city's math works.** They collect ~$2,549, pay out ~$925-$1,300 to consultants, and keep ~$1,250-$1,625 for their own staff and overhead. Healthy margin.

### What Happens When Corrections Hit

Here's where it breaks down. Huntington Beach's fee schedule includes a set number of plan reviews:

| Project Valuation | Reviews Included in Fee | Extra Reviews Charge |
|---|---|---|
| Under $100,000 | **2 reviews** (initial + 1 correction) | $162/hour each additional |
| $100,000 – $1,000,000 | **3 reviews** (initial + 2 corrections) | $162/hour each additional |
| Over $1,000,000 | **4 reviews** (initial + 3 corrections) | $162/hour each additional |

Our $120K ADU gets **3 reviews included**. But the consultant bills the city hourly for every review cycle — whether or not the city charges the homeowner extra.

Here's what each correction cycle actually costs:

```
CORRECTION ROUND 1 (included in fee — homeowner pays $0 extra):
  Consultant re-reviews plans:  2-3 hours × $150-$175/hr = $300-$525
  City staff processes resubmittal:  ~$50-$100
  TOTAL CITY COST:  $350-$625
  CITY RECOVERS:  $0
  NET TO CITY:  -$350 to -$625

CORRECTION ROUND 2 (still included for >$100K — homeowner pays $0 extra):
  Consultant re-reviews:  2-3 hours × $150-$175/hr = $300-$525
  City staff:  ~$50-$100
  TOTAL CITY COST:  $350-$625
  CITY RECOVERS:  $0
  NET TO CITY:  -$350 to -$625

CORRECTION ROUND 3+ (extra charge kicks in — $162/hr):
  Consultant re-reviews:  2-3 hours × $150-$175/hr = $300-$525
  City charges homeowner:  2-3 hours × $162/hr = $324-$486
  NET TO CITY:  roughly breakeven (slight loss on overhead)
```

**Every correction cycle that's included in the original fee is a pure cost to the city.** The city is paying the consultant $300-$625 per cycle and recovering $0 from the homeowner.

---

## The Correction Tax: Annual Cost to a City

### Building the Model

Let's estimate what Huntington Beach spends annually on correction-related re-reviews.

**ADU permit volume estimate:**
- California issued ~24,000-27,000 ADU permits statewide in 2022-2023
- Huntington Beach (pop. ~200,000) is a mid-size Orange County city
- Comparable city Anaheim (pop. ~350K) issued 243 ADU permits in 2023
- Conservative estimate for HB: **60-100 ADU permits/year**
- Let's use **80** as our working number

**Correction rates (from our marketing.md research):**
- San Jose: **90%+** of ADU applications sent back for corrections
- Los Angeles: Most projects require **2-3 correction cycles**
- Sacramento: **38%** returned at least once
- San Diego County: **50%+** need more than 2 cycles
- Conservative assumption for HB: **70%** need at least 1 correction, **35%** need 2+

**The math for ADU permits alone:**

| Scenario | Permits | Correction Cost Each | Annual Cost |
|---|---|---|---|
| 70% need 1 correction round | 56 permits | $450 avg (consultant + city staff) | **$25,200** |
| 35% need 2 correction rounds | 28 permits | $450 avg | **$12,600** |
| 10% need 3+ rounds | 8 permits | $450 avg | **$3,600** |
| **Total ADU correction cost** | | | **$41,400/year** |

But ADUs are only a fraction of the building department's workload. HB also processes permits for:
- Kitchen/bath remodels
- Room additions
- Solar installations
- Re-roofs
- Commercial tenant improvements
- New construction

**Total residential + commercial plan review volume:** A city HB's size likely processes **800-1,200 building permits/year** (CALBO data: 235 permits per staff member). If correction rates are similar across project types:

| Metric | Estimate |
|---|---|
| Total building permits/year | ~1,000 |
| Permits needing 1+ correction rounds | ~600 (60%) |
| Permits needing 2+ correction rounds | ~250 (25%) |
| Average consultant cost per correction round | ~$400 |
| **Total annual correction re-review cost** | **$340,000** |

**Compare that to HB's total consultant spend: ~$250,000-$300,000/year.** This means correction cycles may represent **over 100% of the base plan review cost** — the city is effectively paying for every plan to be reviewed twice.

Put another way: the city collects enough in plan review fees to pay for the initial review. But corrections eat into (and sometimes exceed) the inspection fee revenue and overhead budget. The building department is **subsidizing sloppy submittals** out of its own budget.

---

## What CrossBeam Saves the City

### Scenario: Cut Correction Cycles in Half

If CrossBeam — either on the contractor side (better submittals) or the city side (faster AI-assisted review) — can reduce correction cycles by 50%:

| Metric | Current | With CrossBeam | Savings |
|---|---|---|---|
| Permits needing 1+ corrections | 600 | 300 | 300 fewer re-reviews |
| Permits needing 2+ corrections | 250 | 125 | 125 fewer re-reviews |
| Consultant cost on corrections | ~$340,000/yr | ~$170,000/yr | **$170,000/yr saved** |
| Plan checker hours freed up | ~2,000 hrs/yr | ~1,000 hrs freed | **1,000 hours/yr** |
| Effective throughput increase | 1,000 permits/yr | capacity for 1,250+ | **25% more permits** |

**$170,000/year in direct savings** — that's more than the salary of a full-time plan checker.

**1,000 hours of consultant time freed** — that's equivalent to adding half a full-time reviewer to the department without hiring anyone.

**25% more permit throughput** — at an average of $2,500 per permit, that's **$625,000 in additional permit fee revenue** the city can now capture because their reviewers aren't stuck re-reviewing the same plans.

### The Combined Value Proposition

| Value | Annual Amount | How |
|---|---|---|
| Direct consultant cost savings | **$170,000** | Fewer correction re-review cycles |
| Additional permit fee capacity | **$625,000** | Freed-up reviewer hours process more permits |
| Reduced re-inspection costs | **$40,000** | Fewer failed field inspections from bad plans |
| Reduced homeowner complaints/appeals | Hard to quantify | Faster turnaround = happier constituents |
| **Total annual value** | **~$835,000** | |

For a city spending $250K-$300K/year on consultant plan review, CrossBeam's value is **2-3x their entire consultant budget** when you factor in the throughput increase.

---

## The Misaligned Incentive (Our Moat)

Here's the insight that makes this a real business opportunity:

### Consultants Have Zero Incentive to Reduce Corrections

CSG, WC3, and Bureau Veritas bill **hourly**. Every correction cycle is more revenue for them. A sloppy submittal that requires 3 rounds of review is more profitable than a clean one that gets approved in 1 round.

The consultants aren't doing anything wrong — they're providing good, thorough reviews. But their business model is fundamentally **misaligned with city efficiency**:

```
CONSULTANT INCENTIVE:          CITY INCENTIVE:
More review hours = more $     Fewer review hours = more $ kept
Complex corrections = more $   Simple corrections = faster throughput
Slow turnaround = acceptable   Fast turnaround = competitive advantage
```

No consultant is going to build a tool that reduces their own billable hours. **That's our opening.**

### Cities Can't Fix This Themselves

Cities are locked into the consultant model because:
1. They can't hire enough in-house staff (staffing crisis)
2. They can't fire the consultants (who would do the reviews?)
3. They can't force contractors to submit better plans (it's a free country)
4. They can't raise fees enough to cover unlimited corrections (political backlash)

CrossBeam breaks the logjam from both sides:
- **Contractor side:** Better submittals → fewer corrections needed
- **City side:** AI-assisted review → faster initial review + fewer human hours per correction

---

## Pricing Strategy for City-Side Product

Based on the economics above, here's how to think about pricing:

| Tier | What They Get | Price Point | City ROI |
|---|---|---|---|
| **Free (Tier 1)** | State-law-only plan review assistant; basic checklist generation | $0 | Enough value to get foot in the door |
| **Standard (Tier 2)** | Full AI plan review with web-researched city rules; draft corrections letter generation | $500-$1,500/month | Saves $170K/yr → 10-28x ROI |
| **Premium (Tier 3)** | Dedicated city knowledge base; pre-built city skill; custom checklist; analytics dashboard | $2,000-$5,000/month | Saves $835K/yr → 14-35x ROI |

**The magic number:** If a city spends $300K/year on plan review consultants and CrossBeam saves them $170K of that, charging $1,000-$2,000/month ($12K-$24K/year) gives them a **7-14x ROI** and still leaves us with healthy margins.

For context, that's cheaper than one month of consultant billings. And the city doesn't need procurement approval for annual contracts under $25K in most jurisdictions.

---

## Market Sizing: California City-Side TAM

### How Many Cities Are Potential Customers?

| Segment | Count | Avg Annual Consultant Spend | Total Addressable |
|---|---|---|---|
| Large cities (>200K pop) | ~30 | $500K-$3.5M | ~$30M-$60M |
| Mid-size cities (50K-200K) | ~120 | $100K-$500K | ~$24M-$36M |
| Small cities (10K-50K) | ~200 | $50K-$200K | ~$15M-$25M |
| **Total California** | **~350** | | **~$70M-$120M** |

If we capture just the **correction-cycle waste** (estimated at 40-50% of consultant spend), the addressable market for correction-reduction tools is **$28M-$60M/year** across California alone.

At $1,500/month average across 100 city customers: **$1.8M ARR**.

### Why Start With ADUs

ADUs are the best wedge into the city market because:

1. **Highest correction rate** — 70-90% need corrections (vs ~40-50% for simpler permits)
2. **Most standardized** — State law governs 70%+ of requirements; city variations are small
3. **Highest political pressure** — HCD enforcement, $10K-$50K/month fines for non-compliance
4. **Growing volume** — 24,000+/year statewide and climbing
5. **Both sides benefit** — Contractors want faster approvals, cities want fewer corrections
6. **Pre-approved plan programs** prove the thesis — when plans are standardized, corrections drop to near-zero

If CrossBeam can prove the model on ADUs, expanding to room additions, TIs, and commercial permits is a natural extension of the same knowledge base.

---

## Key Research Sources

### Consultant Contracts (all public record via city council agendas)

- [Huntington Beach — CSG Amendment $480K (March 2025)](https://huntingtonbeach.legistar.com/LegislationDetail.aspx?GUID=C041C01D-17D0-45CD-9275-79A9DB05A761&ID=7157524)
- [Huntington Beach — WC3 $364K (April 2021)](https://huntingtonbeach.legistar.com/LegislationDetail.aspx?GUID=EAF2B906-F5FA-45D6-90F9-65C8476E0B8C&ID=4898761)
- [South San Francisco — CSG + WC3 $300K/yr each (2018)](https://ci-ssf-ca.legistar.com/ViewReport.ashx?GID=642&GUID=5BEEA3E2-D8A1-4B5D-BC20-10699F25A4E3&ID=3088216)
- [Alameda — CSG $2.1M (2023)](https://alameda.legistar.com/LegislationDetail.aspx?GUID=01DE6CF6-01BE-4207-A9C7-551D60509D8C&ID=6104805)
- [Redondo Beach — Bureau Veritas $387K (through 2027)](https://redondo.legistar.com/LegislationDetail.aspx?ID=6438561&GUID=3815E636-30FE-48A3-89E4-4D4364220431)
- [Emeryville — WC3 $3.7M (multi-year)](https://emeryville.legistar.com/ViewReport.ashx?Extra=WithText&GID=520&GUID=113A0EE2-105E-4B14-89D0-E34F4D5C6DCB&ID=6864800)

### Fee Schedules

- [Huntington Beach Building Permit Fee Schedule (effective July 2025)](https://cms3.revize.com/revize/huntingtonbeachca/Documents/Departments/Community%20Development/Building%20Inspections/Permit%20Centre/Building%20Permit%20Fee%20Schedule.pdf)
- [California Title 25, Section 20 — Permit & Plan Check Fees (baseline)](https://www.law.cornell.edu/regulations/california/25-CCR-20)

### Correction & Permit Data

- [San Jose — 90%+ ADU apps returned (Mercury News)](https://www.mercurynews.com/2025/09/05/artificial-intelligence-san-jose-permitting-process/)
- [Los Angeles — 2-3 correction cycles typical (JDJ Consulting)](https://jdj-consulting.com/how-to-read-ladbs-correction-notices-a-homeowners-guide-to-plan-check-comments/)
- [Sacramento — 38% returned (Fortune ADU)](https://www.fortuneadu.com/blogs/post/how-to-fast-track-an-adu-permit-in-sacramento-county-without-delays)
- [San Diego County — 50%+ need 2+ cycles (SD County PDS)](https://www.sandiegocounty.gov/pds/docs/pds441a.pdf)
- [California ADU permits 2022: 24,000+ statewide (Bipartisan Policy Center)](https://bipartisanpolicy.org/blog/accessory-dwelling-units-adus-in-california/)
- [Anaheim — 243 ADU permits in 2023 (HCD APR)](https://local.anaheim.net/docs_agend/questys_pub/40932/40962/40963/41091/41255/1)

### Staffing & Market Context

- [UC Berkeley Labor Center — CA Public Sector Staffing Crisis](https://laborcenter.berkeley.edu/californias-public-sector-staffing-crisis/)
- [CALBO — 235 permits per staff member average](https://www.calbo.org/post/permitting-timelines)
- [Sacramento Fire District — Consultant hourly rates $135-$200](https://www.sacfd.org/third-part-review)

---

## Case Study #2: Buena Park — The Small City That Needs This Most

### Why Buena Park Matters

Buena Park is the perfect proof-of-concept city for CrossBeam's city-side product:
- **Your buddy is the mayor** (Connor Traut, as of 2026) — a real champion who can validate the product
- **Small city, lean staff** — every efficiency gain is immediately felt
- **Massive RHNA pressure** — 3,566 new housing units required by 2029 (14% of existing housing stock)
- **ADUs are the obvious path** — with 14,474 single-family detached homes (57.8% of housing stock), ADUs are the lowest-friction way to meet RHNA goals

### City Profile

| Metric | Buena Park | Huntington Beach | Comparison |
|---|---|---|---|
| Population | ~82,600 | ~200,000 | 41% the size |
| Housing units | ~25,000 | ~80,000+ | ~31% the size |
| Single-family detached | 14,474 (57.8%) | — | Each one = potential ADU site |
| Median home value | $771,900 | ~$1.1M | Affordable for OC |
| RHNA allocation (2021-2029) | **3,566 units** | ~13,368 units | Proportionally much harder |
| Fire plan review | OCFA (outsourced) | In-house | Extra coordination layer |
| Plan submittals | **In-person only** | Electronic | More friction, more staff time |

### Building Department: Lean and Under Pressure

**Staffing (from FY 2024-25 adopted budget, Summary of Positions):**

| Position | Count |
|---|---|
| Director of Community Development | 1 |
| Building Manager / Safety Manager | 1 |
| Senior Building Inspector / Plan Checker | 1 |
| Building Inspector | 1 |
| Permit Technician | 1 |
| Senior Administrative Assistant | 1 |
| **Total building-related staff** | **~4-5 people** |

That's it. Four to five people running the entire building division for a city of 83,000. For context, Huntington Beach has roughly double the building staff.

**They're actively hiring:** Buena Park posted a job for an **Associate Plan Check Engineer** at $112,008-$135,678/year ([GovernmentJobs listing](https://www.governmentjobs.com/careers/buenapark/jobs/newprint/4658571)). The fact that they're hiring at $112K+ tells you they're desperate — they don't have enough plan check capacity in-house.

**Senior Building Inspector / Plan Checker salary:** $88,842 - $112,827/year. That's what they pay the person who actually reviews your ADU plans.

### The Revenue Picture (Verified from FY 2024-25 Adopted Budget)

Buena Park's building department is a meaningful revenue center. From the city's actual budget document:

| Revenue Line | FY 2022-23 Actual | FY 2024-25 Revised |
|---|---|---|
| Building Permits | $884,851 | **$1,200,000** |
| Electrical Permits | $104,307 | $120,000 |
| Plumbing Permits | $42,191 | $72,000 |
| Mechanical Permits | $38,559 | $72,000 |
| **Plan Checking Fees** | **$733,941** | **$827,000** |
| Engineering Fees, Inspect & Other | $141,806 | $133,000 |
| **Total Permit-Related Revenue** | **~$1,945,655** | **~$2,424,000** |

**Key number: $827,000/year in plan checking fees alone.** That's the revenue pool that funds plan review — whether done in-house or by consultants.

**Notice the growth:** Building permit revenue jumped from $885K to $1.2M (+36%) and plan checking from $734K to $827K (+13%) between FY 2022-23 and FY 2024-25. Development is ramping up. The RHNA pressure is real.

**Community Development total budget:** $4,294,170 from the General Fund (4.4% of all city expenditures). Total across all funds (including CDBG, HOME, Successor Agency): $13,030,240 — but most of that is pass-through (Successor Agency alone is $5.98M).

### Estimating Consultant Spend

Buena Park's specific plan review consultant contracts aren't as easily found on Legistar (the city uses a different agenda system — [Agenda Link](https://horizon.agendalink.app/engage/buenaparkca/agendas)). But we can estimate from budget data and comparable cities:

**Method 1: Revenue-based estimate**
- Plan checking fee revenue: $827,000/year
- With 4-5 building staff, they can't review all permits in-house
- A Senior Building Inspector/Plan Checker can review ~200-250 permits/year (CALBO data)
- If BP processes 400-600 permits/year (based on their revenue), they need overflow capacity
- Estimated consultant spend: **$200,000-$400,000/year** for outsourced plan check

**Method 2: Comparable city benchmarking**
- Stanislaus County (similar-ish volume): ~$97K/year average on CSG
- Redondo Beach (similar population ~72K): $387K total over multiple years with Bureau Veritas
- Estimated: **$80,000-$150,000/year** on base plan review, more during busy periods

**Method 3: Staffing gap analysis**
- They're hiring a Plan Check Engineer at $112-$136K/year — that's the cost of the gap they're trying to fill
- Until they hire, they're almost certainly paying a consultant $150-$175/hr to cover
- If the consultant covers 20 hrs/week: 20 × $162 avg × 52 weeks = **~$168,000/year**

**Best estimate: Buena Park spends $150,000-$300,000/year on outsourced plan review and inspection services.**

### ADU Permit Volume Estimate

| Estimation Method | ADU Permits/Year |
|---|---|
| Population ratio to Anaheim (243 permits, 350K pop) | ~57 |
| Population ratio to statewide (24,000 permits, 39M pop) | ~51 |
| Historical residential permits (45 in 2018, pre-ADU boom) | ~30-50 (ADU share of total) |
| RHNA pressure (3,566 units needed by 2029 = ~445/yr) | Need to ramp up significantly |
| **Working estimate** | **~40-60 ADU permits/year** |

### The Correction Cost Model for Buena Park

Using the same methodology as Huntington Beach, but scaled to Buena Park's size:

**For ADU permits (~50/year):**

| Scenario | Permits | Cost per Correction | Annual Cost |
|---|---|---|---|
| 70% need 1 correction | 35 | $400 avg | **$14,000** |
| 35% need 2 corrections | 18 | $400 avg | **$7,200** |
| 10% need 3+ corrections | 5 | $400 avg | **$2,000** |
| **ADU correction cost** | | | **$23,200/year** |

**For all building permits (~500/year):**

| Metric | Estimate |
|---|---|
| Total building permits/year | ~500 |
| Permits needing 1+ corrections | ~300 (60%) |
| Permits needing 2+ corrections | ~125 (25%) |
| Avg consultant cost per correction | ~$375 |
| **Total annual correction cost** | **~$160,000** |

Compare that to their estimated consultant spend of $150K-$300K/year. **Correction cycles are consuming 50-100% of their entire outsourced plan review budget.** For a small city like Buena Park, this is proportionally even more painful than Huntington Beach.

### What CrossBeam Saves Buena Park

**Scenario: Cut correction cycles by 50%**

| Metric | Current | With CrossBeam | Savings |
|---|---|---|---|
| Correction re-review costs | ~$160,000/yr | ~$80,000/yr | **$80,000/yr saved** |
| Plan checker hours freed | ~1,000 hrs/yr | ~500 hrs freed | **500 hours/yr** |
| Throughput increase | ~500 permits/yr | capacity for ~625 | **25% more permits** |
| Additional permit revenue capacity | — | ~125 more permits × $2K avg | **$250,000/yr** |

**$80,000/year in direct savings** — that's almost the salary of their Senior Building Inspector.

**500 hours freed** — for a 4-person department, that's like getting a quarter of another full-time employee.

**$250,000 in unlocked permit revenue capacity** — this is critical because Buena Park *needs* to process more permits to meet their RHNA allocation. They literally can't afford to be slow.

### The RHNA Pressure Multiplier

This is where Buena Park's story gets really compelling for the demo.

Buena Park must accommodate **3,566 new housing units** by 2029. That's ~445 units/year for 8 years. In 2018, they permitted just **45 total residential units**. They need to **10x their throughput** just to meet state requirements.

ADUs are the most realistic path because:
- 14,474 single-family lots = 14,474 potential ADU sites
- No new land needed, no major infrastructure
- State law requires ministerial (60-day) approval
- Average ADU construction: $100K-$200K (much cheaper than new MF housing)

But with only 4-5 building staff processing an estimated 40-60 ADUs/year, and correction cycles eating 50%+ of reviewer time, they'll never get there. **The math doesn't work without either hiring 5+ more staff (at $100K+ each) or dramatically reducing the review time per permit.**

CrossBeam is the dramatically cheaper option:

| Option | Annual Cost | Permits Gained |
|---|---|---|
| Hire 3 more plan checkers | $336K-$408K/yr (at $112-$136K each) | +150-200/yr |
| CrossBeam (Standard tier) | $12K-$18K/yr | +125/yr (from freed capacity) |
| CrossBeam + reduced corrections | $12K-$18K/yr | +125/yr + faster turnaround |
| **CrossBeam ROI vs. hiring** | **18-34x cheaper** | **Similar throughput gain** |

### The Demo Pitch for Mayor Traut

> "Mayor Traut, Buena Park has 3,566 housing units to deliver by 2029. Your building department has 4 people. Right now, 60% of every plan review cycle is spent on correction letters that could have been caught before submission.
>
> CrossBeam does two things: First, it helps contractors submit cleaner plans — so your reviewers see fewer corrections on day one. Second, it gives your plan checkers an AI assistant that handles the routine 60% of the review — stamps present? Codes listed? Fire rating correct for the setback? — so they focus on the engineering judgment that actually requires their expertise.
>
> The result: your department can process 25% more permits without hiring anyone. That's 125 more families housed per year. And it costs less than one month of what you're paying consultants for re-reviews.
>
> We built this specifically for cities like Buena Park — small, lean, under state pressure, and doing the right thing on housing."

### Sources

- [Buena Park FY 2024-25 Adopted Revised Budget](https://cms7files1.revize.com/buenaparkca/Document_center/City%20Departments/Finance/Adopted%20Budget/City's%20FY2024-25/Adopted%20Revised%20Budget%20FY%2024-25%20Final%20(Online%20Version).pdf) — Revenue detail pp. 15-17, Community Development pp. 83+, Summary of Positions pp. 11-13
- [SCAG 6th Cycle RHNA Allocation — Buena Park: 3,566 units](https://scag.ca.gov/sites/main/files/file-attachments/6th_cycle_final_rhna_allocation_plan_070121.pdf)
- [SCAG Local Profile — City of Buena Park (2019)](https://scag.ca.gov/sites/default/files/2024-05/buenapark_localprofile.pdf) — Housing, population, employment data
- [Census QuickFacts — Buena Park](https://www.census.gov/quickfacts/fact/table/buenaparkcitycalifornia/PST045224) — Population 82,611 (2024)
- [Buena Park Building Division](https://www.buenapark.com/city_departments/community_development/building_division/index.php)
- [Buena Park Forms & Handouts — Development Fees effective July 1, 2022](https://www.buenapark.com/city_departments/community_development/building_division/forms_and_handouts.php)
- [Associate Plan Check Engineer job posting — $112K-$136K](https://www.governmentjobs.com/careers/buenapark/jobs/newprint/4658571)
- [Senior Building Inspector/Plan Checker — $89K-$113K](https://www.governmentjobs.com/careers/buenapark/classspecs/newprint/1030512)
- [OCFA — Fire Plan Review for Buena Park](https://ocfa.org/AboutUs/Departments/CommunityRiskReductionDirectory/PlanningAndDevelopment.aspx)
- [Buena Park Housing Element — Certified Feb 2024](https://www.buenapark.com/city_departments/community_development/planning_division/2021_housing_element_update.php)
