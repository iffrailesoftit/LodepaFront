"use client";

import { CalendarClock, Plus, X, Trash2, Edit2, Save, LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface ConfigRule {
  id: number;
  purificador: string;
  dias: string;
  hora_inicio: number;
  minutos_inicio: number;
  hora_fin: number;
  minutos_fin: number;
  velocidad: number;
  orden: number;
  on: number;
}

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const VELOCIDADES = [
  { label: "0% (Apagado)", value: 0 },
  { label: "33%", value: 84 },
  { label: "66%", value: 168 },
  { label: "100%", value: 255 },
];

export default function ConfiguracionHorariaModal({ purificadorId }: { purificadorId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [reglas, setReglas] = useState<ConfigRule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para la regla en edición/creación
  const [editingRule, setEditingRule] = useState<ConfigRule | Partial<ConfigRule> | null>(null);
  const [diasCheckbox, setDiasCheckbox] = useState<boolean[]>([false, false, false, false, false, false, false]);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarReglas();
    } else {
      setEditingRule(null);
    }
  }, [isOpen]);

  const cargarReglas = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/purificador/configuracion?purificadorId=${purificadorId}`);
      if (!res.ok) throw new Error("Error al obtener configuraciones");
      const data = await res.json();
      setReglas(data);
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al cargar la programación");
    } finally {
      setLoading(false);
    }
  };

  const handleIniciCreacion = () => {
    if (reglas.length >= 8) {
      toast.error("Máximo 8 reglas permitidas");
      return;
    }
    setDiasCheckbox([true, true, true, true, true, false, false]); // L a V por defecto
    setEditingRule({
      purificador: purificadorId,
      hora_inicio: 8,
      minutos_inicio: 0,
      hora_fin: 18,
      minutos_fin: 0,
      velocidad: 84,
      on: 1
    });
  };

  const handleEditRule = (rule: ConfigRule) => {
    const diasBools = rule.dias.split("").map(c => c === "1");
    // Por precaución, si la longitud es incorrecta
    while(diasBools.length < 7) diasBools.push(false);
    
    setDiasCheckbox(diasBools.slice(0, 7));
    setEditingRule({ ...rule });
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta configuración?")) return;
    
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/purificador/configuracion/${id}?purificadorId=${purificadorId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Error al eliminar");
      
      toast.success("Regla eliminada");
      cargarReglas();
      router.refresh();
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error("Error al eliminar la regla");
    } finally {
      setLoading(false);
    }
  };

  const padZero = (num: number) => num.toString().padStart(2, "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setLoading(true);
    try {
      const diasStr = diasCheckbox.map(d => d ? "1" : "0").join("");
      const payload = {
        ...editingRule,
        dias: diasStr,
        purificadorId
      };

      const isUpdate = !!editingRule.id;
      const url = isUpdate 
        ? `/api/purificador/configuracion/${editingRule.id}` 
        : `/api/purificador/configuracion`;
      
      const res = await fetchWithAuth(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar");
      }

      toast.success(isUpdate ? "Regla actualizada" : "Regla creada");
      setEditingRule(null);
      cargarReglas();
      router.refresh(); // Refresh dashboard since `fecha_actualizacion` changed
    } catch (error: any) {
      if (error.message === "Sesión expirada") return;
      console.error(error);
      toast.error(error.message || "Error al guardar la regla");
    } finally {
      setLoading(false);
    }
  };

  const formatearHoraMinutos = (h: number, m: number) => `${padZero(h)}:${padZero(m)}`;
  
  const formatearDiasStr = (diasStr: string) => {
    const seleccionados = diasStr.split("").map((c, i) => c === "1" ? DIAS_SEMANA[i] : null).filter(Boolean);
    if (seleccionados.length === 7) return "Todos los días";
    if (diasStr === "1111100") return "Lun a Vie";
    if (diasStr === "0000011") return "Fines de semana";
    if (seleccionados.length === 0) return "Ningún día";
    return seleccionados.join(", ");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-slate-700 hover:bg-slate-800 text-white py-1 px-3 rounded flex items-center justify-center transition-colors text-xs font-medium whitespace-nowrap ml-2"
        title="Configuración Horaria"
      >
        <CalendarClock className="h-4 w-4 mr-1" />
        Horario
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
          <div className={`bg-white rounded-lg shadow-lg flex flex-col ${isMobile ? "w-full h-full max-w-none m-0" : "w-[600px] max-h-[90vh]"}`}>
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <CalendarClock className="mr-2 text-emerald-600" /> Programación 
                </h2>
                <p className="text-xs text-gray-500 mt-1">Purificador: {purificadorId}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              
              {!editingRule ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">
                      Reglas actuales ({reglas.length}/8)
                    </h3>
                    <button
                      onClick={handleIniciCreacion}
                      disabled={reglas.length >= 8 || loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Añadir
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-gray-500 text-sm flex flex-col items-center">
                      <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></span>
                      Cargando programación...
                    </div>
                  ) : reglas.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm mb-4">No hay programaciones configuradas.</p>
                      <button
                        onClick={handleIniciCreacion}
                        className="text-emerald-600 font-medium hover:underline text-sm"
                      >
                        Crear la primera regla
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reglas.map((rule) => (
                        <div key={rule.id} className={`bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between ${rule.on === 1 ? 'border-l-4 border-l-emerald-500 border-y-gray-200 border-r-gray-200' : 'border-gray-200 opacity-75'}`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.on === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                {rule.on === 1 ? 'ON' : 'OFF'}
                              </span>
                              <span className="font-semibold text-gray-800">
                                {formatearHoraMinutos(rule.hora_inicio, rule.minutos_inicio)} - {formatearHoraMinutos(rule.hora_fin, rule.minutos_fin)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                               <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs">{VELOCIDADES.find(v => v.value === rule.velocidad)?.label || 'Desconocido'}</span>
                               <span>•</span>
                               <span className="text-xs">{formatearDiasStr(rule.dias)}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => handleEditRule(rule)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Form */
                <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">
                    {editingRule.id ? "Editar" : "Nueva"} Regla
                  </h3>

                  {/* Días */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana</label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map((dia, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const val = [...diasCheckbox];
                            val[index] = !val[index];
                            setDiasCheckbox(val);
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            diasCheckbox[index] ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horario */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                      <input
                        type="time"
                        required
                        value={formatearHoraMinutos(editingRule.hora_inicio as number, editingRule.minutos_inicio as number)}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(":");
                          setEditingRule({ ...editingRule, hora_inicio: parseInt(h, 10), minutos_inicio: parseInt(m, 10) });
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                      <input
                        type="time"
                        required
                        value={formatearHoraMinutos(editingRule.hora_fin as number, editingRule.minutos_fin as number)}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(":");
                          setEditingRule({ ...editingRule, hora_fin: parseInt(h, 10), minutos_fin: parseInt(m, 10) });
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Configuración */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Velocidad</label>
                      <select
                        value={editingRule.velocidad}
                        onChange={(e) => setEditingRule({ ...editingRule, velocidad: parseInt(e.target.value, 10) })}
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {VELOCIDADES.map(v => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-transparent select-none">Estado</label>
                      <label className="flex items-center space-x-3 cursor-pointer p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={editingRule.on === 1}
                          onChange={(e) => setEditingRule({ ...editingRule, on: e.target.checked ? 1 : 0 })}
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Regla Activa (ON)</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingRule(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center font-medium text-sm"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      ) : <Save className="w-4 h-4 mr-2" />}
                      Guardar Regla
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
