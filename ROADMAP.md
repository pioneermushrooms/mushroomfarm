# Pixel Spore Farm — Feature Overhaul Roadmap

## 8 Phases, each independently playable

---

## Phase 1: XP & Leveling (Foundation)
**Status**: COMPLETE (2026-04-03)  
**Files**: state.js, engine.js, ui.js, index.html

Passive XP system. No gameplay gating yet — just accumulation and display.

### XP Sources
| Action | XP |
|--------|-----|
| Harvest a tent | 10 + 5 per flush |
| Sell at market | 5 per 10 lbs |
| Fulfill contract (on time) | 25 (+10 if satisfaction > 90%) |
| Pitch success | 30 |
| Pitch fail | 5 |
| Research a species | 20 |
| Buy equipment | 15 |
| First harvest of new species | 50 (one-time) |
| New reputation star | 100 |
| Survive contamination | 10 |

### Level Curve
Formula: `xpForLevel(n) = floor(100 * n^1.8)`

| Level | Total XP Needed |
|-------|----------------|
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 900 |
| 6 | 1,500 |
| 7 | 2,500 |
| 8 | 4,000 |
| 9 | 6,000 |
| 10 | 9,000 |
| 11 | 13,000 |
| 12 | 18,000 |
| 13 | 25,000 |
| 14 | 35,000 |
| 15 | 50,000 |

Each level grants 1 skill point. Milestone levels (5, 10, 15) grant 2.

### State Additions
```js
xp: 0,
level: 1,
skillPoints: 0,
unlockedSkills: [],
researchPoints: 0,
```

### UI
- Header: Level display + XP bar
- Level-up banner (reuse milestone banner)
- "+X XP" in game log

### Save Migration
```js
if (typeof state.xp !== 'number') state.xp = 0;
if (typeof state.level !== 'number') state.level = 1;
if (typeof state.skillPoints !== 'number') state.skillPoints = 0;
if (!Array.isArray(state.unlockedSkills)) state.unlockedSkills = [];
```

### Retroactive XP (for existing saves)
```js
retroXP = totalDays * 5 + acquiredClients * 30 + milestones * 75 + researchedSpecies * 20;
```

---

## Phase 2: Skill Tree (Data + UI)
**Status**: COMPLETE (2026-04-03)  
**Files**: state.js, engine.js, ui.js, index.html, style.css

Four branches — player chooses their farm's direction.

### A. Cultivation Branch (green)
| Tier | Skill ID | Name | Cost | Lvl | Prereqs | Effect |
|------|----------|------|------|-----|---------|--------|
| 1 | cult_sterile_technique | Sterile Technique | 1 | 2 | — | -5% contamination globally |
| 1 | cult_grain_optimization | Grain Optimization | 1 | 3 | — | +15% colonization speed |
| 2 | cult_liquid_culture | Liquid Culture | 2 | 5 | cult_sterile_technique | 1 LC inoculates 4 bags free |
| 2 | cult_agar_work | Agar Isolation | 2 | 5 | cult_sterile_technique | +10% biological efficiency |
| 3 | cult_genetic_mod_yield | Yield Genetics | 2 | 8 | cult_agar_work | +15% yieldMod all species |
| 3 | cult_genetic_mod_resilience | Resilient Strains | 2 | 8 | cult_agar_work | -50% tent contam risk |
| 3 | cult_genetic_mod_temp | Thermal Tolerance | 2 | 8 | cult_agar_work | Temp ranges widen +/-5F |
| 4 | cult_exotic_strains | Exotic Genetics | 3 | 12 | cult_genetic_mod_yield | Unlock Cordyceps, Morel, Truffle |

### B. Production/Scale Branch (blue)
| Tier | Skill ID | Name | Cost | Lvl | Prereqs | Effect |
|------|----------|------|------|-----|---------|--------|
| 1 | prod_efficient_sterilize | Efficient Sterilization | 1 | 2 | — | -1hr all cycle times |
| 1 | prod_bulk_mixing | Bulk Substrate Mixing | 1 | 3 | — | Spawn up to 32 blocks |
| 2 | prod_block_machine | Block Production Machine | 2 | 5 | prod_bulk_mixing | Auto-produces 8 blocks/day |
| 2 | prod_supplier_access | Supplier Market Access | 2 | 5 | prod_efficient_sterilize | Unlocks buying ready-made materials |
| 3 | prod_buy_readymade | Ready-Made Blocks | 2 | 8 | prod_supplier_access | Buy 0% contam blocks (any strain) |
| 3 | prod_sell_equipment | Equipment Liquidation | 1 | 7 | prod_supplier_access | Sell equipment at 60% (not 50%) |
| 4 | prod_grain_producer | Grain Producer License | 3 | 12 | prod_block_machine | Passive income $50-200/week |

### C. Commercial Branch (gold)
| Tier | Skill ID | Name | Cost | Lvl | Prereqs | Effect |
|------|----------|------|------|-----|---------|--------|
| 1 | comm_haggling | Haggling | 1 | 2 | — | +$2/lb market sales |
| 1 | comm_marketing_savvy | Marketing Savvy | 1 | 3 | — | +10% pitch success |
| 2 | comm_sunday_market | Sunday Summer Market | 2 | 5 | comm_haggling | Sunday market Jun-Aug, $20 fee, 30lb cap |
| 2 | comm_restaurant_events | Restaurant Connections | 2 | 6 | comm_marketing_savvy | Clients offer one-off event contracts |
| 3 | comm_grow_kits | Grow Kit Production | 3 | 10 | comm_sunday_market | Manufacture + sell DIY kits $30-50 |
| 3 | comm_premium_pricing | Premium Brand | 2 | 9 | comm_restaurant_events | +20% contract revenue |
| 4 | comm_wholesale | Wholesale Distribution | 3 | 13 | comm_grow_kits, comm_premium_pricing | Bulk 200+ lb orders |

### D. Research/Community Branch (purple)
| Tier | Skill ID | Name | Cost | Lvl | Prereqs | Effect |
|------|----------|------|------|-----|---------|--------|
| 1 | res_gardener_network | Gardener Network | 1 | 2 | — | 2x reputation from mulch events |
| 1 | res_species_insight | Species Insight | 1 | 3 | — | -20% research cost |
| 2 | res_speaking_events | Speaking Engagements | 2 | 5 | res_gardener_network | Weekly invitations for XP + research pts |
| 2 | res_lab_equipment_1 | Lab Equipment I | 2 | 5 | res_species_insight | Research bench station |
| 3 | res_research_initiative | Research Initiative | 2 | 8 | res_speaking_events, res_lab_equipment_1 | Spend research pts on global bonuses |
| 3 | res_lab_equipment_2 | Lab Equipment II | 2 | 9 | res_lab_equipment_1 | 2x research point generation |
| 4 | res_mycology_pioneer | Mycology Pioneer | 3 | 14 | res_research_initiative | +$1000, +30% XP, prestige title |

### Skill Tree UI
- New "Skill Tree" button in Administration Dashboard
- Modal with 4-column layout (one per branch)
- Vertical chain of skill nodes per branch
- States: locked (grey), available (gold glow), unlocked (green)
- Click available node → confirmation → deducts SP
- `hasSkill(id)` helper function for checking throughout codebase

### Skill Data Structure
```js
{
  id: string,           // e.g. 'cult_liquid_culture'
  branch: string,       // 'cultivation' | 'production' | 'commercial' | 'research'
  name: string,
  description: string,
  cost: number,         // skill points
  levelReq: number,     // minimum player level
  prereqs: string[],    // skill IDs required first
  icon: string,         // emoji
  tier: number          // 1-4 for row placement
}
```

---

## Phase 3: Garage Square Footage
**Status**: COMPLETE (2026-04-03)  
**Files**: state.js, engine.js, ui.js, index.html

Replace hardcoded tent/sterilizer limits with spatial system.

### Space Constants
```js
GARAGE_BASE_SQFT: 256,  // 16x16 feet starting garage
EQUIPMENT_FOOTPRINTS: {
    'tent_4x4': 16,
    'tent_4x8': 32,
    'tent_8x8': 64,
    'sterilizer_1': 4,   // pressure cooker
    'sterilizer_2': 9,   // barrel
    'sterilizer_3': 9,
    'sterilizer_4': 6,   // autoclave (compact)
    'sterilizer_5': 12,  // industrial autoclave
    'dehydrator': 6,
    'tinctureLab': 9,
    'mulchBin': 4,
    'flowHood': 6,
    'researchBench': 9,  // Phase 5
    'blockMachine': 12   // Phase 5
}
```

### Functions
```js
getUsedSquareFeet() — sums all equipment footprints
getAvailableSquareFeet() — garageSquareFeet - used
```

### Changes
- Replace `state.tents.length >= 3` with space check
- Replace `state.sterilizers.length >= 4` with space check
- Garage panel shows space bar: `240/256 sqft`
- Selling equipment frees space
- Dynamic tent positioning on canvas

---

## Phase 4: Equipment Failures
**Status**: COMPLETE (2026-04-03)  
**Files**: state.js, engine.js, ui.js, index.html

### Failure Events
| ID | Target | Severity | Repair % | Description |
|----|--------|----------|----------|-------------|
| fan_fail | tent | minor | 10% | Exhaust fan motor burned out |
| hum_leak | tent | minor | 15% | Humidifier reservoir cracked |
| ac_compressor | garage_ac | major | 30% | A/C compressor failed |
| heater_element | garage_heat | moderate | 25% | Heating element burned out |
| barrel_leak | sterilizer | major | 40% | Steam barrel sprung a leak |
| cooker_blowout | sterilizer | catastrophic | 100% | Pressure cooker gasket blew! |
| tent_tear | tent | moderate | 20% | Tent poly sheeting torn |
| power_surge | all | major | 15% | Power surge hit the garage |

### Mechanics
- 3% daily chance, 7-day minimum cooldown
- Catastrophic = 5% of all failures (equipment destroyed, must rebuy)
- Repair modal: description, cost, repair/ignore buttons
- Handyperson trait: -15% repair cost
- Equipment age increases failure chance slightly

### Severity Effects
- **Minor**: single component disabled until repaired
- **Moderate**: disabled + 48hr contam risk spike
- **Major**: equipment fully offline
- **Catastrophic**: equipment destroyed, must replace

---

## Phase 5: Skill Effects Implementation
**Status**: COMPLETE (2026-04-03)  
**Files**: engine.js, ui.js, state.js

Wire up actual gameplay changes for each unlocked skill using `hasSkill()` checks.

### 5A: Cultivation Effects
- Contamination risk multipliers in updateGrowthAndSpoil()
- Colonization speed modifier
- New LC action button + state.liquidCultures[]
- Dynamic species stat modification
- 3 new exotic species (gated behind skill)

### 5B: Production Effects
- Sterilizer cycle time reduction
- Spawn block cap increase
- Block production machine (auto-generates)
- Supplier market enable
- Equipment resale value increase

### 5C: Commercial Effects
- Market price bonus (+$2/lb)
- Pitch success modifier
- Sunday market availability
- Restaurant event system
- Grow kit manufacturing action
- Contract revenue multiplier

### 5D: Research Effects
- Mulch reputation doubling
- Research cost reduction
- Speaking event random checks
- Research bench station + action
- Research point spending system

---

## Phase 6: Supplier Market
**Status**: COMPLETE (2026-04-03)  
**Files**: state.js, engine.js, ui.js, index.html

### State
```js
supplierMarket: {
    unlocked: false,
    inventory: [],       // refreshes weekly on Mondays
    priceModifier: 1.0   // fluctuates by season
}
```

### Inventory Examples
```js
{ type: 'grain_bag', species: 'shiitake', qty: 5, price: 25, contam: 0 }
{ type: 'sterile_block', species: 'blue', qty: 16, price: 80, contam: 0 }
{ type: 'raw_pellets', qty: 200, price: 35 }
```

### Mechanics
- 3-6 offers per week
- Prices: +15% spring, -10% winter
- 10% weekly chance of special supplier approach
- Only visible when `hasSkill('prod_supplier_access')`
- Ready-made blocks require `hasSkill('prod_buy_readymade')`

---

## Phase 7: Events System
**Status**: COMPLETE (2026-04-03)  
**Files**: engine.js, ui.js, state.js

### Restaurant Events
- Requires: `hasSkill('comm_restaurant_events')`
- 2% daily chance per acquired client
- +10-20 lbs demand, 3-day deadline, 1.5x pay
- 40 XP + 5 satisfaction on fulfillment

### Sunday Summer Market
- Requires: `hasSkill('comm_sunday_market')`
- Sundays only, June-August
- $20 booth fee, 30lb cap
- Same market selection modal flow

### Community Speaking Events
- Requires: `hasSkill('res_speaking_events')`
- 30% weekly chance (Wednesdays)
- Costs 3 labor hours
- Rewards: 50-100 XP + 10-20 research points + reputation chance

### Level 5 Sunday Market Introduction
- At level 5, if `comm_sunday_market` is unlocked: NPC approaches with dialogue
- "Hey! We run a Sunday market during summer. $20 tent fee, interested?"
- Popup with accept/decline

---

## Phase 8: Polish & Migration
**Status**: NOT STARTED  
**Files**: engine.js, state.js

### Save Migration v1 → v2
- Bump SAVE_KEY to `pixelspore_save_v2`
- Full migration block for all new properties
- Retroactive XP calculation for existing saves

### Trait Synergies (enhanced)
- Handyperson: -15% equipment cost + -15% repair cost
- Smooth Talker: +15% pitch + +5% restaurant event trigger
- Workaholic: +18 labor hours + +10% XP from all sources

### New Milestones
- Reach Level 5, 10, 15
- Unlock all skills in one branch
- Sell first grow kit
- Reach 500 sqft garage

### Balance Targets
- Level 5 reachable in ~2 hours of play
- Level 10 reachable in ~6-8 hours
- Level 15 is endgame (20+ hours)
- Equipment failure should cost 1-5% of weekly revenue on average
- Supplier market prices should be 20-30% more expensive than DIY

---

## Implementation Order Priority
1. **Phase 1** — XP/Leveling (required by everything else)
2. **Phase 2** — Skill Tree data + UI (required by Phases 5-7)
3. **Phase 3** — Garage sqft (independent, can parallel with 2)
4. **Phase 4** — Equipment failures (independent)
5. **Phase 5** — Skill effects (needs Phase 2 done)
6. **Phase 6** — Supplier market (needs Phase 5B)
7. **Phase 7** — Events (needs Phase 5C/5D)
8. **Phase 8** — Polish (last)
