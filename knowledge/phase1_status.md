# Phase 1: XP & Leveling — COMPLETE

## What was implemented

### state.js
- `state.xp` (number, starts 0)
- `state.level` (number, starts 1)  
- `state.skillPoints` (number, starts 0)
- `state.unlockedSkills` (array of skill ID strings)
- `state.researchPoints` (number, for future Research branch)
- `state.speciesFirstHarvest` (array of species names, tracks one-time bonus XP)
- `xpForLevel(n)` — formula: `floor(100 * n^1.8)`
- `MAX_LEVEL = 15`
- `XP_REWARDS` — object with all XP values per action

### engine.js
- `grantXP(amount, reason)` — adds XP, checks level-up, grants skill points (1 per level, 2 at 5/10/15), calls `showLevelUpBanner()`, workaholic trait gives +10% XP
- `hasSkill(skillId)` — returns bool, checks `state.unlockedSkills.includes(id)`
- Save migration: old saves get retroactive XP based on totalDays, clients, milestones, research

### XP Hook Locations (engine.js)
- Harvest: line ~547 (10 + flushes*5 XP)
- First species harvest: line ~551 (50 XP one-time)
- Contract fulfill: line ~605 (25-35 XP)
- Market sell: line ~677 (5 per 10 lbs)
- Pitch success: line ~579 (30 XP)
- Pitch fail: line ~582 (5 XP)
- Dehydrate: line ~591 (5 XP)
- Extract: line ~597 (10 XP)
- Discard mold: line ~503/508 (10 XP)
- Milestone: line ~206 (75 XP)

### XP Hook Locations (ui.js)
- Research species: line ~705 (20 XP)
- Buy equipment: line ~323 (15 XP)
- New rep star: line ~841 (100 XP)

### ui.js
- `showLevelUpBanner(level, sp)` — purple-themed milestone banner
- `updateUI()` renders: level number, current/next XP, XP progress bar

### index.html
- Header: `Lv.X 0/100 XP` display
- 6px purple gradient XP bar below header
- Cache busters at v4

## Ready for Phase 2
- `hasSkill()` is wired and ready
- Skill tree data structure goes in state.js
- Skill tree modal + spending UI goes in ui.js + index.html
- Gemini has generated branch icons, user wants cyberpunk/Arc Raiders style ladder UI
