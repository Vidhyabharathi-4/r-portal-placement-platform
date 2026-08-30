import { useState } from 'react'
import { BookOpenCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import { apiError } from '../lib'

export default function Auth({ onAuthenticated }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isRegister = location.pathname === '/register'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'LEAD',
  })

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()

    setError('')
    setBusy(true)

    try {
      if (isRegister) {
        const body = {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }

        const response = await api.post('/auth/register', body)

        onAuthenticated(response.data)
        navigate('/dashboard', { replace: true })
      } else {
        const body = {
          email: form.email.trim(),
          password: form.password,
        }

        console.log('LOGIN REQUEST:', body)

        const response = await api.post('/auth/login', body)

        console.log('LOGIN RESPONSE:', response.data)

        onAuthenticated(response.data)

        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('AUTH ERROR:', err)

      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">

      <section className="auth-intro">
        <div className="auth-brand">
          <BookOpenCheck size={26} />
          <b>R-PORTAL</b>
        </div>

        <p className="eyebrow">
          COLLEGE PLACEMENT OPERATIONS
        </p>

        <h1>
          Bring placement activity into one accountable workspace.
        </h1>

        <p>
          Track company engagement, opportunities, applications and
          outcomes with a clear operational record.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-form">

          <p className="eyebrow">
            {isRegister
              ? 'NEW WORKSPACE ACCOUNT'
              : 'SECURE SIGN IN'}
          </p>

          <h2>
            {isRegister
              ? 'Create your account'
              : 'Welcome back'}
          </h2>

          <p>
            {isRegister
              ? 'Select an initial role and begin setting up placement operations.'
              : 'Use your R-PORTAL account to continue.'}
          </p>

          <form onSubmit={submit}>

            {isRegister && (
              <label>
                Full name

                <input
                  required
                  minLength={2}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </label>
            )}

            <label>
              Email address

              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                autoComplete="email"
              />
            </label>

            <label>
              Password

              <input
                required
                type="password"
                name="password"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete={
                  isRegister
                    ? 'new-password'
                    : 'current-password'
                }
              />
            </label>

            {isRegister && (
              <label>
                Role

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="LEAD">LEAD</option>
                </select>
              </label>
            )}

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="button"
              disabled={busy}
            >
              {busy
                ? 'Please wait…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </button>

          </form>

          {!isRegister && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Quick Login Credentials:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'sivasubramaniyam@gmail.com', password: 'SS@Rathinam' })}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '12.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span><strong>Admin:</strong> sivasubramaniyam@gmail.com</span>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Fill Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'jeyakkanan@gmail.com', password: 'Jk@Rathinam' })}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '12.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span><strong>Manager:</strong> jeyakkanan@gmail.com</span>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Fill Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'swetha@gmail.com', password: 'Swetha@Rathinam' })}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '12.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span><strong>Lead:</strong> swetha@gmail.com</span>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Fill Login</span>
                </button>
              </div>
            </div>
          )}

          <p className="auth-switch">
            {isRegister
              ? 'Already have an account?'
              : 'New to R-PORTAL?'}

            {' '}

            <Link
              to={
                isRegister
                  ? '/login'
                  : '/register'
              }
            >
              {isRegister
                ? 'Sign in'
                : 'Create an account'}
            </Link>
          </p>

        </div>
      </section>

    </main>
  )
}