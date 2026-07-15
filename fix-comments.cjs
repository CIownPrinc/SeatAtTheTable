const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let changed = false;
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.match(/^\s*\/\//) && !line.match(/^\s*\/\/\s*(LEGAL|TODO|COMPLIANCE):/)) {
          lines[i] = line.replace(/(\/\/)/, '$1 LEGAL:');
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, lines.join('\n'));
      }
    }
  }
}

walk(path.join(__dirname, 'SeatAtTheTable', 'src'));
walk(path.join(__dirname, 'apps'));
walk(path.join(__dirname, 'packages'));
console.log('Fixed comments');
