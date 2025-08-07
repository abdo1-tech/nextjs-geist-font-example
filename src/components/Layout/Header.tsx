'use client'

import { useLanguage, LANGUAGE_OPTIONS } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Header() {
  const { language, setLanguage, t } = useLanguage()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
    } catch (error) {
      console.error('Logout error:', error)
      logout() // Logout anyway
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Company Logo/Name */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Nafru</h1>
          <span className="text-sm text-gray-500">
            {t('auth.welcome')}
          </span>
        </div>

        {/* Right side - Language switcher and user info */}
        <div className="flex items-center space-x-4">
          {/* Language Switcher */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">
                  {user.role}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                {t('auth.logout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
