// ── DOM Element References ───────────────────────────────────────────────────
const elMoney = document.getElementById('money-display');
const elDemand = document.getElementById('demand-display');
const elPowder = document.getElementById('powder-display');
const elTincture = document.getElementById('tincture-display');
const elLog = document.getElementById('log');
const elTentsContainer = document.getElementById('tents-container');
const elSpecies = document.getElementById('species-select');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Asset Image Elements ─────────────────────────────────────────────────────
const imgs = {
    floor:     document.getElementById('img-floor'),
    op:        document.getElementById('img-operator'),
    tent:      document.getElementById('img-tent'),
    shroom:    document.getElementById('img-shroom'),
    sales:     document.getElementById('img-sales'),
    office:    document.getElementById('img-office'),
    market:    document.getElementById('img-market'),
    dehydrator:document.getElementById('img-dehydrator'),
    tlab:      document.getElementById('img-tlab'),
    shiitake:  document.getElementById('img-shiitake'),
    lions:     document.getElementById('img-lions'),
    sab:       document.getElementById('img-sab'),
    flowhood:  document.getElementById('img-flowhood'),
    mulch:     document.getElementById('img-mulch'),
    pc:        document.getElementById('img-pc'),
    barrel:    document.getElementById('img-barrel'),
    tileConcrete: document.getElementById('img-tile-concrete'),
    tileGrass:    document.getElementById('img-tile-grass'),
    tileDirt:     document.getElementById('img-tile-dirt')
};

const keyedImgs = {};
function keyImage(img) {
    if (!img.complete || img.naturalWidth === 0) return img;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const data = x.getImageData(0, 0, c.width, c.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
        if (px[i] > 180 && px[i+1] < 120 && px[i+2] > 180) {
            px[i+3] = 0;
        }
    }
    x.putImageData(data, 0, 0);
    return c;
}

// ── Entities ─────────────────────────────────────────────────────────────────
const operator   = { x: 200, y: 300, targetX: 200, targetY: 300, speed: 150, actionQueue: null, isMoving: false };
const salesperson = { x: 80,  y: 300, targetX: 80,  targetY: 300, speed: 100, timer: 10, state: 'idle' };

function getTotalInventory() {
    return state.inventoryBatches.reduce((sum, b) => sum + b.amount, 0);
}

function deductInventory(amount, reqSpecies = null) {
    const available = state.inventoryBatches
        .filter(b => reqSpecies ? b.species === reqSpecies : true)
        .reduce((sum, b) => sum + b.amount, 0);
    if (available < amount) return false;

    let remaining = amount;
    for (let i = 0; i < state.inventoryBatches.length; i++) {
        const b = state.inventoryBatches[i];
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

// ── Fixed Stations ───────────────────────────────────────────────────────────
const stations = {
    flowHood:   { x: 50,  y: 30,  w: 60, h: 40, name: "Flow Hood",     color: "#444" },
    shipping:   { x: 320, y: 320, w: 60, h: 60, name: "Farmers Market", color: "transparent" },
    office:     { x: 260, y: 220, w: 40, h: 40, name: "Office",         color: "#543a29" },
    stand:      { x: 50,  y: 320, w: 60, h: 40, name: "Auto Market",    color: "#365c40" },
    mulchBin:   { x: 300, y: 10,  w: 40, h: 40,                         color: "#4f311c" },
    sterilizer: { x: 140, y: 150, w: 40, h: 60,                         color: "#555" },
    dehydrator: { x: 20,  y: 150, w: 40, h: 60,                         color: "#aaa" },
    tlab:       { x: 80,  y: 150, w: 60, h: 60,                         color: "#22f" }
};
