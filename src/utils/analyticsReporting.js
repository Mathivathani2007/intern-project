/**
 * Task 83/91: Analytics reporting system
 * Simple reporting utilities for aggregating Firestore analytics
 */
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export const AnalyticsReporting = {
  async getPageViews(sinceTimestamp) {
    const q = query(collection(db, 'analytics'), where('timestamp', '>=', sinceTimestamp));
    const snap = await getDocs(q);
    let views = 0;
    snap.forEach(doc => { views += doc.data().pageViews || 0; });
    return { pageViews: views };
  },

  async getUserCounts(sinceTimestamp) {
    const q = query(collection(db, 'analytics'), where('timestamp', '>=', sinceTimestamp));
    const snap = await getDocs(q);
    const users = new Set();
    snap.forEach(doc => { if (doc.data().userId) users.add(doc.data().userId); });
    return { uniqueUsers: users.size };
  }
};

export default AnalyticsReporting;
