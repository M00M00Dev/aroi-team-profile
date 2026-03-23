import { NextResponse } from 'next/server';
import { doc } from '../../../lib/googleSheets';

// Force Vercel to fetch fresh data every time
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await doc.loadInfo();
    
    // We look for the tab by its exact title to be safe, or fallback to the 5th tab (Index 4)
    const programsSheet = doc.sheetsByTitle['programs'] || doc.sheetsByIndex[4]; 

    if (!programsSheet) {
      return NextResponse.json({ error: 'Programs tab not found in Google Sheets' }, { status: 404 });
    }

    const rows = await programsSheet.getRows();
    
    // Extract the names and filter out any empty blank rows at the bottom
    const masterPrograms = rows
      .map((row: any) => String(row.get('program_name') || '').trim())
      .filter((name: string) => name !== '');

    // Return both the list and the total count
    return NextResponse.json({
      success: true,
      total_programs: masterPrograms.length,
      programs: masterPrograms
    });

  } catch (err: any) {
    console.error("GET PROGRAMS ERROR:", err.message);
    return NextResponse.json({ error: 'Failed to fetch programs', details: err.message }, { status: 500 });
  }
}