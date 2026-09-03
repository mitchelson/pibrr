/**
 * Authentication and Authorization Middleware
 * 
 * This file provides middleware functions for protecting API routes
 * with authentication and permission checks.
 * 
 * Usage:
 * - Copy this file to your Next.js backend (e.g., lib/auth-middleware.ts)
 * - Use withAuth() to protect routes requiring authentication
 * - Use withPermission() to protect routes requiring specific permissions
 * 
 * @requires next
 * @requires jsonwebtoken
 * @requires ./permissions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { hasPermission, hasRole, getAccountById } from './permissions';

// Extend NextApiRequest to include user information
export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    name: string;
    journey_stage: string;
  };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Verify JWT token and attach user to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify JWT token
      const secret = process.env.AUTH_MOBILE_SECRET || process.env.AUTH_SECRET;
      if (!secret) {
        throw new Error('AUTH_MOBILE_SECRET or AUTH_SECRET not configured');
      }

      const decoded = verify(token, secret) as any;
      
      // Get full account info from database
      const account = await getAccountById(decoded.userId || decoded.id);
      if (!account || !account.is_active) {
        return res.status(401).json({ error: 'Account not found or inactive' });
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: account.id,
        email: account.email,
        name: account.name,
        journey_stage: account.journey_stage,
      };

      // Call the actual handler
      return handler(req as AuthenticatedRequest, res);
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE (Permission-based)
// ============================================================================

/**
 * Check if user has a specific permission before allowing access
 * 
 * @param permissionName - Permission name (e.g., "escalas:create")
 * @param getContextId - Optional function to extract context ID from request
 * 
 * @example
 * export default withAuth(
 *   withPermission('escalas:create', (req) => req.query.ministryId as string)(
 *     async (req, res) => {
 *       // Handler code here
 *     }
 *   )
 * );
 */
export function withPermission(
  permissionName: string,
  getContextId?: (req: AuthenticatedRequest) => string | undefined
) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        // Extract context ID if function is provided
        const contextId = getContextId ? getContextId(req) : undefined;
        
        // Check if user has permission
        const hasPerm = await hasPermission(req.user.id, permissionName, contextId);
        
        if (!hasPerm) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: `You don't have permission to ${permissionName}` 
          });
        }

        // Call the actual handler
        return handler(req, res);
      } catch (error) {
        console.error('Permission check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}

/**
 * Check if user has a specific role before allowing access
 * 
 * @param roleName - Role name (e.g., "admin", "lider")
 * @param getContextId - Optional function to extract context ID from request
 * 
 * @example
 * export default withAuth(
 *   withRole('admin')(
 *     async (req, res) => {
 *       // Handler code here
 *     }
 *   )
 * );
 */
export function withRole(
  roleName: string,
  getContextId?: (req: AuthenticatedRequest) => string | undefined
) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        // Extract context ID if function is provided
        const contextId = getContextId ? getContextId(req) : undefined;
        
        // Check if user has role
        const hasRoleAccess = await hasRole(req.user.id, roleName, contextId);
        
        if (!hasRoleAccess) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: `You must be a ${roleName} to access this resource` 
          });
        }

        // Call the actual handler
        return handler(req, res);
      } catch (error) {
        console.error('Role check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}

// ============================================================================
// MINISTRY LEADER AUTHORIZATION
// ============================================================================

/**
 * Check if user is a leader of a specific ministry
 * 
 * @param getMinistryId - Function to extract ministry ID from request
 * 
 * @example
 * export default withAuth(
 *   withMinistryLeader((req) => req.query.ministryId as string)(
 *     async (req, res) => {
 *       // Handler code here
 *     }
 *   )
 * );
 */
export function withMinistryLeader(
  getMinistryId: (req: AuthenticatedRequest) => string
) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        const ministryId = getMinistryId(req);
        
        if (!ministryId) {
          return res.status(400).json({ error: 'Ministry ID is required' });
        }
        
        // Check if user is admin (admins can access any ministry)
        const isAdmin = await hasRole(req.user.id, 'admin');
        if (isAdmin) {
          return handler(req, res);
        }
        
        // Check if user has escalas:read_ministry permission in this ministry context
        // This will be true for leaders and supervisors of this ministry
        const canManage = await hasPermission(
          req.user.id, 
          'escalas:read_ministry', 
          ministryId
        );
        
        if (!canManage) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'You must be a leader of this ministry to access this resource' 
          });
        }

        // Call the actual handler
        return handler(req, res);
      } catch (error) {
        console.error('Ministry leader check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}

// ============================================================================
// BACKWARDS COMPATIBILITY (for migration phase)
// ============================================================================

/**
 * Old-style role check middleware (for backwards compatibility during migration)
 * 
 * @deprecated Use withRole or withPermission instead
 */
export function withOldStyleRole(
  allowedRoles: Array<'admin' | 'supervisor' | 'lider' | 'membro'>
) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        // Check if user has any of the allowed roles
        for (const role of allowedRoles) {
          const hasRoleAccess = await hasRole(req.user.id, role);
          if (hasRoleAccess) {
            return handler(req, res);
          }
        }
        
        // Fallback: check old users table
        try {
          const { sql } = await import('@/lib/db');
          const result = await sql`
            SELECT role FROM users WHERE id = ${req.user.id}::uuid
          `;
          
          if (result[0] && allowedRoles.includes(result[0].role)) {
            return handler(req, res);
          }
        } catch (error) {
          // Ignore error, continue to forbidden response
        }
        
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `You must have one of these roles: ${allowedRoles.join(', ')}` 
        });
      } catch (error) {
        console.error('Role check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract account ID from various request sources
 * Useful for resource ownership checks
 */
export function getAccountIdFromRequest(req: AuthenticatedRequest): string {
  return req.user.id;
}

/**
 * Check if the requesting user is the owner of a resource
 * 
 * @param req - Authenticated request
 * @param resourceOwnerId - UUID of the resource owner
 * @returns boolean
 */
export function isResourceOwner(req: AuthenticatedRequest, resourceOwnerId: string): boolean {
  return req.user.id === resourceOwnerId;
}

/**
 * Check if user can access resource (owner OR has permission)
 * 
 * @param req - Authenticated request
 * @param resourceOwnerId - UUID of the resource owner
 * @param permissionName - Permission name to check
 * @param contextId - Optional context ID
 * @returns Promise<boolean>
 */
export async function canAccessResource(
  req: AuthenticatedRequest,
  resourceOwnerId: string,
  permissionName: string,
  contextId?: string
): Promise<boolean> {
  // Owner can always access their own resources
  if (isResourceOwner(req, resourceOwnerId)) {
    return true;
  }
  
  // Check if user has permission
  return hasPermission(req.user.id, permissionName, contextId);
}
