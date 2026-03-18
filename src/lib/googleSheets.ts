import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 1. Your exact Google Sheet ID
const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// 2. Initialize Auth using Environment Variables
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // The .replace() ensures Vercel reads the line breaks in your private key correctly
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// 3. Export the connected document
export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);