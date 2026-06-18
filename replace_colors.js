const fs = require('fs');
const path = require('path');

const filesToProcess = [
  path.join(__dirname, 'src', 'app', 'page.tsx'),
  path.join(__dirname, 'src', 'components', 'ChatArea.tsx'),
  path.join(__dirname, 'src', 'components', 'DNAProfileView.tsx'),
  path.join(__dirname, 'src', 'components', 'DNASettings.tsx'),
  path.join(__dirname, 'src', 'components', 'RagAgent.tsx'),
  path.join(__dirname, 'src', 'components', 'StyleCloner.tsx'),
];

const replacements = [
  // Class color names
  { regex: /amber-/g, replacement: 'red-' },
  { regex: /yellow-/g, replacement: 'red-' },
  { regex: /orange-/g, replacement: 'red-' },
  // RGB / Hex values & glows
  { regex: /245,158,11/g, replacement: '239,68,68' },
  { regex: /251,191,36/g, replacement: '239,68,68' },
  { regex: /251,\s*191,\s*36/g, replacement: '239, 68, 68' },
  { regex: /rgba\(245,\s*158,\s*11,\s*([0-9.]+)\)/g, replacement: 'rgba(239, 68, 68, $1)' },
  { regex: /rgba\(251,\s*191,\s*36,\s*([0-9.]+)\)/g, replacement: 'rgba(239, 68, 68, $1)' },
  // Animation classes
  { regex: /animate-gold-glow/g, replacement: 'animate-red-glow' },
  // Specific border color replacements if any
  { regex: /rgba\(217, 119, 6, 0.3\)/g, replacement: 'rgba(239, 68, 68, 0.3)' }
];

function processFiles() {
  for (const filePath of filesToProcess) {
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping file: ${filePath} (not found)`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const rep of replacements) {
      content = content.replace(rep.regex, rep.replacement);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully replaced colors in: ${filePath}`);
    } else {
      console.log(`No changes made to: ${filePath}`);
    }
  }
}

processFiles();
