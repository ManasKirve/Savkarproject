import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, password } = credentials;

    // Field-specific validation
    if (!username && !password) {
      setError('Please enter both username and password');
      return;
    } else if (!username) {
      setError('Please enter your username');
      return;
    } else if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      // ✅ Admin authentication
      if ((username === 'vishal' || username === 'manas') && password === 'pass@123') {
        // Save session info
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('username', username);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', 'dummy_token'); // ✅ required for ProtectedRoute

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="fw-bold mb-2">Admin Login</h2>
              <p className="mb-0">Please login to access the admin dashboard</p>
            </div>
            <div className="card-body px-4 py-5">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control py-2"
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control py-2"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg py-2 mt-2">
                    Login
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3 bg-light">
              <small className="text-muted">© 2023 Savkar Admin Panel</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
