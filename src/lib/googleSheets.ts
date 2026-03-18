import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_ID = '1L5ZpNgmFvO7huy8M-m74vI-0Vynba5-XHswSinzdpHk'; 

// --- INDESTRUCTIBLE KEY FORMATTER (TypeScript Safe) ---
function formatPrivateKey(key: string | undefined) {
  if (!key) return '';
  
  try {
    // 1. Extract the raw base64 data using [\s\S] to avoid the ES2018 /s flag error
    const match = key.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
    
    if (match && match[1]) {
      // 2. Strip out ALL spaces, literal \n, quotes, and garbage Vercel added
      const cleanBase64 = match[1].replace(/\s+/g, '').replace(/\\n/g, '').replace(/"/g, '');
      
      // 3. Re-chunk the text into exact 64-character lines
      const chunks = cleanBase64.match(/.{1,64}/g) || [];
      
      // 4. Rebuild the perfect PEM file
      return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }
  } catch (err) {
    console.error("Key formatter failed, falling back to basic replace");
  }

  // Fallback just in case
  return key.replace(/\\n/g, '\n').replace(/"/g, '');
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);