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
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Shield } from "lucide-react"
import { useBets } from "@/lib/hooks/use-bets"
import { useUserBets } from "@/lib/hooks/use-user-bets"
import { useToast } from "@/hooks/use-toast"

interface UserInterfaceProps {
  onBack: () => void
  user: any
  userProfile: any
}

export function UserInterface({ onBack, user, userProfile }: UserInterfaceProps) {
  const { toast } = useToast()
  const { bets, loading: betsLoading, error: betsError, refetch: refetchBets } = useBets("active")
  const {
    userBets,
    loading: userBetsLoading,
    error: userBetsError,
    placeBet,
    refetch: refetchUserBets,
  } = useUserBets(user?.id)

  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [betAmount, setBetAmount] = useState("")
  const [selectedOption, setSelectedOption] = useState("")
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [placeBetError, setPlaceBetError] = useState<string | null>(null)

  // Verificar se o usuário é admin
  const isAdmin = userProfile?.role === "admin"

  const availableBets = bets.filter((bet) => bet.status === "active")
  const userActiveBets = userBets.filter((bet) => bet.status === "active")
  const userCompletedBets = userBets.filter((bet) => bet.status !== "active")

  const handlePlaceBet = async () => {
    // Bloquear apostas para administradores
    if (isAdmin) {
      setPlaceBetError("Administradores não podem fazer apostas para evitar conflitos de interesse.")
      return
    }

    if (!selectedBet || !selectedOption || !betAmount || !user?.id) {
      setPlaceBetError("Todos os campos são obrigatórios")
      return
    }

    const amount = Number.parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) {
      setPlaceBetError("Valor da aposta deve ser maior que zero")
      return
    }

    if (userProfile?.balance && amount > userProfile.balance) {
      setPlaceBetError("Saldo insuficiente")
      return
    }

    setIsPlacingBet(true)
    setPlaceBetError(null)

    try {
      const selectedOptionData = selectedBet.bet_options.find((opt: any) => opt.name === selectedOption)
      if (!selectedOptionData) {
        throw new Error("Opção selecionada não encontrada")
      }

      await placeBet({
        userId: user.id,
        betId: selectedBet.id,
        betOptionId: selectedOptionData.id,
        amount,
        odds: selectedOptionData.odds,
      })

      // Reset form
      setSelectedBet(null)
      setBetAmount("")
      setSelectedOption("")

      // Refresh data
      await refetchUserBets()
      await refetchBets()

      toast({
        variant: "success",
        title: "🎉 Aposta Realizada!",
        description: `Aposta de R$ ${amount.toFixed(2)} em "${selectedOption}" foi registrada com sucesso!`,
      })
    } catch (error: any) {
      setPlaceBetError(error.message || "Erro ao realizar aposta")
      toast({
        variant: "destructive",
        title: "❌ Erro na Aposta",
        description: error.message || "Erro ao realizar aposta",
      })
    } finally {
      setIsPlacingBet(false)
    }
  }

  if (betsLoading || userBetsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Aviso para administradores */}
      {isAdmin && (
        <div className="mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <Shield className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Restrição de Administrador</p>
                  <p className="text-sm">
                    Como administrador, você pode visualizar as apostas mas não pode apostar para manter a integridade
                    do sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Messages */}
      {(betsError || userBetsError) && (
        <div className="mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Erro ao carregar dados</p>
                  {betsError && <p className="text-sm">Apostas: {betsError}</p>}
                  {userBetsError && <p className="text-sm">Suas apostas: {userBetsError}</p>}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  refetchBets()
                  refetchUserBets()
                }}
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Apostas Disponíveis ({availableBets.length})</TabsTrigger>
          <TabsTrigger value="active">
            {isAdmin ? "Apostas Ativas dos Usuários" : "Minhas Apostas Ativas"} ({userActiveBets.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            {isAdmin ? "Histórico de Apostas" : "Meu Histórico"} ({userCompletedBets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4">
            {availableBets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Nenhuma aposta disponível no momento</p>
                  <Button variant="outline" onClick={refetchBets} className="mt-4">
                    Atualizar
                  </Button>
                </CardContent>
              </Card>
            ) : (
              availableBets.map((bet) => (
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
                      {bet.bet_options?.map((option: any) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <span className="font-medium">{option.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Odd: {option.odds}</Badge>
                            {!isAdmin ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBet(bet)
                                      setSelectedOption(option.name)
                                      setPlaceBetError(null)
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
                                        step="0.01"
                                        min="0.01"
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
                                    {placeBetError && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-600">{placeBetError}</p>
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={handlePlaceBet} disabled={!betAmount || isPlacingBet}>
                                      {isPlacingBet ? "Processando..." : "Confirmar Aposta"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Button size="sm" disabled variant="outline">
                                Admin não pode apostar
                              </Button>
                            )}
                          </div>
                        </div>
                      )) || <p className="text-gray-500 text-center py-4">Nenhuma opção disponível</p>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Encerra: {new Date(bet.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {userActiveBets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    {isAdmin ? "Nenhuma aposta ativa de usuários" : "Você não possui apostas ativas"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              userActiveBets.map((userBet) => {
                const bet = bets.find((b) => b.id === userBet.bet_id)
                return (
                  <Card key={userBet.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{bet?.title || "Aposta"}</CardTitle>
                        <Badge variant="secondary">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {isAdmin && userBet.users && (
                          <div className="flex justify-between">
                            <span>Usuário:</span>
                            <span className="font-medium">{userBet.users.full_name || userBet.users.email}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Opção escolhida:</span>
                          <span className="font-medium">{userBet.bet_options?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor apostado:</span>
                          <span className="font-medium">R$ {userBet.amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Odd:</span>
                          <span className="font-medium">{userBet.odds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retorno potencial:</span>
                          <span className="font-bold text-green-600">R$ {userBet.potential_payout?.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {userCompletedBets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">{isAdmin ? "Nenhuma aposta finalizada" : "Nenhuma aposta finalizada"}</p>
                </CardContent>
              </Card>
            ) : (
              userCompletedBets.map((userBet) => {
                const bet = bets.find((b) => b.id === userBet.bet_id)
                const isWin = userBet.status === "won"
                return (
                  <Card key={userBet.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{bet?.title || "Aposta"}</CardTitle>
                        <Badge variant={isWin ? "default" : "destructive"}>
                          {isWin ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {isWin ? "Ganhou" : "Perdeu"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {isAdmin && userBet.users && (
                          <div className="flex justify-between">
                            <span>Usuário:</span>
                            <span className="font-medium">{userBet.users.full_name || userBet.users.email}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Opção escolhida:</span>
                          <span className="font-medium">{userBet.bet_options?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor apostado:</span>
                          <span className="font-medium">R$ {userBet.amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resultado:</span>
                          <span className={`font-bold ${isWin ? "text-green-600" : "text-red-600"}`}>
                            {isWin
                              ? `+R$ ${(userBet.actual_payout - userBet.amount).toFixed(2)}`
                              : `-R$ ${userBet.amount.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
