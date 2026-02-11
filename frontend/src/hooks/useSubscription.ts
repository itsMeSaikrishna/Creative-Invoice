import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import type { SubscriptionInfo } from '../types/invoice'

interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/subscriptions/me')
      setSubscription(response.data as SubscriptionInfo)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscription'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return { subscription, loading, error, refetch: fetchSubscription }
}
