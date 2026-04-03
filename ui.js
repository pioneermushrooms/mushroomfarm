// ── Canvas Renderer ───────────────────────────────────────────────────────────
function renderCanvas() {
    ctx.fillStyle = '#a6afa9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#99a39d';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.strokeRect(x, y, 40, 40);
            ctx.fillStyle = '#919b95';
            ctx.fillRect(x + 8,  y + 12, 2, 2);
            ctx.fillRect(x + 28, y + 8,  2, 2);
            ctx.fillRect(x + 20, y + 30, 2, 2);
            ctx.fillRect(x + 6,  y + 34, 2, 2);
        }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(160, 0,   160, 240);
    ctx.fillRect(0,   120, 160, 120);

    const drawList = [];

    drawList.push({ img: keyedImgs.office, x: stations.office.x, y: stations.office.y, w: stations.office.w, h: stations.office.h, orderY: stations.office.y + stations.office.h, fallback: 'OFFICE', color: stations.office.color });
    drawList.push({ img: keyedImgs.market, x: stations.shipping.x, y: stations.shipping.y, w: stations.shipping.w, h: stations.shipping.h, orderY: stations.shipping.y + stations.shipping.h, fallback: 'MARKET', color: stations.shipping.color });

    const labImg = state.labLevel === 1 ? keyedImgs.sab : keyedImgs.flowhood;
    drawList.push({ img: labImg, x: stations.flowHood.x, y: stations.flowHood.y - 10, w: stations.flowHood.w, h: stations.flowHood.h + 10, orderY: stations.flowHood.y + stations.flowHood.h, fallback: 'LAB', color: stations.flowHood.color });

    if (state.hasMulchBin) {
        drawList.push({ img: keyedImgs.mulch, x: stations.mulchBin.x, y: stations.mulchBin.y, w: stations.mulchBin.w, h: stations.mulchBin.h, orderY: stations.mulchBin.y + stations.mulchBin.h, fallback: 'MULCH', color: stations.mulchBin.color });
    }

    const bestSterLevel = state.sterilizers ? Math.max(...state.sterilizers.map(s => s.level)) : (state.sterilizerLevel || 1);
    const sterImg = bestSterLevel <= 1 ? keyedImgs.pc : keyedImgs.barrel;
    drawList.push({ img: sterImg, x: stations.sterilizer.x, y: stations.sterilizer.y, w: stations.sterilizer.w, h: stations.sterilizer.h, orderY: stations.sterilizer.y + stations.sterilizer.h, fallback: 'STEAM', color: stations.sterilizer.color });

    if (state.hasDehydrator) drawList.push({ img: keyedImgs.dehydrator, x: stations.dehydrator.x, y: stations.dehydrator.y, w: stations.dehydrator.w, h: stations.dehydrator.h, orderY: stations.dehydrator.y + stations.dehydrator.h, fallback: 'DEHYD', color: stations.dehydrator.color });
    if (state.hasTinctureLab) drawList.push({ img: keyedImgs.tlab, x: stations.tlab.x, y: stations.tlab.y, w: stations.tlab.w, h: stations.tlab.h, orderY: stations.tlab.y + stations.tlab.h, fallback: 'LAB', color: stations.tlab.color });

    if (state.hasSalesperson) {
        drawList.push({ img: null, x: stations.stand.x, y: stations.stand.y, w: stations.stand.w, h: stations.stand.h, orderY: stations.stand.y + stations.stand.h, fallback: 'STAND', color: stations.stand.color });
        const bobS = (salesperson.state !== 'idle') ? Math.sin(performance.now() / 100) * 3 : 0;
        drawList.push({ img: keyedImgs.sales, x: salesperson.x - 16, y: salesperson.y - 16 + bobS, w: 32, h: 32, orderY: salesperson.y, isEntity: true, fallbackColor: '#f0f' });
    }

    state.tents.forEach(tent => {
        let shroomDraw = null;
        const hColor = tent.isSpent ? '#8c4423' : '#0a2310';
        if (tent.isGrowing || tent.currentCrop > 0) {
            const progress = tent.currentCrop / tent.capacity;
            let sImg = keyedImgs.shroom;
            if (tent.species === 'shiitake') sImg = keyedImgs.shiitake;
            if (tent.species === 'lions')    sImg = keyedImgs.lions;
            if (sImg && sImg.complete !== false) {
                shroomDraw = { img: sImg, alpha: Math.max(0.2, Math.min(progress, 1)) };
            }
        }
        drawList.push({ img: keyedImgs.tent, x: tent.x - 10, y: tent.y - 20, w: tent.w + 20, h: tent.h + 20, hitX: tent.x, hitY: tent.y, hitW: tent.w, hitH: tent.h, orderY: tent.y + tent.h, fallback: tent.isSpent ? 'SPENT' : 'TENT', color: hColor, shroom: shroomDraw });
    });

    const bob = operator.isMoving ? Math.sin(performance.now() / 100) * 3 : 0;
    drawList.push({ img: keyedImgs.op, x: operator.x - 16, y: operator.y - 16 + bob, w: 32, h: 32, orderY: operator.y, isEntity: true, fallbackColor: '#fff' });

    drawList.sort((a, b) => a.orderY - b.orderY);

    drawList.forEach(obj => {
        const renderImg = obj.img || null;
        if (renderImg && renderImg.complete !== false && renderImg.width > 0) {
            ctx.drawImage(renderImg, obj.x, obj.y, obj.w, obj.h);
            if (obj.shroom) {
                ctx.globalAlpha = obj.shroom.alpha;
                ctx.drawImage(obj.shroom.img, obj.x + obj.w/2 - 16, obj.y + obj.h/2 - 24, 32, 32);
                ctx.globalAlpha = 1.0;
            }
        } else {
            const hX = obj.hitX || obj.x; const hY = obj.hitY || obj.y;
            const hW = obj.hitW || obj.w; const hH = obj.hitH || obj.h;
            ctx.fillStyle = obj.color || obj.fallbackColor;
            if (obj.isEntity) {
                ctx.fillRect(obj.x + 6, obj.y + 6, 20, 20);
            } else {
                ctx.fillRect(hX, hY, hW, hH);
                if (obj.fallback) {
                    ctx.fillStyle = '#fff'; ctx.font = "8px 'Press Start 2P'";
                    ctx.fillText(obj.fallback, hX + 5, hY + hH/2);
                }
            }
        }
    });
}

// ── Labor Resource ──────────────────────────────────────────────────────────────
window.useLabor = function(hours) {
    if (typeof state.laborHours !== 'number') state.laborHours = 16;
    if (hours === 0) return true;
    if (state.laborHours >= hours) {
        state.laborHours -= hours;
        updateUI();
        return true;
    }
    logMsg(`Not enough energy! Action needs ${hours} Labor Hours, but you only have ${state.laborHours} left today. Go Sleep!`, 'error');
    return false;
};

// ── Interactivity Handlers ────────────────────────────────────────────────────
document.getElementById('btn-buy-pellets').addEventListener('click', () => {
    if (state.money >= state.costs.pellets) {
        state.money -= state.costs.pellets; state.rawPellets += 100;
        logMsg('Bought 100lbs Wood Pellets.', 'info');
    } else { logMsg('Need $20 for Pellets.', 'error'); }
});

document.getElementById('btn-sterilize').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    if (!state.sterilizers || state.sterilizers.length === 0) {
        state.sterilizers = [{ id: 1, level: state.sterilizerLevel || 1, busyTime: 0, pendingBlocks: 0 }];
    }

    const idleUnit = state.sterilizers.find(s => s.busyTime <= 0);
    if (!idleUnit) {
        const soonest = state.sterilizers.reduce((a, b) => a.busyTime < b.busyTime ? a : b);
        logMsg(`All sterilizers busy! #${soonest.id} finishes in ${Math.ceil(soonest.busyTime)}h.`, 'error');
        return;
    }

    const caps = {1: 1, 2: 16, 3: 32, 4: 16, 5: 64};
    const blockCap = caps[idleUnit.level] || 1;
    const required = blockCap * 5;

    if (state.rawPellets < required) { logMsg(`Sterilizer #${idleUnit.id} needs ${required} lbs pellets for ${blockCap} blocks!`, 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = stations.sterilizer.x + stations.sterilizer.w / 2;
    operator.targetY = stations.sterilizer.y + stations.sterilizer.h + 20;
    operator.actionQueue = { task: 'sterilize', required, blockCap, unitId: idleUnit.id, state: 'moving' };
});

document.getElementById('btn-inoculate-grain').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    if (state.money < state.costs.grain) { logMsg('Need $10 for grain!', 'error'); return; }
    if (state.incubationBatches.length >= 12) { logMsg('Incubation shelf full!', 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = stations.flowHood.x + stations.flowHood.w / 2;
    operator.targetY = stations.flowHood.y + stations.flowHood.h + 20;
    operator.actionQueue = { task: 'inoculateGrain', species: elSpecies.value, state: 'moving' };
});

document.getElementById('btn-spawn-bulk').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    if (state.sterileBlocks < 1) { logMsg('Need at least 1 Sterilized Block to spawn!', 'error'); return; }
    const readyBags = state.incubationBatches.filter(b => b.colonization >= 100 && !b.isContaminated);
    if (!readyBags.length) { logMsg('No fully colonized bags ready!', 'error'); return; }
    // Defer useLabor until confirmed in modal!
    showSpawnModal(readyBags);
});

document.getElementById('btn-discard-mold').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    const doomedBag = state.incubationBatches.find(b => b.isContaminated) ||
                      (state.blockBatches || []).find(b => b.isContaminated);
    if (!doomedBag) { logMsg('No moldy bags or blocks to discard!', 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = stations.flowHood.x + stations.flowHood.w / 2;
    operator.targetY = stations.flowHood.y + stations.flowHood.h + 20;
    operator.actionQueue = { task: 'discardMold', bagId: doomedBag.id, state: 'moving' };
});

document.getElementById('btn-clear-spent').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    // Priority: Contaminated -> Spent -> Any tent with blocks
    const spentTent = state.tents.find(t => t.isContaminated) || 
                      state.tents.find(t => t.isSpent) || 
                      state.tents.find(t => t.blocksFilled > 0 || t.isGrowing || t.currentCrop > 0);
    if (!spentTent) { logMsg('No tents with crops found to clear!', 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = spentTent.x + spentTent.w / 2;
    operator.targetY = spentTent.y + spentTent.h + 20;
    operator.actionQueue = { task: 'clearSpent', targetTent: spentTent, state: 'moving' };
});

document.getElementById('btn-harvest-auto').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    const readyTent = state.tents.slice().sort((a, b) => b.currentCrop - a.currentCrop)[0];
    if (!readyTent || Math.floor(readyTent.currentCrop) < 1) { logMsg('Nothing to harvest.', 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = readyTent.x + readyTent.w / 2;
    operator.targetY = readyTent.y + readyTent.h + 20;
    operator.actionQueue = { task: 'harvest', targetTent: readyTent, state: 'moving' };
});

document.getElementById('btn-deliver').addEventListener('click', () => {
    if (getTotalInventory() <= 0) { logMsg('Cooler is empty!', 'error'); return; }
    const dueContracts = state.clientRoster.filter(c => c.acquired && (c.daysSinceFulfillment || 0) >= c.contractDays);
    if (dueContracts.length === 0) { logMsg('No contracts are due. Open Contracts panel to deliver early.', 'info'); return; }
    // Open contracts panel so they can pick which one
    modalContracts.style.display = 'flex';
    renderContracts();
});

document.getElementById('btn-sell').addEventListener('click', () => {
    if (getDayOfWeek() !== 6) { logMsg("The Farmers Market is only open on Saturdays!", 'error'); return; }
    if (getTotalInventory() <= 0) { logMsg('Cooler is empty!', 'error'); return; }
    showMarketSelectModal();
});

document.getElementById('btn-pitch').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
    if (state.money < state.costs.pitchCash || getTotalInventory() < state.costs.pitchInv) {
        logMsg(`Need $${state.costs.pitchCash} and ${state.costs.pitchInv} lbs inventory.`, 'error'); return;
    }
    if (!useLabor(2)) return;
    operator.targetX = stations.office.x + stations.office.w / 2;
    operator.targetY = stations.office.y + stations.office.h + 20;
    operator.actionQueue = { task: 'pitch', state: 'moving' };
});

window.targetPitch = function(clientId) {
    const c = state.clientRoster.find(x => x.id === clientId);
    if (!c) return;
    document.getElementById('modal-contracts').style.display = 'none';
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); alert('Operator busy!'); return; }
    if (state.money < state.costs.pitchCash || getTotalInventory() < state.costs.pitchInv) {
        logMsg(`Need $${state.costs.pitchCash} and ${state.costs.pitchInv} lbs inventory.`, 'error');
        alert(`Need $${state.costs.pitchCash} and ${state.costs.pitchInv} lbs inventory.`);
        return;
    }
    if (!useLabor(2)) { alert("Not enough labor hours!"); return; }
    operator.targetX = stations.office.x + stations.office.w / 2;
    operator.targetY = stations.office.y + stations.office.h + 20;
    operator.actionQueue = { task: 'pitch', targetClient: c, state: 'moving' };
};

document.getElementById('btn-dehydrate').addEventListener('click', () => {
    if (!state.hasDehydrator) { logMsg('You need to buy the Dehydrator first!', 'error'); return; }
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
    if (getTotalInventory() < 10) { logMsg('Need 10 lbs of raw inventory to dehydrate.', 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = stations.dehydrator.x + stations.dehydrator.w / 2;
    operator.targetY = stations.dehydrator.y + stations.dehydrator.h + 20;
    operator.actionQueue = { task: 'dehydrate', state: 'moving' };
});

document.getElementById('btn-extract').addEventListener('click', () => {
    if (!state.hasTinctureLab) { logMsg('You need to buy the Tincture Lab!', 'error'); return; }
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
    if ((state.powder || 0) < 1) { logMsg('Need 1 lb of Powder to extract Tincture.', 'error'); return; }
    if (!useLabor(1)) return;
    operator.targetX = stations.tlab.x + stations.tlab.w / 2;
    operator.targetY = stations.tlab.y + stations.tlab.h + 20;
    operator.actionQueue = { task: 'extract', state: 'moving' };
});

document.getElementById('btn-sell-goods').addEventListener('click', () => {
    const e = (state.powder * 100) + (state.tinctures * 80);
    if (e > 0) {
        state.money += e;
        logMsg(`Sold Processed Goods for $${e}!`, 'success');
        state.powder = 0; state.tinctures = 0;
    } else { logMsg('No processed goods to sell.', 'error'); }
});

// ── Tent & Upgrade Window Functions ──────────────────────────────────────────
const TENT_TYPES = {
    '4x4': { cost: 100, maxBlocks: 16, w: 40, h: 40 },
    '4x8': { cost: 150, maxBlocks: 32, w: 40, h: 80 },
    '8x8': { cost: 200, maxBlocks: 64, w: 80, h: 80 }
};

window.buyTent = function(type) {
    if (state.tents.length >= 3) { logMsg('Garage full! Sell a tent first.', 'error'); return; }
    const info = TENT_TYPES[type];
    if (!info) return;
    const cost = Math.floor(info.cost * (state.charTrait === 'handy' ? 0.85 : 1));
    if (state.money < cost) { logMsg(`Need $${cost} for a ${type} tent!`, 'error'); return; }
    state.money -= cost;
    let newY = 30;
    if (state.tents.length === 1) newY = 120;
    else if (state.tents.length === 2) newY = 210;
    const newId = state.tents.length > 0 ? Math.max(...state.tents.map(t => t.id)) + 1 : 1;
    state.tents.push({ id: newId, type, capacity: 0, maxBlocks: info.maxBlocks, blocksFilled: 0, currentCrop: 0, isGrowing: false, isSpawned: false, blockColonization: 0, isSpent: false, flushes: 0, x: 180, y: newY, w: info.w, h: info.h, species: 'blue', temp: 65, humidity: 40, co2: 400, hw: { hum: false, fan: false, ac: false, heat: false } });
    logMsg(`Built a ${type} tent!`, 'success');
    updateUI();
    renderEquipmentModal('facilities', '⛺ Fruiting Facilities');
};

window.sellTent = function(tentId) {
    const tent = state.tents.find(t => t.id === tentId);
    if (!tent) return;
    if (tent.isGrowing || tent.currentCrop > 0 || tent.isSpawned || (tent.blocksFilled || 0) > 0) {
        logMsg(`Clear Tent #${tent.id} before selling it!`, 'error');
        return;
    }
    const info = TENT_TYPES[tent.type];
    const refund = Math.floor((info ? info.cost : 100) * 0.5);
    state.tents = state.tents.filter(t => t.id !== tentId);
    state.money += refund;
    logMsg(`Sold Tent #${tentId} for $${refund}.`, 'success');
    updateUI();
    renderEquipmentModal('facilities', '⛺ Fruiting Facilities');
};

window.buyStrain = function(id) {
    if (state.money >= state.speciesData[id].researchCost && !state.speciesData[id].isResearched) {
        state.money -= state.speciesData[id].researchCost;
        state.speciesData[id].isResearched = true;
        logMsg(`Unlocked ${id} genetics!`, 'success');
        updateSpeciesDropdown();
        renderEquipmentModal('strains', '🍄 Cultivation Strains');
    } else { logMsg('Not enough money or already researched.', 'error'); }
};

function getCurrentTier(eqId) {
    if (eqId === 'sterilizer') return state.sterilizerLevel;
    if (eqId === 'lab')        return state.labLevel;
    if (eqId === 'sales')      return state.hasSalesperson ? 2 : 1;
    if (eqId === 'dehydrator') return state.hasDehydrator  ? 2 : 1;
    if (eqId === 'tincture')   return state.hasTinctureLab ? 2 : 1;
    if (eqId === 'mulch')      return state.hasMulchBin    ? 2 : 1;
    if (eqId === 'co2')        return state.hasCO2         ? 2 : 1;
    return 1;
}

window.purchaseTier = function(eqId, targetLevel, cost, catId, titleText) {
    if (state.money < cost) { logMsg(`Need $${cost} to upgrade!`, 'error'); return; }
    state.money -= cost;
    if (eqId === 'sterilizer') state.sterilizerLevel = targetLevel;
    if (eqId === 'lab')        state.labLevel        = targetLevel;
    if (eqId === 'sales')      state.hasSalesperson  = true;
    if (eqId === 'dehydrator') state.hasDehydrator   = true;
    if (eqId === 'tincture')   state.hasTinctureLab  = true;
    if (eqId === 'mulch')      state.hasMulchBin     = true;
    if (eqId === 'co2')        state.hasCO2          = true;
    logMsg(`Purchased ${eqId} upgrade!`, 'success');
    updateUI();
    renderEquipmentModal(catId, titleText);
};

window.buyGarageClimate = function(type, cost) {
    if (state.money < cost) { logMsg(`Need $${cost}!`, 'error'); return; }
    state.money -= cost;
    if (type === 'ac')   state.garageAC = true;
    if (type === 'heat') state.garageHeater = true;
    logMsg(`Installed garage ${type === 'ac' ? 'A/C' : 'Heater'}!`, 'success');
    // Force garage panel re-render
    const garageEl = document.getElementById('garage-equipment');
    if (garageEl) garageEl.dataset.state = '';
    updateUI();
};

window.buySterilizer = function(level, cost) {
    if (state.sterilizers.length >= 4) { logMsg('Max 4 sterilizer units!', 'error'); return; }
    if (state.money < cost) { logMsg(`Need $${cost}!`, 'error'); return; }
    state.money -= cost;
    const newId = state.sterilizers.length > 0 ? Math.max(...state.sterilizers.map(s => s.id)) + 1 : 1;
    state.sterilizers.push({ id: newId, level, busyTime: 0, pendingBlocks: 0 });
    logMsg(`Bought sterilizer unit #${newId}!`, 'success');
    updateUI();
    renderEquipmentModal('lab', '🔬 Lab & Substrate Ops');
};

window.sellSterilizer = function(unitId) {
    const unit = state.sterilizers.find(s => s.id === unitId);
    if (!unit) return;
    if (unit.busyTime > 0) { logMsg(`Can't sell while running!`, 'error'); return; }
    const eq = equipmentData.find(e => e.id === 'sterilizer');
    const tier = eq ? eq.tiers.find(t => t.level === unit.level) : null;
    const refund = Math.floor((tier ? tier.cost : 100) * 0.5);
    state.sterilizers = state.sterilizers.filter(s => s.id !== unitId);
    state.money += refund;
    logMsg(`Sold sterilizer #${unitId} for $${refund}.`, 'success');
    updateUI();
    renderEquipmentModal('lab', '🔬 Lab & Substrate Ops');
};

window.renderEquipmentModal = function(catId, titleText) {
    document.getElementById('modal-equipment').style.display = 'flex';
    document.querySelector('#modal-equipment h2').innerHTML = titleText;
    const grid = document.getElementById('equipment-grid');
    grid.innerHTML = '';

    if (catId === 'strains') {
        Object.keys(state.speciesData).forEach(key => {
            if (key === 'blue') return;
            const sd = state.speciesData[key];
            const isOwned = sd.isResearched;
            const bg  = isOwned ? '#113311' : '#111';
            const bdr = isOwned ? '#5eff6b' : '#ff9900';
            grid.innerHTML += `<div style="background:${bg}; border: 1px solid ${bdr}; padding: 15px; display:flex; justify-content:space-between; align-items:center; border-radius:4px; margin-bottom:10px;">
                <div style="color:#fff;"><strong>${key.toUpperCase()}</strong><br><span style="font-size:10px; color:#aaa;">${sd.desc}</span></div>
                <div>${isOwned ? '<span style="color:#5eff6b;">Unlocked</span>' : `<button class="pixel-btn small" style="border-color:#ff9900; color:#ff9900;" onclick="buyStrain('${key}')">Research $${sd.researchCost}</button>`}</div>
            </div>`;
        });
        return;
    }

    if (catId === 'facilities') {
        const canBuy = state.tents.length < 3;
        const handyMod = state.charTrait === 'handy' ? 0.85 : 1;

        // Buy new tents section
        let tentBuyHtml = `<div style="background:#1a2430; border: 2px solid #5ea1ff; padding: 10px; border-radius: 4px; margin-bottom:15px;">
            <h3 style="color:#5ea1ff; margin:0 0 10px 0; font-size:14px;">Buy Fruiting Tent (${state.tents.length}/3)</h3>`;
        if (canBuy) {
            Object.keys(TENT_TYPES).forEach(type => {
                const info = TENT_TYPES[type];
                const cost = Math.floor(info.cost * handyMod);
                tentBuyHtml += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:6px 8px; background:#111; border:1px solid #333; border-radius:4px;">
                    <div style="color:#fff; font-size:11px;"><strong>${type}</strong> — ${info.maxBlocks} block capacity</div>
                    <button class="pixel-btn small" style="border-color:#5eff6b; color:#5eff6b;" onclick="buyTent('${type}')">Buy $${cost}</button>
                </div>`;
            });
        } else {
            tentBuyHtml += `<p style="color:#555; font-size:10px;">Garage full (3/3). Sell a tent to make room.</p>`;
        }
        tentBuyHtml += `</div>`;
        grid.innerHTML += tentBuyHtml;

        // Existing tents with sell button
        if (state.tents.length > 0) {
            let ownedHtml = `<div style="background:#1a2430; border: 2px solid #ff9900; padding: 10px; border-radius: 4px; margin-bottom:15px;">
                <h3 style="color:#ff9900; margin:0 0 10px 0; font-size:14px;">Owned Tents</h3>`;
            state.tents.forEach(t => {
                const info = TENT_TYPES[t.type];
                const refund = Math.floor((info ? info.cost : 100) * 0.5);
                const inUse = t.isGrowing || t.currentCrop > 0 || t.isSpawned || (t.blocksFilled || 0) > 0;
                ownedHtml += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:6px 8px; background:#111; border:1px solid ${inUse ? '#ff5e5e' : '#555'}; border-radius:4px;">
                    <div style="color:#fff; font-size:11px;">Tent #${t.id} <strong>(${t.type})</strong> — ${t.maxBlocks || 16} blocks ${inUse ? '<span style="color:#ff9900; font-size:9px;">[IN USE]</span>' : ''}</div>
                    <button class="pixel-btn small" style="border-color:#ff5e5e; color:#ff5e5e;" onclick="sellTent(${t.id})" ${inUse ? 'disabled' : ''}>Sell $${refund}</button>
                </div>`;
            });
            ownedHtml += `</div>`;
            grid.innerHTML += ownedHtml;
        }

    }

    equipmentData.forEach(eq => {
        if (eq.cat !== catId) return;

        // Special rendering for sterilizers — buy specific models, no upgrades
        if (eq.id === 'sterilizer') {
            if (!state.sterilizers) state.sterilizers = [{ id: 1, level: 1, busyTime: 0, pendingBlocks: 0 }];
            const card = document.createElement('div');
            card.style = 'background:#1a2430; border: 2px solid #5ea1ff; padding: 10px; border-radius: 4px;';
            const handyMod = state.charTrait === 'handy' ? 0.85 : 1;
            const canBuy = state.sterilizers.length < 4;
            let html = `<h3 style="color:#5eff6b; margin:0 0 5px 0; font-size:14px;">${eq.title}</h3>`;

            // Catalog — buy any model
            html += `<div style="margin-bottom:10px;"><div style="color:#aaa; font-size:9px; margin-bottom:6px;">Buy a unit (${state.sterilizers.length}/4 slots)</div>`;
            eq.tiers.forEach(t => {
                const cost = Math.floor(t.cost * handyMod);
                html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; padding:6px 8px; background:#111; border:1px solid #333; border-radius:4px;">
                    <div style="color:#fff; font-size:10px;"><strong>${t.name}</strong><br><span style="color:#aaa; font-size:9px;">${t.text}</span></div>
                    ${canBuy ? `<button class="pixel-btn small" style="border-color:#5eff6b; color:#5eff6b;" onclick="buySterilizer(${t.level}, ${cost})">$${cost}</button>` : '<span style="color:#555; font-size:9px;">Full</span>'}
                </div>`;
            });
            html += `</div>`;

            // Owned units
            if (state.sterilizers.length > 0) {
                html += `<div style="color:#aaa; font-size:9px; margin-bottom:6px; border-top:1px solid #333; padding-top:8px;">Owned Units</div>`;
                state.sterilizers.forEach(unit => {
                    const tierInfo = eq.tiers.find(t => t.level === unit.level) || eq.tiers[0];
                    const busy = unit.busyTime > 0;
                    const statusText = busy ? `<span style="color:#ff9900;">${Math.ceil(unit.busyTime)}h left</span>` : `<span style="color:#5eff6b;">Idle</span>`;
                    const refund = Math.floor((tierInfo.cost || 100) * 0.5);
                    html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; padding:6px 8px; background:#111; border:1px solid ${busy ? '#ff9900' : '#5eff6b'}; border-radius:4px;">
                        <div style="color:#fff; font-size:10px;"><strong>#${unit.id}</strong> ${tierInfo.name} — ${statusText}</div>
                        <button class="pixel-btn small" style="border-color:#ff5e5e; color:#ff5e5e;" onclick="sellSterilizer(${unit.id})" ${busy ? 'disabled' : ''}>Sell $${refund}</button>
                    </div>`;
                });
            }

            card.innerHTML = html;
            grid.appendChild(card);
            return;
        }

        const currentLvl = getCurrentTier(eq.id);
        const card = document.createElement('div');
        card.style = 'background:#1a2430; border: 2px solid #5ea1ff; padding: 10px; border-radius: 4px;';
        let html = `<h3 style="color:#5eff6b; margin:0 0 5px 0; font-size:14px;">${eq.title}</h3><div style="display:flex; flex-direction:column; gap:8px;">`;
        eq.tiers.forEach(t => {
            const isOwned = currentLvl >= t.level;
            const isNext  = currentLvl === t.level - 1;
            const bg  = isOwned ? '#113311' : (isNext ? '#332200' : '#111');
            const bdr = isOwned ? '#5eff6b' : (isNext ? '#ff9900' : '#333');
            const col = isOwned ? '#aaa'    : (isNext ? '#fff'    : '#666');
            html += `<div style="background:${bg}; border: 1px solid ${bdr}; padding: 8px; display:flex; justify-content:space-between; align-items:center;">
                <div style="color:${col}; font-size:12px;"><strong>[Lvl ${t.level}] ${t.name}</strong><br><span style="font-size:10px;">${t.text}</span></div>
                <div>${isOwned ? '<span style="color:#5eff6b; font-size:10px;">OWNED</span>' :
                    isNext ? `<button class="pixel-btn small" style="border-color:#ff9900; color:#ff9900;" onclick="purchaseTier('${eq.id}', ${t.level}, ${t.cost}, '${catId}', '${titleText}')">Buy $${t.cost}</button>` :
                    '<span style="color:#555; font-size:10px;">LOCKED</span>'}</div>
            </div>`;
        });
        html += '</div>';
        card.innerHTML = html;
        grid.appendChild(card);
    });
};

// ── Main UI Update ────────────────────────────────────────────────────────────
function updateUI() {
    elMoney.textContent = state.money.toFixed(2);

    document.getElementById('clock-display').textContent = getGameDateStr();
    const daysOpEl = document.getElementById('days-op-display');
    if (daysOpEl) daysOpEl.textContent = state.totalDays.toLocaleString();
    const maxLabor = state.charTrait === 'workaholic' ? 18 : 16;
    document.getElementById('labor-display').textContent = typeof state.laborHours === 'number' ? state.laborHours : maxLabor;
    const maxEl = document.getElementById('labor-max-display');
    if (maxEl) maxEl.textContent = maxLabor;

    // Energy display
    let totalWatts = 0;
    state.tents.forEach(t => {
        if (t.hw) {
            if (t.hw.hum) totalWatts += 50;
            if (t.hw.fan) totalWatts += 20;
        }
    });
    if (state.garageAC)     totalWatts += 300;
    if (state.garageHeater) totalWatts += 150;
    if (state.hasCO2) totalWatts = Math.floor(totalWatts * 0.8);
    const dailyCost = totalWatts * 0.01;
    const eEl = document.getElementById('energy-display');
    if (eEl) eEl.textContent = totalWatts;
    const ecEl = document.getElementById('energy-cost-display');
    if (ecEl) ecEl.textContent = dailyCost.toFixed(2);

    // Garage equipment panel — only re-render when state changes
    const garageEl = document.getElementById('garage-equipment');
    if (garageEl) {
        const garageKey = (state.garageAC ? 'ac' : '') + (state.garageHeater ? 'ht' : '');
        if (garageEl.dataset.state !== garageKey) {
            garageEl.dataset.state = garageKey;
            const handyMod = state.charTrait === 'handy' ? 0.85 : 1;
            const acCost = Math.floor(state.costs.ac * handyMod);
            const heatCost = Math.floor(state.costs.heater * handyMod);
            let gh = '';
            if (state.garageAC) {
                gh += `<span style="font-size:8px; color:#5ea1ff; padding:3px 6px; border:1px solid #5ea1ff; border-radius:3px;">A/C ✓</span>`;
            } else {
                gh += `<button class="pixel-btn small" style="border-color:#5ea1ff; color:#5ea1ff; padding:3px 6px; font-size:8px;" onmousedown="buyGarageClimate('ac', ${acCost})">+A/C $${acCost}</button>`;
            }
            if (state.garageHeater) {
                gh += `<span style="font-size:8px; color:#ff9900; padding:3px 6px; border:1px solid #ff9900; border-radius:3px;">Heater ✓</span>`;
            } else {
                gh += `<button class="pixel-btn small" style="border-color:#ff9900; color:#ff9900; padding:3px 6px; font-size:8px;" onmousedown="buyGarageClimate('heat', ${heatCost})">+Heater $${heatCost}</button>`;
            }
            garageEl.innerHTML = gh;
        }
    }
    document.getElementById('temp-display').textContent = state.ambientTemp;
    document.getElementById('rep-display').textContent = '★'.repeat(state.reputation) + '☆'.repeat(5 - state.reputation);
    elPowder.textContent   = state.powder;
    elTincture.textContent = state.tinctures;

    let totCap = 0;
    elTentsContainer.innerHTML = '';
    state.tents.forEach(t => {
        totCap += t.capacity;
        const prog = t.capacity > 0 ? (t.currentCrop / t.capacity) * 100 : 0;
        const div = document.createElement('div');
        const isColonizing = t.isSpawned && !t.isContaminated;
        const statusLabel = t.isContaminated ? '[CONTAMINATED]' : t.isSpent ? '[SPENT]' : isColonizing ? `[colonizing ${Math.floor(t.blockColonization || 0)}%]` : t.isGrowing ? '[' + t.species + ']' : '[empty]';
        const statusColor = t.isContaminated ? 'color:#ff5e5e' : t.isSpent ? 'color:#b56a47' : isColonizing ? 'color:#5ea1ff' : t.isGrowing ? 'color:#5eff6b' : 'color:#555';
        const displayProg = isColonizing ? (t.blockColonization || 0) : prog;
        const barColor = t.isContaminated ? '#ff5e5e' : isColonizing ? '#5ea1ff' : '#5eff6b';
        let hwHtml = `<div style="display:flex; gap:2px; font-size:8px; margin-bottom:5px; flex-wrap:wrap;">`;
        if (!t.hw.hum)  hwHtml += `<button class="pixel-btn small" style="border-color:#5ea1ff;color:#5ea1ff;" onmousedown="buyHW(${t.id}, 'hum')">+Hum $${state.costs.humidifier}</button>`;
        else            hwHtml += `<span style="font-size:8px;color:#5eff6b;padding:2px 4px;border:1px solid #5eff6b;">HUM✓</span>`;
        if (!t.hw.fan)  hwHtml += `<button class="pixel-btn small" style="border-color:#5ea1ff;color:#5ea1ff;" onmousedown="buyHW(${t.id}, 'fan')">+Exhaust Fan $${state.costs.fan}</button>`;
        else            hwHtml += `<span style="font-size:8px;color:#5eff6b;padding:2px 4px;border:1px solid #5eff6b;">FAN✓</span>`;
        // AC and Heater are garage-wide, not per-tent
        
        if (!t.isSpent && !t.isContaminated && (t.blocksFilled || 0) < (t.maxBlocks || 16)) {
            hwHtml += `<button class="pixel-btn small" style="border-color:#b58c5c;color:#b58c5c; margin-left:5px;" onmousedown="window.openLoadBlocks(${t.id})">Load Blocks</button>`;
        }
        
        const noHW = !t.hw.hum || !t.hw.fan;
        hwHtml += `</div>`;
        if (noHW && (t.isGrowing || isColonizing)) hwHtml += `<div style="font-size:8px;color:#ffde5e;margin-bottom:3px;">⚠ Missing hardware raises contamination risk!</div>`;
        
        let co2Color = t.co2 > 1200 ? '#ff5e5e' : t.co2 > 800 ? '#ff9900' : '#5eff6b';
        hwHtml += `<div style="font-size:9px; color:#aaa; margin-bottom:5px;">Temp: <span style="${(t.temp > state.speciesData[t.species]?.tMax || t.temp < state.speciesData[t.species]?.tMin) ? 'color:#ff5e5e' : 'color:#5eff6b'}">${Math.floor(t.temp)}°F</span> | Hum: <span style="${(t.humidity < state.speciesData[t.species]?.hMin) ? 'color:#ff5e5e' : 'color:#5eff6b'}">${Math.floor(t.humidity)}%</span><br>CO2: <span style="color:${co2Color}">${Math.floor(t.co2 || 400)} ppm</span> | Growth: <span style="color:#ffde5e">${(getTentGrowthMod(t) * 100).toFixed(0)}%</span></div>`;
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:2px;">
                <span>Tent #${t.id} (${t.type}) <span style="${statusColor}">${statusLabel}</span></span>
                <span>${isColonizing ? Math.floor(t.blockColonization || 0) + '% col' : t.capacity > 0 ? Math.floor(t.currentCrop) + '/' + Math.floor(t.capacity) + ' lbs' : (t.blocksFilled || 0) + '/' + (t.maxBlocks || 16) + ' blks'}</span>
            </div>
            ${hwHtml}
            <div class="progress-bar" style="margin-top:0; margin-bottom:10px; height:10px;"><div class="progress-fill" style="width: ${displayProg}%; background:${barColor}"></div></div>
        `;
        elTentsContainer.appendChild(div);
    });

    // Update Materials Dashboard
    const dash = document.getElementById('substrate-dashboard');
    if (dash) {
        let h = '';
        const rawBlocksCount = Math.floor((state.rawPellets || 0) / 10);
        const sterileBlocksCount = state.sterileBlocks || 0;
        
        // Sterilizer status line
        let sterStatus = '';
        if (state.sterilizers) {
            sterStatus = state.sterilizers.map(s => {
                if (s.busyTime > 0) return `<span style="color:#ff9900;" title="Unit #${s.id}">#${s.id}:${Math.ceil(s.busyTime)}h</span>`;
                return `<span style="color:#5eff6b;" title="Unit #${s.id}">#${s.id}:idle</span>`;
            }).join(' ');
        }
        h += `<div style="font-size:10px; color:#aaa; margin-bottom:5px; width:100%;">Raw Pellets: <span style="color:#ffde5e;">${state.rawPellets || 0} lbs</span> | Sterile Blocks: <span style="color:#5eff6b;">${sterileBlocksCount}</span> | Sterilizers: ${sterStatus}</div>`;
        h += `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px;">`;
        for(let i=0; i<rawBlocksCount; i++) {
            h += `<div class="substrate-block raw" title="Raw Pellets (10lbs)"></div>`;
        }
        for(let i=0; i<(state.sterileBlocks || 0); i++) {
            h += `<div class="substrate-block sterile" title="Sterile Block"></div>`;
        }
        if (rawBlocksCount === 0 && sterileBlocksCount === 0) h += `<span style="font-size:9px; color:#555; font-style:italic;">(Inventory Empty)</span>`;
        h += `</div>`;

        h += `<div style="font-size:10px; color:#aaa; margin-bottom:5px; width:100%;">Incubating Grain Bags</div>`;
        h += `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px;">`;
        if (!state.incubationBatches || state.incubationBatches.length === 0) h += `<span style="font-size:9px; color:#555; font-style:italic;">(None)</span>`;
        state.incubationBatches.forEach(b => {
            let extraclass = b.isContaminated ? ' contaminated' : (b.colonization >= 100 ? ' ready' : '');
            let lbl = b.species.substring(0,2).toUpperCase();
            h += `<div class="substrate-block grain-bag${extraclass}" title="Grain: ${b.species} - ${Math.floor(b.colonization)}%">
                <span style="position:absolute; top:2px; left:2px; font-size:7px; color:#fff; z-index:2; font-family:monospace; text-shadow:1px 1px 0 #000;">${lbl}</span>
                <div class="grain-mycelium" style="height:${b.colonization}%;"></div>
            </div>`;
        });
        h += `</div>`;

        h += `<div style="font-size:10px; color:#aaa; margin-bottom:5px; width:100%;">Colonizing Substrate Block Batches</div>`;
        h += `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:5px;">`;
        if (!state.blockBatches || state.blockBatches.length === 0) h += `<span style="font-size:9px; color:#555; font-style:italic;">(None)</span>`;
        if (state.blockBatches) {
            state.blockBatches.forEach(b => {
                let extraclass = b.isContaminated ? ' contaminated' : (b.colonization >= 100 ? ' ready' : '');
                let lbl = b.species.substring(0,2).toUpperCase();
                let bSize = b.size || 16;
                h += `<div class="substrate-block${extraclass}" title="Block Batch: ${b.species} - ${Math.floor(b.colonization)}% (${bSize} blocks)" style="background:#5a3f24;">
                    <span style="position:absolute; top:2px; left:2px; font-size:7px; color:#fff; z-index:2; font-family:monospace; text-shadow:1px 1px 0 #000;">${lbl}</span>
                    <span style="position:absolute; bottom:2px; left:2px; font-size:6px; color:#ffde5e; z-index:2; font-family:monospace; text-shadow:1px 1px 0 #000;">x${bSize}</span>
                    <div class="grain-mycelium" style="height:${b.colonization}%; background:rgba(255,255,255,0.4);"></div>
                </div>`;
            });
        }
        h += `</div>`;
        dash.innerHTML = h;
    }

    const capEl = document.getElementById('capacity-display');
    if (capEl) capEl.textContent = totCap;
    const demEl = document.getElementById('demand-display');
    if (demEl) demEl.textContent = getEffectiveDemand();

    if (typeof renderCooler === 'function') renderCooler();

    // Clock styling
    const clockEl = document.getElementById('clock-display');
    clockEl.style.color = '';
    clockEl.title = '';
    document.getElementById('btn-sleep').textContent = '😴 Sleep';
}

// ── Encyclopedia ──────────────────────────────────────────────────────────────
const modalEncy = document.getElementById('modal-encyclopedia');
document.getElementById('btn-encyclopedia').addEventListener('click', () => {
    modalEncy.style.display = 'flex'; renderEncyclopedia();
});
document.getElementById('btn-close-modal').addEventListener('click', () => {
    modalEncy.style.display = 'none';
});

function renderEncyclopedia() {
    const grid = document.getElementById('encyclopedia-grid');
    grid.innerHTML = '';
    Object.keys(state.speciesData).forEach(key => {
        const s = state.speciesData[key];
        const card = document.createElement('div');
        card.className = 'species-card' + (s.isResearched ? '' : ' locked');
        let headerTitle = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === 'lions') headerTitle = "Lion's Mane";
        if (s.isResearched) {
            card.innerHTML = `<h3>${headerTitle}</h3><p><b>Temp:</b> ${s.idealTemp}</p><p><b>Humidity:</b> ${s.idealHum}</p><p><b>Spoilage Rate:</b> ${s.spoilageDesc}</p><p><b>Base Value:</b> $${s.val}/lb</p><p><i>${s.desc}</i></p>`;
        } else {
            card.innerHTML = `<h3>${headerTitle}</h3><p><b>Temp:</b> ???</p><p><b>Humidity:</b> ???</p><p><b>Spoilage Rate:</b> ???</p><p><b>Base Value:</b> ???</p><button class="pixel-btn small btn-research" onclick="researchSpecies('${key}')">Research ($${s.researchCost})</button>`;
        }
        grid.appendChild(card);
    });
}

window.researchSpecies = function(key) {
    const s = state.speciesData[key];
    if (state.money >= s.researchCost) {
        state.money -= s.researchCost; s.isResearched = true;
        logMsg(`Unlocked research on ${key}! Added to Inoculation list.`, 'success');
        updateSpeciesDropdown(); renderEncyclopedia(); updateUI();
    } else {
        logMsg('Not enough money for research.', 'error');
    }
};

function updateSpeciesDropdown() {
    elSpecies.innerHTML = '';
    Object.keys(state.speciesData).forEach(key => {
        if (state.speciesData[key].isResearched) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            elSpecies.appendChild(opt);
        }
    });
}
updateSpeciesDropdown();

window.buyHW = function(tentId, hwType) {
    // tent.hw uses short keys (hum/fan/ac/heat); costs use full names
    const costKey = hwType === 'hum' ? 'humidifier' : hwType === 'heat' ? 'heater' : hwType;
    const cost = state.costs[costKey];
    const tent = state.tents.find(t => t.id === tentId);
    if (!tent) return;
    if (state.money >= cost) {
        state.money -= cost;
        tent.hw[hwType] = true;
        logMsg(`Tent #${tentId}: ${hwType === 'hum' ? 'Humidifier' : hwType === 'fan' ? 'Exhaust Fan' : hwType === 'heat' ? 'Heater' : 'A/C'} installed!`, 'success');
    } else {
        logMsg(`Not enough money. Need $${cost}.`, 'error');
    }
};

window.openLoadBlocks = function(tentId) {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    const tent = state.tents.find(t => t.id === tentId);
    if (!tent) return;
    
    // find matching ready batches (must match species if tent already has blocks)
    const validBatches = (state.blockBatches || []).filter(b => 
        b.colonization >= 100 && !b.isContaminated &&
        ((tent.blocksFilled || 0) === 0 || tent.species === b.species) &&
        ((tent.blocksFilled || 0) + b.size <= (tent.maxBlocks || 16))
    );
    
    if (validBatches.length === 0) {
        logMsg(`No 100% colonized blocks available on shelf for Tent #${tentId}. (Check space/species constraints)`, 'error');
        return;
    }
    
    if (!useLabor(1)) return; // 1 hour to load blocks
    
    // Quick load the first available batch avoiding an extra modal!
    const batchToLoad = validBatches[0];
    operator.targetX = tent.x + tent.w / 2;
    operator.targetY = tent.y + tent.h + 20;
    operator.actionQueue = { task: 'fruitBlocks', targetTent: tent, batchId: batchToLoad.id, state: 'moving' };
};

// ── Spawn to Bulk Modal ───────────────────────────────────────────────────────
let _spawnSelectedBag  = null;

function showSpawnModal(readyBags) {
    _spawnSelectedBag  = null;

    const bagList    = document.getElementById('spawn-bag-list');
    const tentList   = document.getElementById('spawn-tent-list');
    const confirmBtn = document.getElementById('btn-confirm-spawn');

    function refreshConfirm() {
        const ready = !!(_spawnSelectedBag);
        confirmBtn.disabled    = !ready;
        confirmBtn.style.opacity = ready ? '1' : '0.4';
    }

    bagList.innerHTML = '';
    readyBags.forEach(bag => {
        const btn = document.createElement('button');
        btn.className = 'pixel-btn small';
        btn.style.cssText = 'text-align:left; padding:6px 8px; font-size:9px; width:100%;';
        btn.innerHTML = `<strong>${bag.species.toUpperCase()}</strong> — 100% colonized`;
        btn.addEventListener('click', () => {
            _spawnSelectedBag = bag;
            bagList.querySelectorAll('button').forEach(b => b.style.borderColor = '');
            btn.style.borderColor = '#5eff6b';
            refreshConfirm();
        });
        bagList.appendChild(btn);
    });

    tentList.innerHTML = '<span style="color:#aaa; font-size:10px;">Select a grain bag. Block batch size will adapt to your available sterile blocks (up to 16).</span>';

    refreshConfirm();
    document.getElementById('modal-spawn-select').style.display = 'flex';
}

document.getElementById('btn-close-spawn-select').addEventListener('click', () => {
    document.getElementById('modal-spawn-select').style.display = 'none';
});

document.getElementById('btn-confirm-spawn').addEventListener('click', () => {
    if (!_spawnSelectedBag) return;
    if (!useLabor(2)) return; // Deduct 2 hours for mixing and spawning
    document.getElementById('modal-spawn-select').style.display = 'none';
    const consumed = Math.min(16, state.sterileBlocks);
    operator.targetX = stations.flowHood.x + stations.flowHood.w / 2;
    operator.targetY = stations.flowHood.y + stations.flowHood.h + 20;
    operator.actionQueue = { task: 'spawnBulk', blocksConsumed: consumed, bagId: _spawnSelectedBag.id, state: 'moving' };
    _spawnSelectedBag  = null;
});

// ── B2B Contracts ─────────────────────────────────────────────────────────────
const modalAcq  = document.getElementById('modal-acquisition');
const acqPortrait = document.getElementById('acq-portrait');
const acqName     = document.getElementById('acq-name');
const acqDialogue = document.getElementById('acq-dialogue');
const acqStats    = document.getElementById('acq-stats');

function showAcquisitionModal(client) {
    modalAcq.style.display = 'flex';
    acqPortrait.src = client.img;
    acqName.textContent = client.name;
    acqDialogue.textContent = `"${client.dialogue}"`;
    acqStats.innerHTML = `<span style="color:#f2a900;">${client.contractLbs} lbs / ${client.contractDays} days</span> <br> Preference: ${client.preferredSpecies.toUpperCase()}`;
}

document.getElementById('btn-sign-contract').addEventListener('click', () => {
    if (state.pendingClient) {
        state.pendingClient.acquired = true;
        state.pendingClient.daysSinceFulfillment = 0;
        if (state.pendingClient.contractLbs >= 20) {
            state.reputation++;
            logMsg('1-Star Reputation Boost from signing a massive client!', 'success');
        }
        logMsg(`Signed contract with ${state.pendingClient.name}!`, 'success');
        state.pendingClient = null;
    }
    modalAcq.style.display = 'none';
    renderContracts();
});

const modalContracts = document.getElementById('modal-contracts');
document.getElementById('btn-contracts').addEventListener('click', () => {
    modalContracts.style.display = 'flex'; renderContracts();
});
document.getElementById('btn-close-contracts').addEventListener('click', () => {
    modalContracts.style.display = 'none';
});

function renderContracts() {
    const grid = document.getElementById('contracts-grid');
    grid.innerHTML = '';
    const acquired = state.clientRoster.filter(c => c.acquired);
    
    let html = '<h3>Active Contracts</h3>';
    if (acquired.length === 0) {
        html += `<p style="color:#555; text-align:center;">No active B2B contracts.</p>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
        acquired.forEach(c => {
            let daysLeft = c.contractDays - (c.daysSinceFulfillment || 0);
            let satColor = c.satisfaction > 80 ? '#5eff6b' : (c.satisfaction > 50 ? '#f2a900' : '#ff5e5e');
            const isDue = (c.daysSinceFulfillment || 0) >= c.contractDays;
            const dueBorder = isDue ? '#ff9900' : '#5eff6b';
            const dueLabel = isDue ? `<span style="color:#ff9900; font-weight:bold;">ORDER DUE!</span>` : `<span style="color:#fff;">Due in: ${daysLeft} days</span>`;
            html += `<div class="client-card active" style="display:flex; gap:10px; background:#1e1e1e; padding:10px; border:2px solid ${dueBorder}; border-radius:6px; align-items:center;">
                <img src="${c.img}" style="width:48px; height:48px; image-rendering:pixelated;">
                <div style="text-align:left; width:100%;">
                    <div style="font-weight:bold; color:#fff;">${c.name}</div>
                    <div style="color:#aaa; font-size:10px;">"${c.dialogue}"</div>
                    <div style="color:#f2a900; font-size:11px; margin-top:4px;">${c.contractLbs} lbs / ${c.preferredSpecies.toUpperCase()}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:10px;">
                        ${dueLabel}
                        <span style="color:${satColor};">Satisfaction: ${Math.floor(c.satisfaction)}%</span>
                        <button class="pixel-btn small" style="border-color:#ff9900; color:#ff9900; padding:4px 8px; font-size:9px;" onclick="showInvoiceModal('${c.id}')">📦 Deliver</button>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    html += '<h3 style="margin-top:20px; border-top:1px solid #444; padding-top:10px;">Regional Prospects</h3>';
    
    // Sort unacquired: accessible first
    const unacquired = state.clientRoster.filter(c => !c.acquired).sort((a,b) => a.requiredReputation - b.requiredReputation);
    if (unacquired.length === 0) html += `<p style="color:#555;">No more prospects!</p>`;
    
    html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">`;
    unacquired.forEach(c => {
        let isLocked = c.requiredReputation > state.reputation;
        let cardBg = isLocked ? '#111' : '#1e1e1e';
        let cardBorder = isLocked ? '#333' : '#5ea1ff';
        let opacity = isLocked ? '0.4' : '1.0';
        let reqText = isLocked ? `<span style="color:#ff5e5e; font-size:10px; display:block; margin-top:4px;">Requires ★ ${c.requiredReputation}</span>` : `<span style="color:#5eff6b; font-size:10px; display:block; margin-top:4px;">Unlocked!</span>`;
        if (isLocked && c.requiredReputation > state.reputation + 1) return; // Keep high tiers secret until closer!

        html += `<div class="client-card" style="display:flex; flex-direction:column; gap:5px; background:${cardBg}; padding:10px; border:2px solid ${cardBorder}; border-radius:6px; align-items:center; opacity:${opacity}; text-align:center;">
            <img src="${c.img}" style="width:32px; height:32px; image-rendering:pixelated; filter:${isLocked? 'grayscale(1)' : 'none'};">
            <div style="font-weight:bold; color:#fff; font-size:12px;">${isLocked ? '???' : c.name}</div>
            ${reqText}
            ${!isLocked ? `<button onclick="window.targetPitch('${c.id}')" class="pixel-btn" style="border-color:#ff9900; color:#ff9900; padding:4px 8px; font-size:10px; margin-top:5px;">Pitch ($${state.costs.pitchCash} + ${state.costs.pitchInv}lbs)</button>` : ''}
        </div>`;
    });
    html += `</div>`;
    
    grid.innerHTML = html;
}

// ── Delivery Invoice Modal ────────────────────────────────────────────────────
let _invoiceClientId = null;
let _invoiceAmounts = {};  // { species: amount }

function showInvoiceModal(clientId) {
    const client = state.clientRoster.find(c => c.id === clientId);
    if (!client) return;
    _invoiceClientId = clientId;
    _invoiceAmounts = {};

    document.getElementById('invoice-title').textContent = `📦 Invoice: ${client.name}`;
    document.getElementById('invoice-client-info').innerHTML =
        `Order: <strong>${client.contractLbs} lbs</strong> of <strong>${client.preferredSpecies === 'any' ? 'Any Species' : client.preferredSpecies.toUpperCase()}</strong> | Due every ${client.contractDays} days`;

    renderInvoiceLines(client);
    document.getElementById('modal-invoice').style.display = 'flex';
}

function renderInvoiceLines(client) {
    const linesEl = document.getElementById('invoice-lines');
    linesEl.innerHTML = '';

    // Get available species in cooler
    const coolerTotals = {};
    state.inventoryBatches.forEach(b => {
        if (!coolerTotals[b.species]) coolerTotals[b.species] = 0;
        coolerTotals[b.species] += b.amount;
    });

    const species = Object.keys(coolerTotals).filter(sp =>
        client.preferredSpecies === 'any' || sp === client.preferredSpecies
    );

    if (species.length === 0) {
        linesEl.innerHTML = `<div style="color:#ff5e5e; font-size:10px; padding:8px;">No matching species in cooler.</div>`;
        return;
    }

    species.forEach(sp => {
        const avail = Math.floor(coolerTotals[sp]);
        const current = _invoiceAmounts[sp] || 0;
        const sd = state.speciesData[sp];
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:8px; padding:6px 8px; background:#111; border:1px solid #333; border-radius:4px;';
        div.innerHTML = `
            <span style="color:#fff; font-size:10px; width:80px;">${sp.toUpperCase()}</span>
            <span style="color:#aaa; font-size:9px; width:60px;">${avail} lbs avail</span>
            <span style="color:#aaa; font-size:9px;">$${sd.val}/lb</span>
            <input type="number" min="0" max="${avail}" value="${current}" style="width:60px; padding:4px; font-size:10px; font-family:monospace; background:#222; color:#fff; border:1px solid #555; text-align:center;"
                data-species="${sp}" data-max="${avail}" class="invoice-qty">
        `;
        linesEl.appendChild(div);
    });

    // Attach input listeners
    linesEl.querySelectorAll('.invoice-qty').forEach(input => {
        input.addEventListener('input', () => {
            const sp = input.dataset.species;
            const max = parseInt(input.dataset.max);
            let val = parseInt(input.value) || 0;
            if (val < 0) val = 0;
            if (val > max) val = max;
            input.value = val;
            _invoiceAmounts[sp] = val;
            updateInvoiceTotal(client);
        });
    });

    updateInvoiceTotal(client);
}

function updateInvoiceTotal(client) {
    let totalLbs = 0;
    let totalVal = 0;
    Object.keys(_invoiceAmounts).forEach(sp => {
        const qty = _invoiceAmounts[sp] || 0;
        totalLbs += qty;
        totalVal += qty * (state.speciesData[sp].val + ((state.reputation - 1) * 2));
    });
    const met = totalLbs >= client.contractLbs;
    document.getElementById('invoice-total').innerHTML =
        `Shipping: <strong>${Math.floor(totalLbs)}/${client.contractLbs} lbs</strong> — Est. Revenue: <strong style="color:#5eff6b;">$${Math.floor(totalVal)}</strong>` +
        (met ? ` <span style="color:#5eff6b;">✓ ORDER FULFILLED</span>` : '');

    const btn = document.getElementById('btn-invoice-print');
    const canPrint = totalLbs > 0;
    btn.disabled = !canPrint;
    btn.style.opacity = canPrint ? '1' : '0.4';
}

document.getElementById('btn-close-invoice').addEventListener('click', () => {
    document.getElementById('modal-invoice').style.display = 'none';
});

document.getElementById('btn-invoice-autofill').addEventListener('click', () => {
    const client = state.clientRoster.find(c => c.id === _invoiceClientId);
    if (!client) return;

    _invoiceAmounts = {};
    let remaining = client.contractLbs;

    const coolerTotals = {};
    state.inventoryBatches.forEach(b => {
        if (!coolerTotals[b.species]) coolerTotals[b.species] = 0;
        coolerTotals[b.species] += b.amount;
    });

    const validSpecies = Object.keys(coolerTotals).filter(sp =>
        client.preferredSpecies === 'any' || sp === client.preferredSpecies
    );

    validSpecies.forEach(sp => {
        if (remaining <= 0) return;
        const take = Math.min(Math.floor(coolerTotals[sp]), remaining);
        if (take > 0) {
            _invoiceAmounts[sp] = take;
            remaining -= take;
        }
    });

    renderInvoiceLines(client);
});

document.getElementById('btn-invoice-print').addEventListener('click', () => {
    if (!_invoiceClientId) return;
    const totalLbs = Object.values(_invoiceAmounts).reduce((s, v) => s + v, 0);
    if (totalLbs <= 0) return;

    if (!useLabor(2)) return;

    document.getElementById('modal-invoice').style.display = 'none';
    document.getElementById('modal-contracts').style.display = 'none';

    operator.targetX = stations.shipping.x + stations.shipping.w / 2;
    operator.targetY = stations.shipping.y - 20;
    operator.actionQueue = { task: 'deliver', clientId: _invoiceClientId, shipment: { ..._invoiceAmounts }, state: 'moving' };
    _invoiceClientId = null;
    _invoiceAmounts = {};
});

// ── Market Selection Modal ───────────────────────────────────────────────────
let _marketAmounts = {};

function showMarketSelectModal() {
    _marketAmounts = {};
    const cap = state.holidaySurge ? 200 : 20;
    document.getElementById('market-cap-display').textContent = cap;

    renderMarketLines(cap);
    document.getElementById('modal-market-select').style.display = 'flex';
}

function renderMarketLines(cap) {
    const linesEl = document.getElementById('market-lines');
    linesEl.innerHTML = '';

    const coolerTotals = {};
    state.inventoryBatches.forEach(b => {
        if (!coolerTotals[b.species]) coolerTotals[b.species] = 0;
        coolerTotals[b.species] += b.amount;
    });

    const species = Object.keys(coolerTotals);
    if (species.length === 0) {
        linesEl.innerHTML = `<div style="color:#555; font-size:10px; padding:8px;">Cooler is empty.</div>`;
        return;
    }

    species.forEach(sp => {
        const avail = Math.floor(coolerTotals[sp]);
        const current = _marketAmounts[sp] || 0;
        const sd = state.speciesData[sp];
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:8px; padding:6px 8px; background:#111; border:1px solid #333; border-radius:4px;';
        div.innerHTML = `
            <span style="color:#fff; font-size:10px; width:80px;">${sp.toUpperCase()}</span>
            <span style="color:#aaa; font-size:9px; width:60px;">${avail} lbs</span>
            <span style="color:#aaa; font-size:9px;">$${sd.val}/lb</span>
            <input type="number" min="0" max="${avail}" value="${current}" style="width:60px; padding:4px; font-size:10px; font-family:monospace; background:#222; color:#fff; border:1px solid #555; text-align:center;"
                data-species="${sp}" data-max="${avail}" class="market-qty">
        `;
        linesEl.appendChild(div);
    });

    linesEl.querySelectorAll('.market-qty').forEach(input => {
        input.addEventListener('input', () => {
            const sp = input.dataset.species;
            const max = parseInt(input.dataset.max);
            let val = parseInt(input.value) || 0;
            if (val < 0) val = 0;
            if (val > max) val = max;
            input.value = val;
            _marketAmounts[sp] = val;
            updateMarketTotal(cap);
        });
    });

    const cap2 = state.holidaySurge ? 200 : 20;
    updateMarketTotal(cap2);
}

function updateMarketTotal(cap) {
    let totalLbs = 0;
    let totalVal = 0;
    Object.keys(_marketAmounts).forEach(sp => {
        const qty = _marketAmounts[sp] || 0;
        totalLbs += qty;
        totalVal += qty * state.speciesData[sp].val;
    });
    const over = totalLbs > cap;
    document.getElementById('market-total').innerHTML =
        `Loading: <strong style="${over ? 'color:#ff5e5e' : ''}">${Math.floor(totalLbs)}/${cap} lbs</strong> — Est. Revenue: <strong style="color:#5eff6b;">$${Math.floor(totalVal)}</strong>` +
        (over ? ` <span style="color:#ff5e5e;">⚠ Over market capacity!</span>` : '');

    const btn = document.getElementById('btn-market-go');
    const canGo = totalLbs > 0 && !over;
    btn.disabled = !canGo;
    btn.style.opacity = canGo ? '1' : '0.4';
}

document.getElementById('btn-close-market-select').addEventListener('click', () => {
    document.getElementById('modal-market-select').style.display = 'none';
});

document.getElementById('btn-market-fillall').addEventListener('click', () => {
    _marketAmounts = {};
    const cap = state.holidaySurge ? 200 : 20;
    let remaining = cap;

    const coolerTotals = {};
    state.inventoryBatches.forEach(b => {
        if (!coolerTotals[b.species]) coolerTotals[b.species] = 0;
        coolerTotals[b.species] += b.amount;
    });

    Object.keys(coolerTotals).forEach(sp => {
        if (remaining <= 0) return;
        const take = Math.min(Math.floor(coolerTotals[sp]), remaining);
        if (take > 0) {
            _marketAmounts[sp] = take;
            remaining -= take;
        }
    });

    renderMarketLines(cap);
});

document.getElementById('btn-market-go').addEventListener('click', () => {
    const totalLbs = Object.values(_marketAmounts).reduce((s, v) => s + v, 0);
    if (totalLbs <= 0) return;
    const cap = state.holidaySurge ? 200 : 20;
    if (totalLbs > cap) return;

    document.getElementById('modal-market-select').style.display = 'none';

    if (state.hasSalesperson) {
        // Salesperson carries it
        salesperson.shipment = { ..._marketAmounts };
        salesperson.state = 'movingToShip';
        salesperson.targetX = stations.shipping.x;
        salesperson.targetY = stations.shipping.y + 20;
        logMsg('Salesperson heading to market with your selection!', 'info');
    } else {
        // Operator does it manually
        if (!useLabor(5)) return;
        if (state.money < 30) { logMsg('Cannot afford $30 booth fee.', 'error'); return; }
        state.money -= 30;
        operator.targetX = stations.shipping.x + stations.shipping.w / 2;
        operator.targetY = stations.shipping.y - 20;
        operator.actionQueue = { task: 'sell', shipment: { ..._marketAmounts }, state: 'moving' };
    }
    _marketAmounts = {};
});

// ── Walk-In Cooler ────────────────────────────────────────────────────────────
function renderCooler() {
    const shelf = document.getElementById('cooler-shelf');
    if (!shelf) return;
    
    // Group inventory by species to show cumulative totals
    let totals = {};
    state.inventoryBatches.forEach(b => {
        if (!totals[b.species]) totals[b.species] = 0;
        totals[b.species] += b.amount;
    });

    let h = '';
    const speciesList = Object.keys(totals);
    if (speciesList.length === 0) {
        h = `<span style="color:#555; align-self:center; font-size:10px;">Walk-In Cooler (Empty)</span>`;
    } else {
        speciesList.forEach(sp => {
            let imgSrc = 'shroom.png';
            if (sp === 'shiitake') imgSrc = 'shiitake.png';
            if (sp === 'lions')    imgSrc = 'lions_mane.png';
            h += `
            <div style="display:flex; flex-direction:column; align-items:center; background:linear-gradient(to bottom, #1e3a5f, #0d1b2a); padding:8px; border:2px solid #5ea1ff; border-radius:6px; min-width:70px; box-shadow: 0 4px 15px rgba(94, 161, 255, 0.4), inset 0 2px 10px rgba(255,255,255,0.1);">
                <span style="color:#fff; font-size:8px; font-family:monospace; margin-bottom:4px; opacity:0.8;">${sp.toUpperCase()}</span>
                <img src="${imgSrc}" style="width:48px; height:48px; image-rendering:pixelated; margin-bottom:6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                <span style="color:#5eff6b; font-size:12px; font-weight:bold; text-shadow: 1px 1px 0 #000;">${Math.floor(totals[sp])} lbs</span>
            </div>`;
        });
    }
    shelf.innerHTML = h;
}

// ── Init & Image Loading ──────────────────────────────────────────────────────
function initGame() {
    Object.keys(imgs).forEach(key => {
        if (['floor', 'shroom', 'shiitake', 'lions'].includes(key)) {
            keyedImgs[key] = imgs[key];
        } else {
            keyedImgs[key] = keyImage(imgs[key]);
        }
    });
    ctx.clearRect(0, 0, 400, 400);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = '#5ea1ff'; ctx.font = '16px monospace';
    ctx.fillText('Awaiting Initialization...', 90, 200);
    logMsg('Phase 6: 3/4 Perspective Engine Ready.', 'info');

    if (hasSaveData()) {
        document.getElementById('btn-continue').style.display = 'block';
    }
    document.getElementById('btn-continue').addEventListener('click', () => {
        document.getElementById('modal-splash').style.display = 'none';
        gameStarted = true;
        lastTime = performance.now();
        if (loadGame()) {
            const regionNames = { 'pnw': 'Pacific Northwest', 'desert': 'Desert Southwest', 'northeast': 'Northeast' };
            document.getElementById('region-display').textContent = regionNames[state.region] || 'Unknown';
        }
        startMusic();
        requestAnimationFrame(gameLoop);
    });
}

document.getElementById('btn-start-simulation').addEventListener('click', () => {
    state.money  = parseInt(document.getElementById('setup-funding').value) || 1500;
    state.region = document.getElementById('setup-location').value;
    state.calendarStart = Date.now();
    state.totalDays = 0;
    state.season = getSeasonFromDate();

    // Character
    state.charGender = _charState.gender;
    state.charHair = _charState.hair;
    state.charSkin = _charState.skin;
    state.charHairColor = _charState.haircolor !== undefined ? _charState.haircolor : 0;
    state.charTrait = document.querySelector('input[name="trait"]:checked')?.value || 'handy';

    // Apply trait
    if (state.charTrait === 'handy') {
        Object.keys(state.costs).forEach(k => { state.costs[k] = Math.floor(state.costs[k] * 0.85); });
    }
    if (state.charTrait === 'workaholic') {
        state.laborHours = 18;
    }

    // Generate operator sprite
    keyedImgs.op = generateOperatorSprite();
    document.getElementById('modal-splash').style.display = 'none';
    const regionNames = { 'pnw': 'Pacific Northwest', 'desert': 'Desert Southwest', 'northeast': 'Northeast' };
    document.getElementById('region-display').textContent = regionNames[state.region];
    gameStarted = true;
    lastTime = performance.now();
    updateUI();
    startMusic();
    requestAnimationFrame(gameLoop);
    logMsg('Simulation Initialized. Welcome to the Farm.', 'success');
});

let loadedCount = 0;
const imgVals = Object.values(imgs);
imgVals.forEach(i => {
    if (i.complete) { loadedCount++; }
    else {
        i.onload  = () => { loadedCount++; if (loadedCount === imgVals.length) initGame(); };
        i.onerror = () => { loadedCount++; if (loadedCount === imgVals.length) initGame(); };
    }
});
if (loadedCount === imgVals.length) initGame();

// ── Audio ─────────────────────────────────────────────────────────────────────
let bgmPlaying = false;
let bgmStarting = false;
const bgm = document.getElementById('bgm');
const bgmQueue = ['bgm.mp3', 'bgm2.mp3', 'bgm3.mp3'];
let currentBgmIndex = 0;

function startMusic() {
    if (!bgm || bgmPlaying || bgmStarting) return;
    bgmStarting = true;
    bgm.src = bgmQueue[currentBgmIndex];
    bgm.load();
    bgm.play().then(() => {
        bgmPlaying = true;
        bgmStarting = false;
        document.getElementById('btn-music').textContent = '🔊 Music';
    }).catch(e => {
        console.log('Audio play blocked:', e);
        bgmStarting = false;
    });
}

if (bgm) {
    bgm.volume = 0.3;
    bgm.addEventListener('ended', () => {
        currentBgmIndex = (currentBgmIndex + 1) % bgmQueue.length;
        bgmPlaying = false;
        startMusic();
    });
}

// ── Speed & Sleep ───────────────────────────────────────────────────────────────
document.getElementById('btn-speed').addEventListener('click', () => {
    let s = state.speedMultiplier || 1;
    if (s === 1) s = 2;
    else if (s === 2) s = 5;
    else if (s === 5) s = 10;
    else s = 1;
    state.speedMultiplier = s;
    document.getElementById('btn-speed').textContent = `Speed: ${s}x`;
    logMsg(`Game speed set to ${s}x`, 'info');
});

document.getElementById('btn-sleep').addEventListener('click', () => {
    if (!gameStarted) return;
    document.getElementById('sleep-days-rel').value = 0;
    document.getElementById('sleep-hours-rel').value = 8;
    document.getElementById('modal-sleep').style.display = 'flex';
});
document.getElementById('btn-cancel-sleep').addEventListener('click', () => {
    document.getElementById('modal-sleep').style.display = 'none';
});
let isPaused = false;
document.getElementById('btn-pause').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    document.getElementById('btn-pause').style.borderColor = isPaused ? '#5eff6b' : '#ff5e5e';
    document.getElementById('btn-pause').style.color = isPaused ? '#5eff6b' : '#ff5e5e';
    logMsg(isPaused ? 'Simulation Paused.' : 'Simulation Resumed.', 'info');
});

document.getElementById('btn-confirm-sleep').addEventListener('click', () => {
    const sleepDays  = parseInt(document.getElementById('sleep-days-rel').value) || 0;
    const sleepHours = parseInt(document.getElementById('sleep-hours-rel').value) || 0;
    if (sleepDays === 0 && sleepHours === 0) {
        logMsg('You must skip at least 1 hour.', 'error');
        return;
    }
    document.getElementById('modal-sleep').style.display = 'none';
    
    // Total simulated elapsed time to burn through
    let targetDt = (sleepDays * 24.0) + sleepHours;
    let accumulatedDt = 0;
    
    let steps = 0;
    const maxSteps = 40000; // Hard limit for safety
    
    let interrupted = false;
    let interruptReason = "";
    
    // Monkeypatch logMsg locally to intercept major events
    const origLogMsg = window.logMsg;
    window.logMsg = function(text, type) {
        origLogMsg(text, type);
        if (type === 'error' && (text.toLowerCase().includes('contaminat') || text.toLowerCase().includes('ruined') || text.toLowerCase().includes('rotted'))) {
            interrupted = true;
            interruptReason = text;
        }
    };

    while (accumulatedDt < targetDt && steps < maxSteps) {
        let simDt = 0.05;
        accumulatedDt += simDt;
        
        if (typeof updateTime === 'function') {
            updateTime(simDt);
            updatePhysics(simDt);
            updateGrowthAndSpoil(simDt);
            updateTentMicroclimates(simDt);
            updateSalesperson(simDt);
            updateGardeners(simDt);
            updateOperatorAutomation();
        }
        steps++;
        if (interrupted) break;
    }
    
    window.logMsg = origLogMsg; // Restore logging immediately
    
    if (interrupted) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '50%'; div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.background = '#3a1111'; div.style.border = '4px solid #ff5e5e';
        div.style.padding = '20px'; div.style.color = '#fff';
        div.style.zIndex = '10000'; div.style.textAlign = 'center';
        div.style.boxShadow = '0 0 50px rgba(0,0,0,0.8)';
        div.innerHTML = `<h2 style="margin-top:0; color:#ff5e5e;">Sleep Interrupted!</h2>
        <p style="margin-bottom:20px;">You awoke on ${getGameDateStr()} to an emergency:<br><br><span style="color:#ff5e5e;">${interruptReason}</span></p>
        <button onclick="this.parentElement.remove()" class="pixel-btn">Acknowledge</button>`;
        document.body.appendChild(div);
    } else {
        logMsg(`Time skip complete! ${getGameDateStr()} (Day ${state.totalDays})`, 'success');
    }
    
    if (typeof updateUI === 'function') updateUI();
});

document.getElementById('btn-save').addEventListener('click', saveGame);
document.getElementById('btn-load').addEventListener('click', () => {
    if (loadGame()) logMsg('Game loaded!', 'success');
});
document.getElementById('btn-restart').addEventListener('click', () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
});
document.getElementById('btn-continue-playing').addEventListener('click', () => {
    document.getElementById('modal-win').style.display = 'none';
});
document.getElementById('btn-music').addEventListener('click', () => {
    if (!bgm) return;
    if (bgmPlaying || !bgm.paused) {
        bgm.pause(); bgmPlaying = false; bgmStarting = false;
        document.getElementById('btn-music').textContent = '🔇 Music';
    } else {
        startMusic();
    }
});

// ── Cutscenes ─────────────────────────────────────────────────────────────────
const modalCutscene = document.getElementById('modal-cutscene');
const imgCutscene   = document.getElementById('cutscene-img');
const imgOverlay    = document.getElementById('cutscene-overlay-img');
const titleCutscene = document.getElementById('cutscene-title');

function beginActionCutscene(aq) {
    const t = aq.task;
    let duration = 0.5, label = '', src = '', overlaySrc = '';
    if (t === 'sterilize')   {
        const sUnit = state.sterilizers ? state.sterilizers.find(s => s.id === aq.unitId) : null;
        const sLevel = sUnit ? sUnit.level : 1;
        duration = 2.5; label = 'STERILIZING SUBSTRATE...'; src = sLevel <= 1 ? 'pressure_cooker_34.png' : 'steam_barrel_34.png';
    }
    else if (t === 'inoculateGrain') { duration = 1.5; label = 'INOCULATING GRAINS...'; src = state.labLevel === 1 ? 'sab_34.png' : 'flowhood_34.png'; }
    else if (t === 'spawnBulk')      { duration = 2.0; label = 'SPAWNING TO BULK...'; src = state.labLevel === 1 ? 'sab_34.png' : 'flowhood_34.png'; }
    else if (t === 'fruitBlocks')    { duration = 2.0; label = 'LOADING BLOCKS INTO TENT...'; src = 'tent_34.png'; }
    else if (t === 'dehydrate')      { duration = 3.0; label = 'DEHYDRATING FRUITS...'; src = 'dehydrator_34.png'; }
    else if (t === 'extract')        { duration = 3.5; label = 'EXTRACTING TINCTURES...'; src = 'tlab_34.png'; }
    else if (t === 'harvest') {
        duration = 2.0; label = 'HARVESTING YIELDS...'; src = 'tent_34.png';
        if (aq.targetTent && aq.targetTent.species) {
            if (aq.targetTent.species === 'shiitake')  overlaySrc = 'shiitake.png';
            else if (aq.targetTent.species === 'lions') overlaySrc = 'lions_mane.png';
            else overlaySrc = 'pixel_mushroom.png';
        }
    }
    else if (t === 'pitch')                             { duration = 2.5; label = 'PITCHING LOCAL MARKETS...'; src = 'office_34.png'; }
    else if (t === 'deliver')                           { duration = 2.0; label = 'DELIVERING CONTRACTS...'; src = 'market_34.png'; }
    else if (t === 'sell')                              { duration = 2.0; label = 'SELLING AT FARMERS MARKET...'; src = 'market_34.png'; }
    else if (t === 'discardMold' || t === 'clearSpent') { duration = 1.0; label = 'DUMPING INVENTORY...'; src = 'mulch_bin_34.png'; }

    if (src) {
        modalCutscene.style.display = 'flex';
        titleCutscene.textContent = label;
        imgCutscene.classList.remove('cutscene-img');
        void imgCutscene.offsetWidth;
        imgCutscene.classList.add('cutscene-img');
        imgCutscene.src = src;
        if (overlaySrc) { imgOverlay.src = overlaySrc; imgOverlay.style.display = 'block'; }
        else { imgOverlay.style.display = 'none'; }
    }
    return duration;
}

function endActionCutscene() {
    modalCutscene.style.display = 'none';
}

// ── Market Day Banner ─────────────────────────────────────────────────────────
function showMarketDayBanner() {
    const banner = document.getElementById('milestone-banner');
    document.getElementById('milestone-label').textContent = "FARMERS MARKET DAY!";
    document.getElementById('milestone-reward').textContent = state.holidaySurge ? 'HOLIDAY SURGE — 200 lbs demand!' : 'Sell up to 20 lbs at market prices!';
    banner.style.display = 'block';
    banner.style.borderColor = '#5ea1ff';
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => {
        banner.style.display = 'none';
        banner.style.borderColor = '#ffde5e';
    }, 5000);
}

// ── Category Buttons ──────────────────────────────────────────────────────────
document.getElementById('btn-cat-strains').addEventListener('click',    () => renderEquipmentModal('strains',    '🍄 Cultivation Strains'));
document.getElementById('btn-cat-facilities').addEventListener('click', () => renderEquipmentModal('facilities', '⛺ Fruiting Facilities'));
document.getElementById('btn-cat-lab').addEventListener('click',        () => renderEquipmentModal('lab',        '🔬 Lab & Substrate Ops'));
document.getElementById('btn-cat-logistics').addEventListener('click',  () => renderEquipmentModal('logistics',  '🏭 Commercial Logistics'));
document.getElementById('btn-close-equipment').addEventListener('click', () => {
    document.getElementById('modal-equipment').style.display = 'none';
});

// ── Character Creator ────────────────────────────────────────────────────────
const SKIN_COLORS  = ['#f5cba7', '#c68642', '#8d5524'];
const HAIR_COLORS  = ['#f5e642', '#5c3317', '#1a1a1a', '#c0392b', '#3498db', '#27ae60', '#ecf0f1'];
const _charState = { gender: 'male', hair: 'short', skin: 0, haircolor: 0 };

// Darken/lighten a hex color
function shadeColor(hex, amt) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function drawFarmerSprite(c, P, skinBase, hairBase, isFemale, isLong) {
    const skin     = skinBase;
    const skinHi   = shadeColor(skin, 25);
    const skinSh   = shadeColor(skin, -30);
    const hair     = hairBase;
    const hairHi   = shadeColor(hair, 30);
    const hairSh   = shadeColor(hair, -35);
    const overall  = '#6b4226';
    const overHi   = '#7d5030';
    const overSh   = '#4e2e18';
    const strap    = '#5a3520';
    const buckle   = '#d4a017';
    const shirt    = '#4a7a4a';  // green undershirt
    const shirtSh  = '#3a5f3a';
    const boot     = '#2c2216';
    const bootHi   = '#3d3020';
    const sole     = '#1a1410';
    const outline  = '#1a1008';
    const eyeWhite = '#e8e8e0';
    const iris     = '#3a6644';
    const pupil    = '#111';
    const lip      = shadeColor(skin, -50);
    const blush    = '#d4887766';

    function px(x, y, w, h, color) {
        c.fillStyle = color;
        c.fillRect(x * P, y * P, (w||1) * P, (h||1) * P);
    }

    // ── Long hair back drape ──
    if (isLong) {
        px(4, 4, 1, 9, hairSh);   // left drape shadow
        px(3, 5, 1, 8, hair);     // left drape outer
        px(11, 4, 1, 9, hairSh);  // right drape shadow
        px(12, 5, 1, 8, hair);    // right drape outer
    }

    // ── Head outline ──
    px(5, 3, 6, 1, outline);  // top
    px(5, 8, 6, 1, outline);  // chin
    px(4, 4, 1, 4, outline);  // left
    px(11, 4, 1, 4, outline); // right

    // ── Face fill ──
    px(5, 4, 6, 4, skin);     // main face block
    px(6, 4, 4, 1, skinHi);   // forehead highlight
    px(5, 7, 6, 1, skinSh);   // jaw shadow

    // ── Ears ──
    px(4, 5, 1, 2, skin);     // left ear
    px(4, 5, 1, 1, skinHi);   // left ear highlight
    px(11, 5, 1, 2, skin);    // right ear
    px(11, 6, 1, 1, skinSh);  // right ear shadow

    // ── Eyebrows ──
    px(6, 4, 2, 1, shadeColor(hairBase, -20));  // left brow
    px(9, 4, 2, 1, shadeColor(hairBase, -20));  // right brow (shifted for wider face)

    // ── Eyes ──
    px(6, 5, 2, 1, eyeWhite); // left white
    px(9, 5, 2, 1, eyeWhite); // right white
    px(7, 5, 1, 1, iris);     // left iris
    px(10, 5, 1, 1, iris);    // right iris
    px(7, 5, 1, 1, pupil);    // left pupil (on iris)
    px(10, 5, 1, 1, pupil);   // right pupil

    // Actually let's do: white-iris pattern
    px(6, 5, 1, 1, eyeWhite); px(7, 5, 1, 1, iris);     // left eye
    px(9, 5, 1, 1, iris);     px(10, 5, 1, 1, eyeWhite); // right eye

    // ── Nose ──
    px(8, 6, 1, 1, skinSh);   // nose shadow

    // ── Mouth ──
    px(7, 7, 2, 1, lip);

    // ── Blush (female) ──
    if (isFemale) {
        px(5, 6, 1, 1, blush);
        px(11, 6, 1, 1, blush);  // note: this overlaps ear shadow, looks like rosy cheek
    }

    // ── Hair ──
    px(5, 2, 6, 1, hair);       // crown top
    px(4, 3, 8, 1, hair);       // hair volume row
    px(6, 2, 4, 1, hairHi);     // highlight on crown
    px(5, 3, 1, 1, hairHi);     // left volume highlight
    px(11, 3, 1, 1, hairSh);    // right shadow

    // Short hair: sideburns only
    if (!isLong) {
        px(4, 4, 1, 2, hair);   // left sideburn
        px(11, 4, 1, 2, hair);  // right sideburn
        px(4, 4, 1, 1, hairHi); // sideburn highlight
    } else {
        // Long hair: side panels + bangs
        px(4, 4, 1, 2, hair);
        px(11, 4, 1, 2, hair);
        px(5, 4, 1, 1, hairSh); // bangs shadow under volume
    }

    // ── Neck ──
    px(7, 8, 2, 1, skin);

    // ── Shirt collar (green undershirt peeking out) ──
    px(6, 8, 1, 1, shirt);
    px(9, 8, 1, 1, shirt);

    // ── Overall bib / torso ──
    px(5, 9, 6, 1, shirt);      // shirt row visible
    px(5, 9, 1, 1, shirtSh);    // shirt shadow left
    px(10, 9, 1, 1, shirtSh);   // shirt shadow right
    px(6, 9, 4, 1, overall);    // bib front
    px(7, 9, 2, 1, overHi);     // bib highlight center

    // Straps
    px(6, 8, 1, 2, strap);      // left strap
    px(9, 8, 1, 2, strap);      // right strap

    // ── Torso body ──
    px(5, 10, 6, 2, overall);   // overall body
    px(6, 10, 4, 1, overHi);    // body highlight
    px(5, 10, 1, 2, overSh);    // left shadow
    px(10, 10, 1, 2, overSh);   // right shadow

    // Buckle / clasp
    px(7, 9, 1, 1, buckle);     // left buckle
    px(8, 9, 1, 1, buckle);     // right buckle

    // ── Pockets ──
    px(6, 11, 2, 1, overSh);    // left pocket
    px(8, 11, 2, 1, overSh);    // right pocket
    px(6, 11, 1, 1, overHi);    // pocket flap highlight

    // ── Belt line ──
    px(5, 12, 6, 1, strap);     // belt
    px(7, 12, 2, 1, buckle);    // belt buckle

    // ── Arms ──
    // Upper arm (shirt sleeve rolled up)
    px(4, 9, 1, 1, shirt);      // left sleeve
    px(11, 9, 1, 1, shirt);     // right sleeve
    px(4, 10, 1, 1, shirt);     // left sleeve
    px(11, 10, 1, 1, shirt);    // right sleeve
    // Forearms (skin, rolled up look)
    px(4, 11, 1, 1, skin);      // left forearm
    px(11, 11, 1, 1, skin);     // right forearm
    px(3, 11, 1, 1, skinSh);    // left wrist shadow
    px(12, 11, 1, 1, skinSh);   // right wrist shadow
    // Hands
    px(3, 12, 1, 1, skin);      // left hand
    px(12, 12, 1, 1, skin);     // right hand

    // ── Legs ──
    px(6, 13, 2, 2, overall);   // left leg
    px(8, 13, 2, 2, overall);   // right leg
    px(6, 13, 1, 2, overSh);    // left leg shadow
    px(9, 13, 1, 2, overSh);    // right leg shadow (inner)
    px(7, 13, 1, 2, overHi);    // left leg highlight
    px(8, 13, 1, 2, overHi);    // right leg highlight

    // ── Boots ──
    px(5, 15, 3, 1, boot);      // left boot
    px(8, 15, 3, 1, boot);      // right boot
    px(6, 15, 1, 1, bootHi);    // left boot highlight
    px(9, 15, 1, 1, bootHi);    // right boot highlight
    // Soles
    px(5, 15, 1, 1, sole);      // left toe cap
    px(10, 15, 1, 1, sole);     // right toe cap
}

function drawCharPreview() {
    const cv = document.getElementById('char-preview');
    if (!cv) return;
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 96, 96);
    c.imageSmoothingEnabled = false;

    const skin = SKIN_COLORS[_charState.skin] || SKIN_COLORS[0];
    const hair = HAIR_COLORS[_charState.haircolor] || HAIR_COLORS[0];
    const isFemale = _charState.gender === 'female';
    const isLong = _charState.hair === 'long';

    drawFarmerSprite(c, 6, skin, hair, isFemale, isLong);
}

function generateOperatorSprite() {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;

    const skin = SKIN_COLORS[state.charSkin] || SKIN_COLORS[0];
    const hair = HAIR_COLORS[state.charHairColor] || HAIR_COLORS[0];
    const isFemale = state.charGender === 'female';
    const isLong = state.charHair === 'long';

    drawFarmerSprite(c, 2, skin, hair, isFemale, isLong);
    return cv;
}

// Button selection logic
document.querySelectorAll('.char-opt').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        const val = btn.dataset.val;
        _charState[group] = group === 'skin' || group === 'haircolor' ? parseInt(val) : val;

        // Highlight selected in group
        document.querySelectorAll(`.char-opt[data-group="${group}"]`).forEach(b => {
            b.style.borderColor = '';
            b.style.color = '';
        });
        btn.style.borderColor = '#5ea1ff';
        if (group !== 'skin' && group !== 'haircolor') btn.style.color = '#5ea1ff';

        drawCharPreview();
    });
});

// Initial draw
drawCharPreview();
