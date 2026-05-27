import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Task 49: Create authentication middleware
 * Protects routes and components from unauthorized access
 */

export const withAuthProtection = (Component) => {
  return (props) => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(null);
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setIsAuthenticated(!!currentUser);
        setUser(currentUser);
      });
      return () => unsubscribe();
    }, []);

    if (isAuthenticated === null) return <div>Loading...</div>;

    return isAuthenticated ? <Component {...props} user={user} /> : <div>Access Denied</div>;
  };
};

/**
 * Check user role for admin protection
 */
export const checkUserRole = async (uid, requiredRole) => {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userRole = userDoc.data()?.role || 'user';
    return userRole === requiredRole || userRole === 'admin';
  } catch (error) {
    console.error('Role check error:', error);
    return false;
  }
};

/**
 * Get current user profile with role
 */
export const getCurrentUserProfile = async (uid) => {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data() || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
