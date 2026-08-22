import { NextResponse } from 'next/server';
import { listFunds } from '../../../lib/queries';

export async function GET() {
  try {
    const funds = await listFunds();
    return NextResponse.json({ funds });
  } catch (err) {
    console.error('GET /api/funds failed:', err.message);
    return NextResponse.json(
      { error: 'Could not reach the database. Please try again in a moment.' },
      { status: 503 }
    );
  }
}
