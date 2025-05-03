
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  UserPlus, 
  Settings, 
  UserCircle, 
  LogOut 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-zinc-900 text-white min-h-screen w-60 py-6 hidden md:block">
      <div className="px-4 text-center mb-6">
        <h4 className="text-lg font-semibold">Bybit P2P</h4>
        <p className="text-sm text-zinc-400">Reconciliation Dashboard</p>
      </div>
      
      <hr className="border-zinc-700 mx-4" />
      
      <ul className="mt-6 space-y-2 px-2">
        <li>
          <Link 
            to="/" 
            className={cn(
              "flex items-center px-4 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors",
              isActive('/') && "bg-zinc-800 text-white"
            )}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
        </li>
        
        {user?.isAdmin && (
          <>
            <li>
              <Link 
                to="/admin" 
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors",
                  isActive('/admin') && "bg-zinc-800 text-white"
                )}
              >
                <Settings className="h-5 w-5 mr-3" />
                Admin Panel
              </Link>
            </li>
            <li>
              <Link 
                to="/create-user" 
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors",
                  isActive('/create-user') && "bg-zinc-800 text-white"
                )}
              >
                <UserPlus className="h-5 w-5 mr-3" />
                Create User
              </Link>
            </li>
          </>
        )}
        
        <li>
          <Link 
            to="/profile" 
            className={cn(
              "flex items-center px-4 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors",
              isActive('/profile') && "bg-zinc-800 text-white"
            )}
          >
            <UserCircle className="h-5 w-5 mr-3" />
            Profile
          </Link>
        </li>
        
        <li>
          <button 
            onClick={logout}
            className="flex w-full items-center px-4 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};
