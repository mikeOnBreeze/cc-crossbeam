# ADU Extraction Priorities

Domain-aware extraction guide for California ADU construction plan binders.
Vision subagents use this to guide `key_content` specificity and flag notable
absences in their manifest fragment output.

## How to Use

For each page extracted, identify its content type (site plan, floor plan,
structural, etc.) by looking at what is actually ON the page — not by sheet
number prefix, which varies by firm.

- **CAPTURE with specificity**: Include exact values (dimensions, PSI, nail
  spacing), not just "information present"
- **FLAG IF ABSENT**: If an expected item for this content type is not on the
  sheet, add to `key_content`: `"NOT SHOWN: [item]"` — this is as valuable
  as what IS shown, because missing items often appear in corrections letters

---

## Site Plan
Identify by content: lot outline, building footprints, property lines,
setback dimensions, utility locations, equipment pads.

CAPTURE: setback dimensions (side, rear, front — exact feet/inches), lot
dimensions and total lot area (sq ft), lot coverage percentage, FAR (floor
area ratio), ADU footprint dimensions, distance from primary dwelling,
property line lengths, parking spaces (count, dimensions, tandem arrangement),
utility locations (water meter, sewer lateral, gas, electrical service),
equipment pads (HVAC condenser, water heater), easements, fire access routes,
driveway width, grading/drainage direction

FLAG IF ABSENT: setback dimensions, lot coverage %, parking layout, utility
connections, north arrow, scale notation, property line dimensions, drainage
direction, equipment pad locations

TERMINOLOGY: setback deficiency, lot coverage exceedance, FAR, front/side/rear
setback, tandem parking, utility lateral, easement encroachment, ADU placement

---

## Floor Plan
Identify by content: room layout with dimensions, door/window schedules,
electrical symbols, plumbing fixtures, wall type callouts.

CAPTURE: interior livable area (sq ft), room dimensions and labels, bedroom
count, bathroom count, ceiling height, window schedule (size, type, U-factor,
SHGC, tempered glass), door schedule (size, type, fire rating), egress window
specs (net clear opening sq ft, sill height, min width/height), fire-rated
wall callouts (1-HR, 2-HR with assembly detail reference), electrical layout
(GFCI locations, smoke/CO detector locations, panel location), plumbing
fixture specs (GPF for toilets, GPM for faucets/showerheads), kitchen details
(appliances, counter depth, range hood CFM), HVAC equipment locations,
wall framing spec (stud size, spacing, GWB type/thickness)

FLAG IF ABSENT: egress window dimensions for bedrooms, fire-rated wall
callouts, smoke/CO detector locations, window/door schedules, plumbing fixture
flow rates, electrical panel location, kitchen ventilation (range hood)

TERMINOLOGY: egress non-compliant, fire-rated assembly, efficiency kitchen,
net clear opening, sill height, GFCI, interconnected smoke alarms, Type X
gypsum, means of egress

---

## Elevations & Sections
Identify by content: exterior building views (front/side/rear), cross-section
cuts showing wall/roof/foundation assemblies, material callouts.

CAPTURE: building height (grade to peak — exact dimension), number of stories,
roof pitch (rise:run), roof material and fire class (Class A/B/C), exterior
wall assembly layers (sheathing, building paper, stucco/siding, insulation
R-value, interior GWB type/thickness), eave/overhang projection, foundation-
to-grade relationship, solar panel array location and extent, ventilation
details (ridge vent, soffit vent, gable vent, net free area calculations),
window/door locations on elevation, address number visibility note

FLAG IF ABSENT: building height dimension, roof pitch, wall assembly detail
with R-values, solar panel location (required for new detached ADUs),
ventilation calculations (net free area), fire-rated assembly details

TERMINOLOGY: height violation, composition shingle, Type X gypsum, capillary
break, building envelope, net free area, R-value, building paper

---

## Structural Notes
Identify by content: dense text pages with seismic data tables, concrete
specs, nailing schedules, lumber specifications, special inspection lists.

CAPTURE: seismic design values (Ss, S1, SDS, SD1, Seismic Design Category),
wind speed (mph) and exposure category, concrete specs (PSI, cement type,
W/C ratio), rebar specs (ASTM grade, cover dimensions by exposure), nailing
schedule (every connection type with nail size and spacing), lumber species
and grade (e.g., DFL #2, Select Structural), engineered wood products
(manufacturer, model, ICC-ES report numbers), special inspection requirements
(list each type: concrete, wood, soil), adhesive anchor specs (ASTM
standards, testing percentage, cure time), hardware manufacturer references
(Simpson, Hardy, Hilti — model numbers), glulam specs (combination grade),
pressure-treated wood requirements

FLAG IF ABSENT: seismic design category, wind speed, concrete PSI and cement
type, nailing schedule, special inspection list, lumber grade specification,
rebar cover dimensions

TERMINOLOGY: Seismic Design Category D, lateral force, base shear, special
inspection, Class B splice, proof test, hot-dipped galvanized, DFL #2,
Parallam PSL, TJI joist

---

## Foundation & Framing Plans
Identify by content: plan-view drawings showing footing outlines, slab areas,
rebar callouts, joist layouts, shearwall symbols, holdown symbols.

CAPTURE: foundation type (slab-on-grade, stem wall, raised), footing
dimensions (width x depth), rebar in footings (bar size, spacing, count),
slab thickness and rebar (size @ spacing each way), foundation bolt specs
(diameter, embedment depth, max spacing, distance to ends), concrete PSI and
cement type, floor framing (joist size @ spacing), headers at openings (size,
trimmer count), sheathing specs (thickness, grade, span rating, nail size @
edge/field spacing), shearwall symbol locations (mark numbers), holdown symbol
locations (mark numbers), epoxy dowel specs (if connecting to existing
foundation), vapor barrier notation

FLAG IF ABSENT: footing dimensions, foundation bolt specs (diameter and
spacing), slab rebar schedule, sheathing nailing schedule, shearwall
locations, holdown locations, vapor barrier

TERMINOLOGY: slab-on-grade, continuous footing, mudsill, P.T. sill plate,
epoxy dowel, holdown, shearwall mark, span rating, edge nailing, field
nailing, Simpson SET

---

## Structural Details
Identify by content: multiple numbered detail bubbles with cross-section
drawings, schedule tables (shearwall, holdown), connection details.

CAPTURE: shearwall schedule (mark number, wall length, sheathing type, edge
nail spacing, field nail spacing, holdown hardware model, uplift value in
lbs), holdown/column schedule (mark, hardware model, anchor type, footing
size, bolt specs, uplift value), slab edge/foundation section details, anchor
bolt details (embedment depth, washer size), connection details (roof-to-wall
ties, wall-to-foundation anchors), DTC clip specs and spacing, blocking
requirements (perpendicular and parallel to joists), header framing at
openings (trimmer count by opening width), footing sections at holdowns

FLAG IF ABSENT: shearwall schedule, holdown schedule with uplift values,
roof-to-wall connection details, wall-to-foundation connection details,
anchor bolt embedment depth

TERMINOLOGY: PLF (pounds per linear foot), uplift, holdown, shearwall mark,
DTC clip, hurricane tie, H2.5, Simpson HDU, edge nail, field nail, king stud,
trimmer stud, cripple stud

---

## Energy / Title 24
Identify by content: CF-1R compliance forms (often tiled/composited on a
single sheet), compliance tables, mandatory requirements checklists. These
pages are frequently rasterized images with small text.

CAPTURE: compliance method (prescriptive vs. performance), compliance software
(CBECC, EnergyPro, version), climate zone, building envelope table (component,
area, U-factor, proposed vs standard), fenestration schedule (window type,
area, U-factor, SHGC, orientation), insulation R-values (wall, ceiling,
floor), HVAC system type and efficiency (AFUE, SEER2, HSPF2), water heater
type and efficiency (EF/UEF), duct insulation R-value and sealing method,
PV solar system specs (kW, if new detached ADU), compliance margins (proposed
vs standard for heating, cooling, water heating), mandatory requirements
checklist status (which items checked/unchecked)

FLAG IF ABSENT: compliance certificate, U-factor/SHGC values for windows,
insulation R-values, HVAC efficiency ratings, solar system (required for new
detached ADU per Title 24), compliance margins, duct sealing method

NOTE: Title 24 pages are often composited at small scale with watermarks.
If specific values are not legible, note "VALUE NOT LEGIBLE: [field]" rather
than guessing. Accuracy of what IS legible matters more than completeness.

TERMINOLOGY: CF-1R, performance compliance, prescriptive compliance, U-factor,
SHGC, HERS verification, EDR (Energy Design Rating), mandatory measures,
building envelope, duct leakage

---

## Code Compliance / CalGreen
Identify by content: checklist-format pages with compliance checkboxes,
VOC limit tables, water efficiency tables, EV charging provisions.

CAPTURE: CalGreen tier (mandatory, Tier 1, Tier 2), water efficiency fixtures
(flow rates: GPM for faucets, GPF for toilets), VOC limits for adhesives/
sealants/coatings (g/L values per material type), formaldehyde limits (ppm
per material type), construction waste diversion percentage, EV charging
readiness specs (amperage, voltage, circuit count), indoor air quality
provisions (exhaust fans ENERGY STAR rated, ducted to exterior), moisture
control (vapor retarder requirement), pollutant control measures, checkbox
completion status (which sections checked vs unchecked)

FLAG IF ABSENT: CalGreen checklist completion, fixture flow rates, VOC
documentation, EV charging provision, exhaust fan specs, waste diversion plan

TERMINOLOGY: CalGreen mandatory measures, VOC limits, SCAQMD, formaldehyde
limits, construction waste management, EV-ready, MWELO

---

## Cover Sheet / General Notes
Identify by content: project header, scope of work, governing codes list,
sheet index, vicinity map, consultant information, general notes.

CAPTURE: project address (full), owner name, designer/architect name and
license number, structural engineer firm, energy consultant, project type
(new detached ADU, attached ADU, JADU, garage conversion), ADU square footage,
existing home square footage, lot size, number of bedrooms/bathrooms, governing
codes (CBC edition, Title 24 edition, CalGreen, CFC, local amendments), scope
of work description, sheet index (list of all sheets), separate permits list,
construction type (all-electric, gas+electric), general notes (count and key
topics)

FLAG IF ABSENT: governing code editions, scope of work, sheet index, project
type classification, ADU square footage, bedroom/bathroom count, designer
license number

TERMINOLOGY: detached ADU, attached ADU, JADU, garage conversion, ministerial
review, objective standards, scope of work, governing codes
