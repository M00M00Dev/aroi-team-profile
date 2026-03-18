import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// 1. Decode the Base64 string back to utf8
const decodedKey = Buffer.from(process.env.GOOGLE_BASE64_KEY || '', 'base64').toString('utf8');

// 2. Clean it up: Convert literal "\n" strings into actual, invisible line breaks
const finalKey = decodedKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: finalKey, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);