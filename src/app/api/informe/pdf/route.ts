import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import { getGraphicsData } from "@/actions/dispositivo/graphics"
import { getRegistroDiario, RegistroDiario } from '@/actions/dispositivo/informe/getRegistro';
import fs from "fs"
import path from "path"
import { getAlertaBySala } from "@/actions/alerta/getAlerta";

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
  // | "iaq"
  // | "thermal_indicator"
  // | "ventilation_indicator"
  // | "covid19"

interface Sala {
  id_sala: number
  n_sala: string
  id_dispositivo: number
  n_dispositivo: string
}

interface Hospital {
  id_hospital: number
  hospital: string
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
  // "iaq",
  // "thermal_indicator",
  // "ventilation_indicator",
  // "covid19",
]

const parametersToConvert: ParameterType[] = ["formaldehyde", "o3", "vocs", "co"]

const width = 1000
const height = 400

function maybeConvert(parameter: ParameterType, value: number) {
  if (!parametersToConvert.includes(parameter)) return value
  // return Number((value / 1000).toFixed(3))
  return value
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
    // iaq: "IAQ",
    // thermal_indicator: "Ind. Térmico",
    // ventilation_indicator: "Ind. Ventilación",
    // covid19: "COVID-19",
  }
  return labels[parameter]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      selectedSalas,
      timeRange = "1m", // Forzado a 1m según petición si no viene
      customStartDate,
      customEndDate,
    } = body as {
      selectedSalas: Hospital[]
      timeRange?: TimeRange
      customStartDate?: string
      customEndDate?: string
    }

    console.log("Fechas: " + customStartDate, customEndDate)

    if (!selectedSalas || selectedSalas.length === 0) {
      return NextResponse.json({ error: "No hay salas seleccionadas" }, { status: 400 })
    }

    const chart = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "white",
    })

    const publicDir = path.join(process.cwd(), "public")
    const logoLeftPath = path.join(publicDir, "quironsalud.png")
    const logoRightPath = path.join(publicDir, "logo.jpg")
    const devicePath = path.join(publicDir, "dispositivo.png")
    const indicadoresPath = path.join(publicDir, "indicadores.png")
    const parametrosPath = path.join(publicDir, "parametros.png")
    const logoWebPath = path.join(publicDir, "web.png")

    let logoLeftBase64 = ""
    let logoRightBase64 = ""
    let deviceBase64 = ""
    let indicadoresBase64 = ""
    let parametrosBase64 = ""
    let logoWebBase64 = ""
    try {
      logoLeftBase64 = fs.readFileSync(logoLeftPath).toString("base64")
      logoRightBase64 = fs.readFileSync(logoRightPath).toString("base64")
      deviceBase64 = fs.readFileSync(devicePath).toString("base64")
      indicadoresBase64 = fs.readFileSync(indicadoresPath).toString("base64")
      parametrosBase64 = fs.readFileSync(parametrosPath).toString("base64")
      logoWebBase64 = fs.readFileSync(logoWebPath).toString("base64")
    } catch (e) {
      console.error("Error reading logos:", e)
    }

    /**
     * Helper to format values consistently in the PDF.
     * @param val Value to format
     * @param decimals Number of decimals to show if not avoiding rounding
     * @param avoidRounding If true, preserves all decimals and avoids fixed rounding
     */
    const formatVal = (val: number | string, decimals: number = 2, avoidRounding: boolean = false) => {
      if (val === null || val === undefined) return "-";
      const numericVal = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(numericVal as number)) return val;
      if (avoidRounding) return numericVal.toString().replace('.', ',');
      return (numericVal as number).toFixed(decimals).replace('.', ',');
    };

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          color: #111827;
          background-color: #ffffff;
        }

        .cover-page {
          width: 100%;
          height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 40px;
          box-sizing: border-box;
          background-color: #ffffff;
        }

        .cover-title {
          text-align: center;
          margin-top: 0;
          padding: 20px 0;
          border-top: 4px solid #009ee2;
          border-bottom: 4px solid #009ee2;
        }

        .cover-title h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 15px;
          color: #009ee2;
          letter-spacing: -0.025em;
        }

        .cover-title h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #009ee2;
        }

        .cover-info {
        /* Hacemos el div más estrecho (ajusta el % según necesites) */
        width: 60%; 
        
        /* Centrado horizontal: 'auto' en los lados */
        margin: 40px auto; 

        margin-top: 120px;
        
        /* Aumentamos padding vertical para darle más altura */
        padding: 40px 30px; 
        
        background-color: #f0faff;
        border-radius: 12px;
        border-left: 6px solid #009ee2;
        font-size: 15px;
        
        /* Aumentamos el interlineado para que sea visualmente más alto */
        line-height: 2.5; 
        color: #009ee2;
        
        /* Sombra suave para que resalte en el PDF */
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      }

      .cover-info div {
        display: flex;
        justify-content: flex-start;
        /* Opcional: añade espacio entre las líneas si no quieres usar line-height */
        margin-bottom: 10px; 
      }

      .cover-info strong {
        /* Reducimos un poco el ancho de la etiqueta para que quepa en un div estrecho */
        width: 120px; 
        color: #009ee2;
        flex-shrink: 0; /* Evita que la negrita se deforme */
      }

        .cover-device {
          text-align: center;
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin-top: auto;
        }

        .cover-device img {
          max-width: 40%;
          height: auto;
          object-fit: contain;
        }

        .sala-title {
          font-size: 24px;
          font-weight: 700;
          color: #009ee2;
          border-bottom: 2px solid #009ee2;
          padding-bottom: 12px;
          margin: 40px 0 25px 0;
        }

        .param-section {
          margin-bottom: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 15px 18px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .param-subtitle {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .param-subtitle::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 18px;
          background-color: #009ee2;
          margin-right: 12px;
          border-radius: 2px;
        }

        .chart-container {
          width: 100%;
          background: #fff;
        }

        .chart-container img {
          width: 100%;
          height: auto;
        }

        .page-break {
          page-break-after: always;
        }

        .daily-table {
          width: 100%; /* Si quieres que no ocupe todo, baja el % y añade margin-left/right: auto */
          border-collapse: collapse;
          margin: 20px auto; /* El "auto" centraliza la tabla si el width es < 100% */
          font-size: 12px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          ter-spacing: normal;
          overflow: hidden;
        }

        .daily-table th {
          background-color: #f9fafb;
          color: #374151;
          font-weight: 700;
          text-align: center; /* CAMBIADO: de left a center */
          padding: 12px;
          border-bottom: 2px solid #e5e7eb;
          -webkit-print-color-adjust: exact;
        }

        .daily-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
          text-align: center; /* AÑADIDO: centraliza el contenido de las celdas */
        }

        .daily-table tr:last-child td {
          border-bottom: none;
        }

        .daily-table tr:nth-child(even) {
          background-color: #fcfcfc;
          -webkit-print-color-adjust: exact;
        }

        .intro-page {
          padding: 20px 40px;
          background-color: #ffffff;
          box-sizing: border-box;
        }

        .intro-title {
          font-size: 28px;
          font-weight: 800;
          color: #009ee2;
          margin-bottom: 30px;
          border-bottom: 2px solid #009ee2;
          padding-bottom: 10px;
        }

        .intro-content {
          font-size: 16px;
          line-height: 1.8;
          color: #4b5563;
        }

        .intro-content p {
          margin-bottom: 20px;
        }

        .contact-box {
          margin-top: 40px;
          background-color: #f0faff;
          border-left: 4px solid #009ee2;
          padding: 20px;
          border-radius: 8px;
        }

        .contact-box p {
          margin-bottom: 8px;
        }

        .contact-box p:last-child {
          margin-bottom: 0;
        }

        /* --- Estilos Generales para PDF --- */
        .parameters-page {
          background-color: #ffffff;
          margin: 0;
          padding: 0;
        }

        .parameters-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr); /* 4 columnas fijas */
          gap: 12px; /* Espacio entre tarjetas */
          width: 100%;
          page-break-inside: auto; /* Permite que el contenedor se rompa si es muy largo */
        }

        .param-card {
          border: 1px solid #e5e7eb; /* Borde más suave */
          border-radius: 12px; /* Bordes redondeados */
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          page-break-inside: avoid; /* Evita que la tarjeta se parta entre páginas */
          break-inside: avoid-column; /* También útil para columnas */
          height: 240px; /* Altura fija para uniformidad en el PDF */
          overflow: hidden; /* Asegura que el contenido no se salga */
          transition: transform 0.2s ease-in-out; /* Animación sutil si se ve en web */
        }

        .param-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          background-color: #f0faff;
          border-bottom: 1px solid #009ee2;
          color: #009ee2;
          font-size: 13px;
          font-weight: 700;
          min-height: 45px;
          -webkit-print-color-adjust: exact;
        }

        .param-card-header i {
          font-size: 16px;
          margin-right: 8px;
          color: #009ee2;
        }
        .param-card-box {
          padding: 12px;
          font-size: 10.5px;
          line-height: 1.5;
          color: #4b5563;
          flex-grow: 1;
          text-align: left; /* Alineado a la izquierda para match con el resto */
        }

        .param-card-footer {
          background-color: #f9fafb;
          padding: 6px;
          text-align: center;
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
          -webkit-print-color-adjust: exact;
        }

        .param-card-title {
          background-color: #f9fafb; /* Fondo aún más claro para el título inferior */
          padding: 8px;
          font-weight: bold;
          text-align: center;
          font-size: 11px;
          border-top: 1px solid #e5e7eb;
          color: #1f2937;
          -webkit-print-color-adjust: exact; /* Imprime color de fondo en PDF */
        }


        .param-title {
          font-size: 22px;
          font-weight: 800;
          color: #009ee2;
          background: linear-gradient(90deg, #f0faff 0%, #ffffff 100%);
          padding: 12px 20px;
          border-left: 6px solid #009ee2;
          margin: 30px 0 15px 0;
          letter-spacing: 0.05em;
          -webkit-print-color-adjust: exact;
        }

        .epa-quote-container {
          text-align: center;
          margin: 20px 0;
          padding: 10px;
        }

        .epa-quote-text {
          color: #009ee2; /* El azul celeste de la imagen */
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 5px;
          font-style: normal;
        }

        .epa-source {
          background-color: #a1a1a1; /* Gris de la imagen */
          color: white;
          font-size: 12px;
          padding: 2px 10px;
          display: inline-block;
          border-radius: 2px;
          margin-bottom: 15px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
        }

        .intro-subtitle {
          color: #6b7280;
          font-size: 16px;
          text-align: center;
        }
      </style>
      </head>

      <body>
    `

    // 🔥 BUCLE PRINCIPAL: HOSPITALES
    for (let hIndex = 0; hIndex < selectedSalas.length; hIndex++) {
        const hospital = selectedSalas[hIndex]

        // 🔥 BUCLE SECUNDARIO: SALAS
        for (let sIndex = 0; sIndex < hospital.salas.length; sIndex++) {
            const sala = hospital.salas[sIndex]

            let finalStartDate = customStartDate;
            let finalEndDate = customEndDate;

            if (!finalStartDate || !finalEndDate) {
                const ahora = new Date();
                finalEndDate = ahora.toISOString().split('T')[0];

                const fechaInicio = new Date();
                fechaInicio.setMonth(ahora.getMonth() - 1);
                finalStartDate = fechaInicio.toISOString().split('T')[0];
            }

            // Añadir horas para cubrir el día completo
            finalStartDate = `${finalStartDate} 00:00:00`;
            finalEndDate = `${finalEndDate} 23:59:59`;

            console.log("2Dispositivo: " + sala.id_dispositivo, "Fecha inicio: " + finalStartDate, "Fecha fin: " + finalEndDate)

            const registroDiario = await getRegistroDiario(
                sala.id_dispositivo,
                finalStartDate,
                finalEndDate
            )

            /*
            * Portada
            */
            htmlContent += `
              <div class="cover-page">
                <div class="cover-title">
                  <h1>INFORME MENSUAL EQUIPOS DE MONITORIZACIÓN</h1>
                  <h2>LODEPA</h2>
                </div>

                <div class="cover-info">
                  <div><strong>HOSPITAL:</strong> ${hospital.hospital}</div>
                  <div><strong>UBICACIÓN:</strong> ${sala.n_sala}</div>
                  <div><strong>PERÍODO:</strong> ${customStartDate} – ${customEndDate}</div>
                </div>

                <div class="cover-device">
                  <img src="data:image/png;base64,${deviceBase64}" />
                  <img src="data:image/png;base64,${indicadoresBase64}" />
                </div>
              </div>

              <div class="page-break"></div>
            `

            /*
            * Introducción
            */
           htmlContent += `
            <div class="intro-page">
              <div class="intro-content">
                <p>El presente informe se ha generado automáticamente para que disponga de toda la información de su dispositivo de medición <strong>LODEPA Inbiot</strong>.</p>
                <p>Todos los meses, las personas dadas de alta recibirán el presente informe actualizado.</p>
                <p>Le presentamos la gráfica de cada uno de los parámetros analizados. Si desea el histórico completo de datos (una tabla Excel con todos los datos recogidos por su medidor con frecuencia de 10 minutos), puede extraerlo mediante la pestaña <strong>informes</strong> en la plataforma Web.</p>
                <img src="data:image/png;base64,${parametrosBase64}" />
                <div class="contact-box">
                  <p>Por favor, revise exhaustivamente la información ofrecida. Si tiene cualquier cuestión al respecto, puede ponerse en contacto con nosotros:</p>
                  <p><strong>Email:</strong> calidad@lodepa.com</p>
                  <p><strong>Teléfono:</strong> 617 98 63 08</p>
                </div>
              </div>
            </div>
            <div class="page-break"></div>
           `

           /*
            * Descripción de Parametros
            */
           htmlContent += `
            <div class="parameters-page">
              <div class="epa-quote-container">
                <div class="epa-quote-text">
                  “El aire interior está de 2 a 5 veces más contaminado que el aire exterior”
                </div>
                <div class="epa-source">
                  EPA - Agencia de Protección del Medioambiente
                </div>
                <div class="intro-subtitle">
                  Te ayudamos a conocer todos los elementos clave:
                </div>
              </div>
          <div class="parameters-container">
            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-thermometer-half"></i> Temperatura
              </div>
              <div class="param-card-box">
                Es el parámetro más habitual para determinar el confort de una estancia e influye también en la capacidad de supervivencia de virus en el ambiente.
              </div>
              <div class="param-card-title">Temperatura</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-water"></i> Humedad
              </div>
              <div class="param-card-box">
                Valores fuera del rango óptimo debilitan las mucosas respiratorias, aumentando el riesgo de contraer enfermedades respiratorias.
              </div>
              <div class="param-card-title">Humedad</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-cloud"></i> CO₂
              </div>
              <div class="param-card-box">
                Indica la eficacia de la ventilación. En niveles elevados provoca malestar, somnolencia y disminución de la productividad.
              </div>
              <div class="param-card-title">CO₂</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-flask"></i> TVOC
              </div>
              <div class="param-card-box">
                Compuestos orgánicos volátiles, derivados de productos de construcción, limpieza o cosméticos de uso cotidiano con posibles efectos adversos para la salud a corto y largo plazo.
              </div>
              <div class="param-card-title">TVOC</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-smog"></i> PM2.5
              </div>
              <div class="param-card-box">
                Partículas en suspensión de diámetro inferior a 2.5µm que pueden inhalarse y alcanzar las vías respiratorias inferiores, pudiendo derivar en afecciones respiratorias.
              </div>
              <div class="param-card-title">PM2.5</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-wind"></i> PM10
              </div>
              <div class="param-card-box">
                Partículas en suspensión de diámetro inferior a 10µm que pueden inhalarse y alcanzar las vías respiratorias superiores, pudiendo derivar en afecciones respiratorias.
              </div>
              <div class="param-card-title">PM10</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-filter"></i> PM4
              </div>
              <div class="param-card-box">
                Partículas en suspensión de diámetro inferior a 4µm que pueden inhalarse y derivar en problemas respiratorios como el asma o afecciones alérgicas.
              </div>
              <div class="param-card-title">PM4</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-microscope"></i> PM1
              </div>
              <div class="param-card-box">
                Partículas en suspensión de diámetro inferior a 1µm que pueden atravesar la barrera alvéolo-capilar al inhalarlas, pudiendo derivar en afecciones en la salud.
              </div>
              <div class="param-card-title">PM1</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-burn"></i> Formaldehído
              </div>
              <div class="param-card-box">
                Gas tóxico muy volátil y común en espacios interiores, desde 2016 catalogado como cancerígeno 1B por la UE.
              </div>
              <div class="param-card-title">Formaldehído</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-fan"></i> O₃
              </div>
              <div class="param-card-box">
                Gas altamente reactivo y corrosivo utilizado como desinfectante, biocida o como subproducto de equipos de ofimática o desinfección.
              </div>
              <div class="param-card-title">Ozono</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-exclamation-triangle"></i> NO₂
              </div>
              <div class="param-card-box">
                Gas tóxico, altamente reactivo y corrosivo, considerado uno de los seis contaminantes listados más críticos en cuanto a afecciones en la calidad del aire interior.
              </div>
              <div class="param-card-title">Dióxido de Nitrógeno</div>
            </div>

            <div class="param-card">
              <div class="param-card-header">
                <i class="fas fa-head-side-mask"></i> CO
              </div>
              <div class="param-card-box">
                Gas inodoro e incoloro que provoca una disminución de la capacidad de transporte de oxígeno de la sangre.
              </div>
              <div class="param-card-title">Monóxido de Carbono</div>
            </div>
          </div>
        </div>
        <div class="page-break"></div>
        `

        /*
        * Pagina de alertas
        */
        const alertas = await getAlertaBySala(sala.id_sala, finalStartDate, finalEndDate)

        htmlContent += `<div class="param-title">Notificaciones de Alerta</div>`

        // --- TEXTO INTRODUCTORIO AÑADIDO ---
        htmlContent += `
        <div style="margin-bottom: 25px; color: #4b5563; font-size: 14px; line-height: 1.6;">
          <p>Este apartado detalla las incidencias registradas cuando los niveles de los parámetros monitorizados han excedido los rangos de seguridad configurados. Cada registro representa una desviación que requiere atención o seguimiento para garantizar el cumplimiento de la normativa sanitaria vigente en la sala.</p>
        </div>
        `

        if (alertas.length > 0) {
          htmlContent += `
          <div class="param-section">
            <div class="param-subtitle">Ultimas ${alertas.length} alertas en el periodo</div>
            <table class="daily-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Parámetro</th>
                  <th>Alerta</th>
                  <th>Valor</th>
                </tr>
              </thead>
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
                  <td style="color: #ef4444; font-weight: 600;">${formatVal(maybeConvert(alerta.campo as ParameterType, alerta.valor), 2, parametersToConvert.includes(alerta.campo as ParameterType))}</td>
                </tr>
                `
          }
          htmlContent += `
              </tbody>
            </table>
          </div>
          `
        } else {
          htmlContent += `
          <div class="param-section" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; color: #10b981; margin-bottom: 20px;">
              <i class="fas fa-check-circle"></i>
            </div>
            <div style="font-size: 18px; font-weight: 700; color: #374151; margin-bottom: 10px;">
              No se han detectado alertas
            </div>
            <div style="font-size: 14px; color: #6b7280; line-height: 1.5;">
              Durante el periodo analizado, todos los parámetros se han mantenido dentro de los rangos de normalidad establecidos para esta ubicación.
            </div>
          </div>
          `
        }

        htmlContent += `<div class="page-break"></div>`

            // 🔥 BUCLE TERCIARIO: PARÁMETROS
            for (const parameter of parameters) {
                const data = await getGraphicsData(
                    String(sala.id_dispositivo),
                    parameter,
                    timeRange as any,
                    finalStartDate,
                    finalEndDate
                )

            if (!data?.data?.length) continue

            const labels = data.data.map((p: any) => {
              const d = new Date(p.timestamp)
              return `${d.getDate()}/${d.getMonth() + 1}`
            })
            const values = data.data.map((p: any) => maybeConvert(parameter, p.value))

            const unit = parametersToConvert.includes(parameter) ? "ppm" : data.unit
            const paramLabel = getParameterLabel(parameter)

            const globalMax = data.max !== undefined ? maybeConvert(parameter, data.max) : "-";
            const globalMin = data.min !== undefined ? maybeConvert(parameter, data.min) : "-";
            const globalAvg = data.med !== undefined ? maybeConvert(parameter, data.med) : "-";



            const isPollutant = parametersToConvert.includes(parameter);
            const statsHtml = `
              <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div style="background-color: #e0f4ff; color: #009ee2; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">
                  mín. ${formatVal(globalMin, 1, isPollutant)} ${unit}
                </div>
                <div style="background-color: #eff6ff; color: #009ee2; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">
                  máx. ${formatVal(globalMax, 1, isPollutant)} ${unit}
                </div>
                <div style="background-color: #eff6ff; color: #009ee2; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;">
                  med. ${formatVal(globalAvg, isPollutant ? 3 : 2, false)} ${unit}
                </div>
              </div>
            `;

            const config = {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: `${paramLabel} (${unit})`,
                            data: values,
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16,185,129,0.05)",
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            borderWidth: 2.5,
                        },
                    ],
                },
                options: {
                    responsive: false,
                    animation: false,
                    plugins: {
                        legend: { 
                          display: true, 
                          position: 'top', 
                          align: 'end',
                          labels: {
                            boxWidth: 12,
                            font: { size: 12, weight: 'bold' }
                          }
                        },
                    },
                    scales: {
                        x: { 
                          display: true, 
                          grid: { display: false },
                          ticks: { 
                            maxRotation: 0, 
                            autoSkip: true, 
                            maxTicksLimit: 12,
                            font: { size: 10 }
                          }
                        },
                        y: { 
                          display: true,
                          beginAtZero: false,
                          grid: { color: '#f3f4f6' },
                          ticks: { font: { size: 10 } }
                        },
                    },
                },
            } as const

            const pngBuffer = await chart.renderToBuffer(config as any)
            const base64Image = pngBuffer.toString("base64")

            const fieldPrefix = parameter.charAt(0).toUpperCase() + parameter.slice(1);
            const avgField = `avg${fieldPrefix}` as keyof RegistroDiario;
            const maxField = `max${fieldPrefix}` as keyof RegistroDiario;
            const minField = `min${fieldPrefix}` as keyof RegistroDiario;

            let tableHtml = `
              <div class="param-subtitle">Datos diarios de ${paramLabel} (${unit})</div>
              <table class="daily-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody>
            `;

            for (const reg of registroDiario) {
              const date = new Date(reg.fecha as string);
              const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
              // console.log("RAW fecha:", reg.fecha);
              // console.log("ISO:", new Date(reg.fecha as string).toISOString());
              const minValRaw = reg[minField] !== undefined ? maybeConvert(parameter, reg[minField] as number) : "-";
              const maxValRaw = reg[maxField] !== undefined ? maybeConvert(parameter, reg[maxField] as number) : "-";
              const avgValRaw = reg[avgField] !== undefined ? maybeConvert(parameter, reg[avgField] as number) : "-";

              const minVal = formatVal(minValRaw, 1, isPollutant);
              const maxVal = formatVal(maxValRaw, 1, isPollutant);
              const avgVal = formatVal(avgValRaw, isPollutant ? 3 : 2, false);

              tableHtml += `
                <tr>
                  <td>${formattedDate}</td>
                  <td>${minVal} ${unit}</td>
                  <td>${maxVal} ${unit}</td>
                  <td>${avgVal} ${unit}</td>
                </tr>
              `;
            }

            tableHtml += `</tbody></table>`;

            htmlContent += `
              <div class="param-title">${paramLabel} (${unit})</div>
              <div class="param-section">
                <div class="param-subtitle">Gráfica de ${paramLabel} (${unit})</div>
                ${statsHtml}
                <div class="chart-container">
                  <img src="data:image/png;base64,${base64Image}" />
                </div>
              </div>
              <div class="param-section">
                ${tableHtml}
              </div>
            `
            htmlContent += `<div class="page-break"></div>`
            }
        }
    }

    // --- Página de cierre ---
    /*
* Pagina de cierre (Estilo LODEPA)
*/
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
`;

htmlContent += `</body></html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: "90px",
        bottom: "60px",
        left: "20mm",
        right: "20mm",
      },

      headerTemplate: `
        <div style="width:100%; padding:10px 40px; font-family:Segoe UI; font-size:11px; display:flex; justify-content:space-between; align-items:center; border-bottom: 0.5px solid #e5e7eb;">
          <img src="data:image/jpeg;base64,${logoRightBase64}" style="height:35px;" />
          <div style="flex:1; text-align:center; font-weight:700; color:#009ee2; margin: 0 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            INFORME MENSUAL EQUIPOS DE MONITORIZACIÓN LODEPA
          </div>
          <img src="data:image/png;base64,${logoLeftBase64}" style="height:35px;" />
        </div>
      `,

      footerTemplate: `
        <div style="width:100%; padding: 0 40px; display: flex; justify-content: space-between; font-family:Segoe UI; font-size:9px; color:#6b7280; border-top: 0.5px solid #e5e7eb; padding-top: 10px;">
          <div>Lodepa · Informe Automatizado</div>
          <div><span class="date"></span></div>
          <div>Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
        </div>
      `,
    })
    await browser.close()

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=informe-completo.pdf`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 })
  }
}
