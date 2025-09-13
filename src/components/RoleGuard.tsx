'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface UserRole {
  charity: boolean;
  patron: boolean;
  moderator: boolean;
  admin: boolean;
}

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('charity' | 'patron' | 'moderator' | 'admin')[];
  redirectTo?: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles = ['charity', 'patron'], 
  redirectTo = '/role-selection' 
}: RoleGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRole | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      checkUserRoles();
    }
  }, [isLoaded, user]);

  const checkUserRoles = async () => {
    try {
      const response = await fetch('/api/users/roles');
      
      if (response.ok) {
        const data = await response.json();
        const roles = data.user.roles as UserRole;
        setUserRoles(roles);

        // Check if user has selected a role
        if (!data.user.roleSelected) {
          router.push('/role-selection');
          return;
        }

        // Check if user has any of the allowed roles
        const hasAllowedRole = allowedRoles.some(role => roles[role]);
        
        if (!hasAllowedRole) {
          router.push(redirectTo);
          return;
        }
      } else {
        // User not found, redirect to role selection
        router.push('/role-selection');
        return;
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
      router.push('/role-selection');
      return;
    } finally {
      setIsChecking(false);
    }
  };

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (!userRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => userRoles[role]);
  
  if (!hasAllowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
