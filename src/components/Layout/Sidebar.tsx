'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  roles: string[]
}

export default function Sidebar() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t('navigation.dashboard'),
      roles: ['ADMIN', 'TEAM', 'BUYER', 'SUPPLIER']
    },
    {
      href: '/orders',
      label: t('navigation.orders'),
      roles: ['ADMIN', 'TEAM', 'BUYER']
    },
    {
      href: '/shipments',
      label: t('navigation.shipments'),
      roles: ['ADMIN', 'TEAM', 'BUYER']
    },
    {
      href: '/customers',
      label: t('navigation.customers'),
      roles: ['ADMIN', 'TEAM']
    },
    {
      href: '/suppliers',
      label: t('navigation.suppliers'),
      roles: ['ADMIN', 'TEAM']
    },
    {
      href: '/documents',
      label: t('navigation.documents'),
      roles: ['ADMIN', 'TEAM']
    }
  ]

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'block px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
