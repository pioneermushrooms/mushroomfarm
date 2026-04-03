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

    const sterImg = state.sterilizerLevel === 1 ? keyedImgs.pc : keyedImgs.barrel;
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

// ── Interactivity Handlers ────────────────────────────────────────────────────
document.getElementById('btn-buy-pellets').addEventListener('click', () => {
    if (state.money >= state.costs.pellets) {
        state.money -= state.costs.pellets; state.rawPellets += 100;
        logMsg('Bought 100lbs Wood Pellets.', 'info');
    } else { logMsg('Need $20 for Pellets.', 'error'); }
});

document.getElementById('btn-sterilize').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    const required = state.sterilizerLevel === 1 ? 10 : state.sterilizerLevel === 2 ? 40 : 160;
    if (state.rawPellets < required) { logMsg(`Need ${required} lbs of raw pellets to run sterilizer!`, 'error'); return; }
    operator.targetX = stations.sterilizer.x + stations.sterilizer.w / 2;
    operator.targetY = stations.sterilizer.y + stations.sterilizer.h + 20;
    operator.actionQueue = { task: 'sterilize', required, state: 'moving' };
});

document.getElementById('btn-inoculate-grain').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    if (state.money < state.costs.grain) { logMsg('Need $10 for grain!', 'error'); return; }
    if (state.incubationBatches.length >= 12) { logMsg('Incubation shelf full!', 'error'); return; }
    operator.targetX = stations.flowHood.x + stations.flowHood.w / 2;
    operator.targetY = stations.flowHood.y + stations.flowHood.h + 20;
    operator.actionQueue = { task: 'inoculateGrain', species: elSpecies.value, state: 'moving' };
});

document.getElementById('btn-spawn-bulk').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    if (state.sterileBlocks < 1) { logMsg('Need at least 1 Sterilized Block to spawn!', 'error'); return; }
    const readyBags = state.incubationBatches.filter(b => b.colonization >= 100 && !b.isContaminated);
    if (!readyBags.length) { logMsg('No fully colonized bags ready!', 'error'); return; }
    showSpawnModal(readyBags);
});

document.getElementById('btn-discard-mold').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    const doomedBag = state.incubationBatches.find(b => b.isContaminated);
    if (!doomedBag) { logMsg('No moldy bags to discard!', 'error'); return; }
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
    operator.targetX = spentTent.x + spentTent.w / 2;
    operator.targetY = spentTent.y + spentTent.h + 20;
    operator.actionQueue = { task: 'clearSpent', targetTent: spentTent, state: 'moving' };
});

document.getElementById('btn-harvest-auto').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator is busy!', 'error'); return; }
    const readyTent = state.tents.slice().sort((a, b) => b.currentCrop - a.currentCrop)[0];
    if (!readyTent || Math.floor(readyTent.currentCrop) < 1) { logMsg('Nothing to harvest.', 'error'); return; }
    operator.targetX = readyTent.x + readyTent.w / 2;
    operator.targetY = readyTent.y + readyTent.h + 20;
    operator.actionQueue = { task: 'harvest', targetTent: readyTent, state: 'moving' };
});

document.getElementById('btn-sell').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
    if (state.hasSalesperson) { logMsg('Salesperson handles market sales natively!', 'info'); return; }
    operator.targetX = stations.shipping.x + stations.shipping.w / 2;
    operator.targetY = stations.shipping.y - 20;
    operator.actionQueue = { task: 'sell', state: 'moving' };
});

document.getElementById('btn-pitch').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
    if (state.money < state.costs.pitchCash || getTotalInventory() < state.costs.pitchInv) {
        logMsg(`Need $${state.costs.pitchCash} and ${state.costs.pitchInv} lbs inventory.`, 'error'); return;
    }
    operator.targetX = stations.office.x + stations.office.w / 2;
    operator.targetY = stations.office.y + stations.office.h + 20;
    operator.actionQueue = { task: 'pitch', state: 'moving' };
});

document.getElementById('btn-dehydrate').addEventListener('click', () => {
    if (!state.hasDehydrator) { logMsg('You need to buy the Dehydrator first!', 'error'); return; }
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
    if (getTotalInventory() < 10) { logMsg('Need 10 lbs of raw inventory to dehydrate.', 'error'); return; }
    operator.targetX = stations.dehydrator.x + stations.dehydrator.w / 2;
    operator.targetY = stations.dehydrator.y + stations.dehydrator.h + 20;
    operator.actionQueue = { task: 'dehydrate', state: 'moving' };
});

document.getElementById('btn-extract').addEventListener('click', () => {
    if (!state.hasTinctureLab) { logMsg('You need to buy the Tincture Lab!', 'error'); return; }
    if (operator.actionQueue) { logMsg('Operator busy!', 'error'); return; }
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
window.buyTent = function() {
    if (state.money >= state.costs.newTent) {
        if (state.tents.length >= 3) { logMsg('Garage full!', 'error'); return; }
        state.money -= state.costs.newTent;
        let newX = 180, newY = 30;
        if (state.tents.length === 1) newY = 120;
        else if (state.tents.length === 2) newY = 210;
        state.tents.push({ id: state.tents.length + 1, type: '4x4', capacity: 160, currentCrop: 0, isGrowing: false, isSpawned: false, blockColonization: 0, isSpent: false, flushes: 0, x: newX, y: newY, w: 40, h: 40, species: 'blue', temp: 65, humidity: 40, hw: { hum: false, fan: false, ac: false, heat: false } });
        state.costs.newTent = Math.floor(state.costs.newTent * 1.5);
        renderEquipmentModal('facilities', '⛺ Fruiting Facilities');
    } else { logMsg('Not enough money.', 'error'); }
};

window.upgTent = function() {
    const u = state.tents.find(t => t.type !== '8x8');
    if (!u) { logMsg('Fully upgraded!', 'error'); return; }
    const cost = u.type === '4x4' ? state.costs.upgrade4x8 : state.costs.upgrade8x8;
    if (state.money >= cost) {
        state.money -= cost;
        if (u.type === '4x4') { u.type = '4x8'; u.capacity = 320; u.h = 80; }
        else if (u.type === '4x8') { u.type = '8x8'; u.capacity = 640; u.w = 80; }
        renderEquipmentModal('facilities', '⛺ Fruiting Facilities');
    } else { logMsg(`Need $${cost}.`, 'error'); }
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
    renderEquipmentModal(catId, titleText);
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
        grid.innerHTML += `<div style="background:#1a2430; border: 2px solid #5ea1ff; padding: 10px; border-radius: 4px; margin-bottom:15px;">
            <h3 style="color:#5ea1ff; margin:0 0 10px 0; font-size:14px;">Expand Floorplan</h3>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:#fff; font-size:12px;">Build New Tent (${state.tents.length}/3)</span>
                ${canBuy ? `<button class="pixel-btn small" onclick="buyTent()">Build $${state.costs.newTent}</button>` : '<span style="color:#555;">Max Built</span>'}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#fff; font-size:12px;">Upgrade Oldest Tent Size</span>
                <button class="pixel-btn small" onclick="upgTent()">Upgrade Tent</button>
            </div>
        </div>`;
    }

    equipmentData.forEach(eq => {
        if (eq.cat !== catId) return;
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
    const totInv = Math.floor(getTotalInventory());
    // document.querySelector('#btn-cooler span').textContent = totInv;

    const hStr = state.hour < 10 ? '0' + state.hour : state.hour;
    document.getElementById('clock-display').textContent = `${SEASONS[state.season]}, Day ${state.day} - ${hStr}:00`;
    document.getElementById('temp-display').textContent = state.ambientTemp;
    document.getElementById('rep-display').textContent = '★'.repeat(state.reputation) + '☆'.repeat(5 - state.reputation);
    elPowder.textContent   = state.powder;
    elTincture.textContent = state.tinctures;

    let totCap = 0;
    elTentsContainer.innerHTML = '';
    state.tents.forEach(t => {
        totCap += t.capacity;
        const prog = (t.currentCrop / t.capacity) * 100;
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
        if (!t.hw.ac)   hwHtml += `<button class="pixel-btn small" style="border-color:#5ea1ff;color:#5ea1ff;" onmousedown="buyHW(${t.id}, 'ac')">+AC $${state.costs.ac}</button>`;
        else            hwHtml += `<span style="font-size:8px;color:#5eff6b;padding:2px 4px;border:1px solid #5eff6b;">AC✓</span>`;
        if (!t.hw.heat) hwHtml += `<button class="pixel-btn small" style="border-color:#ff9900;color:#ff9900;" onmousedown="buyHW(${t.id}, 'heat')">+Heat $${state.costs.heater}</button>`;
        else            hwHtml += `<span style="font-size:8px;color:#ff9900;padding:2px 4px;border:1px solid #ff9900;">HTR✓</span>`;
        
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
                <span>${isColonizing ? Math.floor(t.blockColonization || 0) + '% col' : Math.floor(t.currentCrop) + '/' + t.capacity + ' lbs'}</span>
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
        
        h += `<div style="font-size:10px; color:#aaa; margin-bottom:5px; width:100%;">Raw Pellets: <span style="color:#ffde5e;">${state.rawPellets || 0} lbs</span> | Sterile Blocks: <span style="color:#5eff6b;">${sterileBlocksCount}</span></div>`;
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

    document.getElementById('capacity-display').textContent = totCap;
    document.getElementById('demand-display').textContent = getEffectiveDemand();

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
        logMsg(`Tent #${tentId}: ${hwType === 'hum' ? 'Humidifier' : hwType === 'fan' ? 'Fan' : 'A/C'} installed!`, 'success');
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
    acqStats.textContent = `+${client.boost} Base Demand`;
}

document.getElementById('btn-sign-contract').addEventListener('click', () => {
    if (state.pendingClient) {
        state.pendingClient.acquired = true;
        state.demandBase += state.pendingClient.boost;
        if (state.pendingClient.boost >= 3) {
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
    if (acquired.length === 0) {
        grid.innerHTML = `<p style="color:#555; text-align:center;">You have no active B2B contracts. Send your Operator to the Office to pitch clients!</p>`;
        return;
    }
    acquired.forEach(c => {
        const div = document.createElement('div');
        div.className = 'client-card active';
        div.innerHTML = `<img class="client-portrait" src="${c.img}"><div class="client-info"><h3>${c.name}</h3><p>"${c.dialogue}"</p><div class="client-stats">+${c.boost} Base Demand</div></div>`;
        grid.appendChild(div);
    });
}

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
            <div style="display:flex; flex-direction:column; align-items:center; background:#111; padding:5px; border:1px solid #5ea1ff; border-radius:4px; min-width:60px;">
                <img src="${imgSrc}" style="width:32px; height:32px; image-rendering:pixelated; margin-bottom:4px;">
                <span style="color:#5eff6b; font-size:10px; font-weight:bold;">${Math.floor(totals[sp])} lbs</span>
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
        if (bgm && !bgmPlaying) {
            bgm.src = bgmQueue[0];
            bgm.load();
            bgm.play().catch(e => console.log(e));
            bgmPlaying = true;
            document.getElementById('btn-music').textContent = '🔊 Music';
        }
        requestAnimationFrame(gameLoop);
    });
}

document.getElementById('btn-start-simulation').addEventListener('click', () => {
    state.money  = parseInt(document.getElementById('setup-funding').value) || 1500;
    state.region = document.getElementById('setup-location').value;
    document.getElementById('modal-splash').style.display = 'none';
    const regionNames = { 'pnw': 'Pacific Northwest', 'desert': 'Desert Southwest', 'northeast': 'Northeast' };
    document.getElementById('region-display').textContent = regionNames[state.region];
    gameStarted = true;
    lastTime = performance.now();
    updateUI();
    if (bgm && !bgmPlaying) {
        bgm.src = bgmQueue[0];
        bgm.load();
        bgm.play().catch(e => console.log(e));
        bgmPlaying = true;
        document.getElementById('btn-music').textContent = '🔊 Music';
    }
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
const bgm = document.getElementById('bgm');
const bgmQueue = ['bgm.mp3', 'bgm2.mp3', 'bgm3.mp3'];
let currentBgmIndex = 0;

if (bgm) {
    bgm.volume = 0.3;
    bgm.addEventListener('ended', () => {
        currentBgmIndex = (currentBgmIndex + 1) % bgmQueue.length;
        bgm.src = bgmQueue[currentBgmIndex];
        bgm.load();
        bgm.play().catch(e => console.log(e));
    });
}

// ── Sleep / Fast-Forward ──────────────────────────────────────────────────────
document.getElementById('btn-sleep').addEventListener('click', () => {
    if (!gameStarted) return;
    document.getElementById('sleep-day').value  = state.day;
    document.getElementById('sleep-hour').value = 8;
    document.getElementById('modal-sleep').style.display = 'flex';
});
document.getElementById('btn-cancel-sleep').addEventListener('click', () => {
    document.getElementById('modal-sleep').style.display = 'none';
});
document.getElementById('btn-confirm-sleep').addEventListener('click', () => {
    const targetDay  = parseInt(document.getElementById('sleep-day').value)  || state.day;
    const targetHour = parseInt(document.getElementById('sleep-hour').value) || 8;
    if (targetDay < state.day || (targetDay === state.day && targetHour <= state.hour)) {
        logMsg('Wake time must be in the future!', 'error');
        return;
    }
    document.getElementById('modal-sleep').style.display = 'none';
    
    // Instant simulation skip loop (0.05 seconds of real-time equivalent per loop)
    let steps = 0;
    const maxSteps = 40000; // Limit roughly 2,000 in-game hours (80 in-game days)
    
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

    while ((state.day < targetDay || (state.day === targetDay && state.hour < targetHour)) && steps < maxSteps) {
        let simDt = 0.05;
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
        <p style="margin-bottom:20px;">You awoke on Day ${state.day} to an emergency:<br><br><span style="color:#ff5e5e;">${interruptReason}</span></p>
        <button onclick="this.parentElement.remove()" class="pixel-btn">Acknowledge</button>`;
        document.body.appendChild(div);
    } else {
        logMsg(`Time skip complete! Surged ahead to Day ${state.day}, ${state.hour}:00!`, 'success');
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
    if (bgmPlaying) {
        bgm.pause(); bgmPlaying = false;
        document.getElementById('btn-music').textContent = '🔇 Music';
    } else {
        if (!bgm.currentSrc) {
            bgm.src = bgmQueue[currentBgmIndex];
            bgm.load();
        }
        bgm.play().catch(e => console.log(e));
        bgmPlaying = true;
        document.getElementById('btn-music').textContent = '🔊 Music';
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
    if (t === 'sterilize')   { duration = 2.5; label = 'STERILIZING SUBSTRATE...'; src = state.sterilizerLevel === 1 ? 'pressure_cooker_34.png' : 'steam_barrel_34.png'; }
    else if (t === 'inoculateGrain') { duration = 1.5; label = 'INOCULATING GRAINS...'; src = state.labLevel === 1 ? 'sab_34.png' : 'flowhood_34.png'; }
    else if (t === 'spawnBulk')      { duration = 2.0; label = 'SPAWNING TO BULK...'; src = 'tent_34.png'; }
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
    else if (t === 'sell')                              { duration = 2.0; label = 'HAULING FREIGHT...'; src = 'market_34.png'; }
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

// ── Category Buttons ──────────────────────────────────────────────────────────
document.getElementById('btn-cat-strains').addEventListener('click',    () => renderEquipmentModal('strains',    '🍄 Cultivation Strains'));
document.getElementById('btn-cat-facilities').addEventListener('click', () => renderEquipmentModal('facilities', '⛺ Fruiting Facilities'));
document.getElementById('btn-cat-lab').addEventListener('click',        () => renderEquipmentModal('lab',        '🔬 Lab & Substrate Ops'));
document.getElementById('btn-cat-logistics').addEventListener('click',  () => renderEquipmentModal('logistics',  '🏭 Commercial Logistics'));
document.getElementById('btn-close-equipment').addEventListener('click', () => {
    document.getElementById('modal-equipment').style.display = 'none';
});
