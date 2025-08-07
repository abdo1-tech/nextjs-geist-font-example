'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, getAuthToken } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Header from '@/components/Layout/Header'
import Sidebar from '@/components/Layout/Sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  activeOrders: number
  upcomingShipments: number
  pendingDocuments: number
  totalRevenue: number
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    upcomingShipments: 0,
    pendingDocuments: 0,
    totalRevenue: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      // Fetch orders
      const ordersResponse = await fetch('/api/orders?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const activeOrders = ordersData.orders.filter((order: any) => 
          ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)
        ).length

        const totalRevenue = ordersData.orders.reduce((sum: number, order: any) => 
          sum + order.totalPrice, 0
        )

        setStats(prev => ({
          ...prev,
          activeOrders,
          totalRevenue
        }))
      }

      // Fetch shipments
      const shipmentsResponse = await fetch('/api/shipments?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (shipmentsResponse.ok) {
        const shipmentsData = await shipmentsResponse.json()
        const upcomingShipments = shipmentsData.shipments.filter((shipment: any) => 
          ['PREPARING', 'LOADED'].includes(shipment.status)
        ).length

        setStats(prev => ({
          ...prev,
          upcomingShipments
        }))
      }

      // Fetch documents
      const documentsResponse = await fetch('/api/documents?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json()
        const pendingDocuments = documentsData.documents.filter((doc: any) => 
          doc.status === 'pending'
        ).length

        setStats(prev => ({
          ...prev,
          pendingDocuments
        }))
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('dashboard.overview')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.activeOrders')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.activeOrders}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.upcomingShipments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.upcomingShipments}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.pendingDocuments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.pendingDocuments}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalRevenue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : `$${stats.totalRevenue.toLocaleString()}`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Nafru Export Management System</CardTitle>
              <CardDescription>
                Manage your fruit export operations efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  This system helps you manage orders, track shipments, maintain customer relationships, 
                  and generate export documents for your Egyptian fruit export business.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">🍊 Citrus Fruits</h3>
                    <p className="text-sm text-orange-700">
                      Premium oranges and mandarins from Egyptian farms
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">🍇 Grapes</h3>
                    <p className="text-sm text-purple-700">
                      Fresh grapes with excellent quality standards
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">🥭 Mangoes</h3>
                    <p className="text-sm text-yellow-700">
                      Tropical mangoes with rich flavor and aroma
                    </p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h3 className="font-semibold text-amber-900 mb-2">🥥 Dates</h3>
                    <p className="text-sm text-amber-700">
                      Premium dates from Egyptian oases
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
