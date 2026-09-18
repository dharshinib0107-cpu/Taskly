import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setMessage('Please enter your email and password');
      return;
    }

    try {
      const response = await axios.post(
        'https://taskly-nzgu.onrender.com/api/auth/login',
        {
          email,
          password
        }
      );

      localStorage.setItem('token', response.data.token);
      localStorage.setItem(
        'user',
        JSON.stringify(response.data.user)
      );

      setMessage('Login successful');

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Login failed'
      );
    }
  };

  return (
    <div className="login-page">

      <div className="login-decoration decoration-one">
        ✦
      </div>

      <div className="login-decoration decoration-two">
        ✧
      </div>

      <div className="login-card">

        <div className="brand-mark">
          <span>✦</span>
        </div>

        <p className="welcome-text">
          WELCOME BACK
        </p>

        <h1>Good to see you.</h1>

        <p className="login-subtitle">
          Sign in to continue organizing your day
          with a little more clarity.
        </p>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          <div className="input-group">
            <label>Email address</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">

            <div className="password-label">
              <label>Password</label>

              <button type="button">
                Forgot password?
              </button>
            </div>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          </div>

          <label className="remember-me">

            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) =>
                setRememberMe(e.target.checked)
              }
            />

            <span>Remember me</span>

          </label>

          {message && (
            <p className="form-message">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
          >
            Sign in
            <span>→</span>
          </button>

        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <p className="signup-text">
          New here?
          <Link to="/register">
            Create an account
          </Link>
        </p>

      </div>

      <p className="login-footer">
        A calm space for getting things done ✦
      </p>

    </div>
  );
}

export default Login;