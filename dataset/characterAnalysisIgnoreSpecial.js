/**
 * Calculates average character counts for baseline and analyzer responses,
 * ignoring special characters (only letters and digits are counted),
 * and estimates reading time in seconds (assuming 15 chars/second).
 * @param {Array} data - Array of entries from merged_LLM_output_with_token_costs.json
 * @returns {Object} Metrics including averages and reading time estimates.
 */
function characterBasedAnalysisIgnoreSpecialSeconds(data) {
  const baselineCharCounts = [];
  const analyzerCharCounts = [];

  // Regex to match letters and digits (ignoring special characters)
  const cleanText = text => (text || '').replace(/[^a-zA-Z0-9]/g, '');

  data.forEach(entry => {
    // Baseline response text
    const baselineText = entry.baseline_response || "";
    baselineCharCounts.push(cleanText(baselineText).length);

    // Analyzer response text (clarified prompt)
    const analyzerText = (entry.analyzer_response && entry.analyzer_response.suggestedClarifiedPrompt) || "";
    analyzerCharCounts.push(cleanText(analyzerText).length);
  });

  const totalEntries = data.length;
  const avgBaselineChars = baselineCharCounts.reduce((a, b) => a + b, 0) / totalEntries;
  const avgAnalyzerChars = analyzerCharCounts.reduce((a, b) => a + b, 0) / totalEntries;
  const netTimeSavedChars = avgBaselineChars - avgAnalyzerChars;

  // Reading speed assumption
  const charsPerSecond = 15;
  const readingTimeSec = chars => chars / charsPerSecond;

  // Output result
  return {
    avgBaselineChars,
    avgAnalyzerChars,
    netTimeSavedChars,
    readingTimes: {
      baseline: readingTimeSec(avgBaselineChars),
      analyzer: readingTimeSec(avgAnalyzerChars),
      netSaved: readingTimeSec(netTimeSavedChars),
    }
  };
}

// Example usage:
const fs = require('fs');
const path = 'merged_LLM_output_with_token_costs.json';
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
const result = characterBasedAnalysisIgnoreSpecialSeconds(data);

console.log("Avg. Reading Baseline Response (characters, letters/digits only):", result.avgBaselineChars.toFixed(1));
console.log("Avg. Reading Analyzer Response (characters, letters/digits only):", result.avgAnalyzerChars.toFixed(1));
console.log("Net Time Saved in Reading Effort (characters, letters/digits only):", result.netTimeSavedChars.toFixed(1));
console.log("--- Reading Time Estimates (seconds, 15 chars/sec) ---");
console.log(`Baseline Response: ${result.readingTimes.baseline.toFixed(2)} sec`);
console.log(`Analyzer Response: ${result.readingTimes.analyzer.toFixed(2)} sec`);
console.log(`Net Time Saved: ${result.readingTimes.netSaved.toFixed(2)} sec`);
