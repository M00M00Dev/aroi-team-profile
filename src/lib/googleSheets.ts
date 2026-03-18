import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// --- BULLETPROOF PRIVATE KEY FORMATTING ---
let rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY || '';
// 1. Strip out any accidental starting/ending quotes
rawPrivateKey = rawPrivateKey.replace(/^"|"$/g, '');
// 2. Force literal '\n' strings to become actual line breaks
const formattedPrivateKey = rawPrivateKey.replace(/\\n/g, '\n');

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formattedPrivateKey, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);