"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Edit,
  DollarSign,
  UserCog,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Shield,
  User,
  FolderSyncIcon as Sync,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserType {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin"
  balance: number
  created_at: string
  updated_at: string
}

export function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "user" as "user" | "admin",
  })

  const [balanceForm, setBalanceForm] = useState({
    amount: "",
    operation: "add" as "add" | "subtract" | "set",
  })

  const fetchUsers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      console.log("Fetching users with timestamp:", new Date().toISOString())

      // Add cache busting parameter
      const cacheBuster = new Date().getTime()
      const response = await fetch(`/api/admin/users?t=${cacheBuster}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar usuários")
      }

      const data = await response.json()
      console.log("Users fetched:", data.users?.length || 0, "at", data.timestamp)

      // Sort users by updated_at to show recently updated users first
      const sortedUsers = (data.users || []).sort(
        (a: UserType, b: UserType) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )

      setUsers(sortedUsers)
      setLastUpdate(new Date().toLocaleTimeString())

      // Log each user for debugging
      sortedUsers.forEach((user: UserType) => {
        console.log(`User: ${user.email}, Role: ${user.role}, Balance: ${user.balance}, Updated: ${user.updated_at}`)
      })
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const forceRefresh = useCallback(async () => {
    console.log("Force refreshing users...")

    // Clear current users to show loading state
    setUsers([])

    // Wait a bit to ensure any pending operations complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Fetch fresh data
    await fetchUsers(true)
  }, [fetchUsers])

  const syncUsers = async () => {
    try {
      setIsSyncing(true)
      setError(null)

      const response = await fetch("/api/admin/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao sincronizar usuários")
      }

      const data = await response.json()

      if (data.syncedUsers > 0) {
        toast({
          variant: "success",
          title: "🔄 Sincronização Concluída!",
          description: `${data.syncedUsers} usuários sincronizados com sucesso!`,
        })
        await forceRefresh() // Force complete refresh after sync
      } else {
        toast({
          variant: "default",
          title: "ℹ️ Sincronização",
          description: "Todos os usuários já estão sincronizados.",
        })
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "❌ Erro na Sincronização",
        description: err.message,
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name || "",
      role: user.role,
    })
    setIsEditDialogOpen(true)
  }

  const handleBalanceEdit = (user: UserType) => {
    setSelectedUser(user)
    setBalanceForm({
      amount: "",
      operation: "add",
    })
    setIsBalanceDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setIsUpdating(true)
    try {
      console.log("Updating user:", selectedUser.id, "with:", editForm)

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar usuário")
      }

      const data = await response.json()
      console.log("User update response:", data)

      setIsEditDialogOpen(false)
      setSelectedUser(null)

      toast({
        variant: "success",
        title: "✅ Usuário Atualizado!",
        description: `Informações de ${data.user.email} foram atualizadas com sucesso!`,
      })

      // Force complete refresh to ensure we see the changes
      await forceRefresh()
    } catch (err: any) {
      console.error("Error updating user:", err)
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: err.message,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceForm.amount) return

    const amount = Number.parseFloat(balanceForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "❌ Valor Inválido",
        description: "Valor deve ser um número positivo",
      })
      return
    }

    setIsUpdating(true)
    try {
      console.log("Updating balance for user:", selectedUser.id, "with:", balanceForm)

      const response = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          amount,
          operation: balanceForm.operation,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar saldo")
      }

      const data = await response.json()
      console.log("Balance update response:", data)

      setIsBalanceDialogOpen(false)
      setSelectedUser(null)

      toast({
        variant: "success",
        title: "💰 Saldo Atualizado!",
        description: `Saldo alterado de R$ ${data.oldBalance.toFixed(2)} para R$ ${data.newBalance.toFixed(2)}`,
      })

      // Force complete refresh to ensure we see the changes
      await forceRefresh()
    } catch (err: any) {
      console.error("Error updating balance:", err)
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: err.message,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (user: UserType) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao deletar usuário")
      }

      toast({
        variant: "success",
        title: "🗑️ Usuário Deletado!",
        description: `Usuário ${user.email} foi removido do sistema.`,
      })

      // Force complete refresh after deletion
      await forceRefresh()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: err.message,
      })
    }
  }

  // Initial load
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Auto-refresh every 30 seconds, but only if not currently updating
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isUpdating && !isSyncing && !isRefreshing) {
        fetchUsers(false) // Refresh without showing loading spinner
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchUsers, isUpdating, isSyncing, isRefreshing])

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalUsers = users.length
  const adminUsers = users.filter((u) => u.role === "admin").length
  const regularUsers = users.filter((u) => u.role === "user").length
  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Regulares</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalBalance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button variant="outline" onClick={forceRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button variant="outline" onClick={syncUsers} disabled={isSyncing}>
            <Sync className="w-4 h-4 mr-2" />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
        <div className="text-xs text-gray-500">{lastUpdate && `Última atualização: ${lastUpdate}`}</div>
      </div>

      {/* Debug Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <RefreshCw className="w-5 h-5" />
            <div>
              <p className="font-semibold">Sistema de Atualização Melhorado</p>
              <p className="text-sm">
                ✅ Cache desabilitado completamente
                <br />✅ Refresh forçado após mudanças
                <br />✅ Logs detalhados para debug
                <br />✅ Verificação de integridade automática
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Erro ao carregar usuários</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <Button variant="outline" onClick={forceRefresh} className="mt-2">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Gerencie usuários, edite saldos e altere permissões.
            {totalUsers === 0 && " Nenhum usuário encontrado - tente sincronizar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="space-y-2">
                      <p className="text-gray-500">
                        {totalUsers === 0
                          ? "Nenhum usuário encontrado no sistema"
                          : "Nenhum usuário corresponde à busca"}
                      </p>
                      {totalUsers === 0 && (
                        <Button variant="outline" onClick={syncUsers} disabled={isSyncing}>
                          <Sync className="w-4 h-4 mr-2" />
                          {isSyncing ? "Sincronizando..." : "Sincronizar Usuários"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "Sem nome"}</p>
                        <p className="text-sm text-gray-500">{user.id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                        {user.role === "admin" ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Usuário
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">R$ {user.balance.toFixed(2)}</span>
                        {/* Show if balance was recently updated */}
                        {new Date(user.updated_at).getTime() > Date.now() - 60000 && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            Atualizado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(user.updated_at).toLocaleDateString()}</p>
                        <p className="text-gray-500">{new Date(user.updated_at).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBalanceEdit(user)}>
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Tem certeza que deseja deletar o usuário ${user.email}? Esta ação não pode ser desfeita.`,
                              )
                            ) {
                              handleDeleteUser(user)
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Edite as informações do usuário {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <Label htmlFor="role">Papel</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "user" | "admin") => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Usuário
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p>
                  <strong>Dados atuais:</strong>
                </p>
                <p>Nome: {selectedUser.full_name || "Não informado"}</p>
                <p>Papel: {selectedUser.role}</p>
                <p>Última atualização: {new Date(selectedUser.updated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Edit Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Saldo</DialogTitle>
            <DialogDescription>
              Saldo atual de {selectedUser?.email}: R$ {selectedUser?.balance.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation">Operação</Label>
              <Select
                value={balanceForm.operation}
                onValueChange={(value: "add" | "subtract" | "set") =>
                  setBalanceForm({ ...balanceForm, operation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Adicionar ao saldo</SelectItem>
                  <SelectItem value="subtract">Subtrair do saldo</SelectItem>
                  <SelectItem value="set">Definir saldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            {balanceForm.amount && selectedUser && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Resultado:</p>
                <p className="text-lg font-bold">
                  R${" "}
                  {balanceForm.operation === "add"
                    ? (selectedUser.balance + Number.parseFloat(balanceForm.amount)).toFixed(2)
                    : balanceForm.operation === "subtract"
                      ? Math.max(0, selectedUser.balance - Number.parseFloat(balanceForm.amount)).toFixed(2)
                      : Number.parseFloat(balanceForm.amount).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateBalance} disabled={isUpdating || !balanceForm.amount}>
              {isUpdating ? "Atualizando..." : "Atualizar Saldo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
