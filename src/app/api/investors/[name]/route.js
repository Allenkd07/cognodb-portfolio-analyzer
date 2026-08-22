import { NextResponse } from 'next/server';
import { getInvestorHoldings } from '../../../../lib/queries';

export async function GET(request, { params }) {
  try {
    const { name } = await params;
    const holdings = await getInvestorHoldings(decodeURIComponent(name));
    if (holdings.length === 0) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }
    return NextResponse.json({ holdings });
  } catch (err) {
    console.error('GET /api/investors/[name] failed:', err.message);
    return NextResponse.json(
      { error: 'Could not reach the database. Please try again in a moment.' },
      { status: 503 }
    );
  }
}
