import { NextRequest, NextResponse } from 'next/server';
import { getUploadLogs } from '@/lib/uploadLog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      fileName: searchParams.get('fileName') || undefined,
      status: searchParams.get('status') as 'success' | 'failed' | undefined || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
    };

    const result = getUploadLogs(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching upload logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload logs' },
      { status: 500 }
    );
  }
}
