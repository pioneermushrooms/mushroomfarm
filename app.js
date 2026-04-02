// Game State
const SPOIL_TIME = 60; // 60 seconds until rot

const state = {
    money: 500, 
    demand: 10,
    inventoryBatches: [], // { amount, timer, species }
    incubationBatches: [], // { id, species, colonization, contaminated, doomed }
    labLevel: 1, // 1 = SAB, 2 = Flow Hood
    sterilizerLevel: 1, // 1 = Pressure Cooker, 2 = Steam Barrel
    rawPellets: 0,
    sterileBlocks: 0,
    bagIdCounter: 1,
    reputation: 1,
    mulchInventory: 0,
    gardenerTimer: 30,
    // Phase 10 Time & Seasons
    day: 1,
    hour: 8,
    timeTimer: 0,
    season: 0, // 0: Spring, 1: Summer, 2: Fall, 3: Winter
    ambientTemp: 65,
    powder: 0,
    tinctures: 0,
    hasSalesperson: false,
    hasDehydrator: false,
    hasTinctureLab: false,
    hasMulchBin: false,
    hasCO2: false,
    costs: { 
        newTent: 100, upgrade4x8: 50, upgrade8x8: 150,
        hireSales: 300, dehydrator: 400, tinctureLab: 1000, flowHood: 800, mulchBin: 150, steamBarrel: 500,
        pitchCash: 50, pitchInv: 5, grain: 10, pellets: 20,
        humidifier: 50, fan: 50, ac: 300, co2: 250
    },
    tents: [
        { id: 1, type: '4x4', capacity: 10, currentCrop: 0, isGrowing: false, isSpent: false, flushes: 0, x: 180, y: 30, w: 40, h: 40, species: 'blue', temp: 65, humidity: 40, hw: { hum: false, fan: false, ac: false } }
    ],
    speciesData: {
        'blue': { rate: 0.5, colRate: 15, pitchMod: 0, val: 5, yieldMod: 1.2, desc: "+20% Yield", isResearched: true, researchCost: 0, idealTemp: "60-75F", idealHum: "85-95%", spoilageDesc: "Fast", tMin: 60, tMax: 75, hMin: 85, hMax: 95 },
        'golden': { rate: 0.3, colRate: 12, pitchMod: 0.20, val: 10, yieldMod: 1.0, desc: "+$5/lb, +Pitch", isResearched: false, researchCost: 100, idealTemp: "70-85F", idealHum: "85-95%", spoilageDesc: "Fast", tMin: 70, tMax: 85, hMin: 85, hMax: 95 }, 
        'shiitake': { rate: 0.8, colRate: 8, pitchMod: 0.10, val: 20, yieldMod: 1.0, desc: "+60% Speed", isResearched: false, researchCost: 200, idealTemp: "55-70F", idealHum: "80-90%", spoilageDesc: "Slow", tMin: 55, tMax: 70, hMin: 80, hMax: 90 },
        'lions': { rate: 0.1, colRate: 4, pitchMod: 0.15, val: 30, yieldMod: 1.0, desc: "Tinctures, Slow", isResearched: false, researchCost: 300, idealTemp: "65-75F", idealHum: "85-90%", spoilageDesc: "Medium", tMin: 65, tMax: 75, hMin: 85, hMax: 90 }
    },
    clientRoster: [
        { id: 'pizza', name: "Luigi's Pizzeria", dialogue: "Our customers beg for fresh mushrooms. We'll take 10 lbs a week if you can supply it!", boost: 2, img: 'pizza.png', acquired: false },
        { id: 'steak', name: "Iron Steakhouse", dialogue: "I need big, meaty oysters to serve alongside my prime ribs. Don't disappoint me.", boost: 3, img: 'steak.png', acquired: false },
        { id: 'pasta', name: "Bella Pasta", dialogue: "We demand the absolute finest Shiitake for our truffle pasta dish.", boost: 2, img: 'sales.png', acquired: false },
        { id: 'wok', name: "Golden Wok", dialogue: "Fresh mushrooms! Very good! We buy everything!", boost: 4, img: 'sales.png', acquired: false },
        { id: 'vegan', name: "Hipster Vegan Cafe", dialogue: "Lion's mane makes a killer vegan crab cake substitute. Sign us up.", boost: 1, img: 'sales.png', acquired: false }
    ],
    pendingClient: null
};

// DOM Elements
const elMoney = document.getElementById('money-display');
const elInventory = document.getElementById('inventory-display');
const elDemand = document.getElementById('demand-display');
const elPowder = document.getElementById('powder-display');
const elTincture = document.getElementById('tincture-display');
const elLog = document.getElementById('log');
const elTentsContainer = document.getElementById('tents-container');
const elSpecies = document.getElementById('species-select');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Assets
const imgs = {
    floor: document.getElementById('img-floor'),
    op: document.getElementById('img-operator'),
    tent: document.getElementById('img-tent'),
    shroom: document.getElementById('img-shroom'),
    sales: document.getElementById('img-sales'),
    office: document.getElementById('img-office'),
    market: document.getElementById('img-market'),
    dehydrator: document.getElementById('img-dehydrator'),
    tlab: document.getElementById('img-tlab'),
    shiitake: document.getElementById('img-shiitake'),
    lions: document.getElementById('img-lions'),
    sab: document.getElementById('img-sab'),
    flowhood: document.getElementById('img-flowhood'),
    mulch: document.getElementById('img-mulch'),
    pc: document.getElementById('img-pc'),
    barrel: document.getElementById('img-barrel')
};

const keyedImgs = {};
function keyImage(img) {
    if (!img.complete || img.naturalWidth === 0) return img;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const data = x.getImageData(0,0,c.width,c.height);
    const px = data.data;
    for(let i=0; i<px.length; i+=4) {
        // Strict Magenta Chroma Key (#FF00FF and approximations from AI output)
        if (px[i] > 180 && px[i+1] < 120 && px[i+2] > 180) {
            px[i+3] = 0; // Alpha 0
        }
    }
    x.putImageData(data, 0, 0);
    return c;
}

// Entities
const operator = { x: 200, y: 300, targetX: 200, targetY: 300, speed: 150, actionQueue: null, isMoving: false };
const salesperson = { x: 80, y: 300, targetX: 80, targetY: 300, speed: 100, timer: 10, state: 'idle' };

function getTotalInventory() {
    return state.inventoryBatches.reduce((sum, b) => sum + b.amount, 0);
}

function deductInventory(amount, reqSpecies = null) {
    let available = state.inventoryBatches
        .filter(b => reqSpecies ? b.species === reqSpecies : true)
        .reduce((sum, b) => sum + b.amount, 0);
    if (available < amount) return false;
    
    let remaining = amount;
    for (let i = 0; i < state.inventoryBatches.length; i++) {
        let b = state.inventoryBatches[i];
        if (reqSpecies && b.species !== reqSpecies) continue;
        if (b.amount <= remaining) {
            remaining -= b.amount;
            b.amount = 0;
        } else {
            b.amount -= remaining;
            remaining = 0;
        }
        if (remaining <= 0) break;
    }
    state.inventoryBatches = state.inventoryBatches.filter(b => b.amount > 0);
    return true;
}

// Fixed Stations
const stations = {
    flowHood: { x: 50, y: 30, w: 60, h: 40, name: "Flow Hood", color: "#444" },
    shipping: { x: 320, y: 320, w: 60, h: 60, name: "Farmers Market", color: "transparent" }, // Sprite handles look now
    office: { x: 260, y: 220, w: 40, h: 40, name: "Office", color: "#543a29" },
    stand: { x: 50, y: 320, w: 60, h: 40, name: "Auto Market", color: "#365c40" },
    mulchBin: { x: 300, y: 10, w: 40, h: 40, color: "#4f311c" },
    sterilizer: { x: 140, y: 150, w: 40, h: 60, color: "#555" }, // Phase 9 Add
    dehydrator: { x: 20, y: 150, w: 40, h: 60, color: "#aaa" },
    tlab: { x: 80, y: 150, w: 60, h: 60, color: "#22f" }
};

// Core Loop
let lastTime = performance.now();
function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    updateTime(dt);
    updatePhysics(dt);
    updateGrowthAndSpoil(dt);
    updateSalesperson(dt);
    updateGardeners(dt);
    renderCanvas();
    updateUI();

    requestAnimationFrame(gameLoop);
}

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
function updateTime(dt) {
    // 1 second real-time = 1 in-game hour
    state.timeTimer += dt;
    if (state.timeTimer >= 1.0) {
        state.timeTimer -= 1.0;
        state.hour++;
        if (state.hour >= 24) {
            state.hour = 0;
            state.day++;
            
            // Electricity Bill at Midnight
            let dailyWatts = 0;
            state.tents.forEach(t => {
                if(t.hw) {
                    if (t.hw.hum) dailyWatts += 50;
                    if (t.hw.fan) dailyWatts += 20;
                    if (t.hw.ac) dailyWatts += 300;
                }
            });
            let energyCost = dailyWatts * 0.05;
            if (state.hasCO2) energyCost = energyCost * 0.8; // 20% reduction
            if (energyCost > 0) {
                state.money -= energyCost;
                logMsg(`Paid Daily Electricity Bill: -$${energyCost.toFixed(2)}`, "error");
            }

            if (state.day > 30) {
                state.day = 1;
                state.season = (state.season + 1) % 4;
                logMsg(`A new season has begun: ${SEASONS[state.season]}!`, 'success');
            }
        }
    }
    
    // Regional Ambient Temp Calculation
    const climateProfiles = {
        'pnw': [55, 70, 55, 45],
        'desert': [70, 95, 75, 60],
        'northeast': [50, 80, 50, 25]
    };
    const regionName = state.region || 'pnw';
    const profile = climateProfiles[regionName] || climateProfiles['pnw'];
    let base = profile[state.season];
    
    // Diurnal curve: Hotter at 14:00 (2pm), colder at 02:00
    const timeOffset = (state.hour - 8) * (Math.PI / 12);
    const diurnal = Math.sin(timeOffset) * 15; // +/- 15 degrees
    
    state.ambientTemp = Math.floor(base + diurnal);
}

function updateGardeners(dt) {
    if (!state.hasMulchBin || state.mulchInventory <= 0) return;
    state.gardenerTimer -= dt;
    if (state.gardenerTimer <= 0) {
        let taken = Math.min(5, state.mulchInventory);
        state.mulchInventory -= taken;
        if (state.reputation < 5 && Math.random() < 0.20) {
            state.reputation++;
            logMsg("Gardeners loved the Mulch! +1 Business Reputation! ⭐", "success");
        } else {
            logMsg(`Gardeners took ${taken} bags of Mulch.`, "info");
        }
        state.gardenerTimer = 30 + (Math.random() * 30);
    }
}

function updatePhysics(dt) {
    if (operator.actionQueue && operator.actionQueue.state === 'moving') {
        const dx = operator.targetX - operator.x;
        const dy = operator.targetY - operator.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) {
            operator.x = operator.targetX; operator.y = operator.targetY;
            operator.actionQueue.state = 'working'; operator.actionQueue.timer = beginActionCutscene(operator.actionQueue);
        } else {
            operator.x += (dx / dist) * operator.speed * dt; operator.y += (dy / dist) * operator.speed * dt;
            operator.isMoving = true;
        }
    } else { operator.isMoving = false; }

    if (operator.actionQueue && operator.actionQueue.state === 'working') {
        operator.actionQueue.timer -= dt;
        if(operator.actionQueue.timer <= 0) operator.actionQueue.state = 'arrived';
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
            logMsg(`Inoculated grain bag (${operator.actionQueue.species}) for $10.`, "info");
        } 
        else if (t === 'sterilize') {
            state.rawPellets -= operator.actionQueue.required;
            let blocksProduced = state.sterilizerLevel === 1 ? 1 : 5;
            state.sterileBlocks += blocksProduced;
            logMsg(`Sterilized ${blocksProduced} substrate block(s)!`, "success");
        }
        else if (t === 'spawnBulk') {
            const targetTent = operator.actionQueue.targetTent;
            const targetBagId = operator.actionQueue.bagId;
            const bagIndex = state.incubationBatches.findIndex(b => b.id === targetBagId);
            if(bagIndex > -1) {
                const bag = state.incubationBatches[bagIndex];
                state.incubationBatches.splice(bagIndex, 1);
                state.sterileBlocks -= 1;
                targetTent.isGrowing = true; targetTent.species = bag.species;
                logMsg(`Spawned ${bag.species} block to Tent #${targetTent.id}.`, "info");
            }
        }
        else if (t === 'discardMold') {
            const index = state.incubationBatches.findIndex(b => b.id === operator.actionQueue.bagId);
            if(index > -1) {
                state.incubationBatches.splice(index, 1);
                if (state.hasMulchBin) {
                    state.mulchInventory += 1;
                    logMsg(`Dumped contaminated bag into Mulch Bin.`, "info");
                } else {
                    logMsg(`Operator threw away the contaminated bag to the void!`, "info");
                }
            }
        }
        else if (t === 'clearSpent') {
            const targetTent = operator.actionQueue.targetTent;
            targetTent.isSpent = false;
            targetTent.flushes = 0;
            if (state.hasMulchBin) {
                state.mulchInventory += 5;
                logMsg(`Cleared spent tent block into Mulch Bin!`, "success");
            } else {
                logMsg(`Cleared spent tent block.`, "info");
            }
        }
        else if (t === 'harvest') {
            const targetTent = operator.actionQueue.targetTent;
            const harvestedBase = Math.floor(targetTent.currentCrop);
            const harvested = Math.floor(harvestedBase * state.speciesData[targetTent.species].yieldMod);
            
            const dateStr = `${SEASONS[state.season]}, Day ${state.day}`;
            state.inventoryBatches.push({ 
                amount: harvested, 
                timer: SPOIL_TIME, 
                maxTimer: SPOIL_TIME,
                species: targetTent.species,
                harvestDate: dateStr
            });
            
            targetTent.currentCrop -= harvestedBase;
            if(targetTent.currentCrop < 0.1) targetTent.currentCrop = 0;
            
            targetTent.flushes++;
            if (targetTent.flushes >= 3) {
                targetTent.isGrowing = false;
                targetTent.isSpent = true;
                logMsg(`Harvested ${harvested} lbs! Tent block is now SPENT.`, "error");
            } else {
                logMsg(`Harvested ${harvested} lbs! (Flush ${targetTent.flushes}/3)`, "success");
            }
            if (document.getElementById('modal-cooler').style.display === 'flex') {
                renderCooler();
            }
        }
        else if (t === 'sell') { executeSale(); }
        else if (t === 'pitch') {
            if(deductInventory(state.costs.pitchInv)) {
                state.money -= state.costs.pitchCash;
                let successChance = 0.5;
                if(state.hasGoldenUnlocked) successChance += state.speciesData.golden.pitchMod;
                if(Math.random() < successChance) {
                    const unacquired = state.clientRoster.filter(c => !c.acquired);
                    if (unacquired.length > 0) {
                        const randomClient = unacquired[Math.floor(Math.random() * unacquired.length)];
                        state.pendingClient = randomClient;
                        showAcquisitionModal(randomClient);
                        logMsg(`Pitch successful! Meeting secured with ${randomClient.name}.`, "success");
                    } else {
                        state.demand += 10;
                        logMsg("Pitch SUCCESS! +10 lbs Market Demand! (All markets acquired)", "success");
                    }
                } else {
                    logMsg("Pitch FAILED!", "error");
                }
            }
        }
        else if (t === 'dehydrate') {
            if(deductInventory(10)) { // Any species builds powder!
                state.powder += 1;
                logMsg("Produced 1 lb Mushroom Powder (Never Spoils)!", "success");
            }
        }
        else if (t === 'extract') {
            if(deductInventory(5, 'lions')) {
                state.tinctures += 1;
                logMsg("Produced 1 Tincture Bottle (Never Spoils)!", "success");
            } else {
                logMsg("Not enough Lion's Mane (Need 5 lbs)!", "error");
            }
        }
        operator.actionQueue = null;
        endActionCutscene();
    }
}

function executeSale() {
    let inv = getTotalInventory();
    if (inv <= 0) { logMsg("No inventory to sell.", "error"); return; }
    let toSell = Math.min(inv, state.demand);
    if(toSell <= 0) { logMsg("Market demand is full!", "error"); return; }
    
    let earnings = 0;
    while(toSell > 0 && state.inventoryBatches.length > 0) {
        let b = state.inventoryBatches[0];
        let repBonus = (state.reputation - 1) * 2;
        let valPerLb = state.speciesData[b.species].val + repBonus;
        if (b.amount <= toSell) {
            earnings += b.amount * valPerLb;
            toSell -= b.amount;
            state.inventoryBatches.shift();
        } else {
            earnings += toSell * valPerLb;
            b.amount -= toSell;
            toSell = 0;
        }
    }
    state.money += earnings;
    logMsg(`Sold stock to Market for $${earnings}!`, "success");
}

function updateSalesperson(dt) {
    if (!state.hasSalesperson) return;
    if (salesperson.state === 'idle') {
        salesperson.timer -= dt;
        if(salesperson.timer <= 0) {
            let inv = getTotalInventory();
            if (Math.min(inv, state.demand) > 0) {
                salesperson.state = 'movingToShip';
                salesperson.targetX = stations.shipping.x; salesperson.targetY = stations.shipping.y + 20;
            } else salesperson.timer = 5; 
        }
    } else if (salesperson.state === 'movingToShip' || salesperson.state === 'movingToStand') {
        const dx = salesperson.targetX - salesperson.x; const dy = salesperson.targetY - salesperson.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) {
            salesperson.x = salesperson.targetX; salesperson.y = salesperson.targetY;
            if (salesperson.state === 'movingToShip') {
                salesperson.state = 'movingToStand';
                salesperson.targetX = stations.stand.x + 20; salesperson.targetY = stations.stand.y + 20;
            } else {
                executeSale();
                salesperson.state = 'idle'; salesperson.timer = 10; 
            }
        } else {
            salesperson.x += (dx / dist) * salesperson.speed * dt; salesperson.y += (dy / dist) * salesperson.speed * dt;
        }
    }
}

function updateGrowthAndSpoil(dt) {
    // Incubation (New in Phase 7)
    state.incubationBatches.forEach(bag => {
        if (!bag.isContaminated && bag.colonization < 100) {
            bag.colonization += state.speciesData[bag.species].colRate * dt;
            if (bag.colonization >= 100) bag.colonization = 100;
            // Reveal contamination randomly during growth
            if (bag.doomed && bag.colonization > 30 && Math.random() < 0.05) {
                bag.isContaminated = true;
                logMsg(`Trichoderma Mold! Bag #${bag.id} ruined.`, "error");
            }
        }
    });

    // Growth
    state.tents.forEach(tent => {
        if (tent.isGrowing && tent.currentCrop < tent.capacity) {
            tent.currentCrop += state.speciesData[tent.species].rate * dt;
            if (tent.currentCrop >= tent.capacity) {
                tent.currentCrop = tent.capacity; tent.isGrowing = false; 
                logMsg(`Tent #${tent.id} max capacity!`, "success");
            }
        }
    });

    // Spoilage!
    let activeBatches = [];
    state.inventoryBatches.forEach(b => {
        b.timer -= dt;
        if (b.timer > 0) {
            activeBatches.push(b);
        } else {
            logMsg(`${Math.floor(b.amount)} lbs of ${b.species} rotted in the cooler!`, "error");
            if (state.hasMulchBin) state.mulchInventory += Math.floor(b.amount / 5);
        }
    });
    // Force rerender of cooler if batches rot
    if (state.inventoryBatches.length !== activeBatches.length) {
        state.inventoryBatches = activeBatches;
        if (document.getElementById('modal-cooler').style.display === 'flex') {
            renderCooler();
        }
    } else {
        state.inventoryBatches = activeBatches;
    }
}

function renderCanvas() {
    // 1. Draw solid clean gray garage floor
    ctx.fillStyle = '#a6afa9'; // bright clean concrete gray
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw perfect 40x40 grid tiles
    ctx.strokeStyle = '#99a39d';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.strokeRect(x, y, 40, 40);
            
            // Lightly speckled darks
            ctx.fillStyle = '#919b95';
            ctx.fillRect(x + 8, y + 12, 2, 2);
            ctx.fillRect(x + 28, y + 8, 2, 2);
            ctx.fillRect(x + 20, y + 30, 2, 2);
            ctx.fillRect(x + 6, y + 34, 2, 2);
        }
    }
    
    // Grid shadow zones (Highlights functional zones)
    ctx.fillStyle = "rgba(0,0,0,0.08)"; 
    ctx.fillRect(160, 0, 160, 240); // Tents zone
    ctx.fillRect(0, 120, 160, 120); // Process Zone

    let drawList = [];

    // Stations
    drawList.push({ img: keyedImgs.office, x: stations.office.x, y: stations.office.y, w: stations.office.w, h: stations.office.h, orderY: stations.office.y + stations.office.h, fallback: 'OFFICE', color: stations.office.color });
    drawList.push({ img: keyedImgs.market, x: stations.shipping.x, y: stations.shipping.y, w: stations.shipping.w, h: stations.shipping.h, orderY: stations.shipping.y + stations.shipping.h, fallback: 'MARKET', color: stations.shipping.color });
    // Flow Hood (SAB vs Hood)
    let labImg = state.labLevel === 1 ? keyedImgs.sab : keyedImgs.flowhood;
    drawList.push({ img: labImg, x: stations.flowHood.x, y: stations.flowHood.y - 10, w: stations.flowHood.w, h: stations.flowHood.h + 10, orderY: stations.flowHood.y + stations.flowHood.h, fallback: 'LAB', color: stations.flowHood.color });
    if (state.hasMulchBin) {
        drawList.push({ img: keyedImgs.mulch, x: stations.mulchBin.x, y: stations.mulchBin.y, w: stations.mulchBin.w, h: stations.mulchBin.h, orderY: stations.mulchBin.y + stations.mulchBin.h, fallback: 'MULCH', color: stations.mulchBin.color });
    }

    // Sterilizer (PC vs Barrel)
    let sterImg = state.sterilizerLevel === 1 ? keyedImgs.pc : keyedImgs.barrel;
    drawList.push({ img: sterImg, x: stations.sterilizer.x, y: stations.sterilizer.y, w: stations.sterilizer.w, h: stations.sterilizer.h, orderY: stations.sterilizer.y + stations.sterilizer.h, fallback: 'STEAM', color: stations.sterilizer.color });

    if (state.hasDehydrator) drawList.push({ img: keyedImgs.dehydrator, x: stations.dehydrator.x, y: stations.dehydrator.y, w: stations.dehydrator.w, h: stations.dehydrator.h, orderY: stations.dehydrator.y + stations.dehydrator.h, fallback: 'DEHYD', color: stations.dehydrator.color });
    if (state.hasTinctureLab) drawList.push({ img: keyedImgs.tlab, x: stations.tlab.x, y: stations.tlab.y, w: stations.tlab.w, h: stations.tlab.h, orderY: stations.tlab.y + stations.tlab.h, fallback: 'LAB', color: stations.tlab.color });

    if (state.hasSalesperson) {
        drawList.push({ img: null, x: stations.stand.x, y: stations.stand.y, w: stations.stand.w, h: stations.stand.h, orderY: stations.stand.y + stations.stand.h, fallback: 'STAND', color: stations.stand.color });
        const bobS = (salesperson.state !== 'idle') ? Math.sin(performance.now() / 100) * 3 : 0;
        drawList.push({ img: keyedImgs.sales, x: salesperson.x - 16, y: salesperson.y - 16 + bobS, w: 32, h: 32, orderY: salesperson.y, isEntity: true, fallbackColor: '#f0f' });
    }

    // Tents
    state.tents.forEach(tent => {
        let shroomDraw = null;
        let hColor = tent.isSpent ? "#8c4423" : "#0a2310";
        if (tent.isGrowing || tent.currentCrop > 0) {
            const progress = tent.currentCrop / tent.capacity;
            let sImg = keyedImgs.shroom; 
            if(tent.species === 'shiitake') sImg = keyedImgs.shiitake;
            if(tent.species === 'lions') sImg = keyedImgs.lions;
            if (sImg && (sImg.complete !== false)) {
                shroomDraw = { img: sImg, alpha: Math.max(0.2, Math.min(progress, 1)) };
            }
        }
        drawList.push({ img: keyedImgs.tent, x: tent.x - 10, y: tent.y - 20, w: tent.w + 20, h: tent.h + 20, hitX: tent.x, hitY: tent.y, hitW: tent.w, hitH: tent.h, orderY: tent.y + tent.h, fallback: tent.isSpent ? 'SPENT' : 'TENT', color: hColor, shroom: shroomDraw });
    });

    // Operator
    const bob = operator.isMoving ? Math.sin(performance.now() / 100) * 3 : 0;
    drawList.push({ img: keyedImgs.op, x: operator.x - 16, y: operator.y - 16 + bob, w: 32, h: 32, orderY: operator.y, isEntity: true, fallbackColor: '#fff' });

    // SORT Y
    drawList.sort((a,b) => a.orderY - b.orderY);

    // DRAW sorted list
    drawList.forEach(obj => {
        const renderImg = obj.img || null;
        if (renderImg && (renderImg.complete !== false) && (renderImg.width > 0)) { 
            ctx.drawImage(renderImg, obj.x, obj.y, obj.w, obj.h);
            if (obj.shroom) {
                ctx.globalAlpha = obj.shroom.alpha;
                ctx.drawImage(obj.shroom.img, obj.x + obj.w/2 - 16, obj.y + obj.h/2 - 24, 32, 32);
                ctx.globalAlpha = 1.0;
            }
        } else {
            // Draw hitbox logic if missing image
            let hX = obj.hitX || obj.x; let hY = obj.hitY || obj.y; let hW = obj.hitW || obj.w; let hH = obj.hitH || obj.h;
            ctx.fillStyle = obj.color || obj.fallbackColor;
            if (obj.isEntity) {
                ctx.fillRect(obj.x + 6, obj.y + 6, 20, 20);
            } else {
                ctx.fillRect(hX, hY, hW, hH);
                if (obj.fallback) {
                    ctx.fillStyle = "#fff"; ctx.font = "8px 'Press Start 2P'";
                    ctx.fillText(obj.fallback, hX + 5, hY + hH/2);
                }
            }
        }
    });
}

// Interactivity Handlers
document.getElementById('btn-buy-pellets').addEventListener('click', () => {
    if (state.money >= state.costs.pellets) {
        state.money -= state.costs.pellets; state.rawPellets += 100;
        logMsg("Bought 100lbs Wood Pellets.", "info");
    } else { logMsg("Need $20 for Pellets.", "error"); }
});

document.getElementById('btn-sterilize').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator is busy!", "error"); return; }
    let required = state.sterilizerLevel === 1 ? 10 : 50;
    if (state.rawPellets < required) { logMsg(`Need ${required} lbs of raw pellets to run sterilizer!`, "error"); return; }
    operator.targetX = stations.sterilizer.x + stations.sterilizer.w / 2; operator.targetY = stations.sterilizer.y + stations.sterilizer.h + 20;
    operator.actionQueue = { task: 'sterilize', required, state: 'moving' };
});

document.getElementById('btn-inoculate-grain').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator is busy!", "error"); return; }
    if (state.money < state.costs.grain) { logMsg("Need $10 for grain!", "error"); return; }
    if (state.incubationBatches.length >= 12) { logMsg("Incubation shelf full!", "error"); return; }
    operator.targetX = stations.flowHood.x + stations.flowHood.w / 2; operator.targetY = stations.flowHood.y + stations.flowHood.h + 20; 
    operator.actionQueue = { task: 'inoculateGrain', species: elSpecies.value, state: 'moving' };
});

document.getElementById('btn-spawn-bulk').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator is busy!", "error"); return; }
    if (state.sterileBlocks <= 0) { logMsg("You need a Sterilized Substrate Block!", "error"); return; }
    const readyBag = state.incubationBatches.find(b => b.colonization >= 100 && !b.isContaminated);
    if (!readyBag) { logMsg("No fully colonized bags ready!", "error"); return; }
    const emptyTent = state.tents.find(t => !t.isGrowing && Math.floor(t.currentCrop) === 0 && !t.isSpent);
    if (!emptyTent) { logMsg("No empty (non-spent) tents available!", "error"); return; }
    operator.targetX = emptyTent.x + emptyTent.w / 2; operator.targetY = emptyTent.y + emptyTent.h + 20;
    operator.actionQueue = { task: 'spawnBulk', targetTent: emptyTent, bagId: readyBag.id, state: 'moving' };
});

document.getElementById('btn-discard-mold').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator is busy!", "error"); return; }
    const doomedBag = state.incubationBatches.find(b => b.isContaminated);
    if (!doomedBag) { logMsg("No moldy bags to discard!", "error"); return; }
    
    // Operator walks to flowhood/SAB bench and dumps it
    operator.targetX = stations.flowHood.x + stations.flowHood.w / 2; operator.targetY = stations.flowHood.y + stations.flowHood.h + 20;
    operator.actionQueue = { task: 'discardMold', bagId: doomedBag.id, state: 'moving' };
});

document.getElementById('btn-clear-spent').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator is busy!", "error"); return; }
    const spentTent = state.tents.find(t => t.isSpent);
    if (!spentTent) { logMsg("No spent tents to clear!", "error"); return; }
    operator.targetX = spentTent.x + spentTent.w / 2; operator.targetY = spentTent.y + spentTent.h + 20;
    operator.actionQueue = { task: 'clearSpent', targetTent: spentTent, state: 'moving' };
});

document.getElementById('btn-harvest-auto').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator is busy!", "error"); return; }
    const readyTent = state.tents.slice().sort((a,b) => b.currentCrop - a.currentCrop)[0];
    if (!readyTent || Math.floor(readyTent.currentCrop) < 1) { logMsg("Nothing to harvest.", "error"); return; }
    operator.targetX = readyTent.x + readyTent.w / 2; operator.targetY = readyTent.y + readyTent.h + 20;
    operator.actionQueue = { task: 'harvest', targetTent: readyTent, state: 'moving' };
});

document.getElementById('btn-sell').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator busy!", "error"); return; }
    if (state.hasSalesperson) { logMsg("Salesperson handles market sales natively!", "info"); return; }
    operator.targetX = stations.shipping.x + stations.shipping.w / 2; operator.targetY = stations.shipping.y - 20;
    operator.actionQueue = { task: 'sell', state: 'moving' };
});

document.getElementById('btn-pitch').addEventListener('click', () => {
    if (operator.actionQueue) { logMsg("Operator busy!", "error"); return; }
    if (state.money < state.costs.pitchCash || getTotalInventory() < state.costs.pitchInv) {
        logMsg(`Need $${state.costs.pitchCash} and ${state.costs.pitchInv} lbs inventory.`, "error"); return;
    }
    operator.targetX = stations.office.x + stations.office.w / 2; operator.targetY = stations.office.y + stations.office.h + 20;
    operator.actionQueue = { task: 'pitch', state: 'moving' };
});

document.getElementById('btn-dehydrate').addEventListener('click', () => {
    if (!state.hasDehydrator) { logMsg("You need to buy the Dehydrator first!", "error"); return; }
    if (operator.actionQueue) { logMsg("Operator busy!", "error"); return; }
    if (getTotalInventory() < 10) { logMsg("Need 10 lbs of raw inventory to dehydrate.", "error"); return; }
    operator.targetX = stations.dehydrator.x + stations.dehydrator.w / 2; operator.targetY = stations.dehydrator.y + stations.dehydrator.h + 20;
    operator.actionQueue = { task: 'dehydrate', state: 'moving' };
});

document.getElementById('btn-extract').addEventListener('click', () => {
    if (!state.hasTinctureLab) { logMsg("You need to buy the Tincture Lab!", "error"); return; }
    if (operator.actionQueue) { logMsg("Operator busy!", "error"); return; }
    // Note: Deduct logic checks specifically for Lion's Mane upon arrival
    operator.targetX = stations.tlab.x + stations.tlab.w / 2; operator.targetY = stations.tlab.y + stations.tlab.h + 20;
    operator.actionQueue = { task: 'extract', state: 'moving' };
});

document.getElementById('btn-sell-goods').addEventListener('click', () => {
    let e = (state.powder * 100) + (state.tinctures * 80);
    if(e > 0) {
        state.money += e;
        logMsg(`Sold Processed Goods for $${e}!`, "success");
        state.powder = 0; state.tinctures = 0;
    } else { logMsg("No processed goods to sell.", "error"); }
});

// Legacy Upgrade Listeners (Removed)
window.buyTent = function() {
    if (state.money >= state.costs.newTent) {
        if (state.tents.length >= 3) { logMsg("Garage full!", "error"); return; }
        state.money -= state.costs.newTent;
        let newX = 180; let newY = 30; if(state.tents.length === 1) newY = 120; else if(state.tents.length === 2) newY = 210;
        state.tents.push({ id: state.tents.length + 1, type: '4x4', capacity: 10, currentCrop: 0, isGrowing: false, isSpent: false, flushes: 0, x: newX, y: newY, w: 40, h: 40, species: 'blue', temp: 65, humidity: 40, hw: { hum: false, fan: false, ac: false } });
        state.costs.newTent = Math.floor(state.costs.newTent * 1.5);
        renderEquipmentModal('facilities', '⛺ Fruiting Facilities');
    } else { logMsg("Not enough money.", "error"); }
};

window.upgTent = function() {
    const u = state.tents.find(t => t.type !== '8x8');
    if (!u) { logMsg("Fully upgraded!", "error"); return; }
    const cost = u.type === '4x4' ? state.costs.upgrade4x8 : state.costs.upgrade8x8;
    if (state.money >= cost) {
        state.money -= cost;
        if (u.type === '4x4') { u.type = '4x8'; u.capacity = 20; u.h = 80; } 
        else if (u.type === '4x8') { u.type = '8x8'; u.capacity = 40; u.w = 80; }
        renderEquipmentModal('facilities', '⛺ Fruiting Facilities');
    } else { logMsg(`Need $${cost}.`, "error"); }
};

window.buyStrain = function(id) {
    if(state.money >= state.speciesData[id].researchCost && !state.speciesData[id].isResearched) {
        state.money -= state.speciesData[id].researchCost;
        state.speciesData[id].isResearched = true;
        logMsg(`Unlocked ${id} genetics!`, "success");
        updateSpeciesDropdown();
        renderEquipmentModal('strains', '🍄 Cultivation Strains');
    } else { logMsg("Not enough money or already researched.", "error"); }
};


const equipmentData = [
    {
        id: 'sterilizer', title: "Substrate Sterilization", cat: 'lab',
        tiers: [
            { level: 1, name: "Pressure Cooker", cost: 0, text: "1 Block / Run" },
            { level: 2, name: "55-Gal Steam Barrel", cost: 500, text: "5 Blocks / Run." },
            { level: 3, name: "Concrete Roller", cost: 2000, text: "20 Blocks / Run." },
            { level: 4, name: "Autoclave Press", cost: 10000, text: "100 Blocks / Run." }
        ]
    },
    {
        id: 'lab', title: "Mycology Lab", cat: 'lab',
        tiers: [
            { level: 1, name: "Still Air Box", cost: 0, text: "25% contamination risk." },
            { level: 2, name: "Laminar Flow Hood", cost: 800, text: "5% contamination risk. Fast." }
        ]
    },
    {
        id: 'sales', title: "Market Logistics", cat: 'logistics',
        tiers: [
            { level: 1, name: "Manual Hauling", cost: 0, text: "Requires Operator round-trip." },
            { level: 2, name: "Hire Salesperson", cost: 300, text: "Automates Farmer's Market sales." }
        ]
    },
    {
        id: 'dehydrator', title: "Dehydrator Station", cat: 'logistics',
        tiers: [
            { level: 1, name: "None", cost: 0, text: "" },
            { level: 2, name: "Commercial Dehydrator", cost: 400, text: "Process 10lbs fruit to powder." }
        ]
    },
    {
        id: 'tincture', title: "Tincture Extraction", cat: 'logistics',
        tiers: [
            { level: 1, name: "None", cost: 0, text: "" },
            { level: 2, name: "Alcohol Extraction Lab", cost: 1000, text: "Process 5lbs Lion's Mane into tinctures." }
        ]
    },
    {
        id: 'mulch', title: "Mulch/Waste Recovery", cat: 'logistics',
        tiers: [
            { level: 1, name: "Trash Pile", cost: 0, text: "Zero value." },
            { level: 2, name: "Composting Bin", cost: 150, text: "Spent blocks attract gardeners for Reputation." }
        ]
    },
    {
        id: 'co2', title: "Climate Sensors", cat: 'facilities',
        tiers: [
            { level: 1, name: "Analog Timers", cost: 0, text: "Default energy usage." },
            { level: 2, name: "CO2 Sentinels", cost: 250, text: "Optimizes hardware. -20% daily energy." }
        ]
    }
];

function getCurrentTier(eqId) {
    if(eqId === 'sterilizer') return state.sterilizerLevel;
    if(eqId === 'lab') return state.labLevel;
    if(eqId === 'sales') return state.hasSalesperson ? 2 : 1;
    if(eqId === 'dehydrator') return state.hasDehydrator ? 2 : 1;
    if(eqId === 'tincture') return state.hasTinctureLab ? 2 : 1;
    if(eqId === 'mulch') return state.hasMulchBin ? 2 : 1;
    if(eqId === 'co2') return state.hasCO2 ? 2 : 1;
    return 1;
}

window.purchaseTier = function(eqId, targetLevel, cost) {
    if(state.money < cost) { logMsg(`Need $${cost} to upgrade!`, "error"); return; }
    state.money -= cost;
    if(eqId === 'sterilizer') state.sterilizerLevel = targetLevel;
    if(eqId === 'lab') state.labLevel = targetLevel;
    if(eqId === 'sales') state.hasSalesperson = true;
    if(eqId === 'dehydrator') state.hasDehydrator = true;
    if(eqId === 'tincture') state.hasTinctureLab = true;
    if(eqId === 'mulch') state.hasMulchBin = true;
    if(eqId === 'co2') state.hasCO2 = true;
    logMsg(`Purchased ${eqId} upgrade!`, "success");
    renderEquipmentModal();
};

window.renderEquipmentModal = function(catId, titleText) {
    document.getElementById('modal-equipment').style.display = 'flex';
    document.querySelector('#modal-equipment h2').innerHTML = titleText;
    const grid = document.getElementById('equipment-grid');
    grid.innerHTML = '';
    
    // Custom handling for Strains
    if (catId === 'strains') {
        Object.keys(state.speciesData).forEach(key => {
            if(key === 'blue') return; // Default
            const sd = state.speciesData[key];
            const isOwned = sd.isResearched;
            const bg = isOwned ? '#113311' : '#111';
            const bdr = isOwned ? '#5eff6b' : '#ff9900';
            
            grid.innerHTML += `<div style="background:${bg}; border: 1px solid ${bdr}; padding: 15px; display:flex; justify-content:space-between; align-items:center; border-radius:4px; margin-bottom:10px;">
                <div style="color:#fff;">
                    <strong>${key.toUpperCase()}</strong><br>
                    <span style="font-size:10px; color:#aaa;">${sd.desc}</span>
                </div>
                <div>
                    ${isOwned ? '<span style="color:#5eff6b;">Unlocked</span>' : `<button class="pixel-btn small" style="border-color:#ff9900; color:#ff9900;" onclick="buyStrain('${key}')">Research $${sd.researchCost}</button>`}
                </div>
            </div>`;
        });
        return;
    }

    // Custom handling for Tents appended to Facilities
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

    // Standard Tiered Equipment Loop
    equipmentData.forEach(eq => {
        if(eq.cat !== catId) return;
        const currentLvl = getCurrentTier(eq.id);
        const card = document.createElement('div');
        card.style = "background:#1a2430; border: 2px solid #5ea1ff; padding: 10px; border-radius: 4px;";
        
        let html = `<h3 style="color:#5eff6b; margin:0 0 5px 0; font-size:14px;">${eq.title}</h3>`;
        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
        
        eq.tiers.forEach(t => {
            const isOwned = currentLvl >= t.level;
            const isNext = currentLvl === t.level - 1;
            const bg = isOwned ? '#113311' : (isNext ? '#332200' : '#111');
            const bdr = isOwned ? '#5eff6b' : (isNext ? '#ff9900' : '#333');
            const col = isOwned ? '#aaa' : (isNext ? '#fff' : '#666');
            
            html += `<div style="background:${bg}; border: 1px solid ${bdr}; padding: 8px; display:flex; justify-content:space-between; align-items:center;">
                <div style="color:${col}; font-size:12px;">
                    <strong>[Lvl ${t.level}] ${t.name}</strong><br>
                    <span style="font-size:10px;">${t.text}</span>
                </div>
                <div>
                    ${isOwned ? '<span style="color:#5eff6b; font-size:10px;">OWNED</span>' : 
                      isNext ? `<button class="pixel-btn small" style="border-color:#ff9900; color:#ff9900;" onclick="purchaseTier('${eq.id}', ${t.level}, ${t.cost}, '${catId}', '${titleText}')">Buy $${t.cost}</button>` :
                      '<span style="color:#555; font-size:10px;">LOCKED</span>'
                    }
                </div>
            </div>`;
        });
        html += `</div>`;
        card.innerHTML = html;
        grid.appendChild(card);
    });
};

window.purchaseTier = function(eqId, targetLevel, cost, catId, titleText) {
    if(state.money < cost) { logMsg(`Need $${cost} to upgrade!`, "error"); return; }
    state.money -= cost;
    if(eqId === 'sterilizer') state.sterilizerLevel = targetLevel;
    if(eqId === 'lab') state.labLevel = targetLevel;
    if(eqId === 'sales') state.hasSalesperson = true;
    if(eqId === 'dehydrator') state.hasDehydrator = true;
    if(eqId === 'tincture') state.hasTinctureLab = true;
    if(eqId === 'mulch') state.hasMulchBin = true;
    if(eqId === 'co2') state.hasCO2 = true;
    logMsg(`Purchased ${eqId} upgrade!`, "success");
    renderEquipmentModal(catId, titleText);
};

function updateUI() {
    elMoney.textContent = state.money.toFixed(2);
    const totInv = Math.floor(getTotalInventory());
    document.querySelector('#btn-cooler span').textContent = totInv;
    
    document.getElementById('pellets-display').textContent = state.rawPellets;
    document.getElementById('sterile-display').textContent = state.sterileBlocks;
    
    // Calendar Update
    let hStr = state.hour < 10 ? '0'+state.hour : state.hour;
    document.getElementById('clock-display').textContent = `${SEASONS[state.season]}, Day ${state.day} - ${hStr}:00`;
    document.getElementById('temp-display').textContent = state.ambientTemp;
    
    document.getElementById('rep-display').textContent = "★".repeat(state.reputation) + "☆".repeat(5-state.reputation);
    elPowder.textContent = state.powder;
    elTincture.textContent = state.tinctures;
    
    let totCap = 0; let totCrop = 0;
    elTentsContainer.innerHTML = '';
    state.tents.forEach(t => {
        totCap += t.capacity; totCrop += Math.floor(t.currentCrop);
        const prog = (t.currentCrop / t.capacity) * 100;
        const div = document.createElement('div');
        
        let hwHtml = `<div style="display:flex; gap:2px; font-size:8px; margin-bottom:5px;">`;
        if(!t.hw.hum) hwHtml += `<button class="pixel-btn small" onclick="buyHW(${t.id}, 'hum')">+Hum</button>`;
        if(!t.hw.fan) hwHtml += `<button class="pixel-btn small" onclick="buyHW(${t.id}, 'fan')">+Fan</button>`;
        if(!t.hw.ac) hwHtml += `<button class="pixel-btn small" onclick="buyHW(${t.id}, 'ac')">+AC</button>`;
        hwHtml += `</div>
        <div style="font-size:9px; color:#aaa; margin-bottom:5px;">Temp: <span style="${(t.temp > state.speciesData[t.species]?.tMax || t.temp < state.speciesData[t.species]?.tMin) ? 'color:#ff5e5e' : 'color:#5eff6b'}">${Math.floor(t.temp)}°F</span> | Hum: <span style="${(t.humidity < state.speciesData[t.species]?.hMin) ? 'color:#ff5e5e' : 'color:#5eff6b'}">${Math.floor(t.humidity)}%</span></div>`;
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom: 2px;"><span>Tent #${t.id} (${t.type}) ${t.isSpent ? '[SPENT]' : '['+t.species+']'}</span><span>${Math.floor(t.currentCrop)}/${t.capacity}</span></div>
            ${hwHtml}
            <div class="progress-bar" style="margin-top:0; margin-bottom:10px; height:10px;"><div class="progress-fill" style="width: ${prog}%"></div></div>
        `;
        elTentsContainer.appendChild(div);
    });
    
    // Update Incubation Shelf
    const shelf = document.getElementById('incubation-container');
    if (shelf) {
        shelf.innerHTML = '';
        state.incubationBatches.forEach(b => {
            const bd = document.createElement('div');
            bd.className = 'grain-bag' + (b.isContaminated ? ' contaminated' : '');
            bd.innerHTML = `
                <div class="grain-label">${b.species.substring(0,3).toUpperCase()}</div>
                <div class="grain-mycelium" style="height:${b.colonization}%"></div>
            `;
            shelf.appendChild(bd);
        });
    }

    document.getElementById('capacity-display').textContent = totCap;
}

// Modal & Encyclopedia Logic
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
            card.innerHTML = `
                <h3>${headerTitle}</h3>
                <p><b>Temp:</b> ${s.idealTemp}</p>
                <p><b>Humidity:</b> ${s.idealHum}</p>
                <p><b>Spoilage Rate:</b> ${s.spoilageDesc}</p>
                <p><b>Base Value:</b> $${s.val}/lb</p>
                <p><i>${s.desc}</i></p>
            `;
        } else {
            card.innerHTML = `
                <h3>???</h3>
                <p><b>Temp:</b> ???</p>
                <p><b>Humidity:</b> ???</p>
                <button class="pixel-btn small btn-research" onclick="researchSpecies('${key}')">Research ($${s.researchCost})</button>
            `;
        }
        grid.appendChild(card);
    });
}

window.researchSpecies = function(key) {
    const s = state.speciesData[key];
    if (state.money >= s.researchCost) {
        state.money -= s.researchCost; s.isResearched = true;
        logMsg(`Unlocked research on ${key}! Added to Inoculation list.`, "success");
        updateSpeciesDropdown();
        renderEncyclopedia();
        updateUI();
    } else {
        logMsg("Not enough money for research.", "error");
    }
}

function updateSpeciesDropdown() {
    elSpecies.innerHTML = '';
    Object.keys(state.speciesData).forEach(key => {
        if(state.speciesData[key].isResearched) {
            const opt = document.createElement('option'); 
            opt.value = key; 
            opt.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}`; 
            elSpecies.appendChild(opt);
        }
    });
}
// Run once on load to populate starting species
updateSpeciesDropdown();

window.buyHW = function(tentId, hwType) {
    const cost = state.costs[hwType];
    const tent = state.tents.find(t => t.id === tentId);
    if (!tent) return;
    if (state.money >= cost) {
        state.money -= cost;
        tent.hw[hwType] = true;
        logMsg(`Upgraded Tent #${tentId} hardware!`, "success");
    } else {
        logMsg(`Not enough money. Need $${cost}.`, "error");
    }
}

// B2B Contracts & Acquisition Modals
const modalAcq = document.getElementById('modal-acquisition');
const acqPortrait = document.getElementById('acq-portrait');
const acqName = document.getElementById('acq-name');
const acqDialogue = document.getElementById('acq-dialogue');
const acqStats = document.getElementById('acq-stats');

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
        state.demand += state.pendingClient.boost;
        if(state.pendingClient.boost >= 3) {
            state.reputation++;
            logMsg("1-Star Reputation Boost from signing a massive client!", "success");
        }
        logMsg(`Signed contract with ${state.pendingClient.name}!`, "success");
        state.pendingClient = null;
    }
    modalAcq.style.display = 'none';
    renderContracts();
});

const modalContracts = document.getElementById('modal-contracts');
document.getElementById('btn-contracts').addEventListener('click', () => {
    modalContracts.style.display = 'flex';
    renderContracts();
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
        div.innerHTML = `
            <img class="client-portrait" src="${c.img}">
            <div class="client-info">
                <h3>${c.name}</h3>
                <p>"${c.dialogue}"</p>
                <div class="client-stats">+${c.boost} Base Demand/sec</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Walk-In Cooler Logic
const modalCooler = document.getElementById('modal-cooler');
document.getElementById('btn-cooler').addEventListener('click', () => {
    modalCooler.style.display = 'flex';
    renderCooler();
});
document.getElementById('btn-close-cooler').addEventListener('click', () => {
    modalCooler.style.display = 'none';
});

function renderCooler() {
    const grid = document.getElementById('cooler-grid');
    grid.innerHTML = '';
    
    if (state.inventoryBatches.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1 / -1; color:#555; text-align:center;">Cooler is completely empty. Go harvest!</p>`;
        return;
    }
    
    state.inventoryBatches.forEach((b, index) => {
        const card = document.createElement('div');
        card.className = 'batch-card';
        // Map species to image path
        let imgSrc = 'shroom.png';
        if(b.species === 'shiitake') imgSrc = 'shiitake.png';
        if(b.species === 'lions') imgSrc = 'lions_mane.png';
        
        let prog = (b.timer / b.maxTimer) * 100;
        let color = "#5eff6b";
        if (prog < 50) color = "#ffde5e";
        if (prog < 20) color = "#ff5e5e";
        
        card.innerHTML = `
            <img src="${imgSrc}">
            <div style="float:right; text-align:right;">
                <span style="color:#5ea1ff; font-weight:bold;">${Math.floor(b.amount)} lbs</span><br>
                <span style="color:#aaa;">${b.harvestDate}</span>
            </div>
            <div style="clear:both;"></div>
            <div class="spoilage-bar"><div class="spoilage-fill" style="width:${prog}%; background:${color};"></div></div>
        `;
        grid.appendChild(card);
    });
}

// Add an interval to dynamically update cooler progress bars if modal is open
setInterval(() => {
    if (modalCooler.style.display === 'flex') {
        const fills = document.querySelectorAll('#cooler-grid .spoilage-fill');
        state.inventoryBatches.forEach((b, i) => {
            if (fills[i]) {
                let prog = (b.timer / b.maxTimer) * 100;
                fills[i].style.width = prog + '%';
                if (prog < 50) fills[i].style.background = "#ffde5e";
                if (prog < 20) fills[i].style.background = "#ff5e5e";
            }
        });
    }
}, 500);

function logMsg(msg, type) {
    const p = document.createElement('p'); p.textContent = `> ${msg}`; p.className = type;
    elLog.prepend(p); if (elLog.children.length > 5) elLog.removeChild(elLog.lastChild);
}

let gameStarted = false;
function initGame() {
    Object.keys(imgs).forEach(key => {
        if (['floor', 'shroom', 'shiitake', 'lions'].includes(key)) {
            keyedImgs[key] = imgs[key]; // Skip keying for flat elements
        } else {
            keyedImgs[key] = keyImage(imgs[key]);
        }
    });
    // Draw initial static canvas
    ctx.clearRect(0,0,400,400);
    ctx.fillStyle = "#111";
    ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#5ea1ff";
    ctx.font = "16px monospace";
    ctx.fillText("Awaiting Initialization...", 90, 200);
    logMsg("Phase 6: 3/4 Perspective Engine Ready.", "info");
}

document.getElementById('btn-start-simulation').addEventListener('click', () => {
    state.money = parseInt(document.getElementById('setup-funding').value) || 1500;
    state.region = document.getElementById('setup-location').value;
    document.getElementById('modal-splash').style.display = 'none';
    
    const regionNames = { 'pnw': "Pacific Northwest", 'desert': "Desert Southwest", 'northeast': "Northeast" };
    document.getElementById('region-display').textContent = regionNames[state.region];
    
    gameStarted = true;
    lastTime = performance.now();
    updateUI();
    
    // Play audio when user physically interacts with the "Initialize" button
    if(bgm && !bgmPlaying) {
        bgm.play().catch(e=>console.log(e));
        bgmPlaying = true;
        document.getElementById('btn-music').textContent = '🔊 Music';
    }
    
    requestAnimationFrame(gameLoop);
    logMsg("Simulation Initialized. Welcome to the Farm.", "success");
});

let loadedCount = 0;
const imgVals = Object.values(imgs);
imgVals.forEach(i => {
    if (i.complete) loadedCount++;
    else {
        i.onload = () => {
            loadedCount++;
            if(loadedCount === imgVals.length) initGame();
        };
        i.onerror = () => { // Catch failures so game doesn't hang
            loadedCount++;
            if(loadedCount === imgVals.length) initGame();
        };
    }
});
if (loadedCount === imgVals.length) initGame();

let bgmPlaying = false;
const bgm = document.getElementById('bgm');
const bgmQueue = ['bgm1.mp3', 'bgm2.mp3', 'bgm3.mp3'];
let currentBgmIndex = 0;

if(bgm) {
    bgm.volume = 0.3;
    bgm.addEventListener('ended', () => {
        currentBgmIndex = (currentBgmIndex + 1) % bgmQueue.length;
        bgm.src = bgmQueue[currentBgmIndex];
        bgm.play().catch(e=>console.log(e));
    });
}
document.getElementById('btn-music').addEventListener('click', () => {
    if(!bgm) return;
    if(bgmPlaying) {
        bgm.pause();
        bgmPlaying = false;
        document.getElementById('btn-music').textContent = '🔇 Music';
    } else {
        bgm.play().catch(e=>console.log(e));
        bgmPlaying = true;
        document.getElementById('btn-music').textContent = '🔊 Music';
    }
});

const modalCutscene = document.getElementById('modal-cutscene');
const imgCutscene = document.getElementById('cutscene-img');
const imgOverlay = document.getElementById('cutscene-overlay-img');
const titleCutscene = document.getElementById('cutscene-title');

function beginActionCutscene(aq) {
    const t = aq.task;
    let duration = 0.5;
    let label = "";
    let src = "";
    let overlaySrc = "";
    
    if (t === 'sterilize') { duration = 2.5; label = "STERILIZING SUBSTRATE..."; src = state.sterilizerLevel === 1 ? 'pressure_cooker_34.png' : 'steam_barrel_34.png'; }
    else if (t === 'inoculateGrain') { duration = 1.5; label = "INOCULATING GRAINS..."; src = state.labLevel === 1 ? 'sab_34.png' : 'flowhood_34.png'; }
    else if (t === 'spawnBulk') { duration = 2.0; label = "SPAWNING TO BULK..."; src = 'tent_34.png'; }
    else if (t === 'dehydrate') { duration = 3.0; label = "DEHYDRATING FRUITS..."; src = 'dehydrator_34.png'; }
    else if (t === 'extract') { duration = 3.5; label = "EXTRACTING TINCTURES..."; src = 'tlab_34.png'; }
    else if (t === 'harvest') { 
        duration = 2.0; label = "HARVESTING YIELDS..."; src = 'tent_34.png'; 
        if(aq.targetTent && aq.targetTent.species) {
            if(aq.targetTent.species === 'shiitake') overlaySrc = 'shiitake.png';
            else if(aq.targetTent.species === 'lions') overlaySrc = 'lions_mane.png';
            else overlaySrc = 'pixel_mushroom.png';
        }
    }
    else if (t === 'pitch') { duration = 2.5; label = "PITCHING LOCAL MARKETS..."; src = 'office_34.png'; }
    else if (t === 'sell') { duration = 2.0; label = "HAULING FREIGHT..."; src = 'market_34.png'; }
    else if (t === 'discardMold' || t === 'clearSpent') { duration = 1.0; label = "DUMPING INVENTORY..."; src = 'mulch_bin_34.png'; }

    if (src) {
        modalCutscene.style.display = 'flex';
        titleCutscene.textContent = label;
        // Hack to restart CSS animations
        imgCutscene.classList.remove('cutscene-img');
        void imgCutscene.offsetWidth; 
        imgCutscene.classList.add('cutscene-img');
        imgCutscene.src = src;
        
        if (overlaySrc) {
            imgOverlay.src = overlaySrc;
            imgOverlay.style.display = 'block';
        } else {
            imgOverlay.style.display = 'none';
        }
    }
    
    return duration;
}

function endActionCutscene() {
    modalCutscene.style.display = 'none';
}

document.getElementById('btn-cat-strains').addEventListener('click', () => renderEquipmentModal('strains', '🍄 Cultivation Strains'));
document.getElementById('btn-cat-facilities').addEventListener('click', () => renderEquipmentModal('facilities', '⛺ Fruiting Facilities'));
document.getElementById('btn-cat-lab').addEventListener('click', () => renderEquipmentModal('lab', '🔬 Lab & Substrate Ops'));
document.getElementById('btn-cat-logistics').addEventListener('click', () => renderEquipmentModal('logistics', '🏭 Commercial Logistics'));

document.getElementById('btn-close-equipment').addEventListener('click', () => {
    document.getElementById('modal-equipment').style.display = 'none';
});
