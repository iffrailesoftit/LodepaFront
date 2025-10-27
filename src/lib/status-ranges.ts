/*export const measurementRanges = {
  temperature: {

    good: { min: 20, max: 25 },

    warning: { min: 18, max: 28 },

  },

  humidity: {

    good: { min: 40, max: 60 },

    warning: { min: 25, max: 75 },

  },

  co2: {

    good: { min: 0, max: 800 },

    warning: { min: 0, max: 1100 },

  },

  vocs: {

    good: { min: 0, max: 900 },

    warning: { min: 0, max: 1200 },

  },

  pm25: {

    good: { min: 0, max: 25 },

    warning: { min: 26, max: 50 },

  },

  pm10: {

    good: { min: 0, max: 50 },

    warning: { min: 51, max: 100 },

  },

  covid19: {

    good: { min: 60, max: 100 },

    warning: { min: 30, max: 59 },

  },

  iaq: {

    good: { min: 66, max: 100 },

    warning: { min: 33, max: 65 },

  },

  thermalIndicator: {

    good: { min: 80, max: 100 },

    warning: { min: 60, max: 79 },

  },

  ventilationIndicator: {

    good: { min: 80, max: 100 },

    warning: { min: 60, max: 79 },

  },

  formaldehyde: {

    good: { min: 0, max: 0.65 },

    warning: { min: 0, max: 1 },

  },

  o3: {

    good: { min: 0, max: 0.05 },

    warning: { min: 0, max: 0.1 },

  },

  co: {

    good: { min: 0, max: 9 },

    warning: { min: 10, max: 35 },

  },

  no2: {

    good: { min: 0, max: 25 },

    warning: { min: 0.054, max: 0.1 },

  },

  pm1: {

    good: { min: 0, max: 10 },

    warning: { min: 11, max: 20 },

  },

  pm4: {

    good: { min: 0, max: 30 },

    warning: { min: 31, max: 50 },

  },

};

export const getStatus = (name: string, value: any): string => {
  const ranges = measurementRanges[name as keyof typeof measurementRanges];
  if (!ranges) return '#22c55e';

  if (value <= ranges.good.max && value >= ranges.good.min) return '#22c55e';
  if (value <= ranges.warning.max && value >= ranges.warning.min)
    return '#eab308';
  return '#ef4444';
}; Sustiuido por un server action 
*/
export const formatMeasurementName = (name: string): string => {
  const nameMap: Record<string, string> = {
    temperature: 'Temperatura',
    humidity: 'Humedad',
    co2: 'CO₂',
    vocs: 'VOCs',
    pm10: 'PM10',
    pm25: 'PM2.5',
    covid19: 'COVID-19',
    iaq: 'IAQ',
    thermalIndicator: 'Indicador Térmico',
    ventilationIndicator: 'Indicador Ventilación',
    formaldehyde: 'Formaldehído',
    o3: 'Ozono (O₃)',
    co: 'Monóxido de Carbono (CO)',
    no2: 'Dióxido de Nitrógeno (NO₂)',
    pm1: 'PM1',
    pm4: 'PM4',
  };
  return nameMap[name] || name;
};

export const getMeasurementUnit = (name: string): string => {
  const unitMap: Record<string, string> = {
    temperature: '°C',
    humidity: '%',
    co2: 'ppm',
    vocs: 'ppm',
    pm10: 'µg/m³',
    pm25: 'µg/m³',
    covid19: '%',
    iaq: '%',
    thermalIndicator: '%',
    ventilationIndicator: '%',
    formaldehyde: 'ppm',
    o3: 'ppm',
    co: 'ppm',
    no2: 'ppm',
    pm1: 'µg/m³',
    pm4: 'µg/m³',
  };
  return unitMap[name] || '';
};
