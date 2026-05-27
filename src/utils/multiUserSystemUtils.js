/**
 * Task 72: Implement multi-user systems
 * User roles and permissions management
 */

export class MultiUserSystem {
  /**
   * Define user roles with permissions
   */
  static readonly ROLES = {
    ADMIN: {
      name: 'Admin',
      permissions: [
        'view_all_users',
        'edit_all_users',
        'delete_users',
        'manage_roles',
        'access_reports',
        'system_settings'
      ]
    },
    MODERATOR: {
      name: 'Moderator',
      permissions: [
        'view_users',
        'edit_own_content',
        'manage_content',
        'access_reports'
      ]
    },
    USER: {
      name: 'User',
      permissions: [
        'view_profile',
        'edit_own_profile',
        'create_content',
        'view_own_data'
      ]
    },
    GUEST: {
      name: 'Guest',
      permissions: [
        'view_public_content'
      ]
    }
  };

  /**
   * Check if user has permission
   */
  static hasPermission(userRole, permission) {
    const role = this.ROLES[userRole];
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  /**
   * Get user with role-based data
   */
  static async getUserWithRole(db, userId) {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      return {
        ...userData,
        role: userData.role || 'USER',
        permissions: this.ROLES[userData.role || 'USER'].permissions
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(db, userId, newRole) {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      
      if (!this.ROLES[newRole]) {
        throw new Error('Invalid role');
      }

      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign permissions to user
   */
  static async assignPermissions(db, userId, permissions) {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      
      await updateDoc(doc(db, 'users', userId), {
        customPermissions: permissions,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning permissions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all users by role
   */
  static async getUsersByRole(db, role) {
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      
      const q = query(collection(db, 'users'), where('role', '==', role));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }
}

export default MultiUserSystem;
