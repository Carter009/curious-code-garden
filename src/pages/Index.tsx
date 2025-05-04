
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

const Index = () => {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If logged in, redirect to dashboard
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Don't render anything if we're about to redirect
  if (user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-3xl text-center space-y-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Bybit P2P Order Reconciliation</h1>
        <p className="text-xl text-gray-600">
          Easily manage, track, and reconcile your Bybit P2P orders.
        </p>
        <div className="space-y-4">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <p className="text-sm text-gray-500 pt-4">
            For testing, use admin@example.com / password
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
