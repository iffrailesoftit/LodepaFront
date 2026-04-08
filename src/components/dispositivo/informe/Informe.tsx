"use client"

import React, { useState } from "react"
import { Calendar, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { toast } from 'react-hot-toast'
import { getDispositivo } from "@/actions/dispositivo/getDispositivo"

interface InformeProps {
  id: string
}

const Informe: React.FC<InformeProps> = ({ id }) => {
  const [loading, setLoading] = useState(false)

  // Helper para formatear fecha local "YYYY-MM-DD"
  const formatDateLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  // Fecha de hoy
  const today = new Date()

  // Inicio: primer día del mes anterior a las 00:00
  const prevFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const defaultInicio = `${formatDateLocal(prevFirstDay)}T00:00`

  // Fin: último día del mes anterior a las 23:59
  const prevLastDay = new Date(today.getFullYear(), today.getMonth(), 0)
  const defaultFin = `${formatDateLocal(prevLastDay)}T23:59`

  // Parámetros dinámicos
  const dispositivo = Number(id)
  const [inicio, setInicio] = useState<string>(defaultInicio)
  const [fin, setFin] = useState<string>(defaultFin)
  const [reportType, setReportType] = useState<'pdf' | 'excel'>('pdf')

  const generateReport = async () => {
    // Validación: inicio no puede ser mayor que fin
    if (new Date(inicio) > new Date(fin)) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    setLoading(true)
    try {
      if (reportType === 'excel') {
        const url = `/api/informe/${dispositivo}/${encodeURIComponent(inicio)}/${encodeURIComponent(fin)}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Error al generar el informe")
        }
        const header = response.headers.get("Content-Disposition") || ""
        let filename = header.split("filename=")[1] || "informe.xlsx"
        filename = filename.trim().replace(/^"|"$/g, "")

        if (filename === "No_hay_registros.xlsx") {
          toast.error('No se encontraron datos para generar el informe')
          return
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(downloadUrl)
      } else {
        // Lógica para PDF
        const deviceData = await getDispositivo(id)
        if (!deviceData) {
          throw new Error("No se pudo obtener la información del dispositivo")
        }

        const res = await fetch("/api/informe/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedSalas: [
              {
                id_hospital: deviceData.id_hospital,
                hospital: deviceData.n_hospital,
                logo: "", // El API buscará el logo por defecto o según la configuración
                salas: [
                  {
                    id_sala: deviceData.id_sala,
                    n_sala: deviceData.n_sala,
                    id_dispositivo: deviceData.id_dispositivo,
                    n_dispositivo: deviceData.n_dispositivo
                  }
                ]
              }
            ],
            customStartDate: inicio.split('T')[0],
            customEndDate: fin.split('T')[0],
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Error al generar el PDF")
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `informe-${deviceData.n_dispositivo}-${inicio.split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || 'Ocurrió un error al generar el informe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Generar Informe</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            generateReport()
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Formato del informe</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setReportType('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  reportType === 'pdf'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-semibold">PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setReportType('excel')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  reportType === 'excel'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-semibold">Excel (XLSX)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fecha-inicio" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha inicio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fecha-inicio"
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fecha-fin" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha fin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fecha-fin"
                  type="datetime-local"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generando informe...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Generar informe
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Informe
