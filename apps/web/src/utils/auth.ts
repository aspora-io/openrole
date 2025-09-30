import { NextRequest, NextResponse } from 'next/server';

// Route configurations
export const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/about',
  '/contact',
  '/privacy',
  '/terms'
];

export const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

export const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/cv',
  '/portfolio',
  '/search',
  '/settings',
  '/privacy-settings'
];

export const recruiterOnlyRoutes = [
  '/recruiter',
  '/candidates',
  '/job-postings'
];

export const adminOnlyRoutes = [
  '/admin'
];

// Helper functions for route checking
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

export function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route));
}

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

export function isRecruiterOnlyRoute(pathname: string): boolean {
  return recruiterOnlyRoutes.some(route => pathname.startsWith(route));
}

export function isAdminOnlyRoute(pathname: string): boolean {
  return adminOnlyRoutes.some(route => pathname.startsWith(route));
}

// JWT token validation
export function isValidToken(token: string): boolean {
  if (!token) return false;
  
  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp > now;
  } catch (error) {
    return false;
  }
}

// Extract user info from token
export function getUserFromToken(token: string): any | null {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

// Middleware helper for Next.js
export function createAuthMiddleware() {
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('auth_token')?.value;

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token || !isValidToken(token)) {
      if (isProtectedRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // Get user from token
    const user = getUserFromToken(token);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Check role-based access
    if (isRecruiterOnlyRoute(pathname) && user.role !== 'RECRUITER') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    if (isAdminOnlyRoute(pathname) && user.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  };
}

// Client-side auth utilities
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    return null;
  }
}

export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}

export function setAuthData(token: string, user: any): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(user));
}

// Auth headers for API requests
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Role checking utilities
export function hasRole(requiredRole: string, userRole?: string): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === 'ADMIN') return true;
  
  return userRole === requiredRole;
}

export function hasAnyRole(requiredRoles: string[], userRole?: string): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === 'ADMIN') return true;
  
  return requiredRoles.includes(userRole);
}

// Permission checking
export function canAccessProfile(profileUserId: string, currentUserId?: string, currentUserRole?: string): boolean {
  if (!currentUserId) return false;
  
  // Admin can access any profile
  if (currentUserRole === 'ADMIN') return true;
  
  // Users can access their own profile
  if (profileUserId === currentUserId) return true;
  
  // Recruiters can access candidate profiles (implement privacy rules separately)
  if (currentUserRole === 'RECRUITER') return true;
  
  return false;
}

export function canEditProfile(profileUserId: string, currentUserId?: string, currentUserRole?: string): boolean {
  if (!currentUserId) return false;
  
  // Admin can edit any profile
  if (currentUserRole === 'ADMIN') return true;
  
  // Users can only edit their own profile
  return profileUserId === currentUserId;
}

export function canDeleteProfile(profileUserId: string, currentUserId?: string, currentUserRole?: string): boolean {
  if (!currentUserId) return false;
  
  // Admin can delete any profile
  if (currentUserRole === 'ADMIN') return true;
  
  // Users can delete their own profile
  return profileUserId === currentUserId;
}

// Session management
export function isSessionExpired(): boolean {
  const token = getStoredToken();
  return !token || !isValidToken(token);
}

export function getSessionTimeRemaining(): number {
  const token = getStoredToken();
  if (!token || !isValidToken(token)) return 0;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  } catch (error) {
    return 0;
  }
}

export function shouldRefreshToken(): boolean {
  const timeRemaining = getSessionTimeRemaining();
  // Refresh if less than 15 minutes remaining
  return timeRemaining > 0 && timeRemaining < 15 * 60;
}