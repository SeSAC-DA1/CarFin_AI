import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const status = await getDatabaseStatus();

    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Database status API error:', error);

    return NextResponse.json({
      success: false,
      isConnected: false,
      totalVehicles: 0,
      availableVehicles: 0,
      error: 'Database connection failed'
    }, { status: 500 });
  }
}