#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Core required fields (botanical + care)
const CORE_FIELDS = [
  'common', 'latin', 'visual', 'water', 'aspect', 'soil', 'prune',
  'hardiness', 'resilience', 'uses', 'size', 'hue'
];

// Optional but nice-to-have fields
const OPTIONAL_FIELDS = [
  'source', 'peak', 'order', 'bench', 'root', 'trade', 'retail', 'margin',
  'type', 'shrink', 'returnRisk', 'pots', 'cvs'
];

const NUMERIC_FIELDS = ['hue', 'growthSpeed', 'pestRisk', 'thirst', 'careLevel', 'sunNeed'];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function isPlantComplete(plant) {
  // Must have all core fields
  for (const field of CORE_FIELDS) {
    const value = plant[field];
    if (!value || value.trim() === '') return false;
  }
  return true;
}

function validatePlant(plant, index) {
  const errors = [];

  for (const field of CORE_FIELDS) {
    const value = plant[field];
    if (!value || value.trim() === '') {
      errors.push(`  Row ${index + 2}: Missing or empty "${field}"`);
    }
  }

  // Validate numeric fields if present
  for (const field of NUMERIC_FIELDS) {
    const value = plant[field];
    if (value && value.trim() !== '' && isNaN(Number(value))) {
      errors.push(`  Row ${index + 2}: "${field}" must be numeric, got "${value}"`);
    }
  }

  return errors;
}

function convertToJS(csvRow) {
  const obj = {};

  for (const [key, value] of Object.entries(csvRow)) {
    if (!key || value === undefined || value === '') continue;

    const trimmed = String(value).trim();
    if (!trimmed) continue;

    if (NUMERIC_FIELDS.includes(key)) {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        obj[key] = num;
      }
    } else {
      obj[key] = trimmed;
    }
  }

  return obj;
}

function formatPlantJS(plant) {
  const lines = ['{'];
  const entries = Object.entries(plant);

  entries.forEach(([key, value], i) => {
    const comma = i < entries.length - 1 ? ',' : '';
    if (typeof value === 'string') {
      lines.push(`   ${key}:"${value.replace(/"/g, '\\"')}"${comma}`);
    } else {
      lines.push(`   ${key}:${value}${comma}`);
    }
  });

  lines.push('}');
  return lines.join('\n');
}

function readHTMLPlants(htmlPath) {
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const startMarker = 'const PLANTS = [';
  const endMarker = '];';

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker, startIdx);

  if (startIdx === -1) return [];

  const arrayContent = content.substring(startIdx + startMarker.length, endIdx);
  const commonsMatch = arrayContent.match(/common:"([^"]+)"/g) || [];
  return commonsMatch.map(m => m.replace('common:"', '').replace('"', ''));
}

function diffPlants(csvPlants, existingPlants, completeOnly = false) {
  const existing = new Set(existingPlants.map(p => p.toLowerCase()));
  return csvPlants.filter(p => {
    if (existing.has(p.common.toLowerCase())) return false;
    if (completeOnly) return isPlantComplete(p);
    return true;
  });
}

function showDiff(newPlants) {
  console.log('\n📋 VISUAL DIFF - Plants to be added:\n');
  newPlants.forEach((plant, i) => {
    console.log(`${i + 1}. ${plant.common} (${plant.latin})`);
    console.log(`   Hue: ${plant.hue} | Size: ${plant.size}`);
    console.log(`   Uses: ${plant.uses}`);
    console.log();
  });
}

function addPlantsToHTML(htmlPath, newPlants) {
  let content = fs.readFileSync(htmlPath, 'utf-8');

  const endMarker = `];
/* PLANTS:END */`;
  const endIdx = content.indexOf(endMarker);

  if (endIdx === -1) throw new Error('Could not find PLANTS:END marker');

  const insertPoint = endIdx;
  const newPlantLines = newPlants.map((plant, i) => {
    const formatted = formatPlantJS(plant);
    const comma = i < newPlants.length - 1 ? ',' : '';
    return formatted + comma;
  }).join('\n  ');

  const before = content.substring(0, insertPoint);
  const after = content.substring(insertPoint);

  const updated = before + '  ' + newPlantLines + '\n' + after;

  return updated;
}

function main() {
  const command = process.argv[2];
  const csvPath = path.join(__dirname, 'plants.csv');
  const htmlPath = path.join(__dirname, 'timber.html');

  if (command === 'status') {
    const allCSVPlants = parseCSV(csvPath);
    const inHTML = readHTMLPlants(htmlPath);
    const missing = diffPlants(allCSVPlants, inHTML);
    const complete = diffPlants(allCSVPlants, inHTML, true);

    console.log(`\n📊 Plant Status`);
    console.log(`   In HTML: ${inHTML.length}`);
    console.log(`   In CSV: ${allCSVPlants.length}`);
    console.log(`   Available to add: ${missing.length}`);
    console.log(`   Complete & ready: ${complete.length}`);
    console.log(`\n   Next 5 complete plants to add:`);
    complete.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.common}`);
    });

  } else if (command === 'validate') {
    const allCSVPlants = parseCSV(csvPath);
    const inHTML = readHTMLPlants(htmlPath);
    const toAdd = diffPlants(allCSVPlants, inHTML, true).slice(0, 5);

    console.log(`\n✓ Validating ${toAdd.length} plants...\n`);

    let allValid = true;
    toAdd.forEach((plant, i) => {
      const errors = validatePlant(plant, i);
      if (errors.length > 0) {
        console.log(`❌ ${plant.common}:`);
        errors.forEach(e => console.log(e));
        allValid = false;
      } else {
        console.log(`✓ ${plant.common}`);
      }
    });

    if (!allValid) {
      process.exit(1);
    }
    console.log('\n✓ All plants valid!');

  } else if (command === 'diff') {
    const allCSVPlants = parseCSV(csvPath);
    const inHTML = readHTMLPlants(htmlPath);
    const toAdd = diffPlants(allCSVPlants, inHTML, true).slice(0, 5);
    
    if (toAdd.length === 0) {
      console.log('\n❌ No complete plants available to add.');
      console.log('   Fill in missing core data (common, latin, visual, water, aspect, soil, prune, hardiness, resilience, uses, size, hue) in plants.csv first.');
      process.exit(1);
    }
    
    showDiff(toAdd);

  } else if (command === 'add') {
    const allCSVPlants = parseCSV(csvPath);
    const inHTML = readHTMLPlants(htmlPath);
    const toAdd = diffPlants(allCSVPlants, inHTML, true).slice(0, 5);

    if (toAdd.length === 0) {
      console.log('\n❌ No complete plants available to add.');
      console.log('   Fill in missing core data in plants.csv first.');
      process.exit(1);
    }

    // Validate first
    console.log(`\n✓ Validating ${toAdd.length} plants...\n`);
    let allValid = true;
    toAdd.forEach((plant, i) => {
      const errors = validatePlant(plant, i);
      if (errors.length > 0) {
        console.log(`❌ ${plant.common}:`);
        errors.forEach(e => console.log(e));
        allValid = false;
      }
    });

    if (!allValid) {
      console.log('\n❌ Validation failed.');
      process.exit(1);
    }

    // Show diff
    showDiff(toAdd);

    // Convert to JS
    const jsPlants = toAdd.map(convertToJS);

    // Update HTML
    const updated = addPlantsToHTML(htmlPath, jsPlants);
    fs.writeFileSync(htmlPath, updated);

    console.log(`\n✓ Added ${toAdd.length} plants to timber.html`);

  } else {
    console.log(`
Plants Tool - Manage plant database

Usage:
  node plants-tool.js status    Show current status
  node plants-tool.js validate  Validate next 5 complete plants
  node plants-tool.js diff      Show what will be added
  node plants-tool.js add       Add next 5 complete plants to HTML

Examples:
  node plants-tool.js status
  node plants-tool.js validate && node plants-tool.js add
`);
  }
}

main();
