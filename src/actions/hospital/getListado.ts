import { executeQuery } from "@/lib/db";

function transformData(rows: any[]) {
    const hospitalsMap = new Map();
  
    rows.forEach((row) => {
      // Buscar o crear el hospital
      if (!hospitalsMap.has(row.id_hospital)) {
        hospitalsMap.set(row.id_hospital, {
          id: row.id_hospital,
          name: row.hospital,
          rooms: new Map(),
        });
      }
  
      const hospital = hospitalsMap.get(row.id_hospital);
  
      // Buscar o crear la sala dentro del hospital
      if (!hospital.rooms.has(row.id_sala)) {
        hospital.rooms.set(row.id_sala, {
          id: row.id_sala,
          name: row.n_sala,
          devices: [],
        });
      }
  
      const room = hospital.rooms.get(row.id_sala);
  
      // Agregar el dispositivo a la sala
      room.devices.push({
        id: row.id,
        dispositivo: {
          id: row.id_dispositivo,
          ndispositivo: row.n_dispositivo,
          referencia: '', // Agrega referencia si está disponible
        },
        updateTime: parseUpdateTime(row.update_time),
        co2: parseFloat(row.co2),
        covid19: parseFloat(row.covid19),
        humidity: parseFloat(row.humidity),
        iaq: parseFloat(row.iaq),
        pm10: parseFloat(row.pm10),
        pm25: parseFloat(row.pm25),
        temperature: parseFloat(row.temperature),
        vocs: (parseFloat(row.vocs)/1000),
        thermalIndicator: parseFloat(row.thermal_indicator),
        ventilationIndicator: parseFloat(row.ventilation_indicator),
        co: (parseFloat(row.co)/1000),
        formaldehyde: parseFloat(
          (((parseFloat(row.formaldehyde) / 1000) * 0.85).toFixed(3))
        ),
        no2: (parseFloat(row.no2)/1000),
        o3: (parseFloat(row.o3)/1000),
        pm1: parseFloat(row.pm1),
        pm4: parseFloat(row.pm4),
      });
    });
  
    // Convertir Maps a listas y devolver el resultado correcto
    return Array.from(hospitalsMap.values()).map((hospital) => ({
      ...hospital,
      rooms: Array.from(hospital.rooms.values()),
    }));
  }
  
  // Función para parsear la fecha sin forzar zona horaria
  function parseUpdateTime(updateTime: string): number[] {
    const date = new Date(updateTime);
  
    // Formateamos la fecha con la configuración regional "es-ES"
    // pero SIN especificar timeZone.
    const parts = new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Formato 24 horas
    }).formatToParts(date);
  
    return [
      Number(parts.find((p) => p.type === "year")?.value),
      Number(parts.find((p) => p.type === "month")?.value),
      Number(parts.find((p) => p.type === "day")?.value),
      Number(parts.find((p) => p.type === "hour")?.value),
      Number(parts.find((p) => p.type === "minute")?.value),
      Number(parts.find((p) => p.type === "second")?.value),
    ];
  }
  
  
  export async function getListado(id:number,rol: number) {
    try {
      // Ejecutar la consulta SQL segun el Rol
      let rows: any;
      switch(rol){
        // Si el rol es ADMIN
        case 1:
          [rows] = await executeQuery(
                `SELECT h.id AS id_hospital, h.hospital, s.id AS id_sala, s.n_sala, d.id AS id_dispositivo, d.n_dispositivo, r.*
                FROM hospitales h
                JOIN salas s ON h.id = s.hospital
                JOIN dispositivos d ON s.id = d.sala
                JOIN registros r ON d.id = r.dispositivo
                WHERE r.update_time = (
                  SELECT MAX(r2.update_time)
                  FROM registros r2
                  WHERE r2.dispositivo = r.dispositivo
                );`
              );
          break;
        // Responsable de Hospital
        case 2:
          [rows] = await executeQuery(
            `SELECT 
                h.id AS id_hospital, 
                h.hospital, 
                s.id AS id_sala, 
                s.n_sala, 
                d.id AS id_dispositivo, 
                d.n_dispositivo, 
                r.*
            FROM hospitales h
            JOIN usuarios_hospitales uh ON h.id = uh.hospital_id
            JOIN salas s ON h.id = s.hospital
            LEFT JOIN dispositivos d ON s.id = d.sala
            LEFT JOIN registros r ON d.id = r.dispositivo 
            AND r.update_time = (
                SELECT MAX(r2.update_time)
                FROM registros r2
                WHERE r2.dispositivo = d.id
            )
            WHERE uh.usuario_id = ?;
            `,
            [id]
          );
        break;
        // Usuario de la Sala
        case 3:
          [rows] = await executeQuery(
            `SELECT h.id AS id_hospital, h.hospital, s.id AS id_sala, s.n_sala, d.id AS id_dispositivo, d.n_dispositivo, r.*
              FROM salas s
              JOIN hospitales h ON s.hospital = h.id
              JOIN usuarios_salas us ON s.id = us.sala_id
              LEFT JOIN dispositivos d ON s.id = d.sala
              LEFT JOIN registros r ON d.id = r.dispositivo
              AND r.update_time = (
                  SELECT MAX(r2.update_time)
                  FROM registros r2
                  WHERE r2.dispositivo = d.id
              )
              WHERE us.usuario_id = ?;`,[id]
          );
          break;
      }    
  
      // Transformar los datos correctamente
      const transformedData = transformData(rows);
  
      return transformedData;
    } catch (error) {
      console.error('Error al obtener datos:', error);
    }
  }
  