import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export function EnvError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">Configuração Necessária</CardTitle>
            <CardDescription className="text-red-600">
              As variáveis de ambiente do Supabase não foram configuradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Variáveis necessárias:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                <li>• SUPABASE_SERVICE_ROLE_KEY (opcional)</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Como configurar:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Crie um projeto no Supabase</li>
                <li>2. Copie as chaves do dashboard</li>
                <li>3. Configure as variáveis de ambiente</li>
                <li>4. Reinicie a aplicação</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
