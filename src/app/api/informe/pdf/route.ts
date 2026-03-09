import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import { getGraphicsData } from "@/actions/dispositivo/graphics"
import { getRegistroDiario, RegistroDiario } from '@/actions/dispositivo/informe/getRegistro';
import fs from "fs"
import path from "path"
import { getAlertaBySala } from "@/actions/alerta/getAlerta";
import JSZip from "jszip"
import { getParametrosAlerta, getUmbrales, ParametrosAlerta, UmbralAlerta } from "@/actions/alerta/getAlertaParametros";
import { getSession } from "@/actions/auth/getSession";
import annotationPlugin from "chartjs-plugin-annotation";
import { Chart } from "chart.js";
import { ScriptableContext } from "chart.js";

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const backgroundPlugin = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (chart: any) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};
Chart.register(annotationPlugin, backgroundPlugin);
type TimeRange = "1m"

type ParameterType =
  | "temperature"
  | "humidity"
  | "co2"
  | "formaldehyde"
  | "vocs"
  | "pm1"
  | "pm25"
  | "pm4"
  | "pm10"
  | "co"
  | "o3"
  | "no2"

interface Sala {
  id_sala: number
  n_sala: string
  id_dispositivo: number
  n_dispositivo: string
}

interface Hospital {
  id_hospital: number
  hospital: string
  logo: string
  salas: Sala[]
}

const parameters: ParameterType[] = [
  "temperature",
  "humidity",
  "co2",
  "formaldehyde",
  "vocs",
  "pm1",
  "pm25",
  "pm4",
  "pm10",
  "co",
  "o3",
  "no2",
]

const loadImagesFromFolder = () => {
    // Definimos la ruta a la subcarpeta 'informe'
    const informeDir = path.join(process.cwd(), "public", "informe");
    const imagesBase64: { [key: string]: string } = {};

    try {
        // 1. Leemos todos los nombres de archivos en la carpeta
        const files = fs.readdirSync(informeDir);

        files.forEach(file => {
            // 2. Filtramos solo archivos .webp (o .png si te queda alguno)
            if (file.endsWith('.webp') || file.endsWith('.png')) {
                const filePath = path.join(informeDir, file);
                
                // 3. Quitamos la extensión para usarla como clave (ej: "CO2")
                const fileName = path.parse(file).name; 
                
                // 4. Convertimos a Base64
                const base64Data = fs.readFileSync(filePath).toString("base64");
                
                // Guardamos en el objeto: imagesBase64["CO2"] = "..."
                imagesBase64[fileName] = `data:image/webp;base64,${base64Data}`;
            }
        });

        return imagesBase64;
    } catch (error) {
        console.error("No se pudo leer la carpeta de informes:", error);
        return {};
    }
};

const getStyle = (val: any, u: UmbralAlerta | undefined) => {
    // 1. Validamos que el umbral exista
    if (!u) return "";

    // 2. Forzamos la conversión a número para asegurar la comparación matemática
    const numericVal = parseFloat(val);
    const minG = parseFloat(u.min_good as any);
    const maxG = parseFloat(u.max_good as any);
    const minW = parseFloat(u.min_warning as any);
    const maxW = parseFloat(u.max_warning as any);

    // 3. Verificamos si la conversión falló (NaN)
    if (isNaN(numericVal)) return "";

    // LOG DE DEPURACIÓN (Revisa esto en tu consola)
    console.log(`Comparando: ${numericVal} contra Min:${minW} y Max:${maxW}`);

    // 4. Lógica de alerta
    // Si el valor se sale del rango [min, max], se pone en rojo
    if (numericVal >= minG && numericVal <= maxG) {
        return "";
    }
    if (numericVal >= minW && numericVal <= maxW) {
        return "style='color: #efd844ff; font-weight: bold;'";
    }

    return "style='color: #ef4444; font-weight: bold;'";
};

const getChartColors = (val: any, u?: UmbralAlerta) => {
  if (!u) {
    return { border: "#10b981", bg: "rgba(16,185,129,0.05)" };
  }

  const v = Number(val);

  if (Number.isNaN(v)) {
    return { border: "#10b981", bg: "rgba(16,185,129,0.05)" };
  }

  const minG = Number(u.min_good);
  const maxG = Number(u.max_good);
  const minW = Number(u.min_warning);
  const maxW = Number(u.max_warning);

  // GOOD
  if (v >= minG && v <= maxG) {
    return { border: "#10b981", bg: "rgba(16,185,129,0.05)" };
  }

  // WARNING
  if (v >= minW && v <= maxW) {
    return { border: "#efd844", bg: "rgba(239,216,68,0.05)" };
  }

  // ALERT
  return { border: "#ef4444", bg: "rgba(239,68,68,0.05)" };
};

const parametersToConvert: ParameterType[] = ["formaldehyde", "o3", "vocs", "co", "no2"]
const parametersToDivideBy1000: ParameterType[] = ["o3", "no2"]
const parametersToDivideBy1000Graphics: ParameterType[] = ["formaldehyde", "o3", "no2", "vocs"]

const width = 1000
const height = 400

function maybeConvert(parameter: ParameterType, value: number) {
  if (!parametersToDivideBy1000.includes(parameter)) return value
  return value/1000
}

function maybeConvertGraphics(parameter: ParameterType, value: number) {
  if (!parametersToDivideBy1000Graphics.includes(parameter)) return value
  return value/1000
}

const getParameterLabel = (parameter: ParameterType): string => {
  const labels: Record<ParameterType, string> = {
    temperature: "Temperatura",
    humidity: "Humedad",
    co2: "CO₂",
    formaldehyde: "Formaldehído",
    vocs: "TVOC",
    pm1: "PM1.0",
    pm25: "PM2.5",
    pm4: "PM4.0",
    pm10: "PM10",
    co: "CO",
    o3: "O₃",
    no2: "NO₂",
  }
  return labels[parameter]
}

type BandColor = "green" | "yellow" | "red"

type ChartPoint = {
  x: string
  y: number
}

function getBandFromThresholds(
  value: number,
  u?: UmbralAlerta
): BandColor {
  if (!u) return "green"

  const minG = Number(u.min_good)
  const maxG = Number(u.max_good)
  const minW = Number(u.min_warning)
  const maxW = Number(u.max_warning)

  if (value >= minG && value <= maxG) return "green"
  if (value >= minW && value <= maxW) return "yellow"
  return "red"
}

function getStrokeFromBand(band: BandColor) {
  if (band === "green") return "#10b981"
  if (band === "yellow") return "#eab308"
  return "#ef4444"
}

function getCrossedThresholds(v1: number, v2: number, u?: UmbralAlerta): number[] {
  if (!u) return []

  const candidates = [
    Number(u.min_warning),
    Number(u.min_good),
    Number(u.max_good),
    Number(u.max_warning),
  ].filter((v, i, arr) => !Number.isNaN(v) && arr.indexOf(v) === i)

  const min = Math.min(v1, v2)
  const max = Math.max(v1, v2)

  return candidates
    .filter((t) => t > min && t < max)
    .sort((a, b) => (v2 >= v1 ? a - b : b - a))
}

function interpolateCrossing(
  p1: ChartPoint,
  p2: ChartPoint,
  targetY: number
): ChartPoint {
  const t1 = new Date(p1.x).getTime()
  const t2 = new Date(p2.x).getTime()

  if (p1.y === p2.y) {
    return { x: p1.x, y: targetY }
  }

  const ratio = (targetY - p1.y) / (p2.y - p1.y)
  const interpolatedTime = new Date(t1 + (t2 - t1) * ratio).toISOString()

  return {
    x: interpolatedTime,
    y: targetY,
  }
}

function buildContinuousSegmentedPoints(
  rawPoints: ChartPoint[],
  u?: UmbralAlerta
): ChartPoint[] {
  if (!u || rawPoints.length < 2) return rawPoints

  const result: ChartPoint[] = []

  for (let i = 0; i < rawPoints.length - 1; i++) {
    const start = rawPoints[i]
    const end = rawPoints[i + 1]

    if (i === 0) result.push(start)

    const crossed = getCrossedThresholds(start.y, end.y, u)

    for (const threshold of crossed) {
      result.push(interpolateCrossing(start, end, threshold))
    }

    result.push(end)
  }

  return result.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())
}

function getDynamicYScale(
  values: number[],
  umbral?: UmbralAlerta
) {
  const cleanValues = values.filter((v) => typeof v === "number" && !Number.isNaN(v))

  if (!cleanValues.length) {
    return {
      min: 0,
      max: 1,
      stepSize: 0.2,
    }
  }

  const dataMin = Math.min(...cleanValues)
  const dataMax = Math.max(...cleanValues)
  const dataRange = Math.max(dataMax - dataMin, 0.0001)

  // Padding basado en los datos reales
  const padding = Math.max(dataRange * 0.15, dataMax * 0.03)

  let min = dataMin - padding
  let max = dataMax + padding

  // Solo ampliamos por umbrales si están relativamente cerca del rango real
  if (umbral) {
    const thresholdValues = [
      Number(umbral.min_warning),
      Number(umbral.min_good),
      Number(umbral.max_good),
      Number(umbral.max_warning),
    ].filter((v) => !Number.isNaN(v))

    const proximityLimit = dataRange * 3

    for (const t of thresholdValues) {
      if (Math.abs(t - dataMin) <= proximityLimit || Math.abs(t - dataMax) <= proximityLimit) {
        min = Math.min(min, t)
        max = Math.max(max, t)
      }
    }
  }

  if (min === max) {
    min -= 1
    max += 1
  }

  const finalRange = max - min
  let stepSize = finalRange / 5

  if (stepSize >= 10) {
    stepSize = Math.ceil(stepSize)
  } else if (stepSize >= 1) {
    stepSize = Number(stepSize.toFixed(1))
  } else {
    stepSize = Number(stepSize.toFixed(2))
  }

  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    stepSize,
  }
}
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json()

    const {
      selectedSalas,
      timeRange = "1m",
      customStartDate,
      customEndDate,
    } = body as {
      selectedSalas: Hospital[]
      timeRange?: TimeRange
      customStartDate?: string
      customEndDate?: string
    }

    if (!selectedSalas || selectedSalas.length === 0) {
      return NextResponse.json({ error: "No hay salas seleccionadas" }, { status: 400 })
    }

    const totalRooms = selectedSalas.reduce((acc, h) => acc + h.salas.length, 0)
    const isZip = totalRooms > 1
    const zip = isZip ? new JSZip() : null

    const chart = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "white",
    })

    const publicDir = path.join(process.cwd(), "public")
    const logoRightPath = path.join(publicDir, "logo.jpg")
    const devicePath = path.join(publicDir, "dispositivo.png")
    const indicadoresPath = path.join(publicDir, "indicadores.png")
    const parametrosPath = path.join(publicDir, "parametros.png")
    const logoWebPath = path.join(publicDir, "web.png")
    const imagenesInforme = loadImagesFromFolder();

    let logoRightBase64 = ""
    let deviceBase64 = ""
    let indicadoresBase64 = ""
    let parametrosBase64 = ""
    let logoWebBase64 = ""
    try {
      logoRightBase64 = fs.readFileSync(logoRightPath).toString("base64")
      deviceBase64 = fs.readFileSync(devicePath).toString("base64")
      indicadoresBase64 = fs.readFileSync(indicadoresPath).toString("base64")
      parametrosBase64 = fs.readFileSync(parametrosPath).toString("base64")
      logoWebBase64 = fs.readFileSync(logoWebPath).toString("base64")
    } catch (e) {
      console.error("Error reading logos:", e)
    }

    const formatVal = (val: number | string, decimals: number = 2, avoidRounding: boolean = false) => {
      if (val === null || val === undefined) return "-";
      const numericVal = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(numericVal as number)) return val;
      if (avoidRounding) return numericVal.toString().replace('.', ',');
      return (numericVal as number).toFixed(decimals).replace('.', ',');
    };

    const commonStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #111827; background-color: #ffffff; }
    .cover-page { width: 100%; height: calc(100vh - 40px); display: flex; flex-direction: column; justify-content: space-between; padding: 40px 40px; box-sizing: border-box; background-color: #ffffff; }
    .cover-title { text-align: center; margin-top: 0; padding: 20px 0; border-top: 4px solid #009ee2; border-bottom: 4px solid #009ee2; }
    .cover-title h1 { font-size: 32px; font-weight: 800; margin-bottom: 15px; color: #009ee2; letter-spacing: -0.025em; }
    .cover-title h2 { font-size: 24px; font-weight: 600; margin: 0; color: #009ee2; }
    .cover-info { width: 60%; margin: 40px auto; margin-top: 120px; padding: 40px 30px; background-color: #f0faff; border-radius: 12px; border-left: 6px solid #009ee2; font-size: 15px; line-height: 2.5; color: #009ee2; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .cover-info div { display: flex; justify-content: flex-start; margin-bottom: 10px; }
    .cover-info strong { width: 120px; color: #009ee2; flex-shrink: 0; }

    .cover-device {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-top: auto;
    }

    .cover-device-main {
      width: 34%;
      max-width: 250px;
      height: auto;
      object-fit: contain;
      flex-shrink: 0;
    }

    .cover-device-indicators {
      width: 58%;
      max-width: 460px;
      height: auto;
      object-fit: contain;
      flex-shrink: 0;
    }

    .sala-title { font-size: 24px; font-weight: 700; color: #009ee2; border-bottom: 2px solid #009ee2; padding-bottom: 12px; margin: 40px 0 25px 0; }
    .param-section { margin-bottom: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px 18px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
    .param-subtitle { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 10px; display: flex; align-items: center; }
    .param-subtitle::before { content: ''; display: inline-block; width: 4px; height: 18px; background-color: #009ee2; margin-right: 12px; border-radius: 2px; }
    .chart-container { width: 100%; background: #fff; }
    .chart-container img { width: 100%; height: auto; }
    .page-break { page-break-after: always; }
    .daily-table { width: 100%; border-collapse: collapse; margin: 20px auto; font-size: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .daily-table th { background-color: #f9fafb; color: #374151; font-weight: 700; text-align: center; padding: 12px; border-bottom: 2px solid #e5e7eb; -webkit-print-color-adjust: exact; }
    .daily-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563; text-align: center; }
    .daily-table tr:last-child td { border-bottom: none; }
    .daily-table tr:nth-child(even) { background-color: #fcfcfc; -webkit-print-color-adjust: exact; }
    .intro-page { padding: 20px 40px; background-color: #ffffff; box-sizing: border-box; }
    .intro-content { font-size: 16px; line-height: 1.8; color: #4b5563; }
    .intro-content p { margin-bottom: 20px; }

    .intro-parameters-image-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 24px 0 10px;
    }

    .intro-parameters-image {
      width: 100%;
      max-width: 680px;
      max-height: 360px;
      object-fit: contain;
      display: block;
    }

    .contact-box { margin-top: 40px; background-color: #f0faff; border-left: 4px solid #009ee2; padding: 20px; border-radius: 8px; }
    .contact-box p { margin-bottom: 8px; }
    .contact-box p:last-child { margin-bottom: 0; }
    .parameters-page { background-color: #ffffff; margin: 0; padding: 0; }
    .parameters-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%; page-break-inside: auto; }
    .param-card { border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; background-color: #ffffff; page-break-inside: avoid; break-inside: avoid-column; height: 240px; overflow: hidden; }
    .param-card-header { display: flex; align-items: center; justify-content: center; padding: 12px 8px; background-color: #f0faff; border-bottom: 1px solid #009ee2; color: #009ee2; font-size: 13px; font-weight: 700; min-height: 45px; -webkit-print-color-adjust: exact; }
    .param-card-header img.param-icon { width: 40px; height: 40px; margin-right: 8px; object-fit: contain; vertical-align: middle; display: inline-block; }
    .param-card-box { padding: 12px; font-size: 10.5px; line-height: 1.5; color: #4b5563; flex-grow: 1; text-align: left; }
    .param-card-title { background-color: #f9fafb; padding: 8px; font-weight: bold; text-align: center; font-size: 11px; border-top: 1px solid #e5e7eb; color: #1f2937; -webkit-print-color-adjust: exact; }
    .param-title { font-size: 22px; font-weight: 800; color: #009ee2; background: linear-gradient(90deg, #f0faff 0%, #ffffff 100%); padding: 12px 20px; border-left: 6px solid #009ee2; margin: 30px 0 15px 0; letter-spacing: 0.05em; -webkit-print-color-adjust: exact; }
    .epa-quote-container { text-align: center; margin: 20px 0; padding: 10px; }
    .epa-quote-text { color: #009ee2; font-size: 24px; font-weight: 800; margin-bottom: 5px; font-style: normal; }
    .epa-source { background-color: #a1a1a1; color: white; font-size: 12px; padding: 2px 10px; display: inline-block; border-radius: 2px; margin-bottom: 15px; text-transform: uppercase; -webkit-print-color-adjust: exact; }
    .intro-subtitle { color: #6b7280; font-size: 16px; text-align: center; }
  </style>
`

    const browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    })

    let singlePdfBuffer: Buffer | null = null

    for (const hospital of selectedSalas) {
      for (const sala of hospital.salas) {
        let finalStartDate = customStartDate;
        let finalEndDate = customEndDate;

        if (!finalStartDate || !finalEndDate) {
          const ahora = new Date();
          finalEndDate = ahora.toISOString().split('T')[0];
          const fechaInicio = new Date();
          fechaInicio.setMonth(ahora.getMonth() - 1);
          finalStartDate = fechaInicio.toISOString().split('T')[0];
        }

        const queryStartDate = `${finalStartDate} 00:00:00`;
        const queryEndDate = `${finalEndDate} 23:59:59`;

        let registroDiario: RegistroDiario[] = [];
        let umbrales: UmbralAlerta[] = [];
        let alertas: any[] = [];
        let logoHospitalBase64 = "";
        try {
          registroDiario = await getRegistroDiario(sala.id_dispositivo, queryStartDate, queryEndDate)
          umbrales = await getUmbrales(sala.id_dispositivo);
          alertas = await getAlertaBySala(sala.id_sala, queryStartDate, queryEndDate)
          if (hospital.logo) {
            const logoHospitalPath = path.join(publicDir, hospital.logo)
            logoHospitalBase64 = fs.readFileSync(logoHospitalPath).toString("base64")
          }
        } catch (e) {
          console.error(`Error fetching daily records or logo for room ${sala.id_sala}:`, e);
        }

        let htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            ${commonStyles}
          </head>
          <body>
            <div class="cover-page">
              <div class="cover-title">
                <h1>INFORME MENSUAL EQUIPOS DE MONITORIZACIÓN</h1>
                <h2>LODEPA</h2>
              </div>
              <div class="cover-info">
                <div><strong>HOSPITAL:</strong> ${hospital.hospital}</div>
                <div><strong>UBICACIÓN:</strong> ${sala.n_sala}</div>
                <div><strong>PERÍODO:</strong> ${finalStartDate} – ${finalEndDate}</div>
              </div>
              <div class="cover-device">
                <img class="cover-device-main" src="data:image/png;base64,${deviceBase64}" />
                <img class="cover-device-indicators" src="data:image/png;base64,${indicadoresBase64}" />
              </div>
            </div>
            <div class="page-break"></div>

            <div class="intro-page">
              <div class="intro-content">
                <p>El presente informe se ha generado automáticamente para que disponga de toda la información de su dispositivo de medición <strong>LODEPA Inbiot</strong>.</p>
                <p>Todos los meses, las personas dadas de alta recibirán el presente informe actualizado.</p>
                <p>Le presentamos la gráfica de cada uno de los parámetros analizados. Si desea el histórico completo de datos (una tabla Excel con todos los datos recogidos por su medidor con frecuencia de 10 minutos), puede extraerlo mediante la pestaña <strong>informes</strong> en la plataforma Web.</p>
                <div class="intro-parameters-image-wrapper">
                  <img class="intro-parameters-image" src="data:image/png;base64,${parametrosBase64}" />
                </div>
                <div class="contact-box">
                  <p>Por favor, revise exhaustivamente la información ofrecida. Si tiene cualquier cuestión al respecto, puede ponerse en contacto con nosotros:</p>
                  <p><strong>Email:</strong> calidad@lodepa.com</p>
                  <p><strong>Teléfono:</strong> 617 98 63 08</p>
                </div>
              </div>
            </div>
            <div class="page-break"></div>

            <div class="parameters-page">
              <div class="epa-quote-container">
                <div class="epa-quote-text">“El aire interior está de 2 a 5 veces más contaminado que el aire exterior”</div>
                <div class="epa-source">EPA - Agencia de Protección del Medioambiente</div>
                <div class="intro-subtitle">Te ayudamos a conocer todos los elementos clave:</div>
              </div>
              <div class="parameters-container">
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["temperature"]}" alt="Temperatura" class="param-icon"/> Temperatura</div>
                  <div class="param-card-box">Es el parámetro más habitual para determinar el confort de una estancia e influye también en la capacidad de supervivencia de virus en el ambiente.</div>
                  <div class="param-card-title">Temperatura</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["humidity"]}" alt="Humedad" class="param-icon"/> Humedad</div>
                  <div class="param-card-box">Valores fuera del rango óptimo debilitan las mucosas respiratorias, aumentando el riesgo de contraer enfermedades respiratorias.</div>
                  <div class="param-card-title">Humedad</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["co2"]}" alt="CO₂" class="param-icon"/> CO₂</div>
                  <div class="param-card-box">Indica la eficacia de la ventilación. En niveles elevados provoca malestar, somnolencia y disminución de la productividad.</div>
                  <div class="param-card-title">CO₂</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["vocs"]}" alt="TVOC" class="param-icon"/> TVOC</div>
                  <div class="param-card-box">Compuestos orgánicos volátiles, derivados de productos de construcción, limpieza o cosméticos de uso cotidiano con posibles efectos adversos para la salud a corto y largo plazo.</div>
                  <div class="param-card-title">TVOC</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["pm25"]}" alt="PM2.5" class="param-icon"/> PM2.5</div>
                  <div class="param-card-box">Partículas en suspensión de diámetro inferior a 2.5µm que pueden inhalarse y alcanzar las vías respiratorias inferiores, pudiendo derivar en afecciones respiratorias.</div>
                  <div class="param-card-title">PM2.5</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["pm10"]}" alt="PM10" class="param-icon"/> PM10</div>
                  <div class="param-card-box">Partículas en suspensión de diámetro inferior a 10µm que pueden inhalarse y alcanzar las vías respiratorias superiores, pudiendo derivar en afecciones respiratorias.</div>
                  <div class="param-card-title">PM10</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["pm4"]}" alt="PM4" class="param-icon"/> PM4</div>
                  <div class="param-card-box">Partículas en suspensión de diámetro inferior a 4µm que pueden inhalarse y derivar en problemas respiratorios como el asma o afecciones alérgicas.</div>
                  <div class="param-card-title">PM4</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["pm1"]}" alt="PM1" class="param-icon"/> PM1</div>
                  <div class="param-card-box">Partículas en suspensión de diámetro inferior a 1µm que pueden atravesar la barrera alvéolo-capilar al inhalarlas, pudiendo derivar en afecciones en la salud.</div>
                  <div class="param-card-title">PM1</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["formaldehyde"]}" alt="Formaldehído" class="param-icon"/> Formaldehído</div>
                  <div class="param-card-box">Gas tóxico muy volátil y común en espacios interiores, desde 2016 catalogado como cancerígeno 1B por la UE.</div>
                  <div class="param-card-title">Formaldehído</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["o3"]}" alt="O₃" class="param-icon"/> O₃</div>
                  <div class="param-card-box">Gas altamente reactivo y corrosivo utilizado como desinfectante, biocida o como subproducto de equipos de ofimática o desinfección.</div>
                  <div class="param-card-title">Ozono</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["no2"]}" alt="NO₂" class="param-icon"/> NO₂</div>
                  <div class="param-card-box">Gas tóxico, altamente reactivo y corrosivo, considerado uno de los seis contaminantes listados más críticos en cuanto a afecciones en la calidad del aire interior.</div>
                  <div class="param-card-title">Dióxido de Nitrógeno</div>
                </div>
                <div class="param-card">
                  <div class="param-card-header"><img src="${imagenesInforme["co"]}" alt="CO" class="param-icon"/> CO</div>
                  <div class="param-card-box">Gas inodoro e incoloro que provoca una disminución de la capacidad de transporte de oxígeno de la sangre.</div>
                  <div class="param-card-title">Monóxido de Carbono</div>
                </div>
              </div>
            </div>
            <div class="page-break"></div>

            <div class="param-title">Notificaciones de Alerta</div>
            <div style="margin-bottom: 25px; color: #4b5563; font-size: 14px; line-height: 1.6;">
              <p>Este apartado detalla las incidencias registradas cuando los niveles de los parámetros monitorizados han excedido los rangos de seguridad configurados.</p>
            </div>
        `

        if (alertas.length > 0) {
          htmlContent += `
            <div class="param-section">
              <div class="param-subtitle">Ultimas ${alertas.length} alertas en el periodo</div>
              <table class="daily-table">
                <thead><tr><th>Fecha</th><th>Parámetro</th><th>Alerta</th><th>Valor</th></tr></thead>
                <tbody>
          `
          for (const alerta of alertas) {
            const date = new Date(alerta.fecha);
            const formattedDate = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            const paramLabel = getParameterLabel(alerta.campo as ParameterType);
            htmlContent += `
              <tr>
                <td>${formattedDate}</td>
                <td style="font-weight: 600;">${paramLabel}</td>
                <td>${alerta.alerta}</td>
                <td style="color: #ef4444; font-weight: 600;">${formatVal((alerta.campo as ParameterType, alerta.valor), 2, parametersToConvert.includes(alerta.campo as ParameterType))}</td>
              </tr>
            `
          }
          htmlContent += `</tbody></table></div>`
        } else {
          htmlContent += `
            <div class="param-section" style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 48px; color: #10b981; margin-bottom: 20px;"><i class="fas fa-check-circle"></i></div>
              <div style="font-size: 18px; font-weight: 700; color: #374151; margin-bottom: 10px;">No se han detectado alertas</div>
              <div style="font-size: 14px; color: #6b7280; line-height: 1.5;">Durante el periodo analizado, todos los parámetros se han mantenido dentro de los rangos de normalidad.</div>
            </div>
          `
        }
        htmlContent += `<div class="page-break"></div>`

        for (const parameter of parameters) {
          let data;
          try {
            data = await getGraphicsData(String(sala.id_dispositivo), parameter, timeRange as any, queryStartDate, queryEndDate)
          } catch (e) {
            console.warn(`No data for parameter ${parameter} in room ${sala.id_sala}:`, e);
            continue;
          }
          
          if (!data?.data?.length) continue

          const rawPoints: ChartPoint[] = data.data.map((p: any) => ({
            x: p.timestamp,
            y: maybeConvertGraphics(parameter, p.value),
          }))
          const unit = parametersToConvert.includes(parameter) ? "ppm" : data.unit
          const paramLabel = getParameterLabel(parameter)
          const globalMax = data.max !== undefined ? maybeConvertGraphics(parameter, data.max) : "-";
          const globalMin = data.min !== undefined ? maybeConvertGraphics(parameter, data.min) : "-";
          const globalAvg = data.med !== undefined ? maybeConvertGraphics(parameter, data.med) : "-";
          const isPollutant = parametersToConvert.includes(parameter);

          const umbral = umbrales.find(u => u.parametro === parameter);
          const chartPoints = buildContinuousSegmentedPoints(rawPoints, umbral)
          const values = chartPoints.map((p) => p.y)
          const yScale = getDynamicYScale(values, umbral)

          let chartColors = { border: "#10b981", bg: "rgba(16,185,129,0.05)" };

          if (globalAvg !== "-") {
            chartColors = getChartColors(Number(globalAvg), umbral);
          }
          const labels = chartPoints.map((p) => {
  const d = new Date(p.x)
  return `${d.getDate()}/${d.getMonth() + 1}`
})

          const maxValue = yScale.max

const config = {
  type: "line",

  data: {
    labels,
    datasets: [
  {
  label: `${paramLabel} (${unit})`,
  data: values,
  borderColor: "#10b981",
  backgroundColor: "rgba(16,185,129,0.04)",
  spanGaps: true,
  tension: 0,
  pointRadius: 0,
  pointHoverRadius: 0,
  borderWidth: 2,
  fill: false,
  segment: {
    borderColor: (ctx: ScriptableContext<"line">) => {
      const segment = ctx as any
      const y0 = Number(segment?.p0?.parsed?.y)
      const y1 = Number(segment?.p1?.parsed?.y)

      if (Number.isNaN(y0) || Number.isNaN(y1)) return "#10b981"

      const midValue = (y0 + y1) / 2
      return getStrokeFromBand(getBandFromThresholds(midValue, umbral))
    }
  }
}
]
  },

  options: {
    responsive: false,
    animation: false,

    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end"
      },

      annotation: {
        annotations: {
          goodZone: {
            type: "box",
            yScaleID: "y",
            yMin: umbral?.min_good,
            yMax: umbral?.max_good,
            backgroundColor: "rgba(16,185,129,0.08)",
            borderWidth: 0
          },

          warningZone: {
            type: "box",
            yScaleID: "y",
            yMin: umbral?.max_good,
            yMax: umbral?.max_warning,
            backgroundColor: "rgba(250,204,21,0.08)",
            borderWidth: 0
          },

          alertZone: {
            type: "box",
            yScaleID: "y",
            yMin: umbral?.max_warning,
            yMax: maxValue,
            backgroundColor: "rgba(239,68,68,0.08)",
            borderWidth: 0
          },

          warningLine: {
            type: "line",
            yMin: umbral?.max_good,
            yMax: umbral?.max_good,
            borderColor: "#facc15",
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: "Warning",
              position: "end"
            }
          },

          alertLine: {
            type: "line",
            yMin: umbral?.max_warning,
            yMax: umbral?.max_warning,
            borderColor: "#ef4444",
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: "Alert",
              position: "end"
            }
          }
                  }
                }
              },

              scales: {
                x: {
                  grid: {
                    display: false,
                    drawOnChartArea: false,
                    drawTicks: false
                  },

                  border: {
                    display: false
                  },
                },

               y: {
  min: yScale.min,
  max: yScale.max,

  grid: {
    display: false,
    drawOnChartArea: false,
    drawTicks: false
  },

  border: {
    display: false
  },

  ticks: {
    stepSize: yScale.stepSize,
    callback: (v: any) => Number(v).toFixed(2),
    font: { size: 10 }
  }
}
              },

              layout: {
                padding: 10
              }
            }
          };
          const pngBuffer = await chart.renderToBuffer(config as any)
          const base64Image = pngBuffer.toString("base64")
          const fieldPrefix = parameter.charAt(0).toUpperCase() + parameter.slice(1);
          const avgField = `avg${fieldPrefix}` as keyof RegistroDiario;
          const maxField = `max${fieldPrefix}` as keyof RegistroDiario;
          const minField = `min${fieldPrefix}` as keyof RegistroDiario;

          let tableHtml = `
            <div class="param-subtitle">Datos diarios de ${paramLabel} (${unit})</div>
            <table class="daily-table">
              <thead><tr><th>Fecha</th><th>Mínimo</th><th>Máximo</th><th>Promedio</th></tr></thead>
              <tbody>
          `;

          console.log("Umbral:", umbral);
          for (const reg of registroDiario) {
            const date = new Date(reg.fecha as string);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            // Valores numéricos crudos para la comparación (antes de formatear a string)
            const rawMin = reg[minField] !== undefined ? maybeConvert(parameter, reg[minField] as number) : undefined;
            const rawMax = reg[maxField] !== undefined ? maybeConvert(parameter, reg[maxField] as number) : undefined;
            const rawAvg = reg[avgField] !== undefined ? maybeConvert(parameter, reg[avgField] as number) : undefined;

            // Valores formateados para mostrar
            const minVal = formatVal(rawMin ?? "-", 1, isPollutant);
            const maxVal = formatVal(rawMax ?? "-", 1, isPollutant);
            const avgVal = formatVal(rawAvg ?? "-", isPollutant ? 3 : 2, false);

            // Aplicar el estilo si cruza los umbrales
            const minStyle = getStyle(rawMin, umbral);
            const maxStyle = getStyle(rawMax, umbral);
            const avgStyle = getStyle(rawAvg, umbral);

            tableHtml += `
                <tr>
                    <td>${formattedDate}</td>
                    <td ${minStyle}>${minVal} ${unit}</td>
                    <td ${maxStyle}>${maxVal} ${unit}</td>
                    <td ${avgStyle}>${avgVal} ${unit}</td>
                </tr>`;
          }
          tableHtml += `</tbody></table>`;

          htmlContent += `
            <div class="param-title">${paramLabel} (${unit})</div>
            <div class="param-section">
              <div class="param-subtitle">Gráfica de ${paramLabel} (${unit})</div>
              <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div style="background-color: #e0f4ff; color: #009ee2; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">mín. ${formatVal(globalMin, 1, isPollutant)} ${unit}</div>
                <div style="background-color: #eff6ff; color: #009ee2; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">máx. ${formatVal(globalMax, 1, isPollutant)} ${unit}</div>
                <div style="background-color: #eff6ff; color: #009ee2; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">med. ${formatVal(globalAvg, isPollutant ? 3 : 2, false)} ${unit}</div>
              </div>
              <div class="chart-container"><img src="data:image/png;base64,${base64Image}" /></div>
            </div>
            <div class="param-section">${tableHtml}</div>
            <div class="page-break"></div>
          `
        }

        htmlContent += `
          <div style="page-break-before: always; height: 95vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; position: relative;">
            <div style="text-align: center; margin-top: -50px;">
              <h2 style="color: #0076b6; font-style: italic; font-size: 28px; margin-bottom: 40px;">Gracias por confiar en</h2>
              <img src="data:image/png;base64,${logoRightBase64}" style="width: 400px; margin-bottom: 40px;" />
              <div style="margin-top: 20px;">
                <a href="mailto:calidad@lodepa.com" style="color: #6fbcd5; font-size: 22px; font-weight: bold; text-decoration: underline; display: block; margin-bottom: 10px;">calidad@lodepa.com</a>
                <div style="color: #004a99; font-size: 24px; font-weight: bold;">617 98 63 08</div>
              </div>
            </div>
            <div style="margin-top: 60px; width: 85%;">
              <img src="data:image/png;base64,${logoWebBase64}" style="width: 100%; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
            </div>
          </div>
          </body></html>
        `
        let headerTemplate = `
            <div style="width:100%; padding:10px 40px; font-family:Segoe UI; font-size:11px; display:flex; justify-content:space-between; align-items:center; border-bottom: 0.5px solid #e5e7eb;">
              <img src="data:image/jpeg;base64,${logoRightBase64}" style="height:35px;" />
              <div style="flex:1; text-align:center; font-weight:700; color:#009ee2; margin: 0 20px; text-transform: uppercase; letter-spacing: 0.5px;">INFORME MENSUAL EQUIPOS DE MONITORIZACIÓN LODEPA</div>
              <img src="data:image/png;base64,${logoHospitalBase64}" style="height:35px;" />
            </div>
          `
        if(logoHospitalBase64 ==""){
          headerTemplate = `
            <div style="width:100%; padding:10px 40px; font-family:Segoe UI; font-size:11px; display:flex; justify-content:space-between; align-items:center; border-bottom: 0.5px solid #e5e7eb;">
              <img src="data:image/jpeg;base64,${logoRightBase64}" style="height:35px;" />
              <div style="flex:1; text-align:center; font-weight:700; color:#009ee2; margin: 0 20px; text-transform: uppercase; letter-spacing: 0.5px;">INFORME MENSUAL EQUIPOS DE MONITORIZACIÓN LODEPA</div>
            </div>
          `
        }
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          displayHeaderFooter: true,
          margin: { top: "90px", bottom: "60px", left: "20mm", right: "20mm" },
          headerTemplate: headerTemplate,
          footerTemplate: `
            <div style="width:100%; padding: 0 40px; display: flex; justify-content: space-between; font-family:Segoe UI; font-size:9px; color:#6b7280; border-top: 0.5px solid #e5e7eb; padding-top: 10px;">
              <div>Lodepa · Informe Automatizado</div>
              <div><span class="date"></span></div>
              <div>Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
            </div>
          `,
        })

        if (isZip && zip) {
          const folderName = selectedSalas.length > 1 ? hospital.hospital : ""
          const fileName = `${sala.n_sala.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`
          if (folderName) {
            zip.folder(folderName)?.file(fileName, Buffer.from(pdfBuffer))
          } else {
            zip.file(fileName, Buffer.from(pdfBuffer))
          }
        } else {
          singlePdfBuffer = Buffer.from(pdfBuffer)
        }
        await page.close()
      }
    }

    await browser.close()

    if (isZip && zip) {
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
      return new NextResponse(zipBuffer as any, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename=informes-lodepa.zip`,
        },
      })
    } else if (singlePdfBuffer) {
      return new NextResponse(singlePdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=informe-lodepa.pdf`,
        },
      })
    }

    return NextResponse.json({ error: "No se pudo generar el informe" }, { status: 500 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 })
  }
}
