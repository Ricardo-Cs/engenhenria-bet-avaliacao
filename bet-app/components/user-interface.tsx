"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ArrowLeft, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
import { useBettingStore } from "@/lib/betting-store"

interface UserInterfaceProps {
  onBack: () => void
}

export function UserInterface({ onBack }: UserInterfaceProps) {
  const { bets, userBets, placeBet } = useBettingStore()
  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [betAmount, setBetAmount] = useState("")
  const [selectedOption, setSelectedOption] = useState("")

  const availableBets = bets.filter((bet) => bet.status === "active")
  const userActiveBets = userBets.filter((bet) => bet.status === "active")
  const userCompletedBets = userBets.filter((bet) => bet.status !== "active")

  const handlePlaceBet = () => {
    if (selectedBet && selectedOption && betAmount) {
      placeBet({
        betId: selectedBet.id,
        option: selectedOption,
        amount: Number.parseFloat(betAmount),
        odds: selectedBet.options.find((opt: any) => opt.name === selectedOption)?.odds || 1,
      })
      setSelectedBet(null)
      setBetAmount("")
      setSelectedOption("")
    }
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
            <h1 className="text-3xl font-bold">Painel do Usuário</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Saldo disponível</p>
            <p className="text-2xl font-bold text-green-600">R$ 1.000,00</p>
          </div>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Apostas Disponíveis</TabsTrigger>
            <TabsTrigger value="active">Minhas Apostas Ativas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4">
              {availableBets.map((bet) => (
                <Card key={bet.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{bet.title}</CardTitle>
                        <CardDescription>{bet.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{bet.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 mb-4">
                      {bet.options.map((option: any) => (
                        <div
                          key={option.name}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <span className="font-medium">{option.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Odd: {option.odds}</Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBet(bet)
                                    setSelectedOption(option.name)
                                  }}
                                >
                                  Apostar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Fazer Aposta</DialogTitle>
                                  <DialogDescription>
                                    {bet.title} - {option.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="amount">Valor da Aposta (R$)</Label>
                                    <Input
                                      id="amount"
                                      type="number"
                                      placeholder="0.00"
                                      value={betAmount}
                                      onChange={(e) => setBetAmount(e.target.value)}
                                    />
                                  </div>
                                  {betAmount && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-600">Retorno potencial:</p>
                                      <p className="text-lg font-bold text-green-600">
                                        R$ {(Number.parseFloat(betAmount) * option.odds).toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button onClick={handlePlaceBet} disabled={!betAmount}>
                                    Confirmar Aposta
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Encerra: {new Date(bet.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {userActiveBets.map((userBet) => {
                const bet = bets.find((b) => b.id === userBet.betId)
                return (
                  <Card key={userBet.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{bet?.title}</CardTitle>
                        <Badge variant="secondary">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <span>Opção escolhida:</span>
                          <span className="font-medium">{userBet.option}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor apostado:</span>
                          <span className="font-medium">R$ {userBet.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Odd:</span>
                          <span className="font-medium">{userBet.odds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retorno potencial:</span>
                          <span className="font-bold text-green-600">
                            R$ {(userBet.amount * userBet.odds).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {userActiveBets.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">Você não possui apostas ativas</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4">
              {userCompletedBets.map((userBet) => {
                const bet = bets.find((b) => b.id === userBet.betId)
                const isWin = userBet.status === "won"
                return (
                  <Card key={userBet.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{bet?.title}</CardTitle>
                        <Badge variant={isWin ? "default" : "destructive"}>
                          {isWin ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {isWin ? "Ganhou" : "Perdeu"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <span>Opção escolhida:</span>
                          <span className="font-medium">{userBet.option}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor apostado:</span>
                          <span className="font-medium">R$ {userBet.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resultado:</span>
                          <span className={`font-bold ${isWin ? "text-green-600" : "text-red-600"}`}>
                            {isWin
                              ? `+R$ ${(userBet.amount * userBet.odds - userBet.amount).toFixed(2)}`
                              : `-R$ ${userBet.amount.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {userCompletedBets.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">Nenhuma aposta finalizada</p>
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
