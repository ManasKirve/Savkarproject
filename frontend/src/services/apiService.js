

const API_BASE_URL = 'http://localhost:8000'; 

class ApiService {
 
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      // Handle empty responses (like for DELETE requests)
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Loan Records
  static async getAllLoans() {
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

  
  static async getAllTransactions() {
    return this.request('/transactions');
  }

  static async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: transactionData,
    });
  }

 
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


  static async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }


  static async getDefaulters() {
    return this.request('/loans/defaulters');
  }
}

export default ApiService;