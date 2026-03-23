import { NextResponse } from 'next/server';
import { doc } from '../../../lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await doc.loadInfo();
    
    // Looks for tab named 'programs'. If not found, falls back to the 5th tab.
    const programsSheet = doc.sheetsByTitle['programs'] || doc.sheetsByIndex[4]; 

    if (!programsSheet) {
      return NextResponse.json({ error: 'Programs tab not found' }, { status: 404 });
    }

    const rows = await programsSheet.getRows();
    
    // Clean up names and remove empty rows
    const masterPrograms = rows
      .map((row: any) => String(row.get('program_name') || '').trim())
      .filter((name: string) => name !== '');

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