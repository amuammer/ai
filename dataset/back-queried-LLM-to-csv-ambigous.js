const fs = require('fs');
const fileName = "dataset.json";

try {
    const content = fs.readFileSync(fileName, 'utf8');
    let data = JSON.parse(content);

    const uniqueEntriesSet = new Set(); // To keep track of unique combinations
    const csvRows = []; // To store each unique row as a string

    data.forEach(entry => {
        const field = entry.field.trim();
        const prompt = entry.prompt.trim();
        const combinedEntry = `${field},${prompt}`; // This is what we check for uniqueness

        // If this combination hasn't been seen before, add it to both the Set and the array
        if (!uniqueEntriesSet.has(combinedEntry)) {
            uniqueEntriesSet.add(combinedEntry);
            csvRows.push(combinedEntry); // Add the formatted row to our array
        }
    });

    // Join all the unique rows with a newline character
    const csvData = csvRows.join('\n');

    fs.writeFileSync(`ambigous_prompts_benchmark.csv`, csvData, 'utf8');
    console.log("CSV file 'ambigous_prompts_benchmark.csv' created successfully with unique entries.");

} catch (error) {
    console.error(`Error processing file: ${error.message}`);
}
