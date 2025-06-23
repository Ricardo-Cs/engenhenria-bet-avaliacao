"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle, Database } from "lucide-react"

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runFullDebug = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/full-system", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Debug failed")
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Debug do Sistema</h1>
          <p className="text-gray-600">Diagnóstico completo do sistema de apostas</p>
        </div>

        <div className="mb-6">
          <Button onClick={runFullDebug} disabled={loading} size="lg" className="w-full">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Executando Diagnóstico..." : "Executar Diagnóstico Completo"}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Erro no Diagnóstico</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {debugData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Resumo do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{debugData.summary.authUsers}</p>
                    <p className="text-sm text-gray-600">Usuários Auth</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{debugData.summary.publicUsers}</p>
                    <p className="text-sm text-gray-600">Usuários Públicos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{debugData.summary.bets}</p>
                    <p className="text-sm text-gray-600">Apostas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{debugData.summary.userBets}</p>
                    <p className="text-sm text-gray-600">Apostas de Usuários</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {debugData.summary.syncNeeded ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Sincronização Necessária
                    </Badge>
                  ) : (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sincronizado
                    </Badge>
                  )}
                </div>

                {debugData.summary.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Problemas Encontrados:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {debugData.summary.issues.map((issue: string, index: number) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auth Users */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários de Autenticação</CardTitle>
                <CardDescription>Usuários registrados no sistema de autenticação do Supabase</CardDescription>
              </CardHeader>
              <CardContent>
                {debugData.debug.authUsers.error ? (
                  <div className="text-red-600">Erro: {debugData.debug.authUsers.error}</div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold">Total: {debugData.debug.authUsers.count}</p>
                    {debugData.debug.authUsers.users.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p>
                          <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                          <strong>ID:</strong> {user.id}
                        </p>
                        <p>
                          <strong>Confirmado:</strong> {user.confirmed ? "Sim" : "Não"}
                        </p>
                      </div>
                    ))}
                    {debugData.debug.authUsers.count > 5 && (
                      <p className="text-sm text-gray-600">... e mais {debugData.debug.authUsers.count - 5} usuários</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public Users */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários Públicos</CardTitle>
                <CardDescription>Usuários na tabela pública com perfis e saldos</CardDescription>
              </CardHeader>
              <CardContent>
                {debugData.debug.publicUsers.error ? (
                  <div className="text-red-600">Erro: {debugData.debug.publicUsers.error}</div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold">Total: {debugData.debug.publicUsers.count}</p>
                    {debugData.debug.publicUsers.users.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p>
                          <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                          <strong>Nome:</strong> {user.full_name || "Não informado"}
                        </p>
                        <p>
                          <strong>Papel:</strong> {user.role}
                        </p>
                        <p>
                          <strong>Saldo:</strong> R$ {user.balance?.toFixed(2)}
                        </p>
                      </div>
                    ))}
                    {debugData.debug.publicUsers.count > 5 && (
                      <p className="text-sm text-gray-600">
                        ... e mais {debugData.debug.publicUsers.count - 5} usuários
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discrepancies */}
            {debugData.debug.discrepancies.syncNeeded && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800">Discrepâncias Encontradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-yellow-800">
                    <p>
                      Usuários em auth.users mas não em public.users:{" "}
                      {debugData.debug.discrepancies.authUsersNotInPublic.length}
                    </p>
                    <p>
                      Usuários em public.users mas não em auth.users:{" "}
                      {debugData.debug.discrepancies.publicUsersNotInAuth.length}
                    </p>

                    {debugData.debug.discrepancies.authUsersNotInPublic.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold">Usuários que precisam ser sincronizados:</p>
                        {debugData.debug.discrepancies.authUsersNotInPublic.map((user: any) => (
                          <div key={user.id} className="text-sm">
                            • {user.email}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bets */}
            <Card>
              <CardHeader>
                <CardTitle>Apostas</CardTitle>
                <CardDescription>Apostas disponíveis no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {debugData.debug.bets.error ? (
                  <div className="text-red-600">Erro: {debugData.debug.bets.error}</div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold">Total: {debugData.debug.bets.count}</p>
                    {debugData.debug.bets.bets.slice(0, 3).map((bet: any) => (
                      <div key={bet.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p>
                          <strong>Título:</strong> {bet.title}
                        </p>
                        <p>
                          <strong>Status:</strong> {bet.status}
                        </p>
                        <p>
                          <strong>Opções:</strong> {bet.bet_options?.length || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Raw Debug Data */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Brutos (JSON)</CardTitle>
                <CardDescription>Dados completos do diagnóstico para análise técnica</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
