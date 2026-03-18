import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

let formattedKey = '';
const rawEnv = process.env.GOOGLE_PRIVATE_KEY || '';

try {
  // 1. Try to open the JSON envelope (This will bypass Vercel's formatting bugs)
  const parsed = JSON.parse(rawEnv);
  formattedKey = parsed.key;
  console.log("Successfully parsed key from JSON envelope.");
} catch (err) {
  // 2. Fallback if it's not JSON
  console.log("Not JSON, attempting manual format...");
  formattedKey = rawEnv.replace(/\\n/g, '\n').replace(/"/g, '');
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formattedKey, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);