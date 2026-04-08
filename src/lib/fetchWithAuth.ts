import toast from "react-hot-toast";

/**
 * Wrapper para fetch que maneja automáticamente la expiración de sesión (401).
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Accept": "application/json",
      },
    });

    if (response.status === 401) {
      // Sesión expirada
      toast.error("Tu sesión ha expirado, redirigiendo...", {
        duration: 3000,
        icon: "🔒",
      });

      // Pequeña espera para que el usuario vea el mensaje antes de redirigir
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

      // Retornamos un error controlado para que el componente no intente parsear JSON
      throw new Error("Sesión expirada");
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "Sesión expirada") {
      throw error;
    }
    console.error("Error en la petición:", error);
    throw error;
  }
}
