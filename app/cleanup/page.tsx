import { AdminCleanup } from "@/components/admin-cleanup"

export default function CleanupPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Limpeza do Sistema</h1>
          <p className="text-gray-600">Ferramenta para resolver problemas de autenticação</p>
        </div>

        <AdminCleanup />

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:underline">
            ← Voltar ao sistema
          </a>
        </div>
      </div>
    </div>
  )
}
