// src/services/apiService.js

const API_BASE_URL = 'http://localhost:8001'; 

class ApiService {
  // Helper method for making API requests
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`ApiService: Making request to ${url}`);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };
    
    // Convert request body keys from camelCase -> snake_case for backend compatibility
    const decamelize = (obj) => {
      if (Array.isArray(obj)) return obj.map(decamelize);
      if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          acc[snakeKey] = decamelize(obj[key]);
          return acc;
        }, {});
      }
      return obj;
    };

    if (config.body && typeof config.body === 'object') {
      try {
        config.body = JSON.stringify(decamelize(config.body));
      } catch (e) {
        // Fallback to raw stringify on failure
        config.body = JSON.stringify(config.body);
      }
    }

    try {
      console.log(`ApiService: Sending request to ${url}`);
      const response = await fetch(url, config);
      
      console.log(`ApiService: Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      // Handle empty responses (like for DELETE requests)
      if (response.status === 204) {
        console.log("ApiService: Empty response, returning null");
        return null;
      }
      
      const data = await response.json();
      console.log(`ApiService: Response data for ${url}:`, data);

      // Normalize snake_case keys from backend to camelCase for frontend usage
      const camelize = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(camelize);
        } else if (obj && typeof obj === 'object') {
          return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            acc[camelKey] = camelize(obj[key]);
            return acc;
          }, {});
        }
        return obj;
      };

      return camelize(data);
    } catch (error) {
      console.error(`ApiService: Request failed for ${url}:`, error);
      throw error;
    }
  }

  // Dashboard
  static async getDashboardSummary() {
    console.log("ApiService: Getting dashboard summary");
    return this.request('/dashboard/summary');
  }

  // Loan Records
  static async getAllLoans() {
    console.log("ApiService: Getting all loans");
    return this.request('/loans');
  }

  static async createLoan(loanData) {
    return this.request('/loans', {
      method: 'POST',
      body: loanData,
    });
  }

  static async updateLoan(id, updates) {
    return this.request(`/loans/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  static async deleteLoan(id) {
    return this.request(`/loans/${id}`, {
      method: 'DELETE',
    });
  }

  // Legal Notices
  static async getAllNotices() {
    return this.request('/notices');
  }

  static async createNotice(noticeData) {
    return this.request('/notices', {
      method: 'POST',
      body: noticeData,
    });
  }

  static async updateNotice(id, updates) {
    return this.request(`/notices/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  // Transactions
  static async getAllTransactions() {
    return this.request('/transactions');
  }

  static async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: transactionData,
    });
  }

  // Documents
  static async getAllDocuments() {
    return this.request('/documents');
  }

  static async getDocumentsByLoanId(loanId) {
    return this.request(`/loans/${loanId}/documents`);
  }

  static async createDocument(documentData) {
    return this.request('/documents', {
      method: 'POST',
      body: documentData,
    });
  }

  static async deleteDocument(id) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Defaulters
  static async getDefaulters() {
    return this.request('/loans/defaulters');
  }
}

export default ApiService;