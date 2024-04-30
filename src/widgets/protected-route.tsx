import { useAppSelector } from '@/shared/store/hooks'
import { selectAuthState } from '@/shared/store/slices/account'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: React.PropsWithChildren) {
  const authorized = useAppSelector(selectAuthState)

  if(!authorized) {
    return <Navigate to='/login' replace />
  }

  return children
}