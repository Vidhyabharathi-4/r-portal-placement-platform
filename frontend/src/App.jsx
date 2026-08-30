import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import AppShell from './components/AppShell'
import Auth from './components/Auth'
import { ApplicationsPage, AuditPage, DashboardPage, DrivesPage, NotificationsPage, PlacementTeamPage, RecruitersPage, ReportsPage, StudentsPage } from './pages'
import './App.css'

function sessionFromStorage() { try { return JSON.parse(localStorage.getItem('rportal_session')) } catch { return null } }
function Protected({ session, children }) { return session ? children : <Navigate to="/login" replace/> }
export default function App() { const [session, setSession] = useState(sessionFromStorage); const onAuthenticated = (next) => { localStorage.setItem('rportal_token', next.access_token); localStorage.setItem('rportal_session', JSON.stringify(next)); setSession(next) }; const signOut = () => { localStorage.removeItem('rportal_token'); localStorage.removeItem('rportal_session'); setSession(null) }; return <Routes><Route path="/login" element={session ? <Navigate to="/dashboard" replace/> : <Auth onAuthenticated={onAuthenticated}/>}/><Route path="/register" element={session ? <Navigate to="/dashboard" replace/> : <Auth onAuthenticated={onAuthenticated}/>}/><Route element={<Protected session={session}><AppShell user={session?.user} onSignOut={signOut}/></Protected>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/students" element={<StudentsPage/>}/><Route path="/placement-team" element={<PlacementTeamPage/>}/><Route path="/recruiters" element={<RecruitersPage/>}/><Route path="/drives" element={<DrivesPage/>}/><Route path="/applications" element={<ApplicationsPage/>}/><Route path="/reports" element={<ReportsPage/>}/><Route path="/audit" element={<AuditPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/></Route><Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace/>}/></Routes> }
