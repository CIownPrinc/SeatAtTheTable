const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, 'src/main.ts');
const source = fs.readFileSync(mainPath, 'utf8');

const sections = [];
const regex = /\/\/\s*=================\s*(.*?)\s*=================\n/g;

let lastIndex = 0;
let lastTitle = 'HEADER';
let match;

while ((match = regex.exec(source)) !== null) {
  if (match.index > lastIndex) {
    sections.push({ title: lastTitle, content: source.substring(lastIndex, match.index) });
  }
  lastTitle = match[1];
  lastIndex = match.index + match[0].length;
}
sections.push({ title: lastTitle, content: source.substring(lastIndex) });

// Map titles to files
const fileMap = {
  'HEADER': 'core/header.ts',
  'VENTURE DATA': 'data/ventures.ts',
  'ASSETS: CARS & PROPERTIES': 'data/assets.ts',
  'TERRITORY: DISTRICTS': 'data/districts.ts',
  'THE TRADE: PRODUCT, CORNERS': 'data/trade.ts',
  'POLITICS': 'data/politics.ts',
  'GANG': 'data/gang.ts',
  'DIALOGUE ENGINE': 'data/dialogue.ts',
  'NPC REGISTRY': 'data/npc.ts',
  'STATE': 'core/state.ts',
  'HELPERS': 'utils/helpers.ts',
  'MODAL': 'ui/modal.ts',
  'VENTURE QUICK PANEL (used by the map)': 'ui/venturePanel.ts',
  'BANK': 'ui/bank.ts',
  'LOCAL BUSINESSES (map-only, rob/extort)': 'systems/localBiz.ts',
  'ASSETS: CARS & PROPERTIES (Render)': 'ui/assetsPanel.ts',
  'THE TRADE: LAB & CORNERS (Render)': 'ui/tradePanel.ts',
  'POLITICS: FUNCTIONS': 'systems/politicsFuncs.ts',
  'GANG: FUNCTIONS': 'systems/gangFuncs.ts',
  'RENDER: VENTURE CARDS': 'ui/ventureCards.ts',
  'RENDER: STREET PANEL': 'ui/streetPanel.ts',
  'RENDER: ALL': 'ui/renderAll.ts',
  'PRESTIGE': 'systems/prestige.ts',
  'TABS': 'ui/tabs.ts',
  'MAP: 3D WORLD + MINIMAP + INTERIORS': 'systems/map.ts',
  'THREE.JS SCENE': 'systems/scene3d.ts',
  'MINIMAP (simple 2D, pannable, waypoints)': 'systems/minimap.ts',
  'INTERIOR (lightweight 2D scene)': 'systems/interior.ts',
  'MAIN LOOP': 'systems/mainLoop.ts',
  'SETTINGS': 'ui/settings.ts',
  'PERSISTENT SAVE': 'core/saveLoad.ts',
  'GAME LOOP': 'core/gameLoop.ts',
  'BOOT': 'core/boot.ts',
};

// Second ASSETS section title needs a different file
let assetCount = 0;

const files = [];

sections.forEach(sec => {
  let fileName = fileMap[sec.title] || `misc/${sec.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ts`;
  if (sec.title === 'ASSETS: CARS & PROPERTIES') {
    assetCount++;
    if (assetCount === 2) fileName = 'ui/assetsPanel.ts';
  }
  
  files.push({
    title: sec.title,
    path: fileName,
    content: sec.content,
    exports: [],
  });
});

const definedSymbols = new Map(); // symbol -> file path
const allSymbolsList = [];

// Add export keywords and collect symbols
files.forEach(f => {
  let content = f.content;
  
  // export const/let/var
  content = content.replace(/^(const|let|var)\s+([a-zA-Z0-9_]+)\s*(=|;)/gm, (m, kw, id, eq) => {
    f.exports.push(id);
    definedSymbols.set(id, f.path);
    allSymbolsList.push(id);
    return `export ${kw} ${id} ${eq}`;
  });

  // export function
  content = content.replace(/^function\s+([a-zA-Z0-9_]+)\s*\(/gm, (m, id) => {
    f.exports.push(id);
    definedSymbols.set(id, f.path);
    allSymbolsList.push(id);
    return `export function ${id}(`;
  });
  
  // Find async function
  content = content.replace(/^async\s+function\s+([a-zA-Z0-9_]+)\s*\(/gm, (m, id) => {
    f.exports.push(id);
    definedSymbols.set(id, f.path);
    allSymbolsList.push(id);
    return `export async function ${id}(`;
  });
  
  f.content = content;
});

// For each file, find what it needs to import
files.forEach(f => {
  const needsImport = new Set();
  allSymbolsList.forEach(sym => {
    if (f.exports.includes(sym)) return; // defined in this file
    // Check if symbol is used as a whole word
    const regex = new RegExp(`\\b${sym}\\b`);
    if (regex.test(f.content)) {
      needsImport.add(sym);
    }
  });
  
  // Group imports by file
  const importsByFile = {};
  needsImport.forEach(sym => {
    const src = definedSymbols.get(sym);
    if (!importsByFile[src]) importsByFile[src] = [];
    importsByFile[src].push(sym);
  });
  
  let importStr = '';
  for (const src in importsByFile) {
    // compute relative path
    const fDir = path.dirname(f.path);
    let relPath = path.posix.relative(fDir, src);
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    relPath = relPath.replace(/\.ts$/, '');
    importStr += `import { ${importsByFile[src].join(', ')} } from '${relPath}';\n`;
  }
  
  f.content = importStr + (importStr ? '\n' : '') + f.content;
});

// write files
files.forEach(f => {
  const fullPath = path.join(__dirname, 'src', f.path);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, f.content);
});

// Generate globals.ts
let globalsStr = '';
files.forEach(f => {
  if (f.exports.length === 0) return;
  let relPath = './' + f.path.replace(/\.ts$/, '');
  globalsStr += `import { ${f.exports.join(', ')} } from '${relPath}';\n`;
});
globalsStr += '\n// Expose to window\n';
allSymbolsList.forEach(sym => {
  globalsStr += `(window as any).${sym} = ${sym};\n`;
});
fs.writeFileSync(path.join(__dirname, 'src/globals.ts'), globalsStr);

// Generate main.ts
let newMainStr = `import './globals';\n\n`;
files.forEach(f => {
    // Import everything to execute side effects (like adding event listeners)
    newMainStr += `import './${f.path.replace(/\.ts$/, '')}';\n`;
});
fs.writeFileSync(path.join(__dirname, 'src/main.ts'), newMainStr);

console.log('Modularization complete');
