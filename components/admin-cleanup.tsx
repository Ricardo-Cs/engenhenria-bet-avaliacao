"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react"

export function AdminCleanup() {
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<any>(null)

  const handleCleanup = async () => {
    if (!confirm("ATENÇÃO: Isso vai deletar TODOS os usuários do sistema. Tem certeza?")) {
      return
    }

    setIsCleaningUp(true)
    setCleanupResult(null)

    try {
      const response = await fetch("/api/auth/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setCleanupResult(data)

      if (response.ok) {
        alert("Limpeza concluída! Você pode criar novos usuários agora.")
      } else {
        alert(`Erro na limpeza: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    } finally {
      setIsCleaningUp(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-orange-800">Limpeza de Usuários</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          Use esta ferramenta para limpar todos os usuários do sistema quando houver problemas de autenticação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-semibold">⚠️ ATENÇÃO:</p>
            <ul className="text-sm text-red-700 mt-1 space-y-1">
              <li>• Esta ação remove TODOS os usuários do sistema</li>
              <li>• Você precisará criar novos usuários após a limpeza</li>
              <li>• Esta ação não pode ser desfeita</li>
            </ul>
          </div>

          <Button onClick={handleCleanup} disabled={isCleaningUp} variant="destructive" className="w-full" size="lg">
            {isCleaningUp ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Todos os Usuários
              </>
            )}
          </Button>

          {cleanupResult && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">Resultado da Limpeza:</p>
              <ul className="text-sm text-blue-700 mt-1">
                <li>• Total de usuários: {cleanupResult.totalUsers}</li>
                <li>• Removidos com sucesso: {cleanupResult.successful}</li>
                <li>• Falhas: {cleanupResult.failed}</li>
              </ul>
              {cleanupResult.results && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer">Ver detalhes</summary>
                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(cleanupResult.results, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
