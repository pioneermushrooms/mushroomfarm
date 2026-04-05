# Phase 2: Skill Tree — COMPLETE

## What was implemented

### state.js
- `SKILL_TREE` — 32 skills across 4 branches (cultivation/production/commercial/research), 4 tiers each
- Each skill: `{ id, branch, tier, name, cost, levelReq, prereqs[], desc, icon }`
- `BRANCH_META` — branch colors + Gemini icon filenames

### ui.js
- `_skillImageMap` — maps skill IDs to Gemini-generated PNG filenames (Tier 1 complete, Tier 2-4 use emoji fallback)
- `renderSkillTree()` — builds 4-column grid with branch headers, tier labels, connector lines, skill nodes
- `getSkillState(skill)` — returns 'unlocked' | 'available' | 'available-no-sp' | 'locked'
- `unlockSkill(skillId)` — deducts SP, pushes to unlockedSkills, grants 10 XP bonus
- SP badge on Skill Tree button (shows count when > 0)

### style.css
- `.skill-tree-modal` — dark cyberpunk background with purple glow box-shadow
- `.skill-branch` — 4-column grid cells with branch-colored CSS variables
- `.skill-node` states: `.locked` (dim), `.available` (pulsing glow), `.unlocked` (green checkmark)
- `.skill-connector` — vertical lines between tiers, lit up when prereq is owned
- `@keyframes skillPulse` — breathing glow on available nodes
- Hover scale effect on available nodes

### index.html
- Skill Tree modal (`modal-skill-tree`) at z-index 2800
- "🧠 Skill Tree" button in Administration Dashboard with SP badge

### Gemini Assets Used
- 4 branch header icons (branch_icon_*.png)
- 8 Tier 1 skill node icons (skill_*.png)
- Remaining 24 skills use emoji fallback until Gemini generates icons

## What's NOT implemented yet
- Skill EFFECTS (Phase 5) — unlocking a skill currently only tracks it in state, doesn't modify gameplay
- `hasSkill()` is ready in engine.js — Phase 5 will add the actual gameplay modifications
