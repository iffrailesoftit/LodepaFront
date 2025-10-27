"use client"
import { getMeasurementRanges } from "@/actions/dispositivo/umbrales";
import { ListadoSalas } from "@/actions/hospital/sala/getListadoSalas";
import { formatMeasurementName, getMeasurementUnit } from "@/lib/status-ranges"
import Link from "next/link"
import { useEffect, useState } from "react";


export default function Badge({ data }: { data: ListadoSalas }) {
  const { n_sala, id_dispositivo, n_dispositivo, updateTime } = data
  const updateTimeDate = new Date(updateTime);
  const [rango, setRango] = useState<any>({});

  const fechtUmbrales = async (id_sala: number) => {
    const umbrales = await getMeasurementRanges(id_sala);
    setRango(umbrales);
  } ;

  useEffect(() => {
    fechtUmbrales(data.id_sala);
  }, [data.id_sala]);

  const getStatus = (name: string, value: any): string => {
    const ranges = rango[name as keyof typeof rango];

    if (!ranges) return '#22c55e';

    if (value <= ranges.good.max && value >= ranges.good.min) return '#22c55e';
    if (value <= ranges.warning.max && value >= ranges.warning.min)
      return '#eab308';
    return '#ef4444';
  };

  // Excluir campos que no son mediciones
  const excludeFields = ["id_sala", "n_sala", "id_dispositivo", "n_dispositivo", "updateTime","thermalIndicator","ventilationIndicator","covid19","iaq"]

  const measurementEntries = Object.entries(data).filter(([key]) => !excludeFields.includes(key))

  const formatDate = (date: Date) => {
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  // const color = getStatus("iaq", iaq)
  const radius = 18
  const circumference = 2 * Math.PI * radius
  // const offset = circumference - (iaq / 100) * circumference

  const isRuning = (givenDate: Date | string | number) => {
    // Convertir a Date si no lo es
    const date = givenDate instanceof Date ? givenDate : new Date(givenDate);
    const now = new Date();
    const differenceInMs = now.getTime() - date.getTime();
    const differenceInMinutes = differenceInMs / (1000 * 60); // Convertir a minutos
    return differenceInMinutes <= 360;
  };

  return (
    <div className="relative group">
      <Link href={`/dashboard/dispositivo/${id_dispositivo}`}>
        <div className="inline-flex items-center px-4 py-2 bg-neutral-100 rounded-full w-fit hover:bg-neutral-200 transition-colors cursor-pointer">
          <span className="text-neutral-800 font-medium mr-3 text-sm">{n_sala}</span>
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r={radius} fill="transparent" stroke="#e6e6e6" strokeWidth="2" />
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="transparent"
                stroke={isRuning(updateTime) ? "#22c55e" : "#626567"}
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={isRuning(updateTime) ? 0 : 0}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
              <text x="22" y="22" textAnchor="middle" dy=".3em" fontSize="10" fontWeight="bold" fill={isRuning(updateTime) ? "#22c55e" : "#626567"}>
                {isRuning(updateTime) ? "ON" : "OFF"}
              </text>
            </svg>
          </div>
        </div>
      </Link>
      {isRuning(updateTime) && (
        <div
          className="absolute left-0 top-full mt-2 w-full opacity-0 invisible 
                    group-hover:opacity-100 group-hover:visible 
                    transition-all duration-200 ease-in-out 
                    transform origin-top scale-95 group-hover:scale-100 z-50"
        >
          <div className="bg-white rounded-xl shadow-lg p-4 border border-neutral-200 min-w-[280px]">
            <div className="mb-3 pb-2 border-b border-neutral-100">
              <h3 className="font-medium text-neutral-800">{n_dispositivo}</h3>
              <p className="text-xs text-neutral-500">{formatDate(updateTimeDate)}</p>
            </div>
            <div className="space-y-2.5">
              {measurementEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${getStatus(key, Number(value)) === "#22c55e"
                        ? "bg-green-500"
                        : getStatus(key, Number(value)) === "#eab308"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        }`
                      }
                    />
                    <span className="text-sm text-neutral-600">{formatMeasurementName(key)}</span>
                  </div>
                  <span
                    className={`text-sm ${getStatus(key, Number(value)) === "#22c55e"
                      ? "text-green-500"
                      : getStatus(key, Number(value)) === "#eab308"
                        ? "text-yellow-600"
                        : "text-red-600"
                      }`}
                  >
                    {isNaN(Number(value)) ? "N/A" : Number(value).toFixed(1)} {getMeasurementUnit(key)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}