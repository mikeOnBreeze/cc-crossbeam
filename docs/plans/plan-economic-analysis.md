# Economic Analysis: Building & Maintaining the FluentGov Cascade Architecture

> **Purpose**: Detailed cost model for building, operating, and maintaining the hierarchical cascade system described in `plan-hierarchical-cascade-architecture.md`. Intended as a comparison baseline against the current live-research-only approach and against the cost of doing this work by hand.

---

## 1. What We're Costing

Three distinct cost profiles:

| Profile | What It Covers |
|---------|---------------|
| **Build** | Engineering the runtime, tools, registry, and pipeline changes |
| **Onboard** | Mass-producing skill packs and code link maps for each jurisdiction |
| **Operate** | Per-run costs, maintenance, and code cycle updates |

Each is broken down by AI cost (API spend), human cost (labor), and infrastructure cost (hosting/tooling).

---

## 2. Build Costs (One-Time Engineering)

### 2.1 Core Runtime Changes

These are modifications to the existing cc-crossbeam codebase. All prices assume Claude Opus for design/implementation work, Sonnet for testing, Haiku for smoke tests.

| Component | Files | AI Dev Cost | Human Review | Total |
|-----------|-------|------------|-------------|-------|
| `skill-assembler.ts` — runtime skill set assembly from registry | 1 new | $15-25 | 2 hrs @ $75/hr = $150 | $165-175 |
| `code-link-resolver.ts` — deterministic cascade lookup | 1 new | $20-35 | 3 hrs @ $75/hr = $225 | $245-260 |
| `registry.ts` — registry read/query utilities | 1 new | $10-15 | 1 hr = $75 | $85-90 |
| `config.ts` modifications — JurisdictionConfig + PipelineConfig | 1 modified | $8-12 | 1 hr = $75 | $83-87 |
| `session.ts` modifications — jurisdiction metadata | 1 modified | $5-8 | 0.5 hr = $38 | $43-46 |
| `corrections-analysis.ts` — code-link-first prompt changes | 1 modified | $10-15 | 1 hr = $75 | $85-90 |
| `corrections-response.ts` — jurisdiction context reading | 1 modified | $5-8 | 0.5 hr = $38 | $43-46 |
| `verify.ts` — new verification fields | 1 modified | $5-8 | 0.5 hr = $38 | $43-46 |
| `progress.ts` — code-link hit/miss tracking | 1 modified | $5-8 | 0.5 hr = $38 | $43-46 |
| **Subtotal: Runtime** | **9 files** | **$83-134** | **$752** | **$835-886** |

### 2.2 Skill Registry Structure

Creating the directory hierarchy, schemas, and registry manifest.

| Component | AI Dev Cost | Human Review | Total |
|-----------|------------|-------------|-------|
| Directory structure scaffolding (`skill-registry/`) | $5-10 | 0.5 hr = $38 | $43-48 |
| JSON schemas for code link maps | $15-25 | 2 hrs = $150 | $165-175 |
| `registry.json` manifest format + validation | $10-15 | 1 hr = $75 | $85-90 |
| Migration script: move existing skills into registry | $15-25 | 1 hr = $75 | $90-100 |
| **Subtotal: Registry** | **$45-75** | **$338** | **$383-413** |

### 2.3 Test Infrastructure

New test levels for cascade behavior.

| Test | AI Dev Cost | Human Review | Total |
|------|------------|-------------|-------|
| `test-l0-registry.ts` — registry loads, symlinks valid | $5-8 | 0.5 hr = $38 | $43-46 |
| `test-l1-code-link-lookup.ts` — resolver returns correct results | $10-15 | 1 hr = $75 | $85-90 |
| `test-l3-cascade.ts` — agent uses resolver first, falls back correctly | $15-25 | 1.5 hrs = $113 | $128-138 |
| `test-l3-new-city.ts` — agent handles city with no code link maps | $15-25 | 1.5 hrs = $113 | $128-138 |
| Test fixtures (sample code link maps, mock corrections) | $10-15 | 1 hr = $75 | $85-90 |
| **Subtotal: Tests** | **$55-88** | **$414** | **$469-502** |

### 2.4 Build Cost Summary

| Category | AI Spend | Human Labor | Total |
|----------|---------|------------|-------|
| Runtime changes | $83-134 | $752 | $835-886 |
| Registry structure | $45-75 | $338 | $383-413 |
| Test infrastructure | $55-88 | $414 | $469-502 |
| **Total Build** | **$183-297** | **$1,504** | **$1,687-1,801** |

**Round estimate: ~$1,750 to build the system.**

For context: this is roughly equivalent to 20 hours of senior developer time at market rate, or the cost of about 5 full live-research correction runs at current pricing.

---

## 3. Onboarding Costs (Per-Jurisdiction)

### 3.1 Onboarding a Single City (ADU Only)

This is the assembly line. Each city goes through the same steps.

| Step | Description | AI Cost | Human Cost | Time |
|------|-------------|---------|-----------|------|
| 1. **Discovery** | AI searches for city's municipal code, ADU ordinance, zoning tables | $1-2 | — | 5 min |
| 2. **Draft code link map** | AI reads city code pages, generates structured JSON mapping corrections → code sections | $2-4 | — | 10-15 min |
| 3. **Draft city skill** | AI writes SKILL.md with city-specific references, key URLs, contacts | $1-2 | — | 5 min |
| 4. **Human QC** | Human reviews draft maps against actual city code, corrects errors | — | 30-60 min @ $25/hr = $12-25 | 30-60 min |
| 5. **L0-L1 test** | Smoke test that the skill pack loads and resolver finds entries | $0.50 | — | 2 min |
| 6. **L3 validation** | Run a sample correction against the hardened city to verify output quality | $3-5 | 15 min review @ $25/hr = $6 | 15 min |
| **Total per city** | | **$7.50-13.50** | **$18-31** | **~1-1.5 hrs** |

**Average per city: ~$35**

### 3.2 Onboarding a State Baseline

Before onboarding cities, the state-level skill and code link maps need to exist. This is heavier.

| Step | Description | AI Cost | Human Cost | Time |
|------|-------------|---------|-----------|------|
| 1. **State code research** | AI reads state building code adoptions, amendments, ADU-specific statutes | $5-10 | — | 20-30 min |
| 2. **State code link maps** | AI generates maps for state-level correction types (structural stamps, plumbing DFU, electrical load calc, etc.) | $8-15 | — | 30-45 min |
| 3. **State skill pack** | SKILL.md + 15-30 reference files covering state codes | $5-10 | — | 15-20 min |
| 4. **Expert QC** | Licensed architect or PE reviews state maps for accuracy | — | 4-8 hrs @ $75/hr = $300-600 | 4-8 hrs |
| 5. **L3 validation** | Run sample corrections against state baseline | $5-8 | 1 hr review = $75 | 1 hr |
| **Total per state** | | **$23-43** | **$375-675** | **~6-10 hrs** |

**Average per state: ~$500**

### 3.3 California Full Coverage (ADU)

| Scope | Units | Cost Each | Total |
|-------|-------|----------|-------|
| State baseline | 1 | $500 | $500 |
| City onboarding (AI draft) | 482 | $10 avg AI | $4,820 |
| City onboarding (human QC) | 482 | $25 avg human | $12,050 |
| L3 validation runs | 482 | $5 avg | $2,410 |
| **Total: All California cities, ADU** | | | **$19,780** |

**Round estimate: ~$20,000 to cover every California city for ADU corrections.**

### 3.4 Realistic Phased Rollout

You wouldn't onboard all 482 cities at once. Priority ordering by permit volume:

| Phase | Cities | Permits/yr (est.) | Coverage | Cumulative Cost |
|-------|--------|-------------------|----------|----------------|
| **Pilot** | Top 10 cities (LA, SF, San Jose, San Diego, Sacramento, Long Beach, Fresno, Oakland, Anaheim, Santa Ana) | ~8,000 | ~30% of CA ADU volume | $850 |
| **Phase 1** | Next 40 cities | ~6,000 | ~55% | $2,850 |
| **Phase 2** | Next 100 cities | ~5,000 | ~75% | $7,850 |
| **Phase 3** | Remaining 332 cities | ~5,000 | ~100% | $19,780 |

The top 50 cities cover ~55% of California's ADU volume at under $3,000.

### 3.5 Adding a Second Permit Type

Once the infrastructure exists, adding a new permit type (e.g., solar PV) to existing cities is cheaper because:
- State baseline already exists (partial reuse of structural, electrical, fire code maps)
- City overlay structure already exists
- Pipeline skills need adaptation, not creation from scratch

| Component | Cost |
|-----------|------|
| State-level code link maps for new permit type | $300-400 |
| Adapt pipeline skills (corrections-flow, corrections-complete) | $200-300 |
| City-level overlays (most cities don't override state solar code) | $5-10 per city, only ~20% of cities need overlays |
| Testing | $200-300 |
| **Total for 2nd permit type, statewide** | **~$1,500-2,000** |

Each subsequent permit type gets cheaper. Permit types 3-5 might be ~$800-1,200 each.

---

## 4. Operating Costs (Per-Run)

### 4.1 Contractor Corrections Flow — Current vs. Hardened

Measured from real test runs (plan-0215.md: CV5 E2E = $5.92 / 17 min). Broken into phases:

| Phase | Current (Live) | Hardened (Code-Link) | Savings | Notes |
|-------|---------------|---------------------|---------|-------|
| **Phase 1**: Parse corrections letter | $0.50 | $0.50 | — | Same either way — LLM reads the PDF |
| **Phase 2**: Build sheet manifest | $1.00 | $1.00 | — | Same — LLM identifies sheets |
| **Phase 3A**: State law research | $1.50 | $0.10 | 93% | Code-link lookup replaces WebSearch |
| **Phase 3B**: City code research | $2.00 | $0.05 | 97% | Code-link lookup replaces WebSearch + WebFetch |
| **Phase 3C**: Sheet observations | $0.80 | $0.80 | — | Same — LLM reads plan images |
| **Phase 4**: Categorization | $0.50 | $0.30 | 40% | Resolution templates pre-mapped |
| **Phase 5**: Response generation | $1.00 | $0.80 | 20% | Templates reduce reasoning |
| **Total** | **$7.30** | **$3.55** | **51%** | |
| **Time** | **~17 min** | **~8-10 min** | **~45%** | Research phases collapse to lookups |

### 4.1b Full Permit Lifecycle COGS

The per-run costs above cover the AI analysis portion. The full product lifecycle includes additional infrastructure costs for submission handling (Vercel compute, PDF generation, file storage, external API calls, retries).

| Component | Cost | Notes |
|-----------|------|-------|
| Precheck — corrections analysis (hardened) | $3.55 | Phases 1-5 above |
| First submission infrastructure | $5.00 | Vercel, PDF gen, storage, external APIs |
| Submission management | $0.50 | Tracking, status updates |
| Post-rejection corrections analysis | $3.55 | Same cascade flow on resubmittal |
| Response generation | $0.80 | Letter, scope, annotations |
| Resubmission tracking | $0.25 | Status management |
| **Total COGS per permit lifecycle** | **$13.65** | |

**Revenue per permit: $120** ($45 base submission + $75 corrections analysis line item)

**Gross margin per permit: 88.6%**

### 4.2 City-Side Plan Review Flow — Current vs. Hardened

From real test run (CV4 = $8.69 / 16 min):

| Phase | Current (Live) | Hardened (Code-Link) | Savings |
|-------|---------------|---------------------|---------|
| Sheet-by-sheet code review | $5.50 | $3.00 | 45% |
| Code research per discipline | $2.00 | $0.20 | 90% |
| Corrections letter generation | $1.20 | $1.00 | 17% |
| **Total** | **$8.69** | **$4.20** | **52%** |

### 4.3 Per-Permit Cost Under Volume

Full lifecycle COGS at $13.65/permit vs. live research equivalent (~$18.30 with infrastructure):

| Monthly Volume | COGS/Permit (Live) | COGS/Permit (Hardened) | Revenue/Permit | Monthly COGS (Hardened) | Monthly Gross |
|---------------|-------------------|----------------------|---------------|------------------------|--------------|
| 50 permits | $18.30 | $13.65 | $120 | $683 | $5,318 |
| 200 permits | $18.30 | $13.65 | $120 | $2,730 | $21,270 |
| 1,000 permits | $18.30 | $13.65 | $120 | $13,650 | $106,350 |
| 5,000 permits | $18.30 | $13.65 | $120 | $68,250 | $531,750 |

### 4.4 Break-Even Per City

| Metric | Value |
|--------|-------|
| COGS savings per hardened permit | $4.65 |
| Average onboarding cost per city | $35 |
| **Break-even on onboarding** | **~8 permits per city** |
| At 2 permits/month per city | **4 months to payback** |
| At 5 permits/month per city | **~6 weeks to payback** |

For high-volume cities (LA, SF, San Jose), break-even could happen in the first week.

---

## 5. Maintenance Costs (Ongoing)

### 5.1 Code Cycle Updates

California adopts a new building code cycle every ~3 years (2019 → 2022 → 2025). Each cycle update requires refreshing code link maps.

| Task | AI Cost | Human Cost | Time |
|------|---------|-----------|------|
| State-level diff (old cycle → new cycle) | $5-10 | — | 15 min |
| AI applies diff to state code link maps | $8-15 | — | 20 min |
| Expert review of state-level changes | — | 4-6 hrs @ $75/hr = $300-450 | 4-6 hrs |
| AI propagates changes to city maps (482 cities) | $0.50/city × 482 = $241 | — | 2 hrs (batched) |
| Human spot-check of city map updates (sample 10%) | — | 48 cities × 15 min × $25/hr = $300 | 12 hrs |
| L3 regression tests (sample 5%) | 24 cities × $5 = $120 | — | 2 hrs |
| **Total per code cycle update** | **$374-386** | **$600-750** | **~20-22 hrs** |

**~$1,000-1,100 per code cycle update, every 3 years.**

Amortized annually: **~$350/year** for maintaining California ADU coverage.

### 5.2 Municipal Code Changes (Mid-Cycle)

Cities occasionally amend their local ADU ordinances outside the state code cycle (e.g., changing setback rules, adding new requirements). These are sporadic.

| Assumption | Value |
|------------|-------|
| Cities that amend ADU rules per year | ~20-30 (out of 482) |
| Cost to update one city's code link map | $15-25 (AI draft + human review) |
| **Annual mid-cycle maintenance** | **$300-750** |

### 5.3 New Correction Types

As the system processes more real corrections, it will encounter patterns not yet in the code link maps. These get captured and added.

| Assumption | Value |
|------------|-------|
| New correction types discovered per month | ~5-10 (decreasing over time) |
| Cost to add one correction type to state map | $5-10 (AI + human review) |
| Propagation to affected city maps | $0.50-1.00 per city |
| **Annual new-type maintenance** | **$600-1,200** (year 1), **$200-400** (year 2+) |

### 5.4 Total Annual Maintenance

| Category | Year 1 | Year 2+ |
|----------|--------|---------|
| Code cycle updates (amortized) | $350 | $350 |
| Mid-cycle municipal changes | $500 | $500 |
| New correction type discovery | $900 | $300 |
| L3 regression test budget | $600 | $400 |
| **Total annual maintenance** | **$2,350** | **$1,550** |

---

## 6. Total Cost of Ownership: 3-Year View

### 6.1 California ADU — Phased Rollout

| Year | Activity | AI Spend | Human Labor | Total |
|------|----------|---------|------------|-------|
| **Year 0** | Build system + Pilot (10 cities) | $1,033 | $2,354 | $3,387 |
| **Year 0** | Phase 1 (40 more cities) | $670 | $1,330 | $2,000 |
| **Year 1** | Phase 2 (100 more cities) | $1,500 | $3,500 | $5,000 |
| **Year 1** | Maintenance | $1,250 | $1,100 | $2,350 |
| **Year 2** | Phase 3 (remaining 332 cities) | $4,480 | $7,450 | $11,930 |
| **Year 2** | Maintenance | $850 | $700 | $1,550 |
| **Year 3** | Maintenance only | $850 | $700 | $1,550 |
| **3-Year Total** | | **$10,633** | **$17,134** | **$27,767** |

### 6.2 Multi-Permit-Type Expansion

Adding solar PV, residential remodel, and commercial TI to the California coverage:

| Permit Type | Onboarding Cost | Annual Maintenance | 3-Year Total |
|-------------|----------------|-------------------|-------------|
| ADU (above) | $19,780 | $1,550-2,350 | $27,767 |
| Solar PV | $1,500-2,000 | $800 | $4,100 |
| Residential Remodel | $2,000-2,500 | $1,000 | $5,250 |
| Commercial TI | $2,500-3,000 | $1,200 | $6,350 |
| **Total: 4 permit types, all CA** | | | **$43,467** |

### 6.3 Multi-State Expansion

| State | Cities | Onboarding | Annual Maint. | 3-Year Total |
|-------|--------|-----------|--------------|-------------|
| California | 482 | $19,780 | $1,950 | $27,767 |
| Texas | 1,200+ (but ~100 with ADU programs) | $5,500 | $900 | $8,300 |
| Florida | 410+ (statewide code, thin city layer) | $6,000 | $600 | $7,800 |
| Colorado | 270+ (~60 active ADU) | $3,200 | $500 | $4,700 |
| Oregon | 240+ (~40 active ADU) | $2,400 | $400 | $3,600 |
| **5-State Total (ADU only)** | | **$36,880** | **$4,350** | **$52,167** |

---

## 7. Comparison: Build vs. Don't Build

### 7.1 Scenario A: Stay With Live Research (No Cascade)

Every permit pays the full live research cost ($18.30 COGS). No onboarding investment, but no savings either.

| Volume (monthly) | COGS/Permit | Monthly COGS | Annual COGS | 3-Year COGS |
|-----------------|------------|-------------|------------|------------|
| 50 | $18.30 | $915 | $10,980 | $32,940 |
| 200 | $18.30 | $3,660 | $43,920 | $131,760 |
| 1,000 | $18.30 | $18,300 | $219,600 | $658,800 |
| 5,000 | $18.30 | $91,500 | $1,098,000 | $3,294,000 |

### 7.2 Scenario B: Build Cascade (Hardened)

Pay onboarding cost upfront, then run at $13.65/permit forever.

| Volume (monthly) | COGS/Permit | Monthly COGS | Annual COGS | 3-Year COGS | 3-Year + Build/Onboard |
|-----------------|------------|-------------|------------|------------|----------------------|
| 50 | $13.65 | $683 | $8,190 | $24,570 | $52,337 |
| 200 | $13.65 | $2,730 | $32,760 | $98,280 | $126,047 |
| 1,000 | $13.65 | $13,650 | $163,800 | $491,400 | $519,167 |
| 5,000 | $13.65 | $68,250 | $819,000 | $2,457,000 | $2,484,767 |

### 7.3 P&L by Volume (at $120/permit)

This is the full picture — revenue minus all costs, including build and onboarding amortized over 3 years.

| Monthly Volume | Annual Revenue | Annual COGS (Hardened) | Annual Build/Onboard (amortized) | **Annual Gross Profit** | **Margin** |
|---------------|---------------|----------------------|--------------------------------|------------------------|-----------|
| 50 | $72,000 | $8,190 | $9,256 | **$54,554** | **75.8%** |
| 200 | $288,000 | $32,760 | $9,256 | **$245,984** | **85.4%** |
| 500 | $720,000 | $81,900 | $9,256 | **$628,844** | **87.3%** |
| 1,000 | $1,440,000 | $163,800 | $9,256 | **$1,266,944** | **88.0%** |
| 5,000 | $7,200,000 | $819,000 | $9,256 | **$6,371,744** | **88.5%** |

At just 50 permits/month — a single mid-size city's ADU volume — the business generates $54K/year in gross profit. The build and onboarding investment (~$27,767 over 3 years) pays for itself in 6 months at this volume.

### 7.4 Break-Even by Volume (COGS Only)

| Monthly Volume | 3-Year Live COGS | 3-Year Hardened (incl. build) | Savings | When It Pays Off |
|---------------|-----------------|------------------------------|---------|-----------------|
| 50 | $32,940 | $52,337 | **-$19,397** | Never (build cost exceeds COGS savings) |
| 200 | $131,760 | $126,047 | **$5,713** | ~30 months |
| 500 | $329,400 | $272,817 | **$56,583** | ~7 months |
| 1,000 | $658,800 | $519,167 | **$139,633** | ~4 months |
| 5,000 | $3,294,000 | $2,484,767 | **$809,233** | ~2 months |

**Pure COGS break-even requires ~200+ permits/month.** But at $120 revenue, the business is profitable from day one at any volume — the cascade just makes it *more* profitable above 200/month.

### 7.5 Where the Real Value Is

The cost comparison above only measures COGS. The bigger economic picture:

| Factor | Live Research | Hardened Cascade |
|--------|--------------|-----------------|
| Full lifecycle COGS | $18.30/permit | $13.65/permit |
| Gross margin at $120 | 84.8% | 88.6% |
| Wall-clock time per permit | ~25-30 min total | ~12-15 min total |
| Consistency of answers | Variable (WebSearch results differ) | Deterministic (same map → same answer) |
| Quality floor | Depends on search results | Guaranteed (human-verified maps) |
| New city onboarding | $0 (but first run is slow and unreliable) | $35 (but every run is fast and verified) |
| Defensibility | None (anyone can WebSearch) | High (verified maps are IP) |
| Regulatory liability | Risky (unverified research) | Lower (human-verified code refs) |
| Accuracy rate (trackable) | No (can't measure what you can't control) | Yes (hit rate, first-resubmittal acceptance) |
| Sellable accuracy metric | No | Yes — "94% first-resubmittal acceptance rate" |

The code link maps — once verified — become a proprietary dataset. They're the accumulated knowledge of "what every California city actually requires for an ADU" in structured, machine-readable form. This is the moat.

The accuracy metrics become a **sales tool**: contractors buy on "94% of our correction responses are accepted on first resubmittal" because no human expediter can make — or prove — that claim.

---

## 8. Revenue Context

### 8.1 What the Market Pays Today

From the city marketing analysis (marketing-city.md):

| Payer | What They Pay | For What |
|-------|-------------|---------|
| Homeowner | ~$2,549 | Single ADU permit (Huntington Beach) |
| City (to consultant) | $150-175/hr | Plan review by CSG/WC3/Bureau Veritas |
| City (annual consultant spend) | $80K-$3.5M/yr | Outsourced plan review (varies by city size) |
| City (lost to corrections) | ~$340K/yr | Re-review cycles on corrections (Huntington Beach model) |

### 8.2 FluentGov Pricing — Actual Product Structure

| Service | Price | COGS (Hardened) | Gross Margin |
|---------|-------|----------------|-------------|
| **Base submission** (submission, management, resubmission) | $45 | $6.30 | 86.0% |
| **Corrections analysis add-on** (precheck + post-rejection) | $75 | $7.35 | 90.2% |
| **Full permit lifecycle** (base + corrections) | **$120** | **$13.65** | **88.6%** |
| City plan review assist (B2G) | $75-150/review | $4.20 | 94-97% |
| Monthly city subscription (unlimited) | $2,000-5,000/mo | ~$750/mo (est. 100 permits) | 63-85% |
| Annual city contract | $25,000-50,000/yr | ~$9,000/yr | 64-82% |

### 8.3 Market Comparison

| Provider | What You Get | Price | FluentGov Equivalent |
|----------|-------------|-------|---------------------|
| **FluentGov** | Full cycle: precheck + submission + corrections + resubmission | **$120** | — |
| Permit expediter (flat fee) | Same scope, human | $1,500-6,000 | 12-50x more expensive |
| Permit expediter (hourly) | 1 hour of their time | $75-150 | Same price, 1/4 the scope |
| CivCheck | Prescreening only | ~$50-200 | No corrections, no response |
| UpCodes | Self-service code lookup | ~$250/mo subscription | You do the work yourself |
| CodeComply.AI | AI compliance flagging | ~$250/mo/seat | No response generation |

### 8.4 Unit Economics at Scale

At $120/permit with full lifecycle COGS of $13.65:

| Monthly Volume | Monthly Revenue | Monthly COGS | Monthly Maintenance | **Monthly Gross** | **Margin** |
|---------------|----------------|-------------|--------------------|--------------------|-----------|
| 50 | $6,000 | $683 | $160 | **$5,158** | **85.9%** |
| 200 | $24,000 | $2,730 | $160 | **$21,110** | **88.0%** |
| 500 | $60,000 | $6,825 | $160 | **$53,015** | **88.4%** |
| 1,000 | $120,000 | $13,650 | $160 | **$106,190** | **88.5%** |
| 5,000 | $600,000 | $68,250 | $160 | **$531,590** | **88.6%** |

Compare to live research COGS ($18.30/permit) at 1,000 permits/month:

| Metric | Hardened Cascade | Live Research | Difference |
|--------|-----------------|--------------|-----------|
| Monthly revenue | $120,000 | $120,000 | — |
| Monthly COGS | $13,650 | $18,300 | $4,650 saved |
| Monthly gross | $106,190 | $101,540 | **+$4,650/mo** |
| Annual gross | $1,274,280 | $1,218,480 | **+$55,800/yr** |

The per-unit margin difference is modest at $120 pricing ($4.65/permit). The cascade's real value at this price point is **speed** (12 min vs 28 min), **accuracy** (verified vs unverified), and **defensibility** (proprietary dataset vs commodity search).

---

## 9. Risk-Adjusted View

### 9.1 What Could Make It Cost More

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Code link maps need more human QC than estimated | +50-100% on onboarding | Start with pilot to calibrate, adjust QC scope |
| State codes are harder to structure than expected | +$200-400 per state | Use expert reviewers for first state, template for rest |
| API prices increase | +20-40% on per-run costs | Cascade reduces exposure to API pricing changes |
| Cities change codes more often than estimated | +$500-1,000/yr maintenance | Monitor change feeds, automate detection |
| Code link coverage plateaus at 70% (not 90%+) | Reduced savings per run | Still profitable — just smaller gap vs. live research |

### 9.2 What Could Make It Cost Less

| Factor | Impact | Likelihood |
|--------|--------|-----------|
| Batch API pricing or caching | -30-50% on per-run costs | Medium (Anthropic may offer) |
| State skill packs generalize across permit types | -40% on permit type expansion | High (structural/fire/plumbing codes are shared) |
| Community contributions (open-source city maps) | -50-80% on onboarding at scale | Medium-long term |
| Model improvements reduce token usage | -10-30% on per-run costs | High (historical trend) |
| Smaller/cheaper models handle deterministic lookups | -20-40% on resolver overhead | High (Haiku for lookup orchestration) |

---

## 10. Summary: The Decision Table

| Scenario | Build + Onboard | Annual COGS (1K/mo) | Annual Revenue (1K/mo) | Annual Gross (1K/mo) | 3-Year Gross |
|----------|----------------|--------------------|-----------------------|---------------------|-------------|
| **Don't build** (live research) | $0 | $219,600 | $1,440,000 | $1,218,480 | $3,655,440 |
| **Build for CA** (ADU) | $27,767 | $163,800 | $1,440,000 | $1,274,280 | $3,795,073 |
| **Build for 5 states** (ADU) | $52,167 | $163,800 | $1,440,000 | $1,274,280 | $3,770,673 |
| **Build for CA** (4 permit types) | $43,467 | $163,800 | $1,440,000 | $1,274,280 | $3,779,373 |

**At $120/permit, the business is profitable in all scenarios.** The cascade doesn't make-or-break profitability — margins are 85-89% either way.

What the cascade does:

1. **Adds ~$55K/year in gross profit** at 1,000 permits/month from COGS reduction
2. **Cuts delivery time in half** (12 min vs 28 min) — enabling higher throughput per dollar of infrastructure
3. **Creates a trackable accuracy rate** that becomes the primary sales tool
4. **Builds a proprietary dataset** (verified code link maps) that compounds in value over time
5. **Reduces regulatory risk** — human-verified code references vs. unverified web search results

The build investment ($27,767 for full California coverage over 3 years) pays for itself in **6 months** from COGS savings alone at 1,000 permits/month. But the real ROI is in the accuracy metrics and speed that justify the $120 price point against $1,500-6,000 human expediters.
