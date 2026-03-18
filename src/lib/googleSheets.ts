import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// --- HYPER-AGGRESSIVE KEY FORMATTER ---
function formatPrivateKey(key: string | undefined) {
  if (!key) return '';
  // 1. Remove any surrounding quotes Vercel might have added
  let formatted = key.replace(/^"|"$/g, '');
  // 2. Replace literal \n strings with real line breaks using split/join (safer than regex)
  formatted = formatted.split('\\n').join('\n');
  return formatted;
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);