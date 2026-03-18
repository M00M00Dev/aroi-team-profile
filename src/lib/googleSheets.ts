import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

// --- DIAGNOSTIC PROBE (Safe, will not log your actual secret) ---
console.log("==== PRIVATE KEY DIAGNOSTICS ====");
console.log("Key Exists?:", !!rawKey);
console.log("Length:", rawKey.length, "(Should be around 1700)");
console.log("Starts With:", rawKey.substring(0, 35));
console.log("Ends With:", rawKey.substring(rawKey.length - 35));
console.log("Has literal '\\n':", rawKey.includes('\\n'));
console.log("Has actual newlines:", rawKey.includes('\n'));
console.log("Has double quotes:", rawKey.includes('"'));
console.log("=================================");

// Basic formatter 
const formattedKey = rawKey.replace(/\\n/g, '\n').replace(/"/g, '');

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formattedKey, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);