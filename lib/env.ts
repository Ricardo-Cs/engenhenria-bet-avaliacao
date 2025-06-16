// Validação de variáveis de ambiente
export const validateEnv = () => {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env.local file or deployment environment variables.",
    )
  }

  return requiredEnvVars
}

// Configuração padrão para desenvolvimento
export const getEnvConfig = () => {
  try {
    return validateEnv()
  } catch (error) {
    console.warn("Environment validation failed:", error)

    // Retorna configuração de fallback para desenvolvimento
    return {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-key",
    }
  }
}
