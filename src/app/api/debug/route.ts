import { NextResponse } from 'next/server';

// Force Vercel to NEVER cache this response
export const dynamic = 'force-dynamic';

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const base64Key = process.env.GOOGLE_BASE64_KEY || '';

  return NextResponse.json({
    status: "Probe Active",
    env: {
      hasEmail: !!email,
      emailLength: email.length,
      
      hasRawKey: !!rawKey,
      rawKeyLength: rawKey.length,
      rawKeyStarts: rawKey.substring(0, 10),
      rawKeyEnds: rawKey.substring(rawKey.length - 10),
      rawKeyHasNewlines: rawKey.includes('\n'),
      rawKeyHasSlashes: rawKey.includes('\\n'),
      
      hasBase64Key: !!base64Key,
      base64KeyLength: base64Key.length,
    }
  });
}