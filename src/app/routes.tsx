import { createHashRouter, Navigate } from 'react-router'
import LoginPage from './pages/LoginPage'
import TemplatePage from './pages/TemplatePage'

export const router = createHashRouter([
  { index: true, element: <Navigate to="/login" replace /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'templates', element: <TemplatePage /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])
