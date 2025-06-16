"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserInterface } from "@/components/user-interface"
import { AdminInterface } from "@/components/admin-interface"
import { useAuth } from "@/lib/hooks/use-auth"
import { Users, Shield, AlertTriangle } from "lucide-react"

export default function Home() {
  const { user, userProfile, loading, signIn, signUp, signOut } = useAuth()
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Sistema de Apostas</h1>
            <p className="text-xl text-gray-600">Faça login para continuar</p>
          </div>

          <Card>
            <CardHeader>
              <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "signin" | "signup")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setAuthLoading(true)
                  setAuthError(null)

                  try {
                    if (authMode === "signin") {
                      const { error } = await signIn(formData.email, formData.password)
                      if (error) throw error
                    } else {
                      const { error } = await signUp(formData.email, formData.password, formData.fullName)
                      if (error) throw error
                    }
                  } catch (error: any) {
                    setAuthError(error.message)
                  } finally {
                    setAuthLoading(false)
                  }
                }}
              >
                <div className="space-y-4">
                  {authMode === "signup" && (
                    <div>
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  {authError && <div className="text-red-600 text-sm">{authError}</div>}
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Carregando..." : authMode === "signin" ? "Entrar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Determinar automaticamente qual interface mostrar baseado no papel do usuário
  const isAdmin = userProfile?.role === "admin"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header com informações do usuário */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isAdmin ? <Shield className="w-5 h-5 text-red-600" /> : <Users className="w-5 h-5 text-blue-600" />}
                <h1 className="text-xl font-bold text-gray-900">
                  {isAdmin ? "Painel Administrativo" : "Sistema de Apostas"}
                </h1>
              </div>
              {isAdmin && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrador
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Olá, {userProfile?.full_name || user.email}</p>
                {!isAdmin && (
                  <p className="text-xs text-gray-500">Saldo: R$ {userProfile?.balance?.toFixed(2) || "0,00"}</p>
                )}
              </div>
              <Button variant="outline" onClick={signOut} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso para administradores */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Modo Administrador</p>
                  <p className="text-sm">
                    Você está logado como administrador. Pode gerenciar apostas, mas não pode apostar para evitar
                    conflitos de interesse.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interface baseada no papel do usuário */}
      {isAdmin ? (
        <AdminInterface onBack={() => {}} user={user} userProfile={userProfile} />
      ) : (
        <UserInterface onBack={() => {}} user={user} userProfile={userProfile} />
      )}
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}
