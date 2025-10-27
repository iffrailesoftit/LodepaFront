"use client"

import { useAuth } from "@/context/AuthContext"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

export const FormLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error desconocido")
      }

      login(data.token);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (

    <div className=" bg-gray-100 rounded-lg shadow-2xl w-full max-w-md p-6 flex flex-col justify-center items-center space-y-6">
      <Image src="/cropped-LOGO-LODEPA-sin-fondo.png" alt="Logo" width={144} height={144} className="w-48" />
      {isLoading ? (
          <p className="text-center animate-pulse font-semibold">Iniciando sesión...</p>
      ) : (
        <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
        <p className="text-gray-600">Ingresa tus credenciales para acceder</p>
      </div>

      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

      <form className="w-full flex flex-col gap-2" onSubmit={handleSubmit}>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white font-medium cursor-pointer ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>
      </>
      )}
    </div>

  )
}
