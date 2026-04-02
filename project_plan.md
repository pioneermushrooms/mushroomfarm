# Visionary Plan: Pixel Spore Simulator 🍄

We are evolving our prototype from a simple garage clicker into a deep, commercial **Gourmet Mushroom Business Simulator**. Below is the outline for the long-term vision of the game. It mathematically models genuine mycological processes while providing a satisfying upgrade loop.

## User Review Required

> [!IMPORTANT]
> This is a macro-level design document! Please review the outline below. In particular, review the new **Phase 4** section at the very bottom and let me know if you approve those exact mechanics.

---

## 1. Facility & Spatial Expansion
You begin in an unfinished garage and must buy your way into professional commercial real estate.

- **The Garage (Early Game)**: 
  * Limited to a simple Still Air Box (SAB) and single 4x4 tents.
  * Tents can be physically upgraded on the canvas: `4x4` → `4x8` → `8x8`.
  * Spatial limitation: You eventually run out of pixel floor space to add more 8x8 tents.
- **The Warehouse (Mid Game)**: 
  * Unlocks the ability to dedicate entire canvas rooms to specific tasks. 
  * Instead of tents, you build automated climate-controlled *Fruiting Rooms*. Unlocks walk-in refrigerators to slow mushroom spoilage.
- **The Mega-Facility (End Game)**: 
  * Cleanrooms, automated robotic harvesting, and massive pallet systems.

## 2. The Biological Pipeline (The "Tech Tree")
Currently, clicking "Inoculate" magically grows mushrooms. We will expand this into the real 3-step mycological process, opening up new interactive stations for the operator:

1. **The Lab (Agar & Liquid Culture)**: Isolate genetics. Upgrading your lab (SAB → Laminar Flow Hood → Cleanroom) lowers your "Contamination Risk" (which ruins crops).
2. **Incubation Room (Grain Spawn)**: Spawn run phase. Sacks of grain turn white. Keeping this room perfectly heated speeds this up.
3. **Fruiting Chamber (Tents/Rooms)**: Substrate blocks are moved here where they require high humidity and fresh air exchange to fruit.

## 3. Mushroom Species & Market Dynamics
Different species cater to different demands and require different biological timelines.

- **Blue/Pink Oysters**: The easiest. Fast colonization, fast fruiting. Low profit margin, but great for early cash flow.
- **Golden Oysters**: Slightly more premium, unlocks restaurant sales.
- **Lion's Mane**: The mid-game king. Slower to grow, but sells for a high culinary price and unlocks the **Medicinal Branch**.
- **Shiitake**: Requires longer incubation ("browning" phase) but commands massive profits.
- **Reishi / Turkey Tail**: Purely medicinal. Tastes like wood raw, but is the backbone of the Tincture facility.

## 4. Value-Add Business Model (Processing)
Selling raw mushrooms maxes out quickly. To become a millionaire, you must process the harvest.

- **Farmers Market / Culinary Route**: Focus on perfect fresh yields for local chefs.
- **Grow Kit Production**: Stop fruiting the blocks yourself! Just sell the colonized blocks directly to beginners on the internet for passive income.
- **The Dehydrator Facility**: Turn unsold/ugly mushrooms into highly-shelf-stable powders and seasonings.
- **The Extraction Lab (Tinctures)**: The ultimate money maker. Requires Lion's Mane or Reishi. Convert bushels of mushrooms into tiny dropper bottles that sell for $40 each.

## 5. Marketing, Sales & Market Share 📊
To sell your gourmet mushrooms at scale, you can't just passively wait. You must actively invest in **Marketing Campaigns**.
- **The Sampling Model**: Pitching to a new restaurant or securing a grocery account requires an upfront investment of both **Cash** and **Mushrooms** (you have to give them a sample!).
- **Success Rates**: Every marketing pitch has a % chance of success. If it fails, you lose the sample and the money. If it succeeds, your passive "Market Demand" goes up permanently.
- **Species Synergy**: Having a wide variety of species (Oysters, Lion's Mane, Shiitake) mathematically increases your overall Market Exposure and the success rate of acquiring premium chef clients.

## 6. Automation & Staffing 🧑‍🌾
As your farm grows, a single operator can't do it all.
- **Farm Hands**: Hire additional workers (new sprites walking around the facility!) and assign them to specific zones (e.g., "Worker A only harvests", "Worker B only inoculates").
- **Farmers Market Worker**: Hire a dedicated salesperson! Instead of you manually clicking "Sell", this worker automatically hauls inventory to the weekend market, generating a steady stream of secondary income while you focus on the lab.

## Phase 3: Multiple Tents & Tent Sizing ⛺
*Status: Completed*

## Phase 4: Market Dynamics & Sales Automation 📈
*Status: Completed*

## Phase 5: Spoilage, Shelf Stability & Value-Add Processing 🧪
*Status: Completed*

## Phase 6: The 3/4 Perspective & Visual Overhaul 🎨
*Status: Completed*

The current strict top-down garage layout is mathematically sound but visually claustrophobic and unpolished. To elevate the game to a premium feel (like *Animal Crossing* or *Overcooked*), we are completely replacing the graphics engine and asset pipeline.

### 1. The Rendering Engine Refactor
- A 3/4 isometric perspective is **not too intensive** for our custom canvas, but it changes everything about how we draw objects!
- **Y-Sorting (Depth)**: We will rewrite `renderCanvas()` to collect all entities (tents, stations, operators) into a single array every frame, sort them by their `Y` coordinates, and paint them back-to-front. This ensures sprites properly overlap each other, creating the illusion of 3D depth on a 2D canvas.

### 2. The Color Palette & Vibe
- We will abandon the bleak gray asphalt look entirely.
- The new floor will be warm hardwood or clean bright laboratory/greenhouse tiles.
- UI elements (buttons, panels) will be updated with more colorful borders to match the vibrant aesthetic.

### 3. Sprite Regeneration & Chroma-Keying
- Generating assets with pure PNG transparency via AI is historically difficult. To ensure the new sprites perfectly overlay the new vibrant floor without clashing background boxes, we will use a classic game-dev trick: **Chroma-Keying**.
- We will generate all new assets (Tents, Dehydrator, Market, Operator) on a pure Magenta (`#FF00FF`) background.
- I will introduce a pre-processing function in `app.js` that scans the image pixels on load and mathematically converts any Magenta pixel into a `0` Alpha (transparent) pixel.
- This guarantees flawless transparent borders around our new 3/4 perspective pixel art!

> [!IMPORTANT]
> How does this plan for Phase 6 sound? Are you comfortable with me generating all new sprites on a magenta background and rewriting the canvas engine to handle Y-sorting before we move on to actual gameplay expansions? Let me know and I will begin the art overhaul!

## Phase 7: The Biological Pipeline (Incubation & Contamination) 🧫
*Status: Completed*

Currently, clicking "Inoculate" instantly magically starts a mushroom fruiting block inside a tent. We are now going to implement the true biological pipeline of mushroom farming: **Grain Spawn Incubation**.

### 1. The Incubation Pipeline
- **New Step**: Before a tent can grow mushrooms, you must first create "Grain Spawn".
- When you click "Inoculate Grain", the Operator walks to the Flow Hood. Instead of filling a tent, they produce a **Grain Bag** of the selected species.
- Grain bags are placed into a new UI panel called the **Incubation Shelf**. 
- They take time to "colonize" (turn white). Different species colonize at different speeds.

### 2. Spawning to Bulk (Fruiting)
- Tents NO LONGER have an "Inoculate" button.
- They now have a **"Spawn to Bulk"** button. The operator must grab a fully-colonized Grain Bag from the Incubation Shelf and walk it to the tent to start the fruiting process you currently know.

### 3. The Contamination Mechanic 🦠
- Mushroom farming is a battle against mold (Trichoderma). 
- Every Grain Bag has a permanent **Contamination Risk %** rolled when it's created.
- If a bag contaminates during the Incubation phase, it turns green and halts progress permanently. You must click a "Trash" button to throw it away, wasting the time and money.
- **Upgrades**: You currently start with a basic *Still Air Box* (SAB) which has a high contamination rate (e.g. 25%). You will be able to upgrade your lab equipment to a **Laminar Flow Hood** ($800) to drop contamination risk down to 5%!

### 4. UI Adjustments
- Add an "Incubation Shelf" list in the Right Panel showing your active Grain Bags and their % colonization progress.
- Modify the "Commands" block to feature both "Inoculate Grain" and "Spawn to Bulk" (tent) buttons separately.

> [!IMPORTANT]
> How does Phase 7 sound? Does breaking the growth cycle into two separate steps (Incubation -> Fruiting) sound satisfying? Are you ready to introduce the harsh reality of Contamination? Let me know and I will begin execution!

## Phase 8: Business Reputation & Waste Management ♻️
*Status: Completed*

### 1. The Business Profile (5-Star Rating System)
- Add a new **Reputation Rating** UI element to the Top Header (e.g. ⭐⭐⭐★★).
- The rating will dynamically boost passive metrics (e.g. increasing raw Market Demand over time, or boosting the raw sale value of mushrooms).

### 2. The Mulch Bin ($150 Upgrade)
- Add a "Buy Mulch Bin ($150)" to the Upgrades Shop.
- When purchased, it spawns a physical compost/mulch bin on the canvas edge.
- The **Discard Mold** action is rewritten: instead of throwing bags away into the void, the Operator hauls contaminated/moldy grain bags directly to the Mulch Bin.
- We will also add a **Clear Spent Block** mechanic! After harvesting an 8x8 tent a few times, the block goes "dead" and must be cleared out to the Mulch Bin to restart.
- **The Payoff**: Local gardeners periodically swing by to take your mulch. Every time mulch is removed from the bin, there is a chance they leave a **5-star review** on your business profile, raising your overall Rating! 
- This brilliantly transforms a purely negative game state (Trichoderma Mold) into an alternative secondary resource.

> [!IMPORTANT]
> A massive feature expansion request was logged! Below is the proposed macro-roadmap to stagger these heavy simulation mechanics so they stay fun and manageable.

## Phase 9: Substrate Pipeline & Research 🧬
*Status: Completed*

### 1. The Research Database
- A new **Mushroom Encyclopedia** UI panel.
- You must pay to "Research" a species before you can inoculate it. Once researched, its hidden stats are permanently revealed (Ideal Temp, Humidity, Yield, Spoilage time).

### 2. Sterilization & Substrate Prep
- "Spawning to Bulk" will no longer be free magically. 
- You must buy raw Bulk Wood Pellets. 
- You must sterilize them. You start with a **Pressure Cooker** (can only prep a tiny bit at a time). Upgrading to a **Steam Barrel** allows processing massive bulk.
- To use a tent, you must combine 1 Colonized Grain Bag + 1 Sterilized Substrate Block.

## Phase 10: The Calendar, Spoilage UI, & Seasons ☀️❄️
*Status: Completed*

### 1. The Clock & Calendar System 📅
- Introduce a persistent **Calendar** mechanic (e.g., Year 1, Spring, Day 14).
- Time will pass fluidly in the background, driving the seasonal cycles (Winter, Spring, Summer, Fall).
- The current Season dictate the *Ambient Garage Temperature*. If it's too cold in Winter, mushrooms incubate slowly. If it's too hot in Summer, growth halts or spoilage spikes.

### 2. Walk-in Cooler & Batch Visualization 🧊
- Currently, "Yield Inventory" is just a text number. We will build a visual UI for your **Walk-in Cooler**.
- Every time you harvest a tent, it creates a visual "Batch Card" in your cooler.
- **Batch Cards** will feature: An image of the specific mushroom, the lbs harvested, the exact Date of Harvest, and a visual **Spoilage Progress Bar** draining to zero.

### 3. Tent Microclimates & Hardware
- Tents receive internal Temp/Humidity tracking. If the tent falls outside a species' ideal range, growth stalls!
- **Hardware Upgrades**: If your chosen species prefers 90% humidity, you must buy a **Humidifier**.
- **Scale Requirements**: 8x8 tents will require massive **Industrial Humidifiers** (ultrasonic discs/valves). Buy **Exhaust Fans** to boost growth rate, or an **Air Conditioner** to fight the Summer heat.

### 4. The Electricity Bill ⚡
- Every piece of hardware you run in your tents constantly drains an **Energy Cost** ticker.
- Buying a **CO2 Sensor** optimizes fan running times, permanently reducing energy strain.

## Phase 11: B2B Networking & Client Roster 🤝
*Status: Completed*

## Phase 12: Immersive Station Callouts 🎬
*Status: Completed*

## Phase 13: The Startup Screen & Tiered Tech Trees 🚀
*Status: Planning*

### 1. The Main Menu Splash Screen
Before the game loop begins, we will intercept the player with a `screen-splash` overlay.
- **Funding Simulator**: Players can manually set their starting capital (e.g., bootstrapper with $500 vs VC-funded with $50,000).
- **Geographic Location Selector**: Players choose a physical region (e.g., *Pacific Northwest*, *Desert Southwest*, *Northeast*). This dramatically alters the underlying base `ambientTemp` and `humidity` ranges for the seasons, forcing different microclimate strategies.
- **Start Simulation button** begins the initialization.

### 2. Deep Tiered Equipment Upgrades
The flat upgrade buttons will be removed in favor of a massive **Equipment Upgrades** modal tree.
Instead of a single linear upgrade, components will feature a list of sizes/tiers.
- **Sterilization Tree**: Pressure Cooker (Base) -> 55-Gal Steam Barrel -> Concrete Roller -> Industrial Warehouse Press.
- **Microclimate Tree**: Household Humidifier -> Commercial Ultrasonic Humidifier -> HVAC System.
- Purchasing these completely re-routes the capacity and cost metrics.

### 3. Harvest Sprite Visuals
When a Tent is harvested, the `tent_34.png` cutscene plays. We will composite the actual harvested mushroom sprite (e.g., the high-res Lion's Mane or Shiitake) dynamically over the cutscene so you can visibly admire *exactly* what was just grown and picked!

### 4. Audio Playlist Automation 🎶
We will implement an event listener attached to the background music `<audio>` tag. When `bgm1.mp3` completes, it will dynamically swap the `src` to `bgm2.mp3`, then `bgm3.mp3`, creating a continuous loop of your custom tracks! 

## Phase 15: Modular Menus & Audio Fixes 🗂️
*Status: Planning*

### Audio Autoplay Policy Fix
Modern browsers completely block background `<audio>` from playing until the user physically interacts with the DOM.
- We will bind the `bgm.play()` function directly to the **[INITIALIZE FARM]** click handler. The moment you start the simulation, the audio queue drops in automatically.

### Dedicated Sidebar Menus
Instead of forcing every tech tree into one centralized modal, we will completely separate your company's administration sectors onto the main page viewport!
The right-hand panel will feature 4 primary modular Administration Buttons:
1. **[🍄 Strain Research]**: Opens a categorized list specifically for researching and unlocking *Golden Oysters*, *Shiitake*, *Lion's Mane*.
2. **[⛺ Facilities & Climate]**: Opens the list strictly governing new Tent purchases, Tent Expansions (4x8, 8x8), and CO2 Sensors.
3. **[🔬 Lab & Substrate Ops]**: Opens the list holding your Sterilizer Tiers (Pressure Cooker -> Barrel -> Cement Roller) and Flowhood options.
4. **[🏭 Commercial Logistics]**: Opens the list for your Market Salesperson, Dehydrating Arrays, and Extractor Labs.

> [!CAUTION]
> This will wipe out the current generic `[⚙️ Tiered Equipment Modal]` button and separate your upgrades into distinct, hyper-focused department UI trees perfectly formatted for complex business sims! 
