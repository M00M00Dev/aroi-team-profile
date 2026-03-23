import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    endpoints: ['/api/staff', '/api/programs'],
    timestamp: new Date().toISOString()
  });
}