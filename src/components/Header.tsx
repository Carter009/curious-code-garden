import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl">
              Bybit P2P Reconciliation
            </Link>
            <nav className="ml-10 space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  {user.name}
                </span>
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <AvatarFallback>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
