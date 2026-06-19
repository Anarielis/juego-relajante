import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';

// Lazy loading of Pages & Games
const Welcome = React.lazy(() => import('./pages/Welcome'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Games
const ZenGarden = React.lazy(() => import('./games/ZenGarden'));
const PopIt = React.lazy(() => import('./games/PopIt'));
const Breathing = React.lazy(() => import('./games/Breathing'));
const Slime = React.lazy(() => import('./games/Slime'));
const LightRain = React.lazy(() => import('./games/LightRain'));

// Calming loader indicator for lazy bundle downloads
const SoothingLoader = () => (
  <div className="flex-1 flex flex-col justify-center items-center h-[60vh] select-none">
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pastel-rose via-pastel-lavender to-pastel-sky opacity-80 blur-xs animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-0 w-16 h-16 rounded-full bg-indigo-200/50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-lg animate-pulse-gentle">
        🧘
      </div>
    </div>
    <span className="mt-4 font-nunito text-xs text-slate-400 font-semibold tracking-wider">
      CalmSpace...
    </span>
  </div>
);

// Protected routes checker wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SoothingLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirect logged-in users away from Welcome/Login
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SoothingLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <Router>
          <MainLayout>
            <Suspense fallback={<SoothingLoader />}>
              <Routes>
                {/* Public Access Entry points */}
                <Route path="/" element={
                  <PublicRoute>
                    <Welcome />
                  </PublicRoute>
                } />
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />

                {/* Dashboard & Profile pages */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Interactive ASMR Games */}
                <Route path="/game/zen-garden" element={
                  <ProtectedRoute>
                    <ZenGarden />
                  </ProtectedRoute>
                } />
                <Route path="/game/pop-it" element={
                  <ProtectedRoute>
                    <PopIt />
                  </ProtectedRoute>
                } />
                <Route path="/game/breathing" element={
                  <ProtectedRoute>
                    <Breathing />
                  </ProtectedRoute>
                } />
                <Route path="/game/slime" element={
                  <ProtectedRoute>
                    <Slime />
                  </ProtectedRoute>
                } />
                <Route path="/game/light-rain" element={
                  <ProtectedRoute>
                    <LightRain />
                  </ProtectedRoute>
                } />

                {/* Wildcard Fallback redirection */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </Router>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
