"use client"

import { useState, useEffect } from "react"
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

  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "user" as "user" | "admin",
  })

  const [balanceForm, setBalanceForm] = useState({
    amount: "",
    operation: "add" as "add" | "subtract" | "set",
  })

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      console.log("Fetching users...")

      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache busting to ensure fresh data
        cache: "no-cache",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar usuários")
      }

      const data = await response.json()
      console.log("Users fetched:", data.users?.length || 0)

      // Sort users by updated_at to show recently updated users first
      const sortedUsers = (data.users || []).sort(
        (a: UserType, b: UserType) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )

      setUsers(sortedUsers)
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

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
        await fetchUsers(false) // Refresh without showing loading
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
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar usuário")
      }

      const data = await response.json()
      console.log("User updated:", data.user)

      // Update the user in the local state immediately
      setUsers((prevUsers) =>
        prevUsers
          .map((user) =>
            user.id === selectedUser.id ? { ...user, ...data.user, updated_at: new Date().toISOString() } : user,
          )
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
      )

      setIsEditDialogOpen(false)
      setSelectedUser(null)

      toast({
        variant: "success",
        title: "✅ Usuário Atualizado!",
        description: "Informações do usuário foram atualizadas com sucesso!",
      })

      // Refresh data in background to ensure consistency
      setTimeout(() => fetchUsers(false), 1000)
    } catch (err: any) {
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
      const response = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
      console.log("Balance updated:", data)

      // Update the user balance in the local state immediately
      setUsers((prevUsers) =>
        prevUsers
          .map((user) =>
            user.id === selectedUser.id
              ? { ...user, balance: data.newBalance, updated_at: new Date().toISOString() }
              : user,
          )
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
      )

      setIsBalanceDialogOpen(false)
      setSelectedUser(null)

      toast({
        variant: "success",
        title: "💰 Saldo Atualizado!",
        description: `Saldo alterado de R$ ${data.oldBalance.toFixed(2)} para R$ ${data.newBalance.toFixed(2)}`,
      })

      // Refresh data in background to ensure consistency
      setTimeout(() => fetchUsers(false), 1000)
    } catch (err: any) {
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

      // Remove user from local state immediately
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id))

      toast({
        variant: "success",
        title: "🗑️ Usuário Deletado!",
        description: `Usuário ${user.email} foi removido do sistema.`,
      })

      // Refresh data in background to ensure consistency
      setTimeout(() => fetchUsers(false), 1000)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: err.message,
      })
    }
  }

  // Auto-refresh every 30 seconds to keep data fresh
  useEffect(() => {
    fetchUsers()

    const interval = setInterval(() => {
      fetchUsers(false) // Refresh without showing loading spinner
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

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
          <Button variant="outline" onClick={() => fetchUsers(false)} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button variant="outline" onClick={syncUsers} disabled={isSyncing}>
            <Sync className="w-4 h-4 mr-2" />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
        <div className="text-xs text-gray-500">Última atualização: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Auto-refresh Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <RefreshCw className="w-5 h-5" />
            <div>
              <p className="font-semibold">Atualização Automática</p>
              <p className="text-sm">
                Os dados são atualizados automaticamente a cada 30 segundos. Você também pode clicar em "Atualizar" para
                forçar uma atualização imediata.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Info */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Sync className="w-5 h-5" />
            <div>
              <p className="font-semibold">Sincronização de Usuários</p>
              <p className="text-sm">
                Se você criou usuários recentemente e eles não aparecem na lista, clique em "Sincronizar" para importar
                usuários da autenticação para o sistema de gerenciamento.
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
