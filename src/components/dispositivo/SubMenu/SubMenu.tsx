"use client"

import type React from "react"

//import Indicadores from "../Indicadores/Indicadores"
import "./Submenu.css"
import Parametros from "../parametros/Parametros"
import { Grafica } from "../grafica/Grafica"
import Informe from "../informe/Informe"
import { Suspense, useState } from "react"
import Indicadores from "../Indicadores/Indicadores"
import Purificador from "../purificador/Purificador"

interface SubmenuProps {
  id: string
  exists: boolean
}



const Submenu: React.FC<SubmenuProps> = ({ id,exists }) => {

  const [tag, setTag] = useState("parametros")

  const items = [
    { name: "Parámetros", path: "parametros" },
    { name: "Indicadores", path: "indicadores" },
    { name: "Gráfica", path: "grafica" },
    { name: "Informe", path: "informe" },
  ]

  if (exists) {
    // Ejemplo: insertar en la posición 3 (antes de "Informe")
    items.splice(3, 0, { name: "Purificador", path: "purificador" });
  }

  const handleClick = (tag: string) => {
    setTag(tag)
    // console.log("Tag seleccionado:", tag)
    // console.log("ID recibido:", id)
  }

  const DefaultComponent = () => <h2>Selecciona una opción</h2>

  // Selecciona el componente a renderizar según el tag seleccionado
  let ComponentToRender
  if (tag === "parametros") ComponentToRender = Parametros
  else if (tag === "indicadores") ComponentToRender = Indicadores
  else if (tag === "grafica") ComponentToRender = Grafica
  else if (tag === "informe") ComponentToRender = Informe
  else if (tag === "purificador") ComponentToRender = Purificador
  else ComponentToRender = DefaultComponent

  // Determinar si el componente actual es Grafica para aplicar estilos específicos
  const isGraficaComponent = tag === "grafica"

  return (
    <div className="submenu-container">
      {/* Menú de navegación */}
      <div className="menu">
        {items.map((item) => (
          <button
            key={item.path}
            className={`menu-item ${item.path === tag ? "active" : ""}`}
            onClick={() => handleClick(item.path)}
          >
            {item.name}
          </button>
        ))}
        
      </div>

      {/* Contenedor para el componente renderizado con estilos condicionales */}
      <div className={`component-container ${isGraficaComponent ? "grafica-container" : ""}`}>
        <Suspense fallback={<div>Cargando...</div>}>
          <ComponentToRender id={id} />
        </Suspense>
      </div>
    </div>
  )
}

export default Submenu

