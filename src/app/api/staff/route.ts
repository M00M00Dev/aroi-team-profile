import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const base64Key = process.env.GOOGLE_BASE64_KEY || '';

  return NextResponse.json({
    probe: "ACTIVE ON STAFF ROUTE",
    env: {
      rawKeyExists: !!rawKey,
      rawKeyLength: rawKey.length,
      rawKeyPreview: rawKey.substring(0, 25),
      
      base64KeyExists: !!base64Key,
      base64KeyLength: base64Key.length,
      base64KeyPreview: base64Key.substring(0, 25),
    }
  });
}