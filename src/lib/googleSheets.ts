import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';
import path from 'path';

// Load the JSON file directly to bypass .env formatting issues
const keyFile = path.resolve(process.cwd(), 'service-account.json');
const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

export const googleAuth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, googleAuth);