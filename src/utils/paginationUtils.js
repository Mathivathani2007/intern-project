/**
 * Task 78: Implement data pagination utility
 * Provides pagination helpers for Firestore queries
 */

export class PaginationHelper {
  constructor(pageSize = 20) {
    this.pageSize = pageSize;
    this.currentPage = 0;
    this.lastVisible = null;
    this.firstVisible = null;
    this.allDocs = [];
  }

  // Get next page
  async getNextPage(query) {
    try {
      const { getDocs, startAt, startAfter, query: firestoreQuery } = await import('firebase/firestore');
      
      let firestoreQueryWithPagination = query;
      if (this.lastVisible) {
        firestoreQueryWithPagination = startAfter(query, this.lastVisible);
      }

      const snapshot = await getDocs(firestoreQueryWithPagination.limit(this.pageSize + 1));
      const docs = snapshot.docs.slice(0, this.pageSize);

      if (docs.length > 0) {
        this.lastVisible = docs[docs.length - 1];
        this.firstVisible = docs[0];
        this.currentPage++;
      }

      return docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Pagination error:', error);
      return [];
    }
  }

  // Get previous page
  async getPreviousPage(query) {
    try {
      const { getDocs } = await import('firebase/firestore');
      
      if (this.currentPage <= 0) return [];

      const reversedSnapshot = await getDocs(query.endBefore(this.firstVisible).limitToLast(this.pageSize + 1));
      const docs = reversedSnapshot.docs.reverse().slice(0, this.pageSize);

      if (docs.length > 0) {
        this.firstVisible = docs[0];
        this.lastVisible = docs[docs.length - 1];
        this.currentPage--;
      }

      return docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Pagination error:', error);
      return [];
    }
  }

  reset() {
    this.currentPage = 0;
    this.lastVisible = null;
    this.firstVisible = null;
  }
}

/**
 * Calculate pagination metadata
 */
export const calculatePaginationMetadata = (currentPage, pageSize, totalItems) => {
  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    hasNextPage: (currentPage + 1) * pageSize < totalItems,
    hasPreviousPage: currentPage > 0
  };
};
