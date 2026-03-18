import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// IMPORTANT: Keep your actual Google Sheet ID here!
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; 

// Initialize Auth using Environment Variables instead of the JSON file
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // The .replace is crucial for Vercel to read the line breaks in the private key correctly
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);