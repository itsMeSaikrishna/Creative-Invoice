export interface User {
  id: string
  email: string
  created_at: string
  user_metadata: Record<string, unknown>
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface BuyerGSTIN {
  id: string
  user_id: string
  gstin: string
  buyer_name: string
  is_default: boolean
  created_at: string
}
