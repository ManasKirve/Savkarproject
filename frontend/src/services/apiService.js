// src/services/apiService.js

const API_BASE_URL = 'http://localhost:8000'; 

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
    
    // Your backend expects camelCase due to by_alias=True, so NO conversion needed
    if (config.body && typeof config.body === 'object') {
      try {
        config.body = JSON.stringify(config.body);
      } catch (e) {
        config.body = JSON.stringify(config.body);
      }
    }

    try {
      console.log(`ApiService: Sending request to ${url}`);
      const response = await fetch(url, config);
      
      console.log(`ApiService: Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ApiService: Error response: ${errorText}`);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) return null;
      
      const data = await response.json();
      console.log(`ApiService: Response data:`, data);
      
      // Your backend returns snake_case, convert to camelCase for frontend
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

      const camelizedData = camelize(data);
      console.log(`ApiService: Camelized data:`, camelizedData);
      
      return camelizedData;
    } catch (error) {
      console.error(`ApiService: Request failed for ${url}:`, error);
      throw error;
    }
  }

  // Dashboard
  static async getDashboardSummary() {
    const response = await this.request('/dashboard/summary');
    // Handle if the response is wrapped in a data object
    return response.data || response;
  }

  // Loan Records (Global endpoints - NO UID required)
  static async getAllLoans() {
    const response = await this.request('/loans');
    // Handle if the response is wrapped in a data object
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return Array.isArray(response) ? response : [];
  }

  static async createLoan(loanData) {
    return this.request('/loans', {
      method: 'POST',
      body: loanData,
    });
  }

  static async updateLoan(loanId, loanData) {
    return this.request(`/loans/${loanId}`, {
      method: 'PUT',
      body: loanData,
    });
  }

  static async deleteLoan(loanId) {
    return this.request(`/loans/${loanId}`, {
      method: 'DELETE',
    });
  }

  // Documents (Global endpoints - NO UID required)
  static async getDocumentsByLoanId(loanId) {
    const response = await this.request(`/loans/${loanId}/documents`);
    // Handle if the response is wrapped in a data object
    return response.data || response;
  }

  static async createDocument(documentData) {
    return this.request('/documents', {
      method: 'POST',
      body: documentData,
    });
  }

  static async deleteDocument(docId) {
    return this.request(`/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  // Per-user loans list - OPTIONAL UID
  static async getMyLoans(uid) {
    if (uid) {
      const response = await this.request(`/users/me/loans?uid=${uid}`);
      // Handle if the response is wrapped in a data object
      return response.data || response;
    } else {
      return this.getAllLoans(); // Fallback to global
    }
  }

  // Legal Notices
  static async getAllNotices() {
    const response = await this.request('/notices');
    // Handle if the response is wrapped in a data object
    return response.data || response;
  }

  // Health check
  static async healthCheck() {
    return this.request('/health');
  }

  // Debug endpoints
  static async debugFirebase() {
    return this.request('/debug/firebase');
  }

  static async debugUserLoans(uid) {
    return this.request(`/debug/user/${uid}/loans`);
  }

  static async debugSampleLoans() {
    return this.request('/debug/sample-loans');
  }
  
  // Add the getBaseUrl method
  static getBaseUrl() {
    return API_BASE_URL;
  }
}

export default ApiService;