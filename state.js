// ── Constants & Game State ───────────────────────────────────────────────────
const SPOIL_TIME = 60;
const SAVE_KEY = 'pixelspore_save_v1';

const state = {
    money: 500,
    demandBase: 10,
    demandModifier: 1.0,
    demandSeasonalMod: 1.0,
    dailySalesVolume: 0,
    inventoryBatches: [],
    incubationBatches: [],
    blockBatches: [],
    labLevel: 1,
    sterilizerLevel: 1,
    rawPellets: 0,
    sterileBlocks: 0,
    bagIdCounter: 1,
    reputation: 1,
    mulchInventory: 0,
    gardenerTimer: 30,
    day: 1,
    hour: 8,
    timeTimer: 0,
    season: 0,
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
        humidifier: 50, fan: 50, ac: 300, heater: 50, co2: 250
    },
    tents: [
        { id: 1, type: '4x4', capacity: 0, maxBlocks: 16, blocksFilled: 0, currentCrop: 0, isGrowing: false, isSpawned: false, blockColonization: 0, isSpent: false, flushes: 0, x: 180, y: 30, w: 40, h: 40, species: 'blue', temp: 65, humidity: 40, co2: 400, hw: { hum: false, fan: false, ac: false, heat: false } }
    ],
    speciesData: {
        // colRate: 100% / (days * 24 hrs)  |  1 real-sec = 1 in-game hr
        'blue':     { rate: 0.5,  colRate: 0.298, pitchMod: 0,    val: 20, yieldMod: 1.2, desc: "+20% Yield, 14-day col",           isResearched: true,  researchCost: 0,   idealTemp: "60-75F", idealHum: "85-95%", spoilageDesc: "Fast",      tMin: 60, tMax: 75, hMin: 85, hMax: 95 },
        'golden':   { rate: 0.3,  colRate: 0.298, pitchMod: 0.20, val: 25, yieldMod: 1.0, desc: "+$5/lb, +Pitch, 14-day col",       isResearched: false, researchCost: 100, idealTemp: "70-85F", idealHum: "85-95%", spoilageDesc: "Fast",      tMin: 70, tMax: 85, hMin: 85, hMax: 95 },
        'shiitake': { rate: 0.8,  colRate: 0.260, pitchMod: 0.10, val: 30, yieldMod: 1.0, desc: "+60% Speed, 16-day col",           isResearched: false, researchCost: 200, idealTemp: "55-70F", idealHum: "80-90%", spoilageDesc: "Slow",      tMin: 55, tMax: 70, hMin: 80, hMax: 90 },
        'lions':    { rate: 0.1,  colRate: 0.198, pitchMod: 0.15, val: 40, yieldMod: 1.0, desc: "Tinctures, 21-day col",            isResearched: false, researchCost: 300, idealTemp: "65-75F", idealHum: "85-90%", spoilageDesc: "Medium",    tMin: 65, tMax: 75, hMin: 85, hMax: 90 },
        'pink':     { rate: 1.0,  colRate: 0.417, pitchMod: 0.05, val: 18, yieldMod: 1.3, desc: "Fastest grow, 10-day col, hot",    isResearched: false, researchCost: 150, idealTemp: "70-90F", idealHum: "85-95%", spoilageDesc: "Very Fast", tMin: 70, tMax: 90, hMin: 85, hMax: 95 },
        'yellow':   { rate: 0.6,  colRate: 0.298, pitchMod: 0.15, val: 22, yieldMod: 1.1, desc: "+Pitch, warm fruiting, 14-day col", isResearched: false, researchCost: 150, idealTemp: "65-80F", idealHum: "85-95%", spoilageDesc: "Fast",      tMin: 65, tMax: 80, hMin: 85, hMax: 95 },
        'king':     { rate: 0.4,  colRate: 0.260, pitchMod: 0.10, val: 35, yieldMod: 1.0, desc: "Dense fruiting, cool temps, 16-day", isResearched: false, researchCost: 250, idealTemp: "55-65F", idealHum: "85-95%", spoilageDesc: "Slow",     tMin: 55, tMax: 65, hMin: 85, hMax: 95 },
        'enoki':    { rate: 0.3,  colRate: 0.198, pitchMod: 0.20, val: 45, yieldMod: 0.9, desc: "Very cold, +Pitch, 21-day col",     isResearched: false, researchCost: 400, idealTemp: "45-55F", idealHum: "80-95%", spoilageDesc: "Medium",    tMin: 45, tMax: 55, hMin: 80, hMax: 95 },
        'maitake':  { rate: 0.2,  colRate: 0.149, pitchMod: 0.20, val: 50, yieldMod: 1.0, desc: "Premium, slow 28-day col",         isResearched: false, researchCost: 500, idealTemp: "55-65F", idealHum: "80-90%", spoilageDesc: "Slow",      tMin: 55, tMax: 65, hMin: 80, hMax: 90 },
        'nameko':   { rate: 0.5,  colRate: 0.260, pitchMod: 0.10, val: 35, yieldMod: 1.0, desc: "Japanese cuisine, 16-day col",      isResearched: false, researchCost: 300, idealTemp: "55-65F", idealHum: "90-95%", spoilageDesc: "Fast",      tMin: 55, tMax: 65, hMin: 90, hMax: 95 },
        'chestnut': { rate: 0.6,  colRate: 0.298, pitchMod: 0.05, val: 30, yieldMod: 1.1, desc: "Nutty flavor, 14-day col",          isResearched: false, researchCost: 200, idealTemp: "60-70F", idealHum: "85-95%", spoilageDesc: "Medium",    tMin: 60, tMax: 70, hMin: 85, hMax: 95 },
        'reishi':   { rate: 0.05, colRate: 0.149, pitchMod: 0.25, val: 60, yieldMod: 0.6, desc: "Medicinal, Tinctures, 28-day col",  isResearched: false, researchCost: 600, idealTemp: "75-85F", idealHum: "85-95%", spoilageDesc: "Very Slow", tMin: 75, tMax: 85, hMin: 85, hMax: 95 },
        'pearl':    { rate: 0.5,  colRate: 0.260, pitchMod: 0.10, val: 38, yieldMod: 1.0, desc: "Cool fruiting, 16-day col",         isResearched: false, researchCost: 250, idealTemp: "55-75F", idealHum: "85-95%", spoilageDesc: "Medium",    tMin: 55, tMax: 75, hMin: 85, hMax: 95 },
        'pioppino': { rate: 0.4,  colRate: 0.198, pitchMod: 0.10, val: 40, yieldMod: 1.0, desc: "Italian cuisine, 21-day col",       isResearched: false, researchCost: 350, idealTemp: "55-65F", idealHum: "90-95%", spoilageDesc: "Slow",      tMin: 55, tMax: 65, hMin: 90, hMax: 95 }
    },
    clientRoster: [
        { id: 'pizza',    name: "Luigi's Pizzeria",      dialogue: "Our customers beg for fresh mushrooms. We'll take 10 lbs a week if you can supply it!", boost: 2, img: 'pizza.png',  acquired: false },
        { id: 'steak',    name: "Iron Steakhouse",       dialogue: "I need big, meaty oysters to serve alongside my prime ribs. Don't disappoint me.",         boost: 3, img: 'steak.png', acquired: false },
        { id: 'pasta',    name: "Bella Pasta",           dialogue: "We demand the absolute finest Shiitake for our truffle pasta dish.",                        boost: 2, img: 'sales.png', acquired: false },
        { id: 'wok',      name: "Golden Wok",            dialogue: "Fresh mushrooms! Very good! We buy everything!",                                            boost: 4, img: 'sales.png', acquired: false },
        { id: 'vegan',    name: "Hipster Vegan Cafe",    dialogue: "Lion's mane makes a killer vegan crab cake substitute. Sign us up.",                        boost: 1, img: 'sales.png', acquired: false },
        { id: 'chinese',  name: "Jade Dragon Kitchen",   dialogue: "We need fresh Enoki and Shiitake for our hot pot. Best quality only, please.",              boost: 4, img: 'sales.png', acquired: false },
        { id: 'japanese', name: "Sakura Ramen House",    dialogue: "Nameko and Shiitake for our broths. We'll be a steady partner if quality holds.",           boost: 3, img: 'sales.png', acquired: false },
        { id: 'wellness', name: "Root & Branch Apothecary", dialogue: "Our customers swear by Reishi and Lion's Mane. Supply us and you'll have a loyal buyer.", boost: 2, img: 'sales.png', acquired: false },
        { id: 'fine',     name: "Le Champignon Fin",     dialogue: "Maitake, King Trumpet, Pioppino — if you grow it, we'll feature it in our tasting menu.",  boost: 5, img: 'sales.png', acquired: false }
    ],
    pendingClient: null,
    gameOver: false,
    gameWon: false,
    milestonesAchieved: [],
    pitchCount: 0,
    isSleeping: false,
    sleepUntilDay: 1,
    sleepUntilHour: 8
};

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

const equipmentData = [
    {
        id: 'sterilizer', title: "Substrate Sterilization", cat: 'lab',
        tiers: [
            { level: 1, name: "Presto Pressure Cooker", cost: 0,    text: "1 Block / Run. Starter unit." },
            { level: 2, name: "All American Canner",    cost: 1000, text: "4 Blocks / Run. Reliable seal." },
            { level: 3, name: "55-Gal Steam Barrel",    cost: 2500, text: "16 Blocks / Run. High throughput." }
        ]
    },
    {
        id: 'lab', title: "Mycology Lab", cat: 'lab',
        tiers: [
            { level: 1, name: "Still Air Box",       cost: 0,   text: "25% contamination risk." },
            { level: 2, name: "Laminar Flow Hood",   cost: 800, text: "5% contamination risk. Fast." }
        ]
    },
    {
        id: 'sales', title: "Market Logistics", cat: 'logistics',
        tiers: [
            { level: 1, name: "Manual Hauling",     cost: 0,   text: "Requires Operator round-trip." },
            { level: 2, name: "Hire Salesperson",   cost: 300, text: "Automates Farmer's Market sales." }
        ]
    },
    {
        id: 'dehydrator', title: "Dehydrator Station", cat: 'logistics',
        tiers: [
            { level: 1, name: "None",                   cost: 0,   text: "" },
            { level: 2, name: "Commercial Dehydrator",  cost: 400, text: "Process 10lbs fruit to powder." }
        ]
    },
    {
        id: 'tincture', title: "Tincture Extraction", cat: 'logistics',
        tiers: [
            { level: 1, name: "None",                   cost: 0,    text: "" },
            { level: 2, name: "Alcohol Extraction Lab", cost: 1000, text: "2 lbs Mushroom Powder → 1 Tincture bottle." }
        ]
    },
    {
        id: 'mulch', title: "Mulch/Waste Recovery", cat: 'logistics',
        tiers: [
            { level: 1, name: "Trash Pile",       cost: 0,   text: "Zero value." },
            { level: 2, name: "Composting Bin",   cost: 150, text: "Spent blocks attract gardeners for Reputation." }
        ]
    },
    {
        id: 'co2', title: "Climate Sensors", cat: 'facilities',
        tiers: [
            { level: 1, name: "Analog Timers",  cost: 0,   text: "Default energy usage." },
            { level: 2, name: "CO2 Sentinels",  cost: 250, text: "Optimizes hardware. -20% daily energy." }
        ]
    }
];

// Shared loop variables
let gameStarted = false;
let lastTime = performance.now();
