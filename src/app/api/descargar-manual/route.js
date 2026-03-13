import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'Manual de acceso a la plataforma.pdf');
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Manual de acceso a la plataforma.pdf"',
      },
    });
  } catch (e) {
    console.error("Error leyendo el manual:", e);
    return new NextResponse('Manual no encontrado', { status: 404 });
  }
}

export async function POST() {
  return new NextResponse('OK', { status: 200 });
}
