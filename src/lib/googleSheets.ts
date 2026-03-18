import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// Safely decode the Base64 string back into the exact multiline format Google expects
const decodedKey = Buffer.from(process.env.GOOGLE_BASE64_KEY || '', 'base64').toString('utf8');

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: decodedKey, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);