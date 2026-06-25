import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const Goals = lazy(() => import('./pages/Goals.jsx'));
const GoalDetail = lazy(() => import('./pages/GoalDetail.jsx'));
const Calendar = lazy(() => import('./pages/Calendar.jsx'));
const Progress = lazy(() => import('./pages/Progress.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Observability = lazy(() => import('./pages/Observability.jsx'));

function SuspenseWrapper({ Component }) {
  return (
    <Suspense fallback={<div className='min-h-full min-w-full bg-[#020617] animate-pulse' />}>
      <Component />
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to='/login' />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path='/' element={<Dashboard />} />
            <Route path='/goals' element={<SuspenseWrapper Component={Goals} />} />
            <Route path='/goals/:id' element={<SuspenseWrapper Component={GoalDetail} />} />
            <Route path='/calendar' element={<SuspenseWrapper Component={Calendar} />} />
            <Route path='/progress' element={<SuspenseWrapper Component={Progress} />} />
            <Route path='/profile' element={<SuspenseWrapper Component={Profile} />} />
            <Route path='/observability' element={<SuspenseWrapper Component={Observability} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
