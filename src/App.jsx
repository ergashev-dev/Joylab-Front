import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import Inquiries from './pages/Inquiries'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Register from './pages/Register'
import Compare from './pages/Compare'
import VerifyEmail from './pages/VerifyEmail'

// Admin va sotuvchi sahifalari alohida yuklanadi: oddiy tashrif buyuruvchi ularni yuklamaydi
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const PropertyEditor = lazy(() => import('./pages/PropertyEditor'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="compare" element={<Compare />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="favorites"
          element={
            <RequireAuth>
              <Favorites />
            </RequireAuth>
          }
        />
        <Route
          path="inquiries"
          element={
            <RequireAuth>
              <Inquiries />
            </RequireAuth>
          }
        />
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="dashboard/new"
          element={
            <RequireAuth>
              <PropertyEditor />
            </RequireAuth>
          }
        />
        <Route
          path="dashboard/:id/edit"
          element={
            <RequireAuth>
              <PropertyEditor />
            </RequireAuth>
          }
        />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
