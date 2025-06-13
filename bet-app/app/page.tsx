"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserInterface } from "@/components/user-interface"
import { AdminInterface } from "@/components/admin-interface"
import { Users, Shield } from "lucide-react"

export default function Home() {
  const [currentView, setCurrentView] = useState<"selection" | "user" | "admin">("selection")

  if (currentView === "user") {
    return <UserInterface onBack={() => setCurrentView("selection")} />
  }

  if (currentView === "admin") {
    return <AdminInterface onBack={() => setCurrentView("selection")} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sistema de Apostas</h1>
          <p className="text-xl text-gray-600">Escolha seu perfil para continuar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView("user")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Usuário</CardTitle>
              <CardDescription>Visualize e faça suas apostas</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Visualizar apostas disponíveis</li>
                <li>• Fazer apostas em tempo real</li>
                <li>• Acompanhar histórico</li>
                <li>• Ver resultados</li>
              </ul>
              <Button className="w-full" size="lg">
                Entrar como Usuário
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView("admin")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Administrador</CardTitle>
              <CardDescription>Gerencie o sistema de apostas</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Criar novas apostas</li>
                <li>• Editar apostas existentes</li>
                <li>• Fechar apostas</li>
                <li>• Gerenciar resultados</li>
              </ul>
              <Button className="w-full" variant="destructive" size="lg">
                Entrar como Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
