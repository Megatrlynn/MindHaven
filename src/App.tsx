import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import FAQs from './pages/FAQs';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Auth from "./components/Auth";
import Profile from './pages/Profile';
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResetPassword from './pages/ResetPassword';
import Overview from "./pages/admin/Overview";
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManageUsers from './pages/admin/ManageUsers';
import ManageFAQs from './pages/admin/ManageFAQs';
import ManageArticles from './pages/admin/ManageArticles';
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
          <Route path="/chat" element={
            <ProtectedRoute requiredRole='patient'>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/patient-login" element={<Auth />} />
          <Route path="/profile" element={
            <ProtectedRoute requiredRole='patient'>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* <Route path="/contact" element={<ContactUs />} /> */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="doctors" element={<ManageDoctors />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="faqs" element={<ManageFAQs />} />
            <Route path='articles' element={<ManageArticles />} />
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