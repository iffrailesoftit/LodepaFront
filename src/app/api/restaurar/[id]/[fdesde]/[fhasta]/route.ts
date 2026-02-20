// import path from 'path';
// import { NextResponse } from 'next/server';
// import { getSession } from '@/actions/auth/getSession';

// export async function GET(
//   request: Request,
//   // Desestructuramos params y lo aguardamos porque en Next.js 15 es asíncrono
//   context: {
//     params: Promise<{ id: string; fdesde: string; fhasta: string }>;
//   }
// ) {
//   const { id, fdesde, fhasta } = await context.params;

//   const userSession = await getSession()
//   const { id: idUser, rol } = userSession


//   /**
//    * https://myinbiotpublicapi.com/measurements-by-time/{apiKey}/{systemId}/{startDate}/{endDate}
//    */
// }