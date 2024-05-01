import React from 'react'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  React.useEffect(() => {
    navigate('/')
  }, [])

  return (
    null
  )
}