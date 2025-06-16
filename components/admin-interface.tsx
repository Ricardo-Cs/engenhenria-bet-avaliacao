"use client"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Edit,
  X,
  CheckCircle,
  BarChart3,
  AlertCircle,
  Users,
  DollarSign,
  UserCog,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { useBets } from "@/lib/hooks/use-bets"
import { useUserBets } from "@/lib/hooks/use-user-bets"
import { UserManagement } from "@/components/user-management"
import { useToast } from "@/hooks/use-toast"

interface AdminInterfaceProps {
  onBack: () => void
  user: any
  userProfile: any
}

export function AdminInterface({ onBack, user, userProfile }: AdminInterfaceProps) {
  const { toast } = useToast()
  const {
    bets: activeBets,
    loading: activeBetsLoading,
    error: activeBetsError,
    refetch: refetchActiveBets,
    createBet,
    closeBet,
  } = useBets("active")
  const { bets: closedBets, loading: closedBetsLoading, refetch: refetchClosedBets } = useBets("closed")
  const { userBets, loading: userBetsLoading, refetch: refetchUserBets } = useUserBets(null) // Get all user bets for admin

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBet, setEditingBet] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFixingPayments, setIsFixingPayments] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [closeError, setCloseError] = useState<string | null>(null)

  const [newBet, setNewBet] = useState({
    title: "",
    description: "",
    category: "",
    endDate: "",
    options: [{ name: "", odds: 1 }],
  })

  const [editBet, setEditBet] = useState({
    title: "",
    description: "",
    category: "",
    endDate: "",
    options: [{ name: "", odds: 1 }],
  })

  const [stats, setStats] = useState({
    totalBets: 0,
    activeBets: 0,
    totalUserBets: 0,
    totalVolume: 0,
  })

  // Calculate stats
  useEffect(() => {
    const totalBets = activeBets.length + closedBets.length
    const totalUserBets = userBets.length
    const totalVolume = userBets.reduce((sum, bet) => sum + (bet.amount || 0), 0)

    setStats({
      totalBets,
      activeBets: activeBets.length,
      totalUserBets,
      totalVolume,
    })
  }, [activeBets, closedBets, userBets])

  const handleFixUnpaidWinners = async () => {
    setIsFixingPayments(true)
    try {
      const response = await fetch("/api/admin/fix-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao corrigir pagamentos")
      }

      const data = await response.json()

      // Refresh all data
      await refetchActiveBets()
      await refetchClosedBets()
      await refetchUserBets()

      toast({
        variant: "success",
        title: "💰 Pagamentos Corrigidos!",
        description: `${data.fixed_bets} apostas corrigidas. Total pago: R$ ${data.total_payout?.toFixed(2) || "0.00"}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: error.message || "Erro ao corrigir pagamentos",
      })
    } finally {
      setIsFixingPayments(false)
    }
  }

  const handleCreateBet = async () => {
    if (!newBet.title || !newBet.description || !newBet.category || !newBet.endDate || newBet.options.length === 0) {
      setCreateError("Todos os campos são obrigatórios")
      return
    }

    // Validate options
    const validOptions = newBet.options.filter((opt) => opt.name.trim() && opt.odds > 0)
    if (validOptions.length === 0) {
      setCreateError("Adicione pelo menos uma opção válida")
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      await createBet({
        title: newBet.title,
        description: newBet.description,
        category: newBet.category,
        endDate: new Date(newBet.endDate).toISOString(),
        options: validOptions,
        userId: user?.id,
      })

      // Reset form
      setNewBet({
        title: "",
        description: "",
        category: "",
        endDate: "",
        options: [{ name: "", odds: 1 }],
      })
      setIsCreateDialogOpen(false)

      // Refresh data
      await refetchActiveBets()
      await refetchUserBets()

      toast({
        variant: "success",
        title: "✅ Sucesso!",
        description: "Aposta criada com sucesso!",
      })
    } catch (error: any) {
      setCreateError(error.message || "Erro ao criar aposta")
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: error.message || "Erro ao criar aposta",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditBet = (bet: any) => {
    setEditingBet(bet)
    setEditBet({
      title: bet.title,
      description: bet.description,
      category: bet.category,
      endDate: new Date(bet.end_date).toISOString().slice(0, 16), // Format for datetime-local
      options: bet.bet_options?.map((opt: any) => ({ name: opt.name, odds: opt.odds })) || [{ name: "", odds: 1 }],
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateBet = async () => {
    if (!editingBet || !editBet.title || !editBet.description || !editBet.category || !editBet.endDate) {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: "Todos os campos são obrigatórios",
      })
      return
    }

    try {
      const response = await fetch(`/api/bets/${editingBet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editBet.title,
          description: editBet.description,
          category: editBet.category,
          endDate: new Date(editBet.endDate).toISOString(),
          options: editBet.options.filter((opt) => opt.name.trim() && opt.odds > 0),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar aposta")
      }

      setIsEditDialogOpen(false)
      setEditingBet(null)
      await refetchActiveBets()

      toast({
        variant: "success",
        title: "✅ Sucesso!",
        description: "Aposta atualizada com sucesso!",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: error.message || "Erro ao atualizar aposta",
      })
    }
  }

  const handleDeleteBet = async (betId: string) => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/bets/${betId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir aposta")
      }

      // Refresh data
      await refetchActiveBets()
      await refetchUserBets()

      toast({
        variant: "success",
        title: "✅ Sucesso!",
        description: "Aposta excluída com sucesso!",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: error.message || "Erro ao excluir aposta",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseBet = async (betId: string, winningOptionId: string) => {
    setIsClosing(true)
    setCloseError(null)

    try {
      await closeBet(betId, winningOptionId)

      // Refresh all data
      await refetchActiveBets()
      await refetchClosedBets()
      await refetchUserBets()

      toast({
        variant: "success",
        title: "🏆 Aposta Finalizada!",
        description: "Aposta finalizada e pagamentos processados com sucesso!",
      })
    } catch (error: any) {
      setCloseError(error.message || "Erro ao finalizar aposta")
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: error.message || "Erro ao finalizar aposta",
      })
    } finally {
      setIsClosing(false)
    }
  }

  const addOption = (isEdit = false) => {
    if (isEdit) {
      setEditBet({
        ...editBet,
        options: [...editBet.options, { name: "", odds: 1 }],
      })
    } else {
      setNewBet({
        ...newBet,
        options: [...newBet.options, { name: "", odds: 1 }],
      })
    }
  }

  const updateOption = (index: number, field: string, value: any, isEdit = false) => {
    if (isEdit) {
      const updatedOptions = [...editBet.options]
      updatedOptions[index] = { ...updatedOptions[index], [field]: value }
      setEditBet({ ...editBet, options: updatedOptions })
    } else {
      const updatedOptions = [...newBet.options]
      updatedOptions[index] = { ...updatedOptions[index], [field]: value }
      setNewBet({ ...newBet, options: updatedOptions })
    }
  }

  const removeOption = (index: number, isEdit = false) => {
    const currentOptions = isEdit ? editBet.options : newBet.options
    if (currentOptions.length > 1) {
      if (isEdit) {
        setEditBet({
          ...editBet,
          options: editBet.options.filter((_, i) => i !== index),
        })
      } else {
        setNewBet({
          ...newBet,
          options: newBet.options.filter((_, i) => i !== index),
        })
      }
    }
  }

  // Check if a bet can be deleted (no user bets placed)
  const canDeleteBet = (betId: string) => {
    const betUserBets = userBets.filter((ub) => ub.bet_id === betId)
    return betUserBets.length === 0
  }

  if (activeBetsLoading || closedBetsLoading || userBetsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados administrativos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Painel Administrativo</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleFixUnpaidWinners} disabled={isFixingPayments}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFixingPayments ? "animate-spin" : ""}`} />
            {isFixingPayments ? "Corrigindo..." : "Corrigir Pagamentos"}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Aposta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Aposta</DialogTitle>
                <DialogDescription>Preencha os dados para criar uma nova aposta</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                            min="1"
                            placeholder="Odd"
                            value={option.odds}
                            onChange={(e) => updateOption(index, "odds", Number.parseFloat(e.target.value) || 1)}
                          />
                        </div>
                        {newBet.options.length > 1 && (
                          <Button variant="outline" size="icon" onClick={() => removeOption(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addOption()} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{createError}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCreateBet} disabled={isCreating}>
                  {isCreating ? "Criando..." : "Criar Aposta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Messages */}
      {(activeBetsError || closeError) && (
        <div className="mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Erro</p>
                  {activeBetsError && <p className="text-sm">Apostas: {activeBetsError}</p>}
                  {closeError && <p className="text-sm">Finalização: {closeError}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Fix Notice */}
      <div className="mb-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <DollarSign className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Sistema de Pagamentos</p>
                  <p className="text-sm">
                    Se alguma aposta foi finalizada mas os vencedores não receberam o pagamento, clique em "Corrigir
                    Pagamentos" para processar os pagamentos pendentes.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleFixUnpaidWinners} disabled={isFixingPayments} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isFixingPayments ? "animate-spin" : ""}`} />
                {isFixingPayments ? "Corrigindo..." : "Corrigir Pagamentos"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Apostas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apostas Ativas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apostas de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUserBets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalVolume.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bets">Apostas Ativas ({activeBets.length})</TabsTrigger>
          <TabsTrigger value="closed">Apostas Encerradas ({closedBets.length})</TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="w-4 h-4 mr-2" />
            Gerenciar Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bets" className="space-y-4">
          <div className="grid gap-4">
            {activeBets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Nenhuma aposta ativa</p>
                </CardContent>
              </Card>
            ) : (
              activeBets.map((bet) => {
                const betUserBets = userBets.filter((ub) => ub.bet_id === bet.id)
                const totalAmount = betUserBets.reduce((sum, ub) => sum + (ub.amount || 0), 0)
                const canDelete = canDeleteBet(bet.id)

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
                          {canDelete && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Pode excluir
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bet.bet_options?.map((option: any) => {
                          const optionBets = betUserBets.filter((ub) => ub.bet_option_id === option.id)
                          const optionAmount = optionBets.reduce((sum, ub) => sum + (ub.amount || 0), 0)

                          return (
                            <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <span className="font-medium">{option.name}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({optionBets.length} apostas - R$ {optionAmount.toFixed(2)})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Odd: {option.odds}</Badge>
                                <Button
                                  size="sm"
                                  onClick={() => handleCloseBet(bet.id, option.id)}
                                  disabled={isClosing}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {isClosing ? "Finalizando..." : "Definir Vencedor"}
                                </Button>
                              </div>
                            </div>
                          )
                        }) || <p className="text-gray-500 text-center py-4">Nenhuma opção disponível</p>}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className="text-sm text-gray-600">
                          Encerra: {new Date(bet.end_date).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditBet(bet)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {canDelete ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Aposta</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a aposta "{bet.title}"? Esta ação não pode ser
                                    desfeita.
                                    <br />
                                    <br />
                                    <strong>
                                      Esta aposta não possui apostas de usuários, então pode ser excluída com segurança.
                                    </strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBet(bet.id)}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {isDeleting ? "Excluindo..." : "Excluir"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-gray-400"
                              title="Não é possível excluir apostas que já receberam apostas de usuários"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Não pode excluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <div className="grid gap-4">
            {closedBets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Nenhuma aposta encerrada</p>
                </CardContent>
              </Card>
            ) : (
              closedBets.map((bet) => {
                const betUserBets = userBets.filter((ub) => ub.bet_id === bet.id)
                const totalAmount = betUserBets.reduce((sum, ub) => sum + (ub.amount || 0), 0)
                const winners = betUserBets.filter((ub) => ub.status === "won")
                const totalPayout = winners.reduce((sum, ub) => sum + (ub.actual_payout || 0), 0)

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
                          <p className="text-sm text-gray-600">Vencedores</p>
                          <p className="text-lg font-bold">{winners.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aposta</DialogTitle>
            <DialogDescription>Modifique os dados da aposta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editBet.title}
                  onChange={(e) => setEditBet({ ...editBet, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={editBet.category} onValueChange={(value) => setEditBet({ ...editBet, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editBet.description}
                onChange={(e) => setEditBet({ ...editBet, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-endDate">Data de Encerramento</Label>
              <Input
                id="edit-endDate"
                type="datetime-local"
                value={editBet.endDate}
                onChange={(e) => setEditBet({ ...editBet, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Opções de Aposta</Label>
              <div className="space-y-2">
                {editBet.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome da opção"
                        value={option.name}
                        onChange={(e) => updateOption(index, "name", e.target.value, true)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        placeholder="Odd"
                        value={option.odds}
                        onChange={(e) => updateOption(index, "odds", Number.parseFloat(e.target.value) || 1, true)}
                      />
                    </div>
                    {editBet.options.length > 1 && (
                      <Button variant="outline" size="icon" onClick={() => removeOption(index, true)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={() => addOption(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateBet}>Atualizar Aposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
