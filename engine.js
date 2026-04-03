// ── Log ──────────────────────────────────────────────────────────────────────
function logMsg(msg, type) {
    const p = document.createElement('p');
    p.textContent = `> ${msg}`;
    p.className = type;
    elLog.prepend(p);
    if (elLog.children.length > 5) elLog.removeChild(elLog.lastChild);
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_TO_SEASON = [3,3,0,0,0,1,1,1,2,2,2,3]; // Dec-Feb=Winter, Mar-May=Spring, etc.

function getGameDate() {
    if (!state.calendarStart) return null;
    const d = new Date(state.calendarStart);
    d.setDate(d.getDate() + state.totalDays);
    d.setHours(state.hour, 0, 0, 0);
    return d;
}

function getGameDateStr() {
    const d = getGameDate();
    if (!d) return `Day ${state.totalDays} - ${state.hour < 10 ? '0' + state.hour : state.hour}:00`;
    const dow = DAY_NAMES[d.getDay()];
    const mon = MONTH_NAMES[d.getMonth()];
    const day = d.getDate();
    const yr = d.getFullYear();
    const hStr = state.hour < 10 ? '0' + state.hour : state.hour;
    return `${dow}, ${mon} ${day} ${yr} - ${hStr}:00`;
}

function getSeasonFromDate() {
    const d = getGameDate();
    if (!d) return state.season;
    return MONTH_TO_SEASON[d.getMonth()];
}

function getDayOfWeek() {
    const d = getGameDate();
    if (!d) return 0;
    return d.getDay(); // 0=Sun, 6=Sat
}

// ── Demand helpers ────────────────────────────────────────────────────────────
function getEffectiveDemand() {
    let d = 0;
    if (getDayOfWeek() === 6) d += (state.holidaySurge ? 200 : 20); // Saturday market
    state.clientRoster.forEach(c => {
        if (c.acquired && c.daysSinceFulfillment >= c.contractDays) d += c.contractLbs;
    });
    return d;
}

function updateDemandDrift() {
    state.dailySalesVolume = 0;
}

// ── Tent microclimate ─────────────────────────────────────────────────────────
function getTentGrowthMod(tent) {
    const sd = state.speciesData[tent.species];
    if (!sd) return 1.0;
    const tempOk  = tent.temp >= sd.tMin && tent.temp <= sd.tMax;
    const humRatio = Math.min(tent.humidity / sd.hMin, 1.0);
    const tempMod  = tempOk ? 1.0 : 0.2;
    
    let co2Mod = 1.0;
    if (tent.co2 > 1000) {
        co2Mod = Math.max(0, 1.0 - ((tent.co2 - 1000) / 1000)); // hits 0 at 2000ppm
    }
    return tempMod * humRatio * co2Mod;
}

function updateTentMicroclimates(dt) {
    state.tents.forEach(tent => {
        const sd = state.speciesData[tent.species];
        let targetTemp = state.ambientTemp;
        if (sd) {
            if (state.garageAC && state.ambientTemp > sd.tMax) targetTemp = sd.tMax;
            if (state.garageHeater && state.ambientTemp < sd.tMin) targetTemp = sd.tMin;
        } else {
            if (state.garageAC) targetTemp = Math.min(targetTemp, 68);
            if (state.garageHeater) targetTemp = Math.max(targetTemp, 72);
        }
        tent.temp += (targetTemp - tent.temp) * Math.min(dt * 0.5, 1);
        
        let humTarget = 40;
        if (tent.hw.hum) humTarget = sd ? sd.hMin : 90;
        tent.humidity += (humTarget - tent.humidity) * Math.min(dt * 0.2, 1);

        if (tent.co2 === undefined) tent.co2 = 400;
        if (tent.isGrowing && tent.currentCrop > 0) {
            const fillRatio = tent.currentCrop / tent.capacity;
            tent.co2 += Math.pow(fillRatio, 2) * 500 * dt; 
        }
        if (tent.hw.fan) {
            tent.co2 -= (tent.co2 - 400) * Math.min(dt * 2.0, 1);
            if (tent.co2 < 400) tent.co2 = 400;
        }
    });
}

// ── Save / Load ───────────────────────────────────────────────────────────────
function saveGame() {
    const saveData = { version: 1, timestamp: Date.now(), state: JSON.parse(JSON.stringify(state)) };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        logMsg('Game saved!', 'success');
    } catch(e) {
        logMsg('Save failed (storage full?).', 'error');
    }
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { logMsg('No save found.', 'error'); return false; }
    try {
        const saveData = JSON.parse(raw);
        if (saveData.version !== 1) { logMsg('Save version mismatch.', 'error'); return false; }
        Object.assign(state, saveData.state);
        if (state.demandBase === undefined) state.demandBase = state.demand || 10;
        if (typeof state.totalDays !== 'number') state.totalDays = (state.day || 1) + ((state.season || 0) * 30);
        if (!state.calendarStart) {
            const now = new Date();
            now.setDate(now.getDate() - state.totalDays);
            state.calendarStart = now.getTime();
        }
        state.season = getSeasonFromDate();
        if (state.pendingClient) {
            state.pendingClient = state.clientRoster.find(c => c.id === state.pendingClient.id) || null;
        }
        operator.x = 200; operator.y = 300;
        operator.targetX = 200; operator.targetY = 300;
        operator.actionQueue = null;
        salesperson.x = 80; salesperson.y = 300;
        salesperson.state = 'idle'; salesperson.timer = 10;
        updateSpeciesDropdown();
        if (typeof generateOperatorSprite === 'function') keyedImgs.op = generateOperatorSprite();
        updateUI();
        return true;
    } catch(e) {
        logMsg('Save data corrupted.', 'error');
        return false;
    }
}

function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

// ── Win / Lose ────────────────────────────────────────────────────────────────
const MILESTONES = [
    { id: 'first_harvest',  label: 'First Harvest',        check: () => getTotalInventory() > 0,                                              reward: 'Welcome to the farm life.' },
    { id: 'cash_500',       label: 'Seed Capital',         check: () => state.money >= 500,                                                   reward: '+$200 grant',              action: () => { state.money += 200; } },
    { id: 'cash_5000',      label: 'Breaking Even',        check: () => state.money >= 5000,                                                  reward: '+5 Base Market Demand',    action: () => { state.demandBase += 5; } },
    { id: 'rep_3',          label: 'Trusted Supplier',     check: () => state.reputation >= 3,                                                reward: 'Reputation builds demand.' },
    { id: 'all_species',    label: 'Full Spectrum Farm',   check: () => Object.values(state.speciesData).every(sd => sd.isResearched),        reward: '+$500 prestige bonus',     action: () => { state.money += 500; } },
    { id: 'cash_50000',     label: 'Commercial Operation', check: () => state.money >= 50000,                                                 reward: 'Farm complete! Keep growing.', action: () => { state.gameWon = true; showWinScreen(); } }
];

function checkMilestones() {
    MILESTONES.forEach(m => {
        if (!state.milestonesAchieved.includes(m.id) && m.check()) {
            state.milestonesAchieved.push(m.id);
            if (m.action) m.action();
            logMsg(`MILESTONE: "${m.label}" — ${m.reward}`, 'success');
            showMilestoneBanner(m.label, m.reward);
        }
    });
}

function showMilestoneBanner(label, reward) {
    const banner = document.getElementById('milestone-banner');
    document.getElementById('milestone-label').textContent = label;
    document.getElementById('milestone-reward').textContent = reward;
    banner.style.display = 'block';
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => { banner.style.display = 'none'; }, 4000);
}

function checkWinLoseConditions() {
    if (!gameStarted || state.gameOver || state.gameWon) return;
    checkMilestones();
    if (state.money < 0) {
        const canRecover = getTotalInventory() > 0 ||
                           state.tents.some(t => t.isGrowing && t.currentCrop > 1) ||
                           state.incubationBatches.some(b => b.colonization >= 100 && !b.isContaminated);
        if (!canRecover) {
            state.gameOver = true;
            showBankruptcyScreen();
        }
    }
}

function showBankruptcyScreen() {
    const el = document.getElementById('modal-bankrupt');
    document.getElementById('bankrupt-stats').innerHTML =
        `Days in operation: ${state.totalDays}<br>` +
        `Peak reputation: ${'★'.repeat(state.reputation)}<br>` +
        `Clients secured: ${state.clientRoster.filter(c => c.acquired).length}`;
    el.style.display = 'flex';
}

function showWinScreen() {
    const el = document.getElementById('modal-win');
    document.getElementById('win-stats').innerHTML =
        `Final balance: $${state.money.toFixed(2)}<br>` +
        `Reputation: ${'★'.repeat(state.reputation)}<br>` +
        `Clients: ${state.clientRoster.filter(c => c.acquired).length} / ${state.clientRoster.length}`;
    el.style.display = 'flex';
}

// ── Core Loop ─────────────────────────────────────────────────────────────────
function gameLoop(currentTime) {
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (state.gameOver) {
        renderCanvas();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Note: Sleep fast-forward is now handled instantly via UI blocking iteration.
    
    if (typeof isPaused !== 'undefined' && isPaused) {
        renderCanvas();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Game Speed Multiplier
    dt *= (state.speedMultiplier || 1);

    updateTime(dt);
    updatePhysics(dt);
    updateGrowthAndSpoil(dt);
    updateTentMicroclimates(dt);
    updateSalesperson(dt);
    updateGardeners(dt);
    updateOperatorAutomation();
    renderCanvas();
    updateUI();

    requestAnimationFrame(gameLoop);
}

// ── Time & Seasons ────────────────────────────────────────────────────────────
function updateTime(dt) {
    // Migrate legacy single sterilizer
    if (!state.sterilizers || state.sterilizers.length === 0) {
        state.sterilizers = [{ id: 1, level: state.sterilizerLevel || 1, busyTime: state.sterilizerBusyTime || 0, pendingBlocks: state.sterilizerPendingBlocks || 0 }];
    }
    // Tick all sterilizer units
    state.sterilizers.forEach(s => {
        if (s.busyTime > 0) {
            s.busyTime -= dt;
            if (s.busyTime <= 0) {
                state.sterileBlocks += (s.pendingBlocks || 1);
                logMsg(`Sterilizer #${s.id} done! +${s.pendingBlocks} Sterile Blocks.`, 'success');
                s.busyTime = 0;
                s.pendingBlocks = 0;
                if (typeof updateUI === 'function') updateUI();
            }
        }
    });

    state.timeTimer += dt;
    if (state.timeTimer >= 1.0) {
        state.timeTimer -= 1.0;
        state.hour++;
        if (state.hour >= 24) {
            state.hour = 0;
            state.totalDays++;
            state.laborHours = state.charTrait === 'workaholic' ? 18 : 16;

            // Backfill calendarStart if missing (old save or first load)
            if (!state.calendarStart) {
                const now = new Date();
                now.setDate(now.getDate() - state.totalDays);
                state.calendarStart = now.getTime();
            }

            // Sync state.day with calendar day-of-month
            const gd = getGameDate();
            if (gd) state.day = gd.getDate();

            // Derive season from calendar month
            const prevSeason = state.season;
            state.season = getSeasonFromDate();
            if (state.season !== prevSeason) {
                logMsg(`A new season has begun: ${SEASONS[state.season]}!`, 'success');
            }

            // Saturday market day popup
            if (getDayOfWeek() === 6) {
                if (Math.random() < 0.25) {
                    state.holidaySurge = true;
                    logMsg(`HOLIDAY SURGE! Farmers market buying absolutely everything today!`, 'info');
                } else {
                    state.holidaySurge = false;
                }
                if (typeof showMarketDayBanner === 'function') showMarketDayBanner();
            } else {
                state.holidaySurge = false;
            }

            // Electricity bill at midnight
            let dailyWatts = 0;
            state.tents.forEach(t => {
                if (t.hw) {
                    if (t.hw.hum) dailyWatts += 50;
                    if (t.hw.fan) dailyWatts += 20;
                }
            });
            if (state.garageAC)     dailyWatts += 300;
            if (state.garageHeater) dailyWatts += 150;
            let energyCost = dailyWatts * 0.01;
            if (state.hasCO2) energyCost *= 0.8;
            if (energyCost > 0) {
                state.money -= energyCost;
                logMsg(`Paid Daily Electricity Bill: -$${energyCost.toFixed(2)}`, 'error');
            }

            if (state.hasSalesperson) {
                state.money -= 100;
                logMsg(`Paid Daily Salesperson Salary: -$100.00`, 'error');
            }

            // Client Contracts Satisfaction tracking
            state.clientRoster.forEach(c => {
                if (c.acquired) {
                    if (typeof c.daysSinceFulfillment !== 'number') c.daysSinceFulfillment = 0;
                    c.daysSinceFulfillment++;
                    if (c.daysSinceFulfillment > c.contractDays) {
                        const penalty = c.strictness * 10;
                        c.satisfaction -= penalty;
                        logMsg(`Missed contract delivery for ${c.name}! Satisfaction dropped to ${Math.floor(c.satisfaction)}%.`, 'error');
                        if (c.satisfaction < 50) {
                            c.acquired = false;
                            c.satisfaction = 100;
                            c.daysSinceFulfillment = 0;
                            state.reputation = Math.max(1, state.reputation - 1);
                            logMsg(`${c.name} CANCELED the contract for poor performance! Reputation lost!`, 'error');
                        }
                    } else if (c.daysSinceFulfillment <= c.contractDays && c.satisfaction < 100) {
                        c.satisfaction = Math.min(100, c.satisfaction + 1);
                    }
                }
            });

            updateDemandDrift();
            checkWinLoseConditions();
            saveGame();
        }
    }

    // Regional ambient temperature (diurnal curve)
    const climateProfiles = {
        'pnw':       [55, 70, 55, 45],
        'desert':    [70, 95, 75, 60],
        'northeast': [50, 80, 50, 25]
    };
    const regionName = state.region || 'pnw';
    const profile = climateProfiles[regionName] || climateProfiles['pnw'];
    const base = profile[state.season];
    const timeOffset = (state.hour - 8) * (Math.PI / 12);
    const diurnal = Math.sin(timeOffset) * 15;
    state.ambientTemp = Math.floor(base + diurnal);
}

// ── Gardeners ─────────────────────────────────────────────────────────────────
function updateGardeners(dt) {
    if (!state.hasMulchBin || state.mulchInventory <= 0) return;
    state.gardenerTimer -= dt;
    if (state.gardenerTimer <= 0) {
        const taken = Math.min(5, state.mulchInventory);
        state.mulchInventory -= taken;
        logMsg(`Gardeners took ${taken} bags of Mulch.`, 'info');
        state.gardenerTimer = 30 + (Math.random() * 30);
    }
}

function updateOperatorAutomation() {
    // Background automation for loading tents was requested to be manual via UI button.
    return;
}

// ── Physics / Operator ────────────────────────────────────────────────────────
function updatePhysics(dt) {
    if (operator.actionQueue && operator.actionQueue.state === 'moving') {
        const dx = operator.targetX - operator.x;
        const dy = operator.targetY - operator.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) {
            operator.x = operator.targetX; operator.y = operator.targetY;
            operator.actionQueue.state = 'working';
            operator.actionQueue.timer = beginActionCutscene(operator.actionQueue);
        } else {
            operator.x += (dx / dist) * operator.speed * dt;
            operator.y += (dy / dist) * operator.speed * dt;
            operator.isMoving = true;
        }
    } else { operator.isMoving = false; }

    if (operator.actionQueue && operator.actionQueue.state === 'working') {
        operator.actionQueue.timer -= dt;
        if (operator.actionQueue.timer <= 0) operator.actionQueue.state = 'arrived';
    }

    if (operator.actionQueue && operator.actionQueue.state === 'arrived') {
        const t = operator.actionQueue.task;

        if (t === 'inoculateGrain') {
            state.money -= state.costs.grain;
            const willContam = Math.random() < (state.labLevel === 1 ? 0.25 : 0.05);
            state.incubationBatches.push({
                id: state.bagIdCounter++, species: operator.actionQueue.species,
                colonization: 0, isContaminated: false, doomed: willContam
            });
            logMsg(`Inoculated grain bag (${operator.actionQueue.species}) for $10.`, 'info');
        }
        else if (t === 'sterilize') {
            state.rawPellets -= operator.actionQueue.required;
            const unit = state.sterilizers.find(s => s.id === operator.actionQueue.unitId);
            if (unit) {
                const times = {1: 12, 2: 12, 3: 12, 4: 6, 5: 8};
                const cycleTime = times[unit.level] || 12;
                unit.busyTime = cycleTime;
                unit.pendingBlocks = operator.actionQueue.blockCap || 1;
                logMsg(`Sterilizer #${unit.id} loaded with ${unit.pendingBlocks} blocks. Done in ${cycleTime}h.`, 'info');
            }
        }
        else if (t === 'spawnBulk') {
            const bagIndex = state.incubationBatches.findIndex(b => b.id === operator.actionQueue.bagId);
            if (bagIndex > -1) {
                const bag = state.incubationBatches[bagIndex];
                state.incubationBatches.splice(bagIndex, 1);
                const consumed = operator.actionQueue.blocksConsumed || 16;
                state.sterileBlocks -= consumed;
                if (state.sterileBlocks < 0) state.sterileBlocks = 0;
                
                if (!state.blockBatches) state.blockBatches = [];
                const contamRisks = {1: 0.15, 2: 0.10, 3: 0.05, 4: 0.02, 5: 0.0};
                const bestLevel = state.sterilizers ? Math.max(...state.sterilizers.map(s => s.level)) : (state.sterilizerLevel || 1);
                const risk = contamRisks[bestLevel] || 0.15;
                state.blockBatches.push({
                    id: state.bagIdCounter++, species: bag.species,
                    size: consumed,
                    colonization: 0, isContaminated: false, doomed: Math.random() < risk
                });
                logMsg(`Inoculated ${consumed} blocks of ${bag.species}. Colonizing on shelf...`, 'info');
            }
        }
        else if (t === 'fruitBlocks') {
             const targetTent = operator.actionQueue.targetTent;
             const batchIndex = state.blockBatches.findIndex(b => b.id === operator.actionQueue.batchId);
             if (batchIndex > -1) {
                 const batch = state.blockBatches[batchIndex];
                 state.blockBatches.splice(batchIndex, 1);
                 
                 if (!targetTent.blocksFilled) targetTent.blocksFilled = 0;
                 targetTent.blocksFilled += batch.size;
                 targetTent.isSpawned = false;
                 targetTent.isGrowing = true;
                 targetTent.species = batch.species;
                 targetTent.blockColonization = 100;
                 logMsg(`Loaded ${batch.size} fully colonized ${batch.species} blocks into Tent #${targetTent.id}!`, 'success');
             }
        }
        else if (t === 'discardMold') {
            const bagIndex = state.incubationBatches.findIndex(b => b.id === operator.actionQueue.bagId);
            const blockIndex = state.blockBatches ? state.blockBatches.findIndex(b => b.id === operator.actionQueue.bagId) : -1;
            if (bagIndex > -1) {
                state.incubationBatches.splice(bagIndex, 1);
                if (state.hasMulchBin) state.mulchInventory += 1;
                logMsg('Dumped contaminated grain bag.', 'info');
            } else if (blockIndex > -1) {
                state.blockBatches.splice(blockIndex, 1);
                if (state.hasMulchBin) state.mulchInventory += 3;
                logMsg('Dumped contaminated substrate blocks.', 'info');
            }
        }
        else if (t === 'clearSpent') {
            const targetTent = operator.actionQueue.targetTent;
            const wasContaminated = targetTent.isContaminated;
            const hadBlocks = targetTent.blocksFilled > 0;
            targetTent.isSpent = false; targetTent.flushes = 0;
            targetTent.isContaminated = false; targetTent.isGrowing = false;
            targetTent.isSpawned = false; targetTent.blockColonization = 0;
            targetTent.currentCrop = 0; targetTent.blocksFilled = 0;
            targetTent.capacity = 0;
            if (state.hasMulchBin) {
                state.mulchInventory += wasContaminated ? 2 : (hadBlocks ? 5 : 0);
                logMsg(wasContaminated ? 'Cleaned contaminated tent.' : 'Cleared blocks to Mulch Bin!', wasContaminated ? 'error' : 'success');
            } else {
                logMsg(wasContaminated ? 'Cleaned contaminated tent.' : 'Discarded tent contents.', 'info');
            }
        }
        else if (t === 'harvest') {
            const targetTent = operator.actionQueue.targetTent;
            const harvested = parseFloat(targetTent.currentCrop.toFixed(1));
            const gd = getGameDate();
            const dateStr = gd ? `${MONTH_NAMES[gd.getMonth()]} ${gd.getDate()}` : `Day ${state.totalDays}`;
            const spoil = state.speciesData[targetTent.species].spoilTime || SPOIL_TIME;
            state.inventoryBatches.push({
                amount: harvested, timer: spoil, maxTimer: spoil,
                species: targetTent.species, harvestDate: dateStr
            });
            targetTent.currentCrop = 0;
            targetTent.flushes++;
            if (targetTent.flushes >= 3) {
                targetTent.isGrowing = false; targetTent.isSpent = true;
                logMsg(`Harvested ${harvested} lbs! Tent block is now SPENT.`, 'error');
            } else {
                targetTent.isGrowing = true; // RESTART growth for next flush
                logMsg(`Harvested ${harvested} lbs! (Flush ${targetTent.flushes}/3)`, 'success');
            }
            if (typeof renderCooler === 'function') renderCooler();
        }
        else if (t === 'sell') { executeMarketShipment(operator.actionQueue.shipment || {}); }
        else if (t === 'deliver') { executeInvoiceDelivery(operator.actionQueue.clientId, operator.actionQueue.shipment || {}); }
        else if (t === 'pitch') {
            if (deductInventory(state.costs.pitchInv)) {
                state.money -= state.costs.pitchCash;
                // First pitch always succeeds; subsequent pitches 50% + golden mod
                const isFirstPitch = state.pitchCount === 0;
                let successChance = isFirstPitch ? 1.0 : 0.5;
                if (state.charTrait === 'talker') successChance += 0.15;
                if (!isFirstPitch && state.speciesData.golden.isResearched) successChance += state.speciesData.golden.pitchMod;
                state.pitchCount++;
                if (Math.random() < successChance) {
                    let chosenClient = operator.actionQueue.targetClient;
                    if (!chosenClient) {
                        const unacquired = state.clientRoster.filter(c => !c.acquired && c.requiredReputation <= state.reputation);
                        if (unacquired.length > 0) {
                            chosenClient = unacquired[Math.floor(Math.random() * unacquired.length)];
                        }
                    }
                    if (chosenClient) {
                        state.pendingClient = chosenClient;
                        showAcquisitionModal(chosenClient);
                        logMsg(`Pitch successful! Meeting secured with ${chosenClient.name}.`, 'success');
                    } else {
                        state.demandBase += 10;
                        logMsg('Pitch SUCCESS! +10 lbs Market Demand! (All markets acquired)', 'success');
                    }
                } else {
                    logMsg('Pitch FAILED! Try again next time.', 'error');
                }
            }
        }
        else if (t === 'dehydrate') {
            if (deductInventory(10)) {
                state.powder += 1;
                logMsg('Produced 1 lb Mushroom Powder (Never Spoils)!', 'success');
            }
        }
        else if (t === 'extract') {
            if (state.powder >= 1) {
                state.powder -= 1;
                state.tinctures += 1;
                logMsg('Produced 1 Tincture Bottle from 1 lb Powder!', 'success');
            } else {
                logMsg('Need 1 lb Mushroom Powder to make a tincture!', 'error');
            }
        }
        operator.actionQueue = null;
        endActionCutscene();
    }
}

// ── Sales ─────────────────────────────────────────────────────────────────────
// shipment = { species: amount, ... }  e.g. { blue: 10, shiitake: 5 }
function executeInvoiceDelivery(clientId, shipment) {
    const client = state.clientRoster.find(c => c.id === clientId);
    if (!client || !client.acquired) { logMsg('Invalid client.', 'error'); return; }

    let earnings = 0;
    let totalSold = 0;

    Object.keys(shipment).forEach(species => {
        let qty = shipment[species];
        if (qty <= 0) return;
        // Deduct from cooler batches of this species
        for (let i = 0; i < state.inventoryBatches.length; i++) {
            const b = state.inventoryBatches[i];
            if (qty <= 0) break;
            if (b.species !== species || b.amount <= 0) continue;
            const take = Math.min(b.amount, qty);
            b.amount -= take;
            qty -= take;
            const valPerLb = state.speciesData[species].val + ((state.reputation - 1) * 2);
            earnings += take * valPerLb;
            totalSold += take;
        }
    });

    state.inventoryBatches = state.inventoryBatches.filter(b => b.amount > 0);

    if (totalSold >= client.contractLbs) {
        client.daysSinceFulfillment = 0;
        client.satisfaction = Math.min(100, client.satisfaction + Math.floor(client.strictness * 5));
        logMsg(`Contract FULFILLED for ${client.name}! ${Math.floor(totalSold)} lbs delivered for $${Math.floor(earnings)}.`, 'success');
    } else if (totalSold > 0) {
        logMsg(`Partial delivery to ${client.name}: ${Math.floor(totalSold)}/${client.contractLbs} lbs. $${Math.floor(earnings)} earned.`, 'info');
    }

    if (totalSold > 0) state.money += earnings;
    if (typeof renderCooler === 'function') renderCooler();
    return { totalSold, earnings };
}

// shipment = { species: amount } for market selling
function executeMarketShipment(shipment) {
    let earnings = 0;
    let totalSold = 0;

    Object.keys(shipment).forEach(species => {
        let qty = shipment[species];
        if (qty <= 0) return;
        for (let i = 0; i < state.inventoryBatches.length; i++) {
            const b = state.inventoryBatches[i];
            if (qty <= 0) break;
            if (b.species !== species || b.amount <= 0) continue;
            const take = Math.min(b.amount, qty);
            b.amount -= take;
            qty -= take;
            earnings += take * state.speciesData[species].val;
            totalSold += take;
        }
    });

    state.inventoryBatches = state.inventoryBatches.filter(b => b.amount > 0);

    if (totalSold > 0) {
        state.money += earnings;
        logMsg(`Farmers Market: sold ${Math.floor(totalSold)} lbs for $${Math.floor(earnings)}!`, 'success');
    }
    if (typeof renderCooler === 'function') renderCooler();
    return { totalSold, earnings };
}

// executeMarketSale removed — now handled via executeMarketShipment with player-chosen quantities

// ── Salesperson AI ────────────────────────────────────────────────────────────
// Salesperson only goes to market on Saturdays. Prompts player for what to bring.
let _salespersonMarketPrompted = false;

function updateSalesperson(dt) {
    if (!state.hasSalesperson) return;

    // On Saturday mornings, prompt the player once
    if (getDayOfWeek() === 6 && state.hour >= 8 && !_salespersonMarketPrompted) {
        _salespersonMarketPrompted = true;
        if (getTotalInventory() > 0 && typeof showMarketSelectModal === 'function') {
            showMarketSelectModal();
        }
    }
    if (getDayOfWeek() !== 6) _salespersonMarketPrompted = false;

    // Salesperson movement (only when given a shipment via the modal)
    if (salesperson.state === 'movingToShip' || salesperson.state === 'movingToStand') {
        const dx = salesperson.targetX - salesperson.x;
        const dy = salesperson.targetY - salesperson.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) {
            salesperson.x = salesperson.targetX; salesperson.y = salesperson.targetY;
            if (salesperson.state === 'movingToShip') {
                salesperson.state = 'movingToStand';
                salesperson.targetX = stations.stand.x + 20;
                salesperson.targetY = stations.stand.y + 20;
            } else {
                if (salesperson.shipment) {
                    executeMarketShipment(salesperson.shipment);
                    salesperson.shipment = null;
                }
                salesperson.state = 'idle';
            }
        } else {
            salesperson.x += (dx / dist) * salesperson.speed * dt;
            salesperson.y += (dy / dist) * salesperson.speed * dt;
        }
    }
}

// ── Growth & Spoilage ─────────────────────────────────────────────────────────
function updateGrowthAndSpoil(dt) {
    // Incubation colonization
    state.incubationBatches.forEach(bag => {
        if (!bag.isContaminated && bag.colonization < 100) {
            bag.colonization += state.speciesData[bag.species].colRate * dt;
            if (bag.colonization >= 100) bag.colonization = 100;
            const contamRisk = (state.ambientTemp > 80) ? 0.10 : 0.05;
            if (bag.doomed && bag.colonization > 30 && Math.random() < contamRisk) {
                bag.isContaminated = true;
                logMsg(`Trichoderma Mold! Bag #${bag.id} ruined.`, 'error');
            }
        }
    });

    // Shelf blockBatch colonization phase
    if (state.blockBatches) {
        state.blockBatches.forEach(batch => {
            if (!batch.isContaminated && batch.colonization < 100) {
                const sd = state.speciesData[batch.species];
                const tumblerScale = state.hasTumbler ? 1.25 : 1.0;
                batch.colonization += (sd ? sd.colRate : 0.298) * tumblerScale * dt;
                if (batch.colonization >= 100) {
                    batch.colonization = 100;
                    logMsg(`Substrate blocks of ${batch.species} fully colonized! Ready for a tent.`, 'success');
                }
                const riskPerSec = 0.0003; // Base risk on shelf
                if (batch.doomed && batch.colonization > 30 && Math.random() < riskPerSec * 10 * dt) {
                    batch.isContaminated = true;
                    logMsg(`Sterilization failure! Substrate blocks of ${batch.species} ruined.`, 'error');
                } else if (Math.random() < riskPerSec * dt) {
                    batch.isContaminated = true;
                    logMsg(`Substrate blocks of ${batch.species} contaminated on the shelf!`, 'error');
                }
            }
        });
    }

    // Tent fruiting growth + hardware contamination risk
    state.tents.forEach(tent => {
        // dynamically recalculate capacity based on filled blocks and biological efficiency
        if (tent.blocksFilled > 0) {
            const yieldMod = state.speciesData[tent.species].yieldMod || 1.0;
            const baseFlushYield = tent.flushes === 0 ? 2.0 : (tent.flushes === 1 ? 1.0 : 0.5);
            tent.capacity = tent.blocksFilled * baseFlushYield * yieldMod;
        } else {
            tent.capacity = 0;
        }
        
        if (tent.isGrowing && !tent.isContaminated && tent.currentCrop < tent.capacity) {
            tent.currentCrop += state.speciesData[tent.species].rate * getTentGrowthMod(tent) * dt;
            if (tent.currentCrop >= tent.capacity) {
                tent.currentCrop = tent.capacity; tent.isGrowing = false;
                logMsg(`Tent #${tent.id} max capacity!`, 'success');
            }
            // Running without humidifier or fan raises contamination risk
            if (!tent.hw.hum || !tent.hw.fan) {
                const missingCount = (!tent.hw.hum ? 1 : 0) + (!tent.hw.fan ? 1 : 0);
                const riskPerSec = missingCount * 0.0008;
                if (Math.random() < riskPerSec * dt) {
                    tent.isContaminated = true;
                    tent.isGrowing = false;
                    tent.currentCrop = 0;
                    logMsg(`Tent #${tent.id} contaminated! Clean it before reuse.`, 'error');
                }
            }
        }
    });

    // Spoilage
    let activeBatches = [];
    state.inventoryBatches.forEach(b => {
        b.timer -= dt;
        if (b.timer > 0) {
            activeBatches.push(b);
        } else {
            logMsg(`${Math.floor(b.amount)} lbs of ${b.species} rotted in the cooler!`, 'error');
            if (state.hasMulchBin) state.mulchInventory += Math.floor(b.amount / 5);
        }
    });
    if (state.inventoryBatches.length !== activeBatches.length) {
        state.inventoryBatches = activeBatches;
        if (typeof renderCooler === 'function') renderCooler();
    } else {
        state.inventoryBatches = activeBatches;
    }
}
