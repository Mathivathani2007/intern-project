import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 67: Create order management system
 * Complete order management with status tracking
 */

export const OrderManagement = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    items: [],
    totalAmount: 0,
    shippingAddress: '',
    paymentMethod: 'card'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderDoc = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        ...newOrder,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      alert('Order created successfully!');
      setNewOrder({ items: [], totalAmount: 0, shippingAddress: '', paymentMethod: 'card' });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      fetchOrders();
      alert('Order cancelled');
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  return (
    <div className="order-management">
      <h2>Order Management</h2>

      <form onSubmit={handleCreateOrder} className="order-form">
        <textarea
          placeholder="Items (JSON format: [{id: 1, name: 'Item', quantity: 1, price: 100}])"
          onChange={(e) => {
            try {
              setNewOrder(prev => ({ ...prev, items: JSON.parse(e.target.value) }));
            } catch {}
          }}
        />
        <input
          type="number"
          placeholder="Total Amount"
          value={newOrder.totalAmount}
          onChange={(e) => setNewOrder(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
          required
        />
        <textarea
          placeholder="Shipping Address"
          value={newOrder.shippingAddress}
          onChange={(e) => setNewOrder(prev => ({ ...prev, shippingAddress: e.target.value }))}
          required
        />
        <select
          value={newOrder.paymentMethod}
          onChange={(e) => setNewOrder(prev => ({ ...prev, paymentMethod: e.target.value }))}
        >
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="wallet">Wallet</option>
          <option value="cod">Cash on Delivery</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Order'}
        </button>
      </form>

      <div className="orders-list">
        <h3>Your Orders</h3>
        {orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card">
              <h4>Order #{order.id.substring(0, 8)}</h4>
              <p>Amount: ₹{order.totalAmount}</p>
              <p>Status: <span className={`status ${order.status}`}>{order.status}</span></p>
              <p>Created: {new Date(order.createdAt).toLocaleDateString()}</p>
              {order.status === 'pending' && (
                <div className="order-actions">
                  <button onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>Confirm</button>
                  <button onClick={() => handleCancelOrder(order.id)}>Cancel</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
