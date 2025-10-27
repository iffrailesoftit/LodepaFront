import path from 'path';
import XlsxPopulate from 'xlsx-populate';
import { getRegistro, getRegistroDiario, Registro, RegistroDiario } from '@/actions/dispositivo/informe/getRegistro';
import { NextResponse } from 'next/server';
import { getSession } from '@/actions/auth/getSession';

export async function GET(
  request: Request,
  // Desestructuramos params y lo aguardamos porque en Next.js 15 es asíncrono
  context: {
    params: Promise<{ dispositivo: string; fechainicio: string; fechafin: string }>;
  }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  try {
    // 0) Extraer parámetros esperándolos
    const { dispositivo: dispositivoStr, fechainicio, fechafin } = await context.params;
    const dispositivo = Number(dispositivoStr);

    // 1) Cargar plantilla
    const templatePath = path.join(process.cwd(), 'templates', 'plantilla.xlsx');
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    // 2) Hoja de datos en bruto
    const rawSheet = workbook.sheet('Datos en bruto');
    if (!rawSheet) throw new Error('Hoja "Datos en bruto" no encontrada');
    // Limpiar datos previos
    // const lastRawRow = rawSheet.usedRange().endCell().rowNumber();
    // if (lastRawRow > 1) rawSheet.range(`A2:S${lastRawRow}`).clear();

    // 3) Poblar datos en bruto
    const registros: Registro[] = await getRegistro(dispositivo, fechainicio, fechafin);
    registros.forEach((r, i) => {
      const row = i + 2;
      rawSheet.cell(`A${row}`).value(r.id);
      rawSheet.cell(`B${row}`).value(r.hospital);
      rawSheet.cell(`C${row}`).value(r.n_sala);
      rawSheet.cell(`D${row}`).value(r.n_dispositivo);
      rawSheet.cell(`E${row}`).value(new Date(r.fecha));
      rawSheet.cell(`F${row}`).value(Number(r.temperature));
      rawSheet.cell(`G${row}`).value(Number(r.humidity));
      rawSheet.cell(`H${row}`).value(Number(r.co2));
      rawSheet.cell(`I${row}`).value(Number(r.pm10));
      rawSheet.cell(`J${row}`).value(Number(r.pm25));
      rawSheet.cell(`K${row}`).value(Number(r.vocs));
      rawSheet.cell(`L${row}`).value(Number(r.co));
      rawSheet.cell(`M${row}`).value(Number(r.formaldehyde));
      rawSheet.cell(`N${row}`).value(Number(r.no2));
      rawSheet.cell(`O${row}`).value(Number(r.o3));
      rawSheet.cell(`P${row}`).value(Number(r.pm1));
      rawSheet.cell(`Q${row}`).value(Number(r.pm4));
    });

    // 4) Formato datos en bruto (incluye horas y minutos)
    rawSheet.range(`E2:E${registros.length + 1}`).style('numberFormat', 'dd/mm/yyyy hh:mm');
    rawSheet.range(`F2:Q${registros.length + 1}`).style('numberFormat', '0.00');

    // 5) Hoja de datos diarios
    const dailySheet = workbook.sheet('Datos diarios');
    if (!dailySheet) throw new Error('Hoja "Datos diarios" no encontrada');
    // Limpiar datos previos a partir de la fila 17
    // const lastDailyRow = dailySheet.usedRange().endCell().rowNumber();
    // if (lastDailyRow > 16) dailySheet.range(`A17:AK${lastDailyRow}`).clear();

    // 6) Obtener y poblar registros diarios
    const registrosDiarios: RegistroDiario[] = await getRegistroDiario(dispositivo, fechainicio, fechafin);
    registrosDiarios.forEach((r, i) => {
      const row = i + 17;
      dailySheet.cell(`A${row}`).value(new Date(r.fecha));
      dailySheet.cell(`B${row}`).value(Number(r.avgTemperature));
      dailySheet.cell(`C${row}`).value(Number(r.maxTemperature));
      dailySheet.cell(`D${row}`).value(Number(r.minTemperature));
      dailySheet.cell(`E${row}`).value(Number(r.avgHumidity));
      dailySheet.cell(`F${row}`).value(Number(r.maxHumidity));
      dailySheet.cell(`G${row}`).value(Number(r.minHumidity));
      dailySheet.cell(`H${row}`).value(Number(r.avgCo2));
      dailySheet.cell(`I${row}`).value(Number(r.maxCo2));
      dailySheet.cell(`J${row}`).value(Number(r.minCo2));
      dailySheet.cell(`K${row}`).value(Number(r.avgPm10));
      dailySheet.cell(`L${row}`).value(Number(r.maxPm10));
      dailySheet.cell(`M${row}`).value(Number(r.minPm10));
      dailySheet.cell(`N${row}`).value(Number(r.avgPm25));
      dailySheet.cell(`O${row}`).value(Number(r.maxPm25));
      dailySheet.cell(`P${row}`).value(Number(r.minPm25));
      dailySheet.cell(`Q${row}`).value(Number(r.avgVocs));
      dailySheet.cell(`R${row}`).value(Number(r.maxVocs));
      dailySheet.cell(`S${row}`).value(Number(r.minVocs));
      dailySheet.cell(`T${row}`).value(Number(r.avgCo));
      dailySheet.cell(`U${row}`).value(Number(r.maxCo));
      dailySheet.cell(`V${row}`).value(Number(r.minCo));
      dailySheet.cell(`W${row}`).value(Number(r.avgFormaldehyde));
      dailySheet.cell(`X${row}`).value(Number(r.maxFormaldehyde));
      dailySheet.cell(`Y${row}`).value(Number(r.minFormaldehyde));
      dailySheet.cell(`Z${row}`).value(Number(r.avgNo2));
      dailySheet.cell(`AA${row}`).value(Number(r.maxNo2));
      dailySheet.cell(`AB${row}`).value(Number(r.minNo2));
      dailySheet.cell(`AC${row}`).value(Number(r.avgO3));
      dailySheet.cell(`AD${row}`).value(Number(r.maxO3));
      dailySheet.cell(`AE${row}`).value(Number(r.minO3));
      dailySheet.cell(`AF${row}`).value(Number(r.avgPm1));
      dailySheet.cell(`AG${row}`).value(Number(r.maxPm1));
      dailySheet.cell(`AH${row}`).value(Number(r.minPm1));
      dailySheet.cell(`AI${row}`).value(Number(r.avgPm4));
      dailySheet.cell(`AJ${row}`).value(Number(r.maxPm4));
      dailySheet.cell(`AK${row}`).value(Number(r.minPm4));
    });

    // 7) Formato datos diarios
    dailySheet.range(`A17:A${registrosDiarios.length + 16}`).style('numberFormat', 'dd/mm/yyyy');
    dailySheet.range(`B17:AK${registrosDiarios.length + 16}`).style('numberFormat', '0.00');

    // 8) Generar buffer y respuesta
    const buf = await workbook.outputAsync();
    const uint8 = new Uint8Array(buf as ArrayBuffer);

    // Obtener nombre de hospital (segundo registro si existe)
    const hospitalName = registros.length > 1 ? registros[1].hospital : registros.length > 0 ? registros[0].hospital : 'desconocido';
    const salaName = registros.length > 1 ? registros[1].n_sala : registros.length > 0 ? registros[0].n_sala : 'desconocido';

    let headers = {
      'Content-Disposition': `attachment; filename="informe_${hospitalName}_${salaName}_${fechainicio}_${fechafin}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    if(hospitalName === 'desconocido' && salaName === 'desconocido'){
      headers = {
        'Content-Disposition': `attachment; filename="No_hay_registros.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    return new NextResponse(uint8, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('Error generando informe:', error);
    return NextResponse.json({ error: 'Error al generar informe' }, { status: 500 });
  }
}
