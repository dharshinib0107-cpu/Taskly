import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (!agree) {
      setMessage('Please agree to the terms and privacy policy');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          name,
          email,
          password
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Registration failed'
      );
    }
  };

  return (
    <div className="register-page">

      <div className="register-decoration decoration-one">✦</div>

      <div className="register-decoration decoration-two">✧</div>

      <div className="register-card">

        <div className="brand-mark">
          <span>✦</span>
        </div>

        <p className="welcome-text">
          CREATE YOUR SPACE
        </p>

        <h1>Let's begin.</h1>

        <p className="register-subtitle">
          Create your account and make your everyday
          tasks a little easier to manage.
        </p>

        <form
          className="register-form"
          onSubmit={handleRegister}
        >

          <div className="input-group">
            <label>Full name</label>

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Confirm password</label>

            <input
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <label className="terms">

            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />

            <span>
              I agree to the terms and privacy policy.
            </span>

          </label>

          {message && (
            <p className="form-message">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="register-button"
          >
            Create account
            <span>→</span>
          </button>

        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <p className="login-text">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </p>

      </div>

      <p className="register-footer">
        A calm space for getting things done ✦
      </p>

    </div>
  );
}

export default Register;