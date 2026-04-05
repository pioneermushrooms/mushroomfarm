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
    sterilizerLevel: 1,  // legacy — kept for migration
    sterilizers: [
        { id: 1, level: 1, busyTime: 0, pendingBlocks: 0 }
    ],
    rawPellets: 0,
    sterileBlocks: 0,
    bagIdCounter: 1,
    reputation: 1,
    mulchInventory: 0,
    gardenerTimer: 30,
    calendarStart: 0,  // epoch ms, set on game init
    totalDays: 0,      // days since farm opened (0-999999+)
    day: 1,
    hour: 8,
    timeTimer: 0,
    season: 0,
    ambientTemp: 65,
    powder: 0,
    tinctures: 0,
    farmName: '',
    charGender: 'male',
    charHair: 'short',
    charSkin: 0,
    charHairColor: 0,
    charTrait: 'handy',
    garageAC: false,
    garageHeater: false,
    hasSalesperson: false,
    hasDehydrator: false,
    hasTinctureLab: false,
    hasMulchBin: false,
    hasCO2: false,
    costs: {
        newTent: 100, upgrade4x8: 50, upgrade8x8: 150,
        hireSales: 300, dehydrator: 400, tinctureLab: 1000, flowHood: 800, mulchBin: 150, steamBarrel: 500,
        pitchCash: 50, pitchInv: 5, grain: 10, pellets: 20,
        humidifier: 50, fan: 50, ac: 1000, heater: 100, co2: 250
    },
    tents: [
        { id: 1, type: '4x4', capacity: 0, maxBlocks: 16, blocksFilled: 0, currentCrop: 0, isGrowing: false, isSpawned: false, blockColonization: 0, isSpent: false, flushes: 0, x: 180, y: 30, w: 40, h: 40, species: 'blue', temp: 65, humidity: 40, co2: 400, hw: { hum: false, fan: false, ac: false, heat: false } }
    ],
    speciesData: {
        // colRate: 100% / (days * 24 hrs)  |  1 real-sec = 1 in-game hr
        'blue':     { rate: 0.5,  colRate: 0.298, pitchMod: 0,    val: 20, yieldMod: 1.2, spoilTime: 240, desc: "+20% Yield, 14-day col",           isResearched: true,  researchCost: 0,   idealTemp: "60-75F", idealHum: "85-95%", spoilageDesc: "Fast (10d)",      tMin: 60, tMax: 75, hMin: 85, hMax: 95 },
        'golden':   { rate: 0.3,  colRate: 0.298, pitchMod: 0.20, val: 25, yieldMod: 1.0, spoilTime: 240, desc: "+$5/lb, +Pitch, 14-day col",       isResearched: false, researchCost: 100, idealTemp: "70-85F", idealHum: "85-95%", spoilageDesc: "Fast (10d)",      tMin: 70, tMax: 85, hMin: 85, hMax: 95 },
        'shiitake': { rate: 0.8,  colRate: 0.260, pitchMod: 0.10, val: 30, yieldMod: 1.0, spoilTime: 384, desc: "+60% Speed, 16-day col",           isResearched: false, researchCost: 200, idealTemp: "55-70F", idealHum: "80-90%", spoilageDesc: "Slow (16d)",      tMin: 55, tMax: 70, hMin: 80, hMax: 90 },
        'lions':    { rate: 0.1,  colRate: 0.198, pitchMod: 0.15, val: 40, yieldMod: 1.0, spoilTime: 312, desc: "Tinctures, 21-day col",            isResearched: false, researchCost: 300, idealTemp: "65-75F", idealHum: "85-90%", spoilageDesc: "Medium (13d)",    tMin: 65, tMax: 75, hMin: 85, hMax: 90 },
        'pink':     { rate: 1.0,  colRate: 0.417, pitchMod: 0.05, val: 18, yieldMod: 1.3, spoilTime: 168, desc: "Fastest grow, 10-day col, hot",    isResearched: false, researchCost: 150, idealTemp: "70-90F", idealHum: "85-95%", spoilageDesc: "Very Fast (7d)",  tMin: 70, tMax: 90, hMin: 85, hMax: 95 },
        'yellow':   { rate: 0.6,  colRate: 0.298, pitchMod: 0.15, val: 22, yieldMod: 1.1, spoilTime: 240, desc: "+Pitch, warm fruiting, 14-day col", isResearched: false, researchCost: 150, idealTemp: "65-80F", idealHum: "85-95%", spoilageDesc: "Fast (10d)",      tMin: 65, tMax: 80, hMin: 85, hMax: 95 },
        'king':     { rate: 0.4,  colRate: 0.260, pitchMod: 0.10, val: 35, yieldMod: 1.0, spoilTime: 384, desc: "Dense fruiting, cool temps, 16-day", isResearched: false, researchCost: 250, idealTemp: "55-65F", idealHum: "85-95%", spoilageDesc: "Slow (16d)",     tMin: 55, tMax: 65, hMin: 85, hMax: 95 },
        'enoki':    { rate: 0.3,  colRate: 0.198, pitchMod: 0.20, val: 45, yieldMod: 0.9, spoilTime: 312, desc: "Very cold, +Pitch, 21-day col",     isResearched: false, researchCost: 400, idealTemp: "45-55F", idealHum: "80-95%", spoilageDesc: "Medium (13d)",    tMin: 45, tMax: 55, hMin: 80, hMax: 95 },
        'maitake':  { rate: 0.2,  colRate: 0.149, pitchMod: 0.20, val: 50, yieldMod: 1.0, spoilTime: 384, desc: "Premium, slow 28-day col",         isResearched: false, researchCost: 500, idealTemp: "55-65F", idealHum: "80-90%", spoilageDesc: "Slow (16d)",      tMin: 55, tMax: 65, hMin: 80, hMax: 90 },
        'nameko':   { rate: 0.5,  colRate: 0.260, pitchMod: 0.10, val: 35, yieldMod: 1.0, spoilTime: 240, desc: "Japanese cuisine, 16-day col",      isResearched: false, researchCost: 300, idealTemp: "55-65F", idealHum: "90-95%", spoilageDesc: "Fast (10d)",      tMin: 55, tMax: 65, hMin: 90, hMax: 95 },
        'chestnut': { rate: 0.6,  colRate: 0.298, pitchMod: 0.05, val: 30, yieldMod: 1.1, spoilTime: 312, desc: "Nutty flavor, 14-day col",          isResearched: false, researchCost: 200, idealTemp: "60-70F", idealHum: "85-95%", spoilageDesc: "Medium (13d)",    tMin: 60, tMax: 70, hMin: 85, hMax: 95 },
        'reishi':   { rate: 0.05, colRate: 0.149, pitchMod: 0.25, val: 60, yieldMod: 0.6, spoilTime: 456, desc: "Medicinal, Tinctures, 28-day col",  isResearched: false, researchCost: 600, idealTemp: "75-85F", idealHum: "85-95%", spoilageDesc: "Very Slow (19d)", tMin: 75, tMax: 85, hMin: 85, hMax: 95 },
        'pearl':    { rate: 0.5,  colRate: 0.260, pitchMod: 0.10, val: 38, yieldMod: 1.0, spoilTime: 312, desc: "Cool fruiting, 16-day col",         isResearched: false, researchCost: 250, idealTemp: "55-75F", idealHum: "85-95%", spoilageDesc: "Medium (13d)",    tMin: 55, tMax: 75, hMin: 85, hMax: 95 },
        'pioppino':  { rate: 0.4,  colRate: 0.198, pitchMod: 0.10, val: 40,  yieldMod: 1.0, spoilTime: 384, desc: "Italian cuisine, 21-day col",       isResearched: false, researchCost: 350, idealTemp: "55-65F", idealHum: "90-95%", spoilageDesc: "Slow (16d)",      tMin: 55, tMax: 65, hMin: 90, hMax: 95 },
        // Exotic species — require cult_exotic_strains skill
        'cordyceps': { rate: 0.02, colRate: 0.099, pitchMod: 0.30, val: 120, yieldMod: 0.4, spoilTime: 456, desc: "Medicinal powerhouse, 42-day col",  isResearched: false, researchCost: 1000, idealTemp: "68-75F", idealHum: "90-95%", spoilageDesc: "Very Slow (19d)", tMin: 68, tMax: 75, hMin: 90, hMax: 95, exotic: true },
        'morel':     { rate: 0.03, colRate: 0.069, pitchMod: 0.30, val: 150, yieldMod: 0.3, spoilTime: 168, desc: "Ultra-premium, 60-day col",         isResearched: false, researchCost: 1500, idealTemp: "55-65F", idealHum: "80-90%", spoilageDesc: "Very Fast (7d)", tMin: 55, tMax: 65, hMin: 80, hMax: 90, exotic: true },
        'truffle':   { rate: 0.01, colRate: 0.046, pitchMod: 0.40, val: 250, yieldMod: 0.2, spoilTime: 312, desc: "Legendary, 90-day col, $250/lb",    isResearched: false, researchCost: 2500, idealTemp: "60-70F", idealHum: "85-95%", spoilageDesc: "Medium (13d)",   tMin: 60, tMax: 70, hMin: 85, hMax: 95, exotic: true }
    },
    clientRoster: [
    {
        id: "c_1",
        name: "Luigies Pizzeria",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 10,
        contractDays: 9,
        preferredSpecies: "any",
        img: "client_pizzeria.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.835596005658608,
        requiredReputation: 1
    },
    {
        id: "c_2",
        name: "Iron Steakhouse",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 20,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "client_steakhouse.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.7454522291038077,
        requiredReputation: 1
    },
    {
        id: "c_3",
        name: "Bella Pasta",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 15,
        contractDays: 8,
        preferredSpecies: "shiitake",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.6332066022444631,
        requiredReputation: 1
    },
    {
        id: "c_4",
        name: "Bella Bistro 4",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 34,
        contractDays: 8,
        preferredSpecies: "lions",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.8662578636904166,
        requiredReputation: 1
    },
    {
        id: "c_5",
        name: "Jade Pizzeria 5",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 25,
        contractDays: 8,
        preferredSpecies: "any",
        img: "client_pizzeria.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.102192030767537,
        requiredReputation: 1
    },
    {
        id: "c_6",
        name: "Golden Eatery 6",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 22,
        contractDays: 7,
        preferredSpecies: "any",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.490123066416008,
        requiredReputation: 1
    },
    {
        id: "c_7",
        name: "Fine Bistro 7",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 29,
        contractDays: 6,
        preferredSpecies: "shiitake",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.2653040329785785,
        requiredReputation: 1
    },
    {
        id: "c_8",
        name: "Golden Bistro 8",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 19,
        contractDays: 9,
        preferredSpecies: "blue",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.1338683365843316,
        requiredReputation: 1
    },
    {
        id: "c_9",
        name: "Le Champignon Fin",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 5,
        contractDays: 7,
        preferredSpecies: "pioppino",
        img: "client_kitchen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.471533226430494,
        requiredReputation: 1
    },
    {
        id: "c_10",
        name: "Bella Apothecary 10",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 30,
        contractDays: 7,
        preferredSpecies: "lions",
        img: "client_apothecary.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.4209496349778625,
        requiredReputation: 1
    },
    {
        id: "c_11",
        name: "Sakura Pizzeria 11",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 43,
        contractDays: 9,
        preferredSpecies: "lions",
        img: "client_pizzeria.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.2461799548417725,
        requiredReputation: 2
    },
    {
        id: "c_12",
        name: "Fine Tavern 12",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 35,
        contractDays: 6,
        preferredSpecies: "lions",
        img: "client_tavern.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.4526618747707278,
        requiredReputation: 2
    },
    {
        id: "c_13",
        name: "Sakura Kitchen 13",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 41,
        contractDays: 6,
        preferredSpecies: "any",
        img: "client_kitchen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.986835904203342,
        requiredReputation: 2
    },
    {
        id: "c_14",
        name: "Hipster Steakhouse 14",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 28,
        contractDays: 6,
        preferredSpecies: "blue",
        img: "client_steakhouse.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.1562987200686137,
        requiredReputation: 2
    },
    {
        id: "c_15",
        name: "Iron Kitchen 15",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 41,
        contractDays: 5,
        preferredSpecies: "pioppino",
        img: "client_kitchen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.3023700769421067,
        requiredReputation: 2
    },
    {
        id: "c_16",
        name: "Hipster Eatery 16",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 31,
        contractDays: 6,
        preferredSpecies: "any",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.0792327086429894,
        requiredReputation: 2
    },
    {
        id: "c_17",
        name: "Golden Cafe 17",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 44,
        contractDays: 7,
        preferredSpecies: "any",
        img: "client_cafe.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.6489787532833287,
        requiredReputation: 2
    },
    {
        id: "c_18",
        name: "Jade Ramen House 18",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 33,
        contractDays: 6,
        preferredSpecies: "shiitake",
        img: "client_ramen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.8229983749138112,
        requiredReputation: 2
    },
    {
        id: "c_19",
        name: "Golden Kitchen 19",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 36,
        contractDays: 7,
        preferredSpecies: "pioppino",
        img: "client_kitchen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.5561060681907666,
        requiredReputation: 2
    },
    {
        id: "c_20",
        name: "Hipster Eatery 20",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 44,
        contractDays: 7,
        preferredSpecies: "any",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.1804305932309203,
        requiredReputation: 2
    },
    {
        id: "c_21",
        name: "Golden Steakhouse 21",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 45,
        contractDays: 6,
        preferredSpecies: "any",
        img: "client_steakhouse.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.873670222072921,
        requiredReputation: 3
    },
    {
        id: "c_22",
        name: "Root & Branch Tavern 22",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 53,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "client_tavern.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.2989115487165037,
        requiredReputation: 3
    },
    {
        id: "c_23",
        name: "Sakura Cafe 23",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 48,
        contractDays: 9,
        preferredSpecies: "shiitake",
        img: "client_cafe.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.1727050929583838,
        requiredReputation: 3
    },
    {
        id: "c_24",
        name: "Iron Tavern 24",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 39,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "client_tavern.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.024101054788339,
        requiredReputation: 3
    },
    {
        id: "c_25",
        name: "Iron Pizzeria 25",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 35,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "client_pizzeria.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.0856606915202058,
        requiredReputation: 3
    },
    {
        id: "c_26",
        name: "Jade Pizzeria 26",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 35,
        contractDays: 8,
        preferredSpecies: "lions",
        img: "client_pizzeria.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.7997540613670604,
        requiredReputation: 3
    },
    {
        id: "c_27",
        name: "Rustic Diner 27",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 38,
        contractDays: 7,
        preferredSpecies: "lions",
        img: "client_diner.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.6742448100961655,
        requiredReputation: 3
    },
    {
        id: "c_28",
        name: "Local Bistro 28",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 53,
        contractDays: 7,
        preferredSpecies: "pioppino",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.0249150131565958,
        requiredReputation: 3
    },
    {
        id: "c_29",
        name: "Hipster Bistro 29",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 41,
        contractDays: 9,
        preferredSpecies: "lions",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.5748621052325085,
        requiredReputation: 3
    },
    {
        id: "c_30",
        name: "Root & Branch Cafe 30",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 52,
        contractDays: 7,
        preferredSpecies: "shiitake",
        img: "client_cafe.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.8050591367287638,
        requiredReputation: 3
    },
    {
        id: "c_31",
        name: "Golden Cafe 31",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 51,
        contractDays: 6,
        preferredSpecies: "any",
        img: "client_cafe.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.828207846169148,
        requiredReputation: 4
    },
    {
        id: "c_32",
        name: "Fine Diner 32",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 50,
        contractDays: 7,
        preferredSpecies: "any",
        img: "client_diner.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.8075747346142803,
        requiredReputation: 4
    },
    {
        id: "c_33",
        name: "Rustic Diner 33",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 54,
        contractDays: 6,
        preferredSpecies: "any",
        img: "client_diner.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.137897663352,
        requiredReputation: 4
    },
    {
        id: "c_34",
        name: "Golden Eatery 34",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 7,
        preferredSpecies: "any",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.1899671898753303,
        requiredReputation: 4
    },
    {
        id: "c_35",
        name: "Jade Kitchen 35",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 48,
        contractDays: 7,
        preferredSpecies: "shiitake",
        img: "client_kitchen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.249541582171819,
        requiredReputation: 4
    },
    {
        id: "c_36",
        name: "Rustic Eatery 36",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 54,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.355379944500795,
        requiredReputation: 4
    },
    {
        id: "c_37",
        name: "Fine Bistro 37",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 59,
        contractDays: 8,
        preferredSpecies: "blue",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.8245109242361846,
        requiredReputation: 4
    },
    {
        id: "c_38",
        name: "Sakura Diner 38",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 8,
        preferredSpecies: "lions",
        img: "client_diner.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.9558145050431675,
        requiredReputation: 4
    },
    {
        id: "c_39",
        name: "Iron Bistro 39",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 46,
        contractDays: 9,
        preferredSpecies: "pioppino",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.432628933462078,
        requiredReputation: 4
    },
    {
        id: "c_40",
        name: "Jade Pizzeria 40",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 9,
        preferredSpecies: "blue",
        img: "client_pizzeria.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.9720896859083394,
        requiredReputation: 4
    },
    {
        id: "c_41",
        name: "Fine Bistro 41",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 74,
        contractDays: 6,
        preferredSpecies: "shiitake",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.499926275880379,
        requiredReputation: 5
    },
    {
        id: "c_42",
        name: "Golden Eatery 42",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 73,
        contractDays: 9,
        preferredSpecies: "blue",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.2560867198828323,
        requiredReputation: 5
    },
    {
        id: "c_43",
        name: "Rustic Diner 43",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 71,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "client_diner.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.830948545288976,
        requiredReputation: 5
    },
    {
        id: "c_44",
        name: "Local Eatery 44",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 73,
        contractDays: 5,
        preferredSpecies: "pioppino",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.0195665659587076,
        requiredReputation: 5
    },
    {
        id: "c_45",
        name: "Sakura Apothecary 45",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 63,
        contractDays: 8,
        preferredSpecies: "shiitake",
        img: "client_apothecary.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.629449408876734,
        requiredReputation: 5
    },
    {
        id: "c_46",
        name: "Sakura Apothecary 46",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 8,
        preferredSpecies: "any",
        img: "client_apothecary.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.35482818501508,
        requiredReputation: 5
    },
    {
        id: "c_47",
        name: "Rustic Kitchen 47",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 71,
        contractDays: 8,
        preferredSpecies: "blue",
        img: "client_kitchen.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.2332994275007736,
        requiredReputation: 5
    },
    {
        id: "c_48",
        name: "Root & Branch Bistro 48",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 56,
        contractDays: 9,
        preferredSpecies: "blue",
        img: "client_bistro.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.598743351669254,
        requiredReputation: 5
    },
    {
        id: "c_49",
        name: "Jade Eatery 49",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 69,
        contractDays: 6,
        preferredSpecies: "pioppino",
        img: "client_eatery.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.3448108544492006,
        requiredReputation: 5
    },
    {
        id: "c_50",
        name: "Jade Diner 50",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 57,
        contractDays: 6,
        preferredSpecies: "lions",
        img: "client_diner.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.8288159754349715,
        requiredReputation: 5
    }
],
    pendingClient: null,
    gameOver: false,
    gameWon: false,
    milestonesAchieved: [],
    pitchCount: 0,
    laborHours: 16,
    speedMultiplier: 1,
    isSleeping: false,
    sleepUntilDay: 1,
    sleepUntilHour: 8,
    liquidCultures: [],   // { id, species }
    growKits: 0,
    xp: 0,
    level: 1,
    skillPoints: 0,
    unlockedSkills: [],
    researchPoints: 0,
    speciesFirstHarvest: [],  // track which species have been harvested for one-time XP bonus
    lastBreakdownDay: 0,
    activeBreakdowns: [],     // { eventId, targetId, repairCost, severity }
    wholesaleOrders: []       // { id, species, lbs, pricePerLb, deadlineDay, accepted }
};

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

// ── XP & Leveling ───────────────────────────────────────────────────────────
function xpForLevel(n) { return Math.floor(100 * Math.pow(n, 1.8)); }
const MAX_LEVEL = 15;

const XP_REWARDS = {
    harvest:         10,   // +5 per flush number
    harvestFlushBonus: 5,
    sellMarket:      5,    // per 10 lbs
    fulfillContract: 25,   // +10 if satisfaction > 90%
    fulfillEarly:    35,
    pitchSuccess:    30,
    pitchFail:       5,
    researchSpecies: 20,
    buyEquipment:    15,
    firstSpeciesHarvest: 50,
    newRepStar:      100,
    surviveContam:   10,
    completeMilestone: 75
};

// ── Garage Square Footage ────────────────────────────────────────────────────
const GARAGE_BASE_SQFT = 256;  // 16x16 ft starting garage
const EQUIPMENT_FOOTPRINTS = {
    'tent_4x4': 16,
    'tent_4x8': 32,
    'tent_8x8': 64,
    'sterilizer_1': 4,   // pressure cooker
    'sterilizer_2': 9,   // DIY barrel
    'sterilizer_3': 9,   // Bubba's barrel
    'sterilizer_4': 6,   // autoclave (compact)
    'sterilizer_5': 12,  // industrial autoclave
    'dehydrator': 6,
    'tinctureLab': 9,
    'mulchBin': 4,
    'flowHood': 6,
    'researchBench': 9,
    'blockMachine': 12
};

// ── Equipment Failures ──────────────────────────────────────────────────────
const FAILURE_EVENTS = [
    { id: 'fan_fail',       target: 'tent_hw',    hw: 'fan',  severity: 'minor',        repairPct: 0.10, desc: "Exhaust fan motor burned out!",       effect: 'Fan disabled until repaired.' },
    { id: 'hum_leak',       target: 'tent_hw',    hw: 'hum',  severity: 'minor',        repairPct: 0.15, desc: "Humidifier reservoir cracked!",       effect: 'Humidifier disabled until repaired.' },
    { id: 'ac_compressor',  target: 'garage_ac',              severity: 'major',        repairPct: 0.30, desc: "A/C compressor failed!",              effect: 'Garage A/C offline. All tents will overheat.' },
    { id: 'heater_element', target: 'garage_heat',             severity: 'moderate',     repairPct: 0.25, desc: "Heating element burned out!",         effect: 'Garage heater offline. Tents may freeze.' },
    { id: 'barrel_leak',    target: 'sterilizer',              severity: 'major',        repairPct: 0.40, desc: "Steam barrel sprung a leak!",         effect: 'One sterilizer disabled until repaired.' },
    { id: 'cooker_blowout', target: 'sterilizer',              severity: 'catastrophic', repairPct: 1.00, desc: "Pressure cooker gasket blew out!",    effect: 'Sterilizer DESTROYED. Must buy replacement.' },
    { id: 'tent_tear',      target: 'tent',                    severity: 'moderate',     repairPct: 0.20, desc: "Tent poly sheeting torn!",            effect: 'Contamination risk spiked for 48 hours.' },
    { id: 'power_surge',    target: 'all',                     severity: 'major',        repairPct: 0.15, desc: "Power surge hit the garage!",         effect: 'All electric equipment offline for 24 hours.' }
];

// ── Skill Tree ──────────────────────────────────────────────────────────────
const SKILL_TREE = [
    // ── Cultivation Branch (green) ──
    { id: 'cult_sterile_technique',     branch: 'cultivation', tier: 1, name: "Sterile Technique",   cost: 1, levelReq: 2,  prereqs: [],                          desc: "-5% contamination risk globally",                icon: '🧤' },
    { id: 'cult_grain_optimization',    branch: 'cultivation', tier: 1, name: "Grain Optimization",  cost: 1, levelReq: 3,  prereqs: [],                          desc: "+15% grain bag colonization speed",              icon: '🌾' },
    { id: 'cult_liquid_culture',        branch: 'cultivation', tier: 2, name: "Liquid Culture",      cost: 2, levelReq: 5,  prereqs: ['cult_sterile_technique'],   desc: "Create LC: 1 bag → inoculates 4 bags free",     icon: '💉' },
    { id: 'cult_agar_work',             branch: 'cultivation', tier: 2, name: "Agar Isolation",      cost: 2, levelReq: 5,  prereqs: ['cult_sterile_technique'],   desc: "+10% biological efficiency on all species",      icon: '🧫' },
    { id: 'cult_genetic_mod_yield',     branch: 'cultivation', tier: 3, name: "Yield Genetics",      cost: 2, levelReq: 8,  prereqs: ['cult_agar_work'],           desc: "+15% yieldMod on all species",                   icon: '🧬' },
    { id: 'cult_genetic_mod_resilience',branch: 'cultivation', tier: 3, name: "Resilient Strains",   cost: 2, levelReq: 8,  prereqs: ['cult_agar_work'],           desc: "-50% tent contamination risk",                   icon: '🛡' },
    { id: 'cult_genetic_mod_temp',      branch: 'cultivation', tier: 3, name: "Thermal Tolerance",   cost: 2, levelReq: 8,  prereqs: ['cult_agar_work'],           desc: "Species temp ranges widen +/-5F",                icon: '🌡' },
    { id: 'cult_exotic_strains',        branch: 'cultivation', tier: 4, name: "Exotic Genetics",     cost: 3, levelReq: 12, prereqs: ['cult_genetic_mod_yield'],    desc: "Unlock Cordyceps, Morel, Truffle",               icon: '💎' },

    // ── Production Branch (blue) ──
    { id: 'prod_efficient_sterilize',   branch: 'production',  tier: 1, name: "Efficient Sterilization", cost: 1, levelReq: 2, prereqs: [],                         desc: "-1 hour on all sterilizer cycle times",          icon: '⏱' },
    { id: 'prod_bulk_mixing',           branch: 'production',  tier: 1, name: "Bulk Substrate",      cost: 1, levelReq: 3,  prereqs: [],                          desc: "Spawn up to 32 blocks per batch",                icon: '📦' },
    { id: 'prod_block_machine',         branch: 'production',  tier: 2, name: "Block Machine",       cost: 2, levelReq: 5,  prereqs: ['prod_bulk_mixing'],         desc: "Auto-produces 8 sterile blocks/day ($5/day)",    icon: '🏭' },
    { id: 'prod_supplier_access',       branch: 'production',  tier: 2, name: "Supplier Market",     cost: 2, levelReq: 5,  prereqs: ['prod_efficient_sterilize'], desc: "Unlocks buying materials from suppliers",         icon: '🛒' },
    { id: 'prod_buy_readymade',         branch: 'production',  tier: 3, name: "Ready-Made Blocks",   cost: 2, levelReq: 8,  prereqs: ['prod_supplier_access'],     desc: "Buy 0% contam blocks from suppliers",            icon: '✅' },
    { id: 'prod_sell_equipment',        branch: 'production',  tier: 3, name: "Equipment Liquidation",cost: 1, levelReq: 7, prereqs: ['prod_supplier_access'],     desc: "Sell equipment at 60% value (up from 50%)",      icon: '💰' },
    { id: 'prod_grain_producer',        branch: 'production',  tier: 4, name: "Grain Producer License",cost: 3, levelReq: 12, prereqs: ['prod_block_machine'],     desc: "Passive income: sell grain $50-200/week",        icon: '🏗' },

    // ── Commercial Branch (gold) ──
    { id: 'comm_haggling',              branch: 'commercial',  tier: 1, name: "Haggling",            cost: 1, levelReq: 2,  prereqs: [],                          desc: "+$2/lb on all market sales",                     icon: '🤝' },
    { id: 'comm_marketing_savvy',       branch: 'commercial',  tier: 1, name: "Marketing Savvy",     cost: 1, levelReq: 3,  prereqs: [],                          desc: "+10% pitch success rate",                        icon: '📢' },
    { id: 'comm_sunday_market',         branch: 'commercial',  tier: 2, name: "Sunday Market",       cost: 2, levelReq: 5,  prereqs: ['comm_haggling'],            desc: "Sunday market (summer only), $20 fee, 30lb cap", icon: '🛍' },
    { id: 'comm_restaurant_events',     branch: 'commercial',  tier: 2, name: "Restaurant Events",   cost: 2, levelReq: 6,  prereqs: ['comm_marketing_savvy'],     desc: "Clients offer one-off event contracts",          icon: '🍽' },
    { id: 'comm_grow_kits',             branch: 'commercial',  tier: 3, name: "Grow Kits",           cost: 3, levelReq: 10, prereqs: ['comm_sunday_market'],        desc: "Manufacture + sell DIY grow kits ($30-50)",      icon: '📦' },
    { id: 'comm_premium_pricing',       branch: 'commercial',  tier: 3, name: "Premium Brand",       cost: 2, levelReq: 9,  prereqs: ['comm_restaurant_events'],   desc: "+20% revenue on all contracts",                  icon: '👑' },
    { id: 'comm_wholesale',             branch: 'commercial',  tier: 4, name: "Wholesale",           cost: 3, levelReq: 13, prereqs: ['comm_grow_kits','comm_premium_pricing'], desc: "Unlock bulk 200+ lb wholesale orders", icon: '🚛' },

    // ── Research Branch (purple) ──
    { id: 'res_gardener_network',       branch: 'research',    tier: 1, name: "Gardener Network",    cost: 1, levelReq: 2,  prereqs: [],                          desc: "2x reputation from mulch/gardener events",       icon: '🌱' },
    { id: 'res_species_insight',        branch: 'research',    tier: 1, name: "Species Insight",     cost: 1, levelReq: 3,  prereqs: [],                          desc: "-20% research cost for all species",             icon: '🔍' },
    { id: 'res_speaking_events',        branch: 'research',    tier: 2, name: "Speaking Events",     cost: 2, levelReq: 5,  prereqs: ['res_gardener_network'],     desc: "Weekly invitations for XP + research points",    icon: '🎤' },
    { id: 'res_lab_equipment_1',        branch: 'research',    tier: 2, name: "Lab Equipment I",     cost: 2, levelReq: 5,  prereqs: ['res_species_insight'],      desc: "Research bench: $50 + 5lbs → 10 research pts",   icon: '🔬' },
    { id: 'res_research_initiative',    branch: 'research',    tier: 3, name: "Research Initiative",  cost: 2, levelReq: 8, prereqs: ['res_speaking_events','res_lab_equipment_1'], desc: "Spend research pts on global bonuses", icon: '📊' },
    { id: 'res_lab_equipment_2',        branch: 'research',    tier: 3, name: "Lab Equipment II",    cost: 2, levelReq: 9,  prereqs: ['res_lab_equipment_1'],      desc: "2x research point generation rate",              icon: '⚗' },
    { id: 'res_mycology_pioneer',       branch: 'research',    tier: 4, name: "Mycology Pioneer",    cost: 3, levelReq: 14, prereqs: ['res_research_initiative'],   desc: "+$1000, +30% XP, prestige title",                icon: '🏆' },
];

const BRANCH_META = {
    cultivation: { name: 'Cultivation',  color: '#5eff6b', icon: 'branch_icon_cultivation_1775241461569.png' },
    production:  { name: 'Production',   color: '#5ea1ff', icon: 'branch_icon_production_1775241478135.png' },
    commercial:  { name: 'Commercial',   color: '#ffd700', icon: 'branch_icon_commercial_1775241494669.png' },
    research:    { name: 'Research',      color: '#9b7fff', icon: 'branch_icon_research_1775241511491.png' }
};

const equipmentData = [
    {
        id: 'sterilizer', title: "Substrate Sterilization", cat: 'lab',
        tiers: [
            { level: 1, name: "Steel Pot",          cost: 0,     text: "1 Block. 12h Cycle. 15% Contam Risk." },
            { level: 2, name: "DIY 55-Gal Barrel",  cost: 550,   text: "16 Blocks. 12h Cycle. 10% Contam Risk." },
            { level: 3, name: "Bubba's Barrel",     cost: 2500,  text: "32 Blocks. 12h Cycle. 5% Contam Risk." },
            { level: 4, name: "Agoclave",           cost: 5000,  text: "16 Blocks. 6h Cycle. 2% Contam Risk." },
            { level: 5, name: "Indus Autoclave",    cost: 20000, text: "64 Blocks. 8h Cycle. 0% Contam Risk." }
        ]
    },
    {
        id: 'tumbler', title: "Substrate Mixer", cat: 'lab',
        tiers: [
            { level: 1, name: "Manual Mixing",      cost: 0,    text: "Mix by hand." },
            { level: 2, name: "Block Tumbler",      cost: 1000, text: "+25% Block Colonization Speed." }
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
