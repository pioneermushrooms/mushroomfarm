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
        'pioppino': { rate: 0.4,  colRate: 0.198, pitchMod: 0.10, val: 40, yieldMod: 1.0, spoilTime: 384, desc: "Italian cuisine, 21-day col",       isResearched: false, researchCost: 350, idealTemp: "55-65F", idealHum: "90-95%", spoilageDesc: "Slow (16d)",      tMin: 55, tMax: 65, hMin: 90, hMax: 95 }
    },
    clientRoster: [
    {
        id: "c_1",
        name: "Luigies Pizzeria",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 10,
        contractDays: 5,
        preferredSpecies: "any",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.2340833413677035,
        requiredReputation: 1
    },
    {
        id: "c_2",
        name: "Iron Steakhouse",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 20,
        contractDays: 8,
        preferredSpecies: "blue",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.162458525695932,
        requiredReputation: 1
    },
    {
        id: "c_3",
        name: "Bella Pasta",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 15,
        contractDays: 5,
        preferredSpecies: "shiitake",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.296019723197998,
        requiredReputation: 1
    },
    {
        id: "c_4",
        name: "Root & Branch Kitchen 4",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 26,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.1698628961824387,
        requiredReputation: 1
    },
    {
        id: "c_5",
        name: "Bella Kitchen 5",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 29,
        contractDays: 6,
        preferredSpecies: "blue",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.6151204785386213,
        requiredReputation: 1
    },
    {
        id: "c_6",
        name: "Golden Eatery 6",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 24,
        contractDays: 8,
        preferredSpecies: "any",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.7321636898499926,
        requiredReputation: 1
    },
    {
        id: "c_7",
        name: "Hipster Apothecary 7",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 16,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.9852242253818506,
        requiredReputation: 1
    },
    {
        id: "c_8",
        name: "Jade Eatery 8",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 34,
        contractDays: 7,
        preferredSpecies: "any",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.8384257455388875,
        requiredReputation: 1
    },
    {
        id: "c_9",
        name: "Le Champignon Fin",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 5,
        contractDays: 8,
        preferredSpecies: "pioppino",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.5881740094991157,
        requiredReputation: 1
    },
    {
        id: "c_10",
        name: "Jade Pizzeria 10",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 27,
        contractDays: 7,
        preferredSpecies: "any",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.1945685240216348,
        requiredReputation: 1
    },
    {
        id: "c_11",
        name: "Hipster Tavern 11",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 32,
        contractDays: 8,
        preferredSpecies: "blue",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.8214206002236977,
        requiredReputation: 2
    },
    {
        id: "c_12",
        name: "Sakura Apothecary 12",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 34,
        contractDays: 8,
        preferredSpecies: "pioppino",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.9333446926992579,
        requiredReputation: 2
    },
    {
        id: "c_13",
        name: "Bella Diner 13",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 38,
        contractDays: 5,
        preferredSpecies: "shiitake",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.6604663546237997,
        requiredReputation: 2
    },
    {
        id: "c_14",
        name: "Sakura Apothecary 14",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 32,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.0965006103081927,
        requiredReputation: 2
    },
    {
        id: "c_15",
        name: "Root & Branch Cafe 15",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 25,
        contractDays: 5,
        preferredSpecies: "any",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.0309566854224297,
        requiredReputation: 2
    },
    {
        id: "c_16",
        name: "Golden Apothecary 16",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 27,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.0534647209624164,
        requiredReputation: 2
    },
    {
        id: "c_17",
        name: "Hipster Diner 17",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 29,
        contractDays: 8,
        preferredSpecies: "shiitake",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.1467007124507176,
        requiredReputation: 2
    },
    {
        id: "c_18",
        name: "Rustic Cafe 18",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 41,
        contractDays: 8,
        preferredSpecies: "shiitake",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.9322695212215546,
        requiredReputation: 2
    },
    {
        id: "c_19",
        name: "Fine Bistro 19",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 33,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.2801656822820786,
        requiredReputation: 2
    },
    {
        id: "c_20",
        name: "Jade Cafe 20",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 40,
        contractDays: 9,
        preferredSpecies: "any",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.613752872632395,
        requiredReputation: 2
    },
    {
        id: "c_21",
        name: "Fine Eatery 21",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 39,
        contractDays: 9,
        preferredSpecies: "any",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.73305171729303,
        requiredReputation: 3
    },
    {
        id: "c_22",
        name: "Golden Apothecary 22",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 43,
        contractDays: 7,
        preferredSpecies: "shiitake",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.2651349012328956,
        requiredReputation: 3
    },
    {
        id: "c_23",
        name: "Iron Pizzeria 23",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 50,
        contractDays: 8,
        preferredSpecies: "shiitake",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.6395105096505413,
        requiredReputation: 3
    },
    {
        id: "c_24",
        name: "Bella Diner 24",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 51,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.7777038814434327,
        requiredReputation: 3
    },
    {
        id: "c_25",
        name: "Fine Pizzeria 25",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 38,
        contractDays: 7,
        preferredSpecies: "shiitake",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.410273535951343,
        requiredReputation: 3
    },
    {
        id: "c_26",
        name: "Hipster Diner 26",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 49,
        contractDays: 5,
        preferredSpecies: "pioppino",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.1418391208287133,
        requiredReputation: 3
    },
    {
        id: "c_27",
        name: "Iron Tavern 27",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 40,
        contractDays: 7,
        preferredSpecies: "pioppino",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.3664189853366904,
        requiredReputation: 3
    },
    {
        id: "c_28",
        name: "Jade Apothecary 28",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 51,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.9361430861233244,
        requiredReputation: 3
    },
    {
        id: "c_29",
        name: "Local Pizzeria 29",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 36,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.8273626102490126,
        requiredReputation: 3
    },
    {
        id: "c_30",
        name: "Golden Cafe 30",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 44,
        contractDays: 7,
        preferredSpecies: "blue",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.6488483953430748,
        requiredReputation: 3
    },
    {
        id: "c_31",
        name: "Fine Cafe 31",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 7,
        preferredSpecies: "lions",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.0698189762647954,
        requiredReputation: 4
    },
    {
        id: "c_32",
        name: "Bella Cafe 32",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 51,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.5445396390418491,
        requiredReputation: 4
    },
    {
        id: "c_33",
        name: "Bella Eatery 33",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 57,
        contractDays: 5,
        preferredSpecies: "shiitake",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.2301706549393976,
        requiredReputation: 4
    },
    {
        id: "c_34",
        name: "Bella Ramen House 34",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 7,
        preferredSpecies: "shiitake",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.9125581406069765,
        requiredReputation: 4
    },
    {
        id: "c_35",
        name: "Root & Branch Cafe 35",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 56,
        contractDays: 7,
        preferredSpecies: "blue",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.0312579313614187,
        requiredReputation: 4
    },
    {
        id: "c_36",
        name: "Golden Bistro 36",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 62,
        contractDays: 9,
        preferredSpecies: "pioppino",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.444147667264867,
        requiredReputation: 4
    },
    {
        id: "c_37",
        name: "Jade Ramen House 37",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 62,
        contractDays: 6,
        preferredSpecies: "lions",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.5232484193798981,
        requiredReputation: 4
    },
    {
        id: "c_38",
        name: "Hipster Kitchen 38",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 58,
        contractDays: 9,
        preferredSpecies: "blue",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.6478273013824851,
        requiredReputation: 4
    },
    {
        id: "c_39",
        name: "Bella Tavern 39",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 45,
        contractDays: 8,
        preferredSpecies: "lions",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.3830296742667763,
        requiredReputation: 4
    },
    {
        id: "c_40",
        name: "Rustic Kitchen 40",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 45,
        contractDays: 7,
        preferredSpecies: "lions",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.5384893075464916,
        requiredReputation: 4
    },
    {
        id: "c_41",
        name: "Jade Cafe 41",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 59,
        contractDays: 6,
        preferredSpecies: "pioppino",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.1688410257674526,
        requiredReputation: 5
    },
    {
        id: "c_42",
        name: "Jade Ramen House 42",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 59,
        contractDays: 8,
        preferredSpecies: "pioppino",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.911500098850567,
        requiredReputation: 5
    },
    {
        id: "c_43",
        name: "Root & Branch Bistro 43",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 5,
        preferredSpecies: "blue",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.360856786681945,
        requiredReputation: 5
    },
    {
        id: "c_44",
        name: "Local Tavern 44",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 69,
        contractDays: 8,
        preferredSpecies: "pioppino",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.8308025190177273,
        requiredReputation: 5
    },
    {
        id: "c_45",
        name: "Jade Tavern 45",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 64,
        contractDays: 7,
        preferredSpecies: "blue",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.0007519541537357,
        requiredReputation: 5
    },
    {
        id: "c_46",
        name: "Bella Eatery 46",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 56,
        contractDays: 6,
        preferredSpecies: "pioppino",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.15097090286063,
        requiredReputation: 5
    },
    {
        id: "c_47",
        name: "Sakura Diner 47",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 71,
        contractDays: 7,
        preferredSpecies: "any",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 2.0494808256969033,
        requiredReputation: 5
    },
    {
        id: "c_48",
        name: "Hipster Apothecary 48",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 74,
        contractDays: 9,
        preferredSpecies: "blue",
        img: "champignon.png",
        acquired: false,
        satisfaction: 100,
        strictness: 0.8237903582855219,
        requiredReputation: 5
    },
    {
        id: "c_49",
        name: "Iron Bistro 49",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 74,
        contractDays: 5,
        preferredSpecies: "lions",
        img: "steak.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.6640893952412577,
        requiredReputation: 5
    },
    {
        id: "c_50",
        name: "Fine Diner 50",
        dialogue: "We need high quality mushrooms!",
        contractLbs: 70,
        contractDays: 7,
        preferredSpecies: "shiitake",
        img: "pizza.png",
        acquired: false,
        satisfaction: 100,
        strictness: 1.986139488196665,
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
    sleepUntilHour: 8
};

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

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
