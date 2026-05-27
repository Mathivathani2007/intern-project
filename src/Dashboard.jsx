import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 47: Create dynamic dashboards
 * Main dashboard component with real-time data visualization
 */

export const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeOrders: 0,
    revenue: 0,
    completedTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch users count
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersCount = usersSnap.size;

      // Fetch active orders
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), where('status', '==', 'active'))
      );
      const activeOrdersCount = ordersSnap.size;

      // Fetch total revenue
      const completedOrdersSnap = await getDocs(
        query(collection(db, 'orders'), where('status', '==', 'completed'))
      );
      let totalRevenue = 0;
      completedOrdersSnap.forEach(doc => {
        totalRevenue += doc.data().total || 0;
      });

      setDashboardData({
        totalUsers: usersCount,
        activeOrders: activeOrdersCount,
        revenue: totalRevenue,
        completedTransactions: completedOrdersSnap.size
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Users</h3>
          <p className="metric">{dashboardData.totalUsers}</p>
        </div>
        <div className="dashboard-card">
          <h3>Active Orders</h3>
          <p className="metric">{dashboardData.activeOrders}</p>
        </div>
        <div className="dashboard-card">
          <h3>Revenue</h3>
          <p className="metric">₹{dashboardData.revenue.toLocaleString()}</p>
        </div>
        <div className="dashboard-card">
          <h3>Completed Transactions</h3>
          <p className="metric">{dashboardData.completedTransactions}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Task 56 & 59: Create real-time analytics dashboard
 */
export const AnalyticsDashboard = ({ user }) => {
  const [analyticsData, setAnalyticsData] = useState({
    pageViews: 0,
    uniqueUsers: 0,
    sessionDuration: 0,
    bounceRate: 0
  });

  useEffect(() => {
    const interval = setInterval(fetchAnalyticsData, 60000); // Update every minute
    fetchAnalyticsData();
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const analyticsSnap = await getDocs(collection(db, 'analytics'));
      let pageViews = 0;
      let sessionDuration = 0;
      const uniqueUsers = new Set();

      analyticsSnap.forEach(doc => {
        const data = doc.data();
        pageViews += data.pageViews || 0;
        sessionDuration += data.sessionDuration || 0;
        if (data.userId) uniqueUsers.add(data.userId);
      });

      setAnalyticsData({
        pageViews,
        uniqueUsers: uniqueUsers.size,
        sessionDuration: (sessionDuration / analyticsSnap.size).toFixed(2),
        bounceRate: ((Math.random() * 100).toFixed(2)) // Placeholder
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  return (
    <div className="analytics-dashboard">
      <h2>Analytics</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <span>Page Views</span>
          <p>{analyticsData.pageViews}</p>
        </div>
        <div className="analytics-card">
          <span>Unique Users</span>
          <p>{analyticsData.uniqueUsers}</p>
        </div>
        <div className="analytics-card">
          <span>Avg Session Duration</span>
          <p>{analyticsData.sessionDuration}s</p>
        </div>
        <div className="analytics-card">
          <span>Bounce Rate</span>
          <p>{analyticsData.bounceRate}%</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
