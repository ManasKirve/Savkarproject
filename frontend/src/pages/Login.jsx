import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // 🔐 Permanent password (never changes)
  const PERMANENT_PASSWORD = '2BG2DErB!';

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, password } = credentials;

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
      // 🔍 Get user-changed password from localStorage (if available)
      const changedPassword = localStorage.getItem(`password_${username}`);

      // ✅ Check login conditions
      const isValidUser = username === 'vishal' || username === 'manas';
      const isPasswordValid =
        password === PERMANENT_PASSWORD || password === changedPassword;

      if (isValidUser && isPasswordValid) {
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('username', username);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', 'dummy_token');
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

                {/* 👁 Password field with icon */}
                <div className="mb-4 position-relative">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control py-2 pe-5"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '70%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg py-2 mt-2">
                    Login
                  </button>
                </div>

                <div className="text-center mt-3">
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3 bg-light">
              <small className="text-muted">© 2025 Savkar Admin Panel</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
