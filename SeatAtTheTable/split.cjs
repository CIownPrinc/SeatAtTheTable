const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// extract CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  fs.mkdirSync(path.join(__dirname, 'src/styles'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'src/styles/main.css'), cssMatch[1].trim());
  html = html.replace(cssMatch[0], '<link rel="stylesheet" href="./src/styles/main.css">');
}

// extract JS
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (jsMatch) {
  let js = jsMatch[1];
  
  // Remove the IIFE wrapper
  js = js.replace(/^\s*\(\s*function\s*\(\)\s*\{/, '');
  js = js.replace(/\}\s*\)\s*\(\s*\)\s*;\s*$/, '');

  fs.mkdirSync(path.join(__dirname, 'src'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'src/main.ts'), js.trim());

  html = html.replace(jsMatch[0], '<script type="module" src="./src/main.ts"></script>');
  fs.writeFileSync(htmlPath, html);
}

console.log('Extraction complete');
