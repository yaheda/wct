import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json(
      { message: 'Hello, World ! It is working.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in hello route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
