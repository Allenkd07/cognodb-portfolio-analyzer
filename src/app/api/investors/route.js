import { NextResponse } from 'next/server';
import { listInvestors } from '../../../lib/queries';

export async function GET() {
  try {
    const investors = await listInvestors();
    return NextResponse.json({ investors });
  } catch (err) {
    console.error('GET /api/investors failed:', err.message);
    return NextResponse.json(
      { error: 'Could not reach the database. Please try again in a moment.' },
      { status: 503 }
    );
  }
}
