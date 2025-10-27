'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

type Registro = {
  [key: string]: number | any;
};

type Umbral = {
  min_good: number;
  max_good: number;
  min_warning: number;
  max_warning: number;
};

export default function VisorDispositivo() {
  const { dispositivo } = useParams();
  const [mounted, setMounted] = useState(false);
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [umbrales, setUmbrales] = useState<Record<string, Umbral>>({});
  const alertaRef = useRef<HTMLAudioElement | null>(null);
  const alertaReproducida = useRef<Set<string>>(new Set());
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [datoAlerta, setDatoAlerta] = useState<{ label: string; value: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    alertaRef.current = new Audio('/alert.mp3');
  }, []);

  const activarPopup = (dato: { label: string; value: number }) => {
    setDatoAlerta(dato);
    setMostrarPopup(true);
    setTimeout(() => {
      setMostrarPopup(false);
      setDatoAlerta(null);
    }, 30000); // 30 segundos
  };

  // Cargar umbrales desde la API
  useEffect(() => {
    fetch('/api/umbrales')
      .then(res => res.json())
      .then(setUmbrales)
      .catch(console.error);
  }, []);

  // Obtener datos del dispositivo
  const fetchDatos = async () => {
    try {
      const res = await fetch(`/api/registro/get/${dispositivo}/last`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRegistro(data[0]);
        alertaReproducida.current.clear(); // reset para nueva lectura
        
      }
    } catch (error) {
      console.error('Error al obtener datos del dispositivo:', error);
    }
  };

  useEffect(() => {
    if (!dispositivo) return;
    fetchDatos();
    const interval = setInterval(fetchDatos, 60000); // cada minuto
    return () => clearInterval(interval);
  }, [dispositivo]);

  const datosMostrar = registro
    ? [
        { label: 'Temperatura (°C)', value: registro.temperature, key: 'temperature' },
        { label: 'Humedad (%)', value: registro.humidity, key: 'humidity' },
        { label: 'CO₂ (ppm)', value: registro.co2, key: 'co2' },
        { label: 'Formaldehído (ppm)', value: registro.formaldehyde, key: 'formaldehyde' },
        { label: 'TVOC (ppm)', value: registro.vocs, key: 'vocs' },
        { label: 'PM1 (µg/m³)', value: registro.pm1, key: 'pm1' },
        { label: 'PM2.5 (µg/m³)', value: registro.pm25, key: 'pm25' },
        { label: 'PM10 (µg/m³)', value: registro.pm10, key: 'pm10' },
        { label: 'CO (ppm)', value: registro.co, key: 'co' },
        { label: 'O₃ (ppm)', value: registro.o3, key: 'o3' },
        { label: 'NO₂ (ppm)', value: registro.no2, key: 'no2' },
        { label: 'IAQ', value: registro.iaq, key: 'iaq' },
      ]
    : [];
  const fechaActualizacion = registro?.updateTime
    ? new Date(
        registro.updateTime[0],       // Año
        registro.updateTime[1] - 1,   // Mes (0-indexed)
        registro.updateTime[2],       // Día
        registro.updateTime[3],       // Hora
        registro.updateTime[4],       // Minuto
        registro.updateTime[5]        // Segundo
      )
    : null;

  if (!mounted) return null; 
  return (
    
    <>
    <Head>
      <title>Visor de calidad del aire</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#ffffff" />
      <link rel="icon" href="/cropped-LOGO-LODEPA-sin-fondo.png" />
      <link rel="manifest" href="/manifestvisor.json" />
    </Head>
    <div className="relative w-screen h-screen bg-white text-black text-center p-6">
      {/* Logo */}
      <div className="mb-2">
        <img
          src="/cropped-LOGO-LODEPA-sin-fondo.png"
          alt="Logo LODEPA"
          className="h-24 mx-auto"
        />
      </div>
      <div className="grid grid-cols-4 grid-rows-4 w-screen h-screen bg-white text-black text-center gap-6">
        {datosMostrar.map((dato, index) => {
          const thresholds = umbrales[dato.key];
          let color = 'text-black';
          
          if (thresholds) {
            const {max_good,  max_warning } = thresholds;  
            const v = dato.value;
            if (v > max_warning) {
              color = 'text-red-600';

              // Sonar solo una vez por lectura y por tipo
              if (!alertaReproducida.current.has(dato.key)) {
                alertaReproducida.current.add(dato.key);
                alertaRef.current?.play().catch(() => {});
                activarPopup({ label: dato.label, value: dato.value });
              }
            } else if (v > max_good) {
              color = 'text-yellow-500';
            }
          }

          return (
            <div
              key={index}
              className="flex items-center justify-center border border-gray-300 rounded-2xl shadow-md p-6"
            >
              <div>
                <div className="text-3xl font-semibold mb-4">{dato.label}</div>
                <div className={`text-4xl font-bold ${color}`}>{dato.value} </div>
                
              </div>
            </div>
          );
        })}
        {fechaActualizacion && (
        <div className="absolute bottom-4 left-4 text-gray-500 text-xl">
          Última actualización: {fechaActualizacion.toLocaleString('es-ES')}
        </div>
      )}
      {mostrarPopup && datoAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-red-600 p-8 rounded-2xl shadow-xl text-4xl font-bold text-center animate-bounce max-w-xl">
            ¡Alerta en {datoAlerta.label}! <br />
            Valor actual: {datoAlerta.value}
          </div>
        </div>
      )}
      </div>
    </div>
  </>  
  );
}
