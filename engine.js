// ── Log ──────────────────────────────────────────────────────────────────────
function logMsg(msg, type) {
    const p = document.createElement('p');
    p.textContent = `> ${msg}`;
    p.className = type;
    elLog.prepend(p);
    if (elLog.children.length > 5) elLog.removeChild(elLog.lastChild);
}

// ── Demand helpers ────────────────────────────────────────────────────────────
function getEffectiveDemand() {
    return Math.max(1, Math.round(state.demandBase * state.demandModifier * state.demandSeasonalMod));
}

function updateDemandDrift() {
    const seasonalFactors = [1.0, 1.2, 1.3, 0.8]; // Spring / Summer / Fall / Winter
    state.demandSeasonalMod = seasonalFactors[state.season];
    const effective = getEffectiveDemand();
    if (state.dailySalesVolume <= 0) {
        state.demandModifier = Math.min(1.5, state.demandModifier + 0.05);
    } else if (state.dailySalesVolume >= effective) {
        state.demandModifier = Math.max(0.5, state.demandModifier - 0.03);
    } else {
        state.demandModifier += (1.0 - state.demandModifier) * 0.1;
    }
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
            if (tent.hw.ac && state.ambientTemp > sd.tMax) targetTemp = sd.tMax;
            if (tent.hw.heat && state.ambientTemp < sd.tMin) targetTemp = sd.tMin;
        } else {
            if (tent.hw.ac) targetTemp = Math.min(targetTemp, 68);
            if (tent.hw.heat) targetTemp = Math.max(targetTemp, 72);
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
        if (state.pendingClient) {
            state.pendingClient = state.clientRoster.find(c => c.id === state.pendingClient.id) || null;
        }
        operator.x = 200; operator.y = 300;
        operator.targetX = 200; operator.targetY = 300;
        operator.actionQueue = null;
        salesperson.x = 80; salesperson.y = 300;
        salesperson.state = 'idle'; salesperson.timer = 10;
        updateSpeciesDropdown();
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
        `Days survived: ${state.day + (state.season * 30)}<br>` +
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
    state.timeTimer += dt;
    if (state.timeTimer >= 1.0) {
        state.timeTimer -= 1.0;
        state.hour++;
        if (state.hour >= 24) {
            state.hour = 0;
            state.day++;

            // Electricity bill at midnight
            let dailyWatts = 0;
            state.tents.forEach(t => {
                if (t.hw) {
                    if (t.hw.hum)  dailyWatts += 50;
                    if (t.hw.fan)  dailyWatts += 20;
                    if (t.hw.ac)   dailyWatts += 300;
                    if (t.hw.heat) dailyWatts += 150;
                }
            });
            let energyCost = dailyWatts * 0.05;
            if (state.hasCO2) energyCost *= 0.8;
            if (energyCost > 0) {
                state.money -= energyCost;
                logMsg(`Paid Daily Electricity Bill: -$${energyCost.toFixed(2)}`, 'error');
            }

            if (state.day > 30) {
                state.day = 1;
                state.season = (state.season + 1) % 4;
                logMsg(`A new season has begun: ${SEASONS[state.season]}!`, 'success');
            }
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
            const blocksProduced = state.sterilizerLevel === 1 ? 1 : state.sterilizerLevel === 2 ? 4 : 16;
            state.sterileBlocks += blocksProduced;
            logMsg(`Sterilized ${blocksProduced} substrate block(s)!`, 'success');
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
                state.blockBatches.push({
                    id: state.bagIdCounter++, species: bag.species,
                    size: consumed,
                    colonization: 0, isContaminated: false
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
            const harvestedBase = Math.floor(targetTent.currentCrop);
            const harvested = Math.floor(harvestedBase * state.speciesData[targetTent.species].yieldMod);
            const dateStr = `${SEASONS[state.season]}, Day ${state.day}`;
            state.inventoryBatches.push({
                amount: harvested, timer: SPOIL_TIME, maxTimer: SPOIL_TIME,
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
        else if (t === 'sell') { executeSale(); }
        else if (t === 'pitch') {
            if (deductInventory(state.costs.pitchInv)) {
                state.money -= state.costs.pitchCash;
                // First pitch always succeeds; subsequent pitches 50% + golden mod
                const isFirstPitch = state.pitchCount === 0;
                let successChance = isFirstPitch ? 1.0 : 0.5;
                if (!isFirstPitch && state.speciesData.golden.isResearched) successChance += state.speciesData.golden.pitchMod;
                state.pitchCount++;
                if (Math.random() < successChance) {
                    const unacquired = state.clientRoster.filter(c => !c.acquired);
                    if (unacquired.length > 0) {
                        const randomClient = unacquired[Math.floor(Math.random() * unacquired.length)];
                        state.pendingClient = randomClient;
                        showAcquisitionModal(randomClient);
                        logMsg(`Pitch successful! Meeting secured with ${randomClient.name}.`, 'success');
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
            if (state.powder >= 2) {
                state.powder -= 2;
                state.tinctures += 1;
                logMsg('Produced 1 Tincture Bottle from 2 lbs Powder!', 'success');
            } else {
                logMsg('Need 2 lbs Mushroom Powder to make a tincture!', 'error');
            }
        }
        operator.actionQueue = null;
        endActionCutscene();
    }
}

// ── Sales ─────────────────────────────────────────────────────────────────────
function executeSale() {
    const inv = getTotalInventory();
    if (inv <= 0) { logMsg('No inventory to sell.', 'error'); return; }
    const effective = getEffectiveDemand();
    let toSell = Math.min(inv, effective);
    if (toSell <= 0) { logMsg('Market demand is full!', 'error'); return; }

    let earnings = 0;
    let amountSold = 0;
    while (toSell > 0 && state.inventoryBatches.length > 0) {
        const b = state.inventoryBatches[0];
        const repBonus = (state.reputation - 1) * 2;
        const valPerLb = state.speciesData[b.species].val + repBonus;
        if (b.amount <= toSell) {
            earnings += b.amount * valPerLb;
            amountSold += b.amount;
            toSell -= b.amount;
            state.inventoryBatches.shift();
        } else {
            earnings += toSell * valPerLb;
            b.amount -= toSell;
            amountSold += toSell;
            toSell = 0;
        }
    }
    state.money += earnings;
    state.dailySalesVolume += amountSold;
    logMsg(`Sold ${amountSold} lbs to Market for $${earnings}!`, 'success');
}

// ── Salesperson AI ────────────────────────────────────────────────────────────
function updateSalesperson(dt) {
    if (!state.hasSalesperson) return;
    if (salesperson.state === 'idle') {
        salesperson.timer -= dt;
        if (salesperson.timer <= 0) {
            const inv = getTotalInventory();
            const isSaturday = (state.day % 7 === 6);
            if (isSaturday && Math.min(inv, getEffectiveDemand()) > 0) {
                salesperson.state = 'movingToShip';
                salesperson.targetX = stations.shipping.x;
                salesperson.targetY = stations.shipping.y + 20;
            } else { salesperson.timer = 5; }
        }
    } else if (salesperson.state === 'movingToShip' || salesperson.state === 'movingToStand') {
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
                executeSale();
                salesperson.state = 'idle'; salesperson.timer = 10;
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
                batch.colonization += (sd ? sd.colRate : 0.298) * dt;
                if (batch.colonization >= 100) {
                    batch.colonization = 100;
                    logMsg(`Substrate blocks of ${batch.species} fully colonized! Ready for a tent.`, 'success');
                }
                const riskPerSec = 0.0003; // Base risk on shelf
                if (Math.random() < riskPerSec * dt) {
                    batch.isContaminated = true;
                    logMsg(`Substrate blocks of ${batch.species} contaminated during colonization!`, 'error');
                }
            }
        });
    }

    // Tent fruiting growth + hardware contamination risk
    state.tents.forEach(tent => {
        // dynamically recalculate capacity based on filled blocks and flush penalty
        if (tent.blocksFilled > 0) {
            const flushMult = tent.flushes === 0 ? 1 : (tent.flushes === 1 ? 0.5 : 0.25);
            tent.capacity = (tent.blocksFilled * 10) * flushMult;
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
