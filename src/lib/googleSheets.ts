import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// 1. Parse the entire JSON file straight from Vercel
const credsEnv = process.env.GOOGLE_SERVICE_ACCOUNT || '{}';
let creds;

try {
  creds = JSON.parse(credsEnv);
} catch (error) {
  console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT JSON. Is it set correctly in Vercel?");
  creds = {};
}

// 2. Pass the email and key exactly as Google formatted them in the JSON
const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);