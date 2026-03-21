---
title: "Storm Sewer and Stormwater Management"
category: "Utilities"
relevance: "Storm sewer design, stormwater management, runoff coefficients, separation distances"
authority: "City of Edmonton / EPCOR"
---

# Storm Sewer and Stormwater Management — City of Edmonton

## Design Storm

| System | Return Period | Notes |
|--------|--------------|-------|
| Minor system (pipes) | **1:5 year** | Vol 3-03: sufficient inlet capacity for 1:5 year rainfall event |
| Major system (overland) | **1:100 year** | Vol 3-02: SWMF and flood profiling for 5yr, 10yr, 25yr, 100yr events |

## Minimum Pipe Size

| Application | Minimum Diameter | Notes |
|-------------|-----------------|-------|
| Storm main | 300 mm | |
| Catch basin leads | 250 mm | Exception to 300mm minimum |
| Foundation drain | 200 mm | |
| Service connection | 150 mm | Vol 3-03, Section 3.3.2, Table 3.1 |

## Minimum Cover (Section 2.2.1)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Minimum cover (crown to finished grade) | **2.0 m** | For all pipes smaller than 600mm |
| Frost protection | Required | Where min cover cannot be achieved, per Standard Specifications Sewer Construction drawing WA-002-001 |

## Minimum Service Pipe Slope

**Minimum storm service pipe slope: 1.00%**

## Minimum Slopes by Sewer Size (Table 2.3)

| Sewer Size (mm) | Min Slope — Straight Run (%) | Min Slope — Curved Sewer (%) |
|:---------------:|:----------------------------:|:----------------------------:|
| 100 | 2.00 | 2.00 |
| 150 | 1.00 | 1.00 |
| 200 | 0.40 (foundation drain) | - |
| 250 | 0.28 (foundation drain) | - |
| 300 | 0.22 | 0.25 |
| 375 | 0.15 | 0.18 |
| 450 | 0.12 | 0.15 |
| 525 | 0.10 | 0.13 |
| 600+ | 0.10 | 0.10 |

## Storm Sewer — Separation Chart (Figure 3)

| Domain Infrastructure | Subdomain Infrastructure | Horizontal (m) | Vertical (m) | Notes |
|----------------------|-------------------------|----------------|---------------|-------|
| Storm service to lot | Storm mains | 3.05 | 0 | Main 중심 ~ PL, centre to centre |
| Storm service to lot | Sanitary mains | 3.0 | 0.5 | Storm service to sanitary main |
| Property Line | Storm services | 1.83 | 0 | Main 중심 ~ PL, centre to centre |
| Bus stop pad | Storm services | 1.5 | - | Bus pad edge 기준. Bus pad 아래 매설 지양 |
| Shallow utilities (power, gas, telecom) | Storm services to lot | 0.3 | 0.15 | Vol.3 Fig 3-1, Table 3-2 |
| Overhead telecommunications | Storm services to lot | 0.3 | 0.3 | Vol.3 Fig 3-1, Table 3-2 |
| Trees (centre of tree) | Drainage services | 1.5 | - | |
| Light Standard Base / Foundation | Drainage services | 1.0 | - | |
| Streetlight pole and foundation | Drainage services | 1.0 | - | |
| Drainage crossing (top of casing) | Storm services running parallel | 3.0 | 0.3 | Casing 외면 기준 |
| Power crossing (duct bank) | Drainage services parallel | 0.5 | 0.5 | Crossing/main 외면 기준 |

### Manhole Separation Chart

| Domain Infrastructure | Subdomain Infrastructure | Horizontal (m) | Vertical (m) | Notes |
|----------------------|-------------------------|----------------|---------------|-------|
| Storm/Sanitary MH | Watermain | 2.5 | 0 | Centre to centre |
| Oversized MH (Ø1800+) | Watermain | 3.0 | - | Centreline to centreline, watermain ≤600mm |
| MH shaft | Water Services (50mm or smaller) | 2.0 | 0 | Main 중심 ~ PL, centre to centre |
| MH | Gas crossings/line | 1.5 | - | Preferred 3.0m |
| MH | Telecom pedestal/line | 1.5 | - | Preferred 3.0m |

## Standard Invert Drop Requirements

### Pipe Size Change
- **Matching Crowns** method (default)
- If downstream pipe is larger: may reduce drop per hydraulic calculations

### Drop by Deflection Angle

| Deflection Angle | Minimum Drop |
|:-----------------|:-------------|
| Straight (180°) or ≤45° | **0.03 m (30 mm)** |
| >45° to 90° | **0.05 m (50 mm)** |

## Impervious Surface Runoff Coefficients

| Type of Surface | Runoff Coefficient (C) |
|----------------|----------------------|
| Roof (R) | 0.95 |
| Pavement (P) | 0.95 |
| Landscaping (L) | 0.10 |

## Sampling Manhole

- Sampling MH 최소 경사: **1%**

## Stormwater Management — On-Site Calculations (C005)

도면에 포함해야 하는 SWM 계산 항목:

| Calculation | Unit |
|-------------|------|
| 전체 개발 면적 (Total development area) | ha |
| 평균 유출 계수 (Average runoff coefficient) | — |
| 필요 현장 저류 용량 (Required onsite ponding volume) | m³ |
| 달성 저류 용량 (Ponding volume achieved) + 계산 근거 | m³ |
| 최대 허용 부지 유출속도 (Maximum allowable site outflow rate) | m³/s |
| 유량 제한/Orifice 크기 + 데이터 시트 | mm |

### Orifice 요구사항

- **최소 크기: 50mm** (round, sharp-edged orifice)
- Orifice 크기 Calculation 별도 포함

## Stormwater Management Facilities (SWMFs)

Edmonton requires SWMFs as the final treatment process for stormwater (Vol 3-02, EPCOR April 2025):

| SWMF Type | Key Requirements |
|-----------|-----------------|
| **Naturalized Wet Ponds** | Relatively oval shaped; no grates on submerged inlets/outlets |
| **Constructed Wetlands** | Final treatment process; design per Vol 3-02 |
| **Dry Ponds** | Min bottom slope **1.5%**; max live storage depth **1.5 m** |

- Control structure must be above the **1:100 year design event** water level
- Shared-use paths within SWMF must be at or above the **1:25 year design event** water level
- Areas with stormwater discharge < **20 L/s/ha** may trigger downstream sewer upgrades
- Pre-development vs. post-development release rate matching required

## Low Impact Development (LID)

Edmonton/EPCOR actively supports LID through SIRP ($1.6B, 20-year plan). EPCOR published **LID Best Management Practices Design Guide** (August 2025):

| LID Type | Description |
|----------|-------------|
| Bioretention / Rain Gardens | Vegetated depressions for infiltration and filtration |
| Bioswales | Vegetated channels for conveyance and treatment |
| Permeable Pavement | Porous asphalt, porous concrete, open grid pavers |
| Green Roofs | Vegetated roof systems for retention |
| Rainwater Harvesting | Collection and reuse of roof runoff |

- All LID features must **drain within 48–72 hours**
- Source: EPCOR LID BMP Design Guide (Aug 2025)

## Overland Drainage Routes

- Major system must have defined overland flow routes
- Routes must not direct water onto private property
- Minimum freeboard: **300 mm** between major system water surface and lowest adjacent building opening

---

> **Source**: EPCOR Design and Construction Standards Vol 3-02 (April 2025), Vol 3-03 Design Guidelines, LID BMP Design Guide (August 2025).
