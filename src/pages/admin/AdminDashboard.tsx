import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Users, UserCog, MessageCircle } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage doctors, users, and FAQs of the platform</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <NavLink
          to="/admin/doctors"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <Users className="w-5 h-5 mr-2" />
          Manage Doctors
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <UserCog className="w-5 h-5 mr-2" />
          Manage Users
        </NavLink>
        <NavLink
          to="/admin/faqs"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Manage FAQs
        </NavLink>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminDashboard;