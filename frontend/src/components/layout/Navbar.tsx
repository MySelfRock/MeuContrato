'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/store'
import { UserPlan } from '@/types'

export function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getPlanBadge = (plan: UserPlan) => {
    switch (plan) {
      case UserPlan.FREE:
        return <Badge variant="secondary">Free</Badge>
      case UserPlan.PRO:
        return <Badge variant="default">Pro</Badge>
      case UserPlan.BUSINESS:
        return <Badge variant="success">Business</Badge>
      default:
        return null
    }
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MeuContrato</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/templates"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/dashboard/contracts"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Meus Contratos
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.credits} créditos
                    </p>
                  </div>
                  {getPlanBadge(user.plan)}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
