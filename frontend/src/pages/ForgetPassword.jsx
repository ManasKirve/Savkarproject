import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // 👁 icons for toggling

const ForgotPassword = () => {
  const [form, setForm] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    setMessage('');
  };

  const toggleVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username, oldPassword, newPassword, confirmPassword } = form;

    if (!username || !oldPassword || !newPassword || !confirmPassword) {
      setMessage('All fields are required');
      return;
    }

    const storedPassword = localStorage.getItem(`password_${username}`) || 'pass@123';

    if (oldPassword !== storedPassword) {
      setMessage('Old password is incorrect');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('New password and confirm password do not match');
      return;
    }

    // Save new password
    localStorage.setItem(`password_${username}`, newPassword);
    setMessage('✅ Password updated successfully. Redirecting to login...');

    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h2 className="fw-bold mb-2">Reset Password</h2>
              <p className="mb-0">Enter details to reset your password</p>
            </div>

            <div className="card-body px-4 py-5">
              {message && (
                <div
                  className={`alert ${
                    message.includes('✅') ? 'alert-success' : 'alert-danger'
                  }`}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Username */}
                <div className="mb-4">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control py-2"
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                  />
                </div>

                {/* Old Password */}
                <div className="mb-4 position-relative">
                  <label htmlFor="oldPassword" className="form-label">Old Password</label>
                  <input
                    type={showPassword.oldPassword ? 'text' : 'password'}
                    className="form-control py-2 pe-5"
                    id="oldPassword"
                    name="oldPassword"
                    value={form.oldPassword}
                    onChange={handleChange}
                    placeholder="Enter your old password"
                  />
                  <span
                    onClick={() => toggleVisibility('oldPassword')}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '70%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPassword.oldPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {/* New Password */}
                <div className="mb-4 position-relative">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type={showPassword.newPassword ? 'text' : 'password'}
                    className="form-control py-2 pe-5"
                    id="newPassword"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                  />
                  <span
                    onClick={() => toggleVisibility('newPassword')}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '70%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPassword.newPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {/* Confirm Password */}
                <div className="mb-4 position-relative">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    className="form-control py-2 pe-5"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                  />
                  <span
                    onClick={() => toggleVisibility('confirmPassword')}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '70%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPassword.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg py-2 mt-2">
                    Update Password
                  </button>
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

export default ForgotPassword;
