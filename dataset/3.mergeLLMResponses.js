const fs = require('fs');

// Load JSON files
const generatorData = JSON.parse(fs.readFileSync('./generatorLLMResponseWithFollowup.json', 'utf-8'));
const analyzerData = JSON.parse(fs.readFileSync('./analyzerLLMResponse.json', 'utf-8'));

// Index by prompt
const genMap = new Map(generatorData.map(item => [item.prompt, item]));
const anaMap = new Map(analyzerData.map(item => [item.prompt, item]));

// Validate prompts match
const genPrompts = [...genMap.keys()].sort();
const anaPrompts = [...anaMap.keys()].sort();
const missingInAnalyzer = genPrompts.filter(p => !anaMap.has(p));
const missingInGenerator = anaPrompts.filter(p => !genMap.has(p));

if (missingInAnalyzer.length || missingInGenerator.length) {
  console.error('❌ Prompt mismatch between files!');
  if (missingInAnalyzer.length) {
    console.error('Missing in analyzerLLMResponse.json:\n', missingInAnalyzer.join('\n'));
  }
  if (missingInGenerator.length) {
    console.error('Missing in generatorLLMResponseWithFollowup.json:\n', missingInGenerator.join('\n'));
  }
  process.exit(1);
}

// Merge entries
let merged = genPrompts.map(prompt => {
  const gen = genMap.get(prompt);
  const ana = anaMap.get(prompt);

  return {
    // index will be assigned after sorting
    prompt,
    field: gen.field,
    baseline_response: gen.response,
    responseLength: gen.responseLength,
    followup_prompt: gen.followup_prompt,
    analyzer_response: JSON.parse(ana.response),
    analyzer_responseLength: ana.responseLength,
  };
});

// Sort by field then prompt
merged.sort((a, b) => {
  if (a.field === b.field) return a.prompt.localeCompare(b.prompt);
  return a.field.localeCompare(b.field);
});

// Assign global index and move it to the top of each object
merged = merged.map((item, i) => {
  return {
    index: i + 1,
    ...item,
  };
});

// Save output
fs.writeFileSync('./merged_LLM_output.json', JSON.stringify(merged, null, 2));
console.log('✅ Fully merged, sorted, re-indexed globally, and saved to merged_LLM_output.json');
