import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Users, UserCog, MessageCircle, Home, FileText } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="max-w-fit mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        {/* <p className="mt-2 text-gray-600">Manage doctors, users, FAQs, articles, and platform overview</p> */}
      </div>

      <div className="flex space-x-4 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4">
        <NavLink
          to="/admin/overview"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <Home className="w-5 h-5 mr-2"  />
          Overview
        </NavLink>
        <NavLink
          to="/admin/doctors"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <Users className="w-5 h-5 mr-2" />
          Therapists
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <UserCog className="w-5 h-5 mr-2" />
          Users
        </NavLink>
        <NavLink
          to="/admin/faqs"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          FAQs
        </NavLink>
        <NavLink
          to="/admin/articles"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <FileText className="w-5 h-5 mr-2" />
          Articles
        </NavLink>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
