import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { checkUserRole } from '../middleware/authMiddleware';

/**
 * Task 48: Build admin panel with Firebase
 * Admin-only dashboard for managing system
 */

export const AdminPanel = ({ user }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAdminAccess();
  }, [user]);

  const verifyAdminAccess = async () => {
    if (user) {
      const hasAccess = await checkUserRole(user.uid, 'admin');
      setIsAdmin(hasAccess);
      if (hasAccess) {
        loadAdminData(activeTab);
      }
    }
  };

  const loadAdminData = async (tab) => {
    if (!isAdmin) return;
    try {
      const collectionName = tab === 'users' ? 'users' : tab === 'orders' ? 'orders' : 'reports';
      const snapshot = await getDocs(collection(db, collectionName));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(items);
      setLoading(false);
    } catch (error) {
      console.error(`Error loading ${tab}:`, error);
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLoading(true);
    loadAdminData(tab);
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, activeTab, id));
      setData(data.filter(item => item.id !== id));
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setData(data.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Role updated');
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (!isAdmin) {
    return <div className="admin-denied">Access Denied. Admin privileges required.</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => handleTabChange('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => handleTabChange('orders')}
        >
          Orders
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''} 
          onClick={() => handleTabChange('reports')}
        >
          Reports
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name/Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td>{item.id.substring(0, 8)}</td>
                  <td>
                    {activeTab === 'users' ? item.displayName : 
                     activeTab === 'orders' ? `Order #${item.id}` : 
                     item.title}
                  </td>
                  <td>
                    {activeTab === 'users' ? (
                      <select 
                        value={item.role || 'user'}
                        onChange={(e) => handleUpdateRole(item.id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    ) : (
                      item.status || 'N/A'
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
