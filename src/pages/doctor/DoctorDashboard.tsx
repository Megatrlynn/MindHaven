import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, UserCircle } from 'lucide-react';

const DoctorDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Therapist Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your patient connections and profile</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <NavLink
          to="/doctor/chats"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Patient Connections
        </NavLink>
        <NavLink
          to="/doctor/profile"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <UserCircle className="w-5 h-5 mr-2" />
          My Profile
        </NavLink>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Outlet />
      </div>
    </div>
  );
};

export default DoctorDashboard;