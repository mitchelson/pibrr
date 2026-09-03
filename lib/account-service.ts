/**
 * Account Service Layer (Dual-Write Implementation)
 * 
 * This service handles the dual-write pattern during migration.
 * It writes to both the old `users` table and new `accounts` table
 * to ensure zero-downtime migration.
 * 
 * Usage:
 * - Copy this file to your Next.js backend (e.g., lib/account-service.ts)
 * - Replace direct database writes with calls to these service functions
 * - Once migration is complete, remove the dual-write logic
 * 
 * @requires @/lib/db
 * @requires ./feature-flags
 * @requires ./permissions
 */

import { sql } from '@/lib/db'
import { isFeatureEnabled } from './feature-flags';
import { assignRole, removeRole, createContext } from './permissions';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAccountInput {
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  auth_provider?: string;
  auth_provider_id?: string;
  journey_stage?: 'visitante' | 'congregado' | 'membro' | 'líder' | 'pastor' | 'admin';
}

export interface UpdateAccountInput {
  name?: string;
  avatar_url?: string;
  phone?: string;
  journey_stage?: 'visitante' | 'congregado' | 'membro' | 'líder' | 'pastor' | 'admin';
  is_active?: boolean;
  is_verified?: boolean;
}

// ============================================================================
// ACCOUNT CRUD (with Dual-Write)
// ============================================================================

/**
 * Create a new account (dual-write to users and accounts)
 */
export async function createAccount(input: CreateAccountInput): Promise<string> {
  const useNewSystem = await isFeatureEnabled('use_new_permissions');
  
  try {
    if (useNewSystem) {
      // PHASE 3+: Write only to new accounts table
      const result = await sql`
        INSERT INTO accounts (
          email, name, avatar_url, phone, 
          auth_provider, auth_provider_id, journey_stage
        )
        VALUES (
          ${input.email},
          ${input.name},
          ${input.avatar_url || null},
          ${input.phone || null},
          ${input.auth_provider || 'google'},
          ${input.auth_provider_id || null},
          ${input.journey_stage || 'visitante'}
        )
        RETURNING id
      `;
      
      const accountId = result[0].id;
      
      // Assign default role based on journey_stage
      const defaultRole = input.journey_stage || 'visitante';
      await assignRole(accountId, defaultRole);
      
      return accountId;
    } else {
      // PHASE 2: Dual-write to both tables
      
      // 1. Write to old users table
      const oldResult = await sql`
        INSERT INTO users (
          email, nome, avatar_url, telefone, 
          auth_provider, google_id, role
        )
        VALUES (
          ${input.email},
          ${input.name},
          ${input.avatar_url || null},
          ${input.phone || null},
          ${input.auth_provider || 'google'},
          ${input.auth_provider_id || null},
          ${mapJourneyStageToOldRole(input.journey_stage)}
        )
        RETURNING id
      `;
      
      const userId = oldResult[0].id;
      
      // 2. Write to new accounts table (with same ID)
      await sql`
        INSERT INTO accounts (
          id, email, name, avatar_url, phone, 
          auth_provider, auth_provider_id, journey_stage
        )
        VALUES (
          ${userId}::uuid,
          ${input.email},
          ${input.name},
          ${input.avatar_url || null},
          ${input.phone || null},
          ${input.auth_provider || 'google'},
          ${input.auth_provider_id || null},
          ${input.journey_stage || 'visitante'}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      // 3. Assign default role
      const defaultRole = input.journey_stage || 'visitante';
      await assignRole(userId, defaultRole);
      
      return userId;
    }
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

/**
 * Update an account (dual-write to users and accounts)
 */
export async function updateAccount(
  accountId: string, 
  input: UpdateAccountInput
): Promise<void> {
  const useNewSystem = await isFeatureEnabled('use_new_permissions');
  
  try {
    if (useNewSystem) {
      // PHASE 3+: Write only to new accounts table
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      if (input.avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(input.avatar_url);
      }
      if (input.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(input.phone);
      }
      if (input.journey_stage !== undefined) {
        updates.push(`journey_stage = $${paramIndex++}`);
        values.push(input.journey_stage);
      }
      if (input.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(input.is_active);
      }
      if (input.is_verified !== undefined) {
        updates.push(`is_verified = $${paramIndex++}`);
        values.push(input.is_verified);
      }
      
      if (updates.length > 0) {
        updates.push(`updated_at = now()`);
        values.push(accountId);
        
        await sql.query(
          `UPDATE accounts SET ${updates.join(', ')} WHERE id = $${paramIndex}::uuid`,
          values
        );
      }
    } else {
      // PHASE 2: Dual-write to both tables
      
      // 1. Update old users table
      const oldUpdates: string[] = [];
      const oldValues: any[] = [];
      let oldParamIndex = 1;
      
      if (input.name !== undefined) {
        oldUpdates.push(`nome = $${oldParamIndex++}`);
        oldValues.push(input.name);
      }
      if (input.avatar_url !== undefined) {
        oldUpdates.push(`avatar_url = $${oldParamIndex++}`);
        oldValues.push(input.avatar_url);
      }
      if (input.phone !== undefined) {
        oldUpdates.push(`telefone = $${oldParamIndex++}`);
        oldValues.push(input.phone);
      }
      if (input.journey_stage !== undefined) {
        oldUpdates.push(`role = $${oldParamIndex++}`);
        oldValues.push(mapJourneyStageToOldRole(input.journey_stage));
      }
      if (input.is_active !== undefined) {
        oldUpdates.push(`is_active = $${oldParamIndex++}`);
        oldValues.push(input.is_active);
      }
      
      if (oldUpdates.length > 0) {
        oldUpdates.push(`atualizado_em = now()`);
        oldValues.push(accountId);
        
        await sql.query(
          `UPDATE users SET ${oldUpdates.join(', ')} WHERE id = $${oldParamIndex}::uuid`,
          oldValues
        );
      }
      
      // 2. Update new accounts table
      const newUpdates: string[] = [];
      const newValues: any[] = [];
      let newParamIndex = 1;
      
      if (input.name !== undefined) {
        newUpdates.push(`name = $${newParamIndex++}`);
        newValues.push(input.name);
      }
      if (input.avatar_url !== undefined) {
        newUpdates.push(`avatar_url = $${newParamIndex++}`);
        newValues.push(input.avatar_url);
      }
      if (input.phone !== undefined) {
        newUpdates.push(`phone = $${newParamIndex++}`);
        newValues.push(input.phone);
      }
      if (input.journey_stage !== undefined) {
        newUpdates.push(`journey_stage = $${newParamIndex++}`);
        newValues.push(input.journey_stage);
      }
      if (input.is_active !== undefined) {
        newUpdates.push(`is_active = $${newParamIndex++}`);
        newValues.push(input.is_active);
      }
      if (input.is_verified !== undefined) {
        newUpdates.push(`is_verified = $${newParamIndex++}`);
        newValues.push(input.is_verified);
      }
      
      if (newUpdates.length > 0) {
        newUpdates.push(`updated_at = now()`);
        newValues.push(accountId);
        
        await sql.query(
          `UPDATE accounts SET ${newUpdates.join(', ')} WHERE id = $${newParamIndex}::uuid`,
          newValues
        );
      }
    }
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

/**
 * Delete an account (dual-write to users and accounts)
 */
export async function deleteAccount(accountId: string): Promise<void> {
  const useNewSystem = await isFeatureEnabled('use_new_permissions');
  
  try {
    if (useNewSystem) {
      // PHASE 3+: Delete only from accounts (cascade will handle related records)
      await sql`DELETE FROM accounts WHERE id = ${accountId}::uuid`;
    } else {
      // PHASE 2: Delete from both tables
      await sql`DELETE FROM users WHERE id = ${accountId}::uuid`;
      await sql`DELETE FROM accounts WHERE id = ${accountId}::uuid`;
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(accountId: string): Promise<void> {
  const useNewSystem = await isFeatureEnabled('use_new_permissions');
  
  try {
    if (useNewSystem) {
      await sql`
        UPDATE accounts 
        SET last_login_at = now() 
        WHERE id = ${accountId}::uuid
      `;
    } else {
      // Dual-write
      await sql`
        UPDATE users 
        SET last_login_at = now(), atualizado_em = now() 
        WHERE id = ${accountId}::uuid
      `;
      await sql`
        UPDATE accounts 
        SET last_login_at = now(), updated_at = now() 
        WHERE id = ${accountId}::uuid
      `;
    }
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
}

// ============================================================================
// MINISTRY OPERATIONS (with Context Creation)
// ============================================================================

/**
 * Create a ministry (also creates a context for role assignments)
 */
export async function createMinistry(
  name: string,
  description: string,
  leaderId?: string
): Promise<string> {
  try {
    // Create ministry in database
    const result = await sql`
      INSERT INTO ministerios (nome, descricao, lider_id)
      VALUES (${name}, ${description}, ${leaderId || null})
      RETURNING id
    `;
    
    const ministryId = result[0].id;
    
    // Create context for this ministry
    await createContext('ministry', ministryId, name, description);
    
    // If leader is specified, assign leader role in this ministry context
    if (leaderId) {
      const contextResult = await sql`
        SELECT id FROM contexts 
        WHERE context_type = 'ministry' AND context_id = ${ministryId}::uuid
      `;
      const contextId = contextResult[0].id;
      
      await assignRole(leaderId, 'lider', contextId);
    }
    
    return ministryId;
  } catch (error) {
    console.error('Error creating ministry:', error);
    throw error;
  }
}

/**
 * Add member to ministry (assigns membro role in ministry context)
 */
export async function addMemberToMinistry(
  ministryId: string,
  userId: string
): Promise<void> {
  try {
    // Add to ministerio_membros table
    await sql`
      INSERT INTO ministerio_membros (ministerio_id, user_id)
      VALUES (${ministryId}::uuid, ${userId}::uuid)
      ON CONFLICT (ministerio_id, user_id) DO NOTHING
    `;
    
    // Assign membro role in ministry context
    const contextResult = await sql`
      SELECT id FROM contexts 
      WHERE context_type = 'ministry' AND context_id = ${ministryId}::uuid
    `;
    
    if (contextResult.length > 0) {
      const contextId = contextResult[0].id;
      await assignRole(userId, 'membro', contextId);
    }
  } catch (error) {
    console.error('Error adding member to ministry:', error);
    throw error;
  }
}

/**
 * Remove member from ministry (removes role)
 */
export async function removeMemberFromMinistry(
  ministryId: string,
  userId: string
): Promise<void> {
  try {
    // Remove from ministerio_membros table
    await sql`
      DELETE FROM ministerio_membros 
      WHERE ministerio_id = ${ministryId}::uuid AND user_id = ${userId}::uuid
    `;
    
    // Remove role from ministry context
    const contextResult = await sql`
      SELECT id FROM contexts 
      WHERE context_type = 'ministry' AND context_id = ${ministryId}::uuid
    `;
    
    if (contextResult.length > 0) {
      const contextId = contextResult[0].id;
      await removeRole(userId, 'membro', contextId);
    }
  } catch (error) {
    console.error('Error removing member from ministry:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map journey_stage to old role field (for backwards compatibility)
 */
function mapJourneyStageToOldRole(
  journeyStage?: string
): 'admin' | 'supervisor' | 'lider' | 'membro' {
  switch (journeyStage) {
    case 'admin':
    case 'pastor':
      return 'admin';
    case 'líder':
      return 'lider';
    case 'membro':
    case 'congregado':
      return 'membro';
    default:
      return 'membro';
  }
}

/**
 * Map old role to journey_stage
 */
function mapOldRoleToJourneyStage(
  role: string
): 'visitante' | 'congregado' | 'membro' | 'líder' | 'pastor' | 'admin' {
  switch (role) {
    case 'admin':
      return 'admin';
    case 'supervisor':
      return 'líder';
    case 'lider':
      return 'líder';
    case 'membro':
      return 'membro';
    default:
      return 'visitante';
  }
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Sync an account from users to accounts table (one-way sync for backfill)
 */
export async function syncUserToAccount(userId: string): Promise<void> {
  try {
    const userResult = await sql`
      SELECT * FROM users WHERE id = ${userId}::uuid
    `;
    
    if (userResult.length === 0) {
      throw new Error(`User ${userId} not found`);
    }
    
    const user = userResult[0];
    
    // Insert or update account
    await sql`
      INSERT INTO accounts (
        id, email, name, avatar_url, phone, 
        auth_provider, auth_provider_id, 
        journey_stage, is_active, is_verified,
        created_at, updated_at, last_login_at
      )
      VALUES (
        ${user.id}::uuid,
        ${user.email},
        ${user.nome},
        ${user.avatar_url},
        ${user.telefone},
        ${user.auth_provider || 'google'},
        ${user.google_id},
        ${mapOldRoleToJourneyStage(user.role)},
        ${user.is_active !== false},
        ${true},
        ${user.criado_em},
        ${user.atualizado_em},
        ${user.last_login_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone,
        updated_at = now()
    `;
    
    // Assign role
    await assignRole(userId, user.role);
    
    console.log(`Synced user ${userId} to accounts`);
  } catch (error) {
    console.error(`Error syncing user ${userId}:`, error);
    throw error;
  }
}
