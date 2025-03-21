import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import FAQs from './pages/FAQs';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManageUsers from './pages/admin/ManageUsers';
import ManageFAQs from './pages/admin/ManageFAQs';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorChats from './pages/doctor/DoctorChats';
import DoctorProfile from './pages/doctor/DoctorProfile';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="doctors" replace />} />
            <Route path="doctors" element={<ManageDoctors />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="faqs" element={<ManageFAQs />} />
          </Route>
          <Route path="/doctor" element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="chats" replace />} />
            <Route path="chats" element={<DoctorChats />} />
            <Route path="profile" element={<DoctorProfile />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;