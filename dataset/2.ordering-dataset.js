// fix_and_group_entries.js
// Reads entries from a JSON file (array of objects), removes duplicates, assigns global sequential index, and groups by field.

// Usage example (Node.js):
// const grouped = fixAndGroupEntries(readEntriesFromJSON('your_entries.json'));
// require('fs').writeFileSync('grouped_entries.json', JSON.stringify(grouped, null, 2));

const fs = require('fs');

/**
 * Reads entries from a JSON file.
 * Expects an array of objects with at least: field, prompt, response
 * @param {string} filename
 * @returns {Array<Object>} Array of entry objects
 */
function readEntriesFromJSON(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  let data = JSON.parse(content);
  // If the JSON file uses a top-level object with a property "data" or similar, adapt as needed
  if (Array.isArray(data)) return data;
  // Try common patterns for top-level object
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.entries)) return data.entries;
  throw new Error('Unrecognized JSON structure: expected array at top level or under "data"/"entries".');
}

/**
 * Deduplicate, re-index globally, and group entries by field.
 * @param {Array<Object>} entries
 * @returns {Object} grouped entries by field, each with new global index
 */
function fixAndGroupEntries(entries) {
  // Remove duplicates: Same field+prompt = duplicate (response is ignored for deduplication)
  const uniqueMap = new Map();
  for (const entry of entries) {
    // Ensure field and prompt exist for key creation
    const field = entry.field || '';
    const prompt = entry.prompt || '';
    // The key now only includes field and prompt
    const key = `${field}||${prompt}`;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, entry); // Keep the first entry encountered for this field+prompt
    }
  }
  const uniqueEntries = Array.from(uniqueMap.values());

  // Sort by field initially for consistent grouping later
  uniqueEntries.sort((a, b) => {
    if (a.field !== b.field) return a.field.localeCompare(b.field);
    return a.prompt.localeCompare(b.prompt); // Secondary sort for determinism
  });

  const threshold = 0;
  let lessThresholdCount = 0;
  let moreThresholdCount = 0;
  const entriesGroupedByField = {}; // Temporary structure to group and sort

  for (const entry of uniqueEntries) {
    if (!entry.response) {
      console.log(`${entry.field.trim()},${entry.prompt.trim()}`);
    } else {
      const responseLength = entry.response.length;
      if (responseLength > threshold) {
          moreThresholdCount++;
          if (!entriesGroupedByField[entry.field]) {
              entriesGroupedByField[entry.field] = [];
          }
          entriesGroupedByField[entry.field].push({
              field: entry.field,
              prompt: entry.prompt,
              response: entry.response,
              responseLength: responseLength,
          });
      } else {
        lessThresholdCount++;
      }
    }
  }

  const finalGroupedEntries = [];
  let index = 1;
  const entriesGroupedLength = {}; // This will now reflect the count of entries with responseLength > threshold

  // Iterate over fields and sort entries within each field by responseLength (desc)
  const sortedFields = Object.keys(entriesGroupedByField).sort(); // Sort fields alphabetically for deterministic output
  for (const field of sortedFields) {
      const fieldEntries = entriesGroupedByField[field];

      // Sort entries within this field by responseLength in descending order
      fieldEntries.sort((a, b) => b.responseLength - a.responseLength);

      entriesGroupedLength[field] = fieldEntries.length; // Count after filtering and grouping

      // Assign global index and push to final array
      for (const entry of fieldEntries) {
          finalGroupedEntries.push({
              field: entry.field,
              index: index++,
              prompt: entry.prompt,
              response: entry.response,
              responseLength: entry.responseLength,
          });
      }
  }

  console.log("lessThresholdCount", lessThresholdCount);
  console.log("moreThresholdCount", moreThresholdCount);
  console.log("Entries count per field (responseLength > threshold):", entriesGroupedLength);

  return finalGroupedEntries;
}

// ---- Example usage ----
const entriesFileName = "generatorLLMResponse";
const entries = readEntriesFromJSON(`${entriesFileName}.json`);
const grouped = fixAndGroupEntries(entries);
fs.writeFileSync(`${entriesFileName}_grouped.json`, JSON.stringify(grouped, null, 2));
