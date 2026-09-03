import { NextRequest, NextResponse } from 'next/server';
import { getAccountPermissions, getAccountRoles } from '@/lib/permissions';
import { getSession } from '@/lib/mobile-auth';
import { maybeProxyGestao } from "@/lib/gestao-bff"


/**
 * GET /api/auth/permissions
 * 
 * Returns the authenticated user's permissions and roles
 * This endpoint is used by the mobile app to check permissions client-side
 * 
 * @requires Authorization header with Bearer token
 * @returns {
 *   permissions: Array<{ name, display_name, category }>,
 *   roles: Array<{ role_name, role_display_name, context_type, context_name }>,
 *   journey_stage: string
 * }
 */
export async function GET(req: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(req)
  if (__gestaoBff) return __gestaoBff

  try {
    const session = await getSession(req)
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = session.userId
    
    // Get permissions and roles
    const [permissions, roles] = await Promise.all([
      getAccountPermissions(userId),
      getAccountRoles(userId),
    ]);
    
    // Get user's journey stage
    const { sql } = await import('@/lib/db');
    const accountResult = await sql`
      SELECT journey_stage FROM accounts WHERE id = ${userId}::uuid
    `;
    
    const journeyStage = accountResult[0]?.journey_stage || 'visitante';
    
    return NextResponse.json({
      permissions: permissions.map(p => ({
        name: p.permission_name,
        display_name: p.permission_display_name,
        category: p.permission_category,
      })),
      roles: roles.map(r => ({
        role_name: r.name,
        role_display_name: r.display_name,
        context_type: r.context_type,
        context_name: r.context_name,
      })),
      journey_stage: journeyStage,
    });
  } catch (error: any) {
    console.error('Error in permissions endpoint:', error);
    
    if (error.name === 'TokenExpiredError' || error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to get permissions', details: error.message },
      { status: 500 }
    );
  }
}
