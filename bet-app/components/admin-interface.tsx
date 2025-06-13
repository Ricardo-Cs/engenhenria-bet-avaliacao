"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Edit, X, CheckCircle, BarChart3 } from "lucide-react"
import { useBettingStore } from "@/lib/betting-store"

interface AdminInterfaceProps {
  onBack: () => void
}

export function AdminInterface({ onBack }: AdminInterfaceProps) {
  const { bets, createBet, updateBet, closeBet, userBets } = useBettingStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBet, setEditingBet] = useState<any>(null)
  const [newBet, setNewBet] = useState({
    title: "",
    description: "",
    category: "",
    endDate: "",
    options: [{ name: "", odds: 1 }],
  })

  const activeBets = bets.filter((bet) => bet.status === "active")
  const closedBets = bets.filter((bet) => bet.status === "closed")

  const handleCreateBet = () => {
    if (newBet.title && newBet.description && newBet.category && newBet.endDate && newBet.options.length > 0) {
      createBet({
        ...newBet,
        endDate: new Date(newBet.endDate).toISOString(),
      })
      setNewBet({
        title: "",
        description: "",
        category: "",
        endDate: "",
        options: [{ name: "", odds: 1 }],
      })
      setIsCreateDialogOpen(false)
    }
  }

  const handleCloseBet = (betId: string, winningOption: string) => {
    closeBet(betId, winningOption)
  }

  const addOption = () => {
    setNewBet({
      ...newBet,
      options: [...newBet.options, { name: "", odds: 1 }],
    })
  }

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...newBet.options]
    updatedOptions[index] = { ...updatedOptions[index], [field]: value }
    setNewBet({ ...newBet, options: updatedOptions })
  }

  const removeOption = (index: number) => {
    if (newBet.options.length > 1) {
      setNewBet({
        ...newBet,
        options: newBet.options.filter((_, i) => i !== index),
      })
    }
  }

  const getTotalBetsAmount = () => {
    return userBets.reduce((total, bet) => total + bet.amount, 0)
  }

  const getActiveBetsCount = () => {
    return userBets.filter((bet) => bet.status === "active").length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Aposta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Aposta</DialogTitle>
                <DialogDescription>Preencha os dados para criar uma nova aposta</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newBet.title}
                      onChange={(e) => setNewBet({ ...newBet, title: e.target.value })}
                      placeholder="Ex: Eleições 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newBet.category}
                      onValueChange={(value) => setNewBet({ ...newBet, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="esportes">Esportes</SelectItem>
                        <SelectItem value="politica">Política</SelectItem>
                        <SelectItem value="entretenimento">Entretenimento</SelectItem>
                        <SelectItem value="economia">Economia</SelectItem>
                        <SelectItem value="tecnologia">Tecnologia</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newBet.description}
                    onChange={(e) => setNewBet({ ...newBet, description: e.target.value })}
                    placeholder="Descreva os detalhes da aposta"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Encerramento</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newBet.endDate}
                    onChange={(e) => setNewBet({ ...newBet, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Opções de Aposta</Label>
                  <div className="space-y-2">
                    {newBet.options.map((option, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            placeholder="Nome da opção"
                            value={option.name}
                            onChange={(e) => updateOption(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Odd"
                            value={option.odds}
                            onChange={(e) => updateOption(index, "odds", Number.parseFloat(e.target.value))}
                          />
                        </div>
                        {newBet.options.length > 1 && (
                          <Button variant="outline" size="icon" onClick={() => removeOption(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addOption} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateBet}>Criar Aposta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Apostas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apostas Ativas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apostas de Usuários</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getActiveBetsCount()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {getTotalBetsAmount().toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Apostas Ativas</TabsTrigger>
            <TabsTrigger value="closed">Apostas Encerradas</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {activeBets.map((bet) => {
                const betUserBets = userBets.filter((ub) => ub.betId === bet.id)
                const totalAmount = betUserBets.reduce((sum, ub) => sum + ub.amount, 0)

                return (
                  <Card key={bet.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{bet.title}</CardTitle>
                          <CardDescription>{bet.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{bet.category}</Badge>
                          <Badge variant="outline">{betUserBets.length} apostas</Badge>
                          <Badge variant="outline">R$ {totalAmount.toFixed(2)}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bet.options.map((option: any) => {
                          const optionBets = betUserBets.filter((ub) => ub.option === option.name)
                          const optionAmount = optionBets.reduce((sum, ub) => sum + ub.amount, 0)

                          return (
                            <div key={option.name} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <span className="font-medium">{option.name}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({optionBets.length} apostas - R$ {optionAmount.toFixed(2)})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Odd: {option.odds}</Badge>
                                <Button size="sm" onClick={() => handleCloseBet(bet.id, option.name)}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Definir Vencedor
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className="text-sm text-gray-600">Encerra: {new Date(bet.endDate).toLocaleString()}</span>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {activeBets.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">Nenhuma aposta ativa</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            <div className="grid gap-4">
              {closedBets.map((bet) => {
                const betUserBets = userBets.filter((ub) => ub.betId === bet.id)
                const totalAmount = betUserBets.reduce((sum, ub) => sum + ub.amount, 0)
                const winners = betUserBets.filter((ub) => ub.status === "won")
                const totalPayout = winners.reduce((sum, ub) => sum + ub.amount * ub.odds, 0)

                return (
                  <Card key={bet.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{bet.title}</CardTitle>
                          <CardDescription>{bet.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{bet.category}</Badge>
                          <Badge variant="destructive">Encerrada</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Apostado</p>
                          <p className="text-lg font-bold">R$ {totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Pago</p>
                          <p className="text-lg font-bold text-red-600">R$ {totalPayout.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Lucro da Casa</p>
                          <p className="text-lg font-bold text-green-600">
                            R$ {(totalAmount - totalPayout).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Vencedor</p>
                          <p className="text-lg font-bold">{bet.winningOption}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {closedBets.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">Nenhuma aposta encerrada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
