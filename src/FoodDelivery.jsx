import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 68: Develop food delivery backend
 * Restaurant and food delivery system
 */

export const FoodDelivery = ({ user }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  useEffect(() => {
    fetchRestaurants();
    fetchOrders();
  }, [user]);

  const fetchRestaurants = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'restaurants'));
      const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(restaurantList);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'foodOrders'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleAddToCart = (item, restaurantId) => {
    const cartItem = { ...item, restaurantId, quantity: 1 };
    setCart([...cart, cartItem]);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await addDoc(collection(db, 'foodOrders'), {
        userId: user.uid,
        items: cart,
        totalAmount,
        status: 'confirmed',
        restaurantId: cart[0].restaurantId,
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString()
      });

      alert('Order placed successfully!');
      setCart([]);
      fetchOrders();
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  return (
    <div className="food-delivery">
      <h2>Food Delivery Service</h2>

      <div className="restaurants-list">
        <h3>Restaurants</h3>
        <div className="restaurants-grid">
          {restaurants.map(restaurant => (
            <div key={restaurant.id} className="restaurant-card">
              <h4>{restaurant.name}</h4>
              <p>{restaurant.cuisineType}</p>
              <p>⭐ {restaurant.rating || 4.5}</p>
              <p>Delivery: {restaurant.deliveryTime || 30} mins</p>
              <button onClick={() => setSelectedRestaurant(restaurant)}>
                View Menu
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedRestaurant && (
        <div className="menu-display">
          <h3>{selectedRestaurant.name} - Menu</h3>
          <button onClick={() => setSelectedRestaurant(null)}>Close</button>
          <div className="menu-items">
            {selectedRestaurant.menu && selectedRestaurant.menu.map((item, idx) => (
              <div key={idx} className="menu-item">
                <p><strong>{item.name}</strong> - ₹{item.price}</p>
                <p>{item.description}</p>
                <button onClick={() => handleAddToCart(item, selectedRestaurant.id)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cart">
        <h3>Cart ({cart.length} items)</h3>
        {cart.map((item, idx) => (
          <div key={idx} className="cart-item">
            <p>{item.name} x1 - ₹{item.price}</p>
          </div>
        ))}
        {cart.length > 0 && (
          <button onClick={handlePlaceOrder}>Place Order</button>
        )}
      </div>

      <div className="orders-list">
        <h3>Your Orders</h3>
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <p>Order #{order.id.substring(0, 8)}</p>
            <p>Total: ₹{order.totalAmount}</p>
            <p>Status: {order.status}</p>
            <p>Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodDelivery;
