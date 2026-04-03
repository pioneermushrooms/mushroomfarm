const fs = require('fs');
let content = fs.readFileSync('state.js', 'utf8');

const baseNames = ['Bistro', 'Cafe', 'Diner', 'Steakhouse', 'Pizzeria', 'Kitchen', 'Ramen House', 'Tavern', 'Apothecary', 'Eatery'];
const prefixes = ['Golden', 'Iron', 'Bella', 'Local', 'Hipster', 'Jade', 'Sakura', 'Root & Branch', 'Fine', 'Rustic'];
const species = ['any', 'blue', 'shiitake', 'lions', 'pioppino'];
const images = ['pizza.png', 'steak.png', 'champignon.png'];

let clients = [];
for (let i = 1; i <= 50; i++) {
    let repReq = Math.floor((i - 1) / 10) + 1; // 1-5
    let bName = prefixes[Math.floor(Math.random()*prefixes.length)] + ' ' + baseNames[Math.floor(Math.random()*baseNames.length)] + ' ' + i;
    let lbs = 5 + Math.floor(Math.random() * 20) + (repReq * 10);
    let s = species[Math.floor(Math.random() * species.length)];
    let img = images[Math.floor(Math.random() * images.length)];
    
    // Hardcode some flavors
    if(i===1) { bName='Luigies Pizzeria'; img='pizza.png'; s='any'; lbs=10; }
    if(i===2) { bName='Iron Steakhouse'; img='steak.png'; s='blue'; lbs=20; }
    if(i===3) { bName='Bella Pasta'; img='champignon.png'; s='shiitake'; lbs=15; }
    if(i===9) { bName='Le Champignon Fin'; img='champignon.png'; s='pioppino'; lbs=5; repReq=1; }

    clients.push({
        id: 'c_' + i,
        name: bName,
        dialogue: 'We need high quality mushrooms!',
        contractLbs: lbs,
        contractDays: 5 + Math.floor(Math.random() * 5),
        preferredSpecies: s,
        img: img,
        acquired: false,
        satisfaction: 100,
        strictness: 0.5 + Math.random() * 2,
        requiredReputation: repReq
    });
}

let repStart = content.indexOf('clientRoster: [');
// find the closing bracket of clientRoster array
let nest = 0;
let repEnd = -1;
for(let i=repStart+14; i<content.length; i++) {
    if(content[i] === '[') nest++;
    if(content[i] === ']') {
        if(nest===1) { repEnd = i; break; }
        nest--;
    }
}

const newArrStr = 'clientRoster: ' + JSON.stringify(clients, null, 4).replace(/\"([^(\")\"]+)\":/g, '$1:');
fs.writeFileSync('state.js', content.substring(0, repStart) + newArrStr + content.substring(repEnd+1));
console.log('Done!');
