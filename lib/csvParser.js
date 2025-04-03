import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

let cachedData = null;
let callTitles = null; // Store title data from the second CSV

// Load the call titles CSV
function loadCallTitles() {
  if (callTitles) return callTitles;

  try {
    const filePath = path.join(process.cwd(), 'public', 'calls.csv'); // Path to your calls CSV file

    if (!fs.existsSync(filePath)) {
      console.error('Calls CSV file not found at:', filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    callTitles = records.reduce((acc, record) => {
      const { id, title } = record;
      acc[id] = title; // Use id as the key and title as the value
      return acc;
    }, {});

    return callTitles;
  } catch (error) {
    console.error('Error loading call titles CSV:', error);
    return [];
  }
}

// Function to extract ID from videoUrl
function extractIdFromVideoUrl(mediaData) {
  try {
    const media = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (media && media.videoUrl) {
      const matches = media.videoUrl.match(/media-data\/\d+\/(\d+)\/\d+\.playback/);
      if (matches && matches[1]) {
        return matches[1]; // Return the extracted ID
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting ID from videoUrl:', error);
    return null;
  }
}

export async function parseCSV() {
  if (cachedData) {
    return cachedData;
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'extensiveCalls.csv');
    if (!fs.existsSync(filePath)) {
      console.error('CSV file not found at:', filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    const processedRecords = records.map((record) => {
      const processed = { ...record };
    
      if (processed.media) {
        try {
          const extractedId = extractIdFromVideoUrl(processed.media);
          if (extractedId) {
            processed.extractedId = extractedId;
          }
        } catch (e) {
          console.error('Failed to extract ID from media:', e);
        }
      }
    
      ['media', 'content', 'context', 'parties', 'metaData', 'interaction'].forEach((field) => {
        if (processed[field] && typeof processed[field] === 'string') {
          try {
            processed[field] = JSON.parse(processed[field]);
          } catch (e) {
            console.log(`Failed to parse ${field} as JSON, keeping as string`);
          }
        }
      });
    
      // Додаємо scheduled з metaData
      if (processed.metaData && typeof processed.metaData === 'object') {
        processed.scheduled = processed.metaData.scheduled || null;
      }
    
      return processed;
    });

    // Load the call titles and associate them with the records
    const callTitles = loadCallTitles();
    processedRecords.forEach((record) => {
      // First try using id, if it's not available, try using extractedId
      const callTitle = callTitles[record.id] || callTitles[record.extractedId];
      if (callTitle) {
        record.title = callTitle; // Attach the title from calls.csv based on id or extractedId
      }
    });

    cachedData = processedRecords;
    return processedRecords;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}