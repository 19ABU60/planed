import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name, invitationCode);
      }
      toast.success(isLogin ? 'Willkommen zurück!' : 'Konto erstellt!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ein Fehler ist aufgetreten');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <GraduationCap size={28} color="white" />
          </div>
          <h1>PlanEd</h1>
        </div>
        <p className="login-subtitle">
          {isLogin ? 'Melden Sie sich an, um Ihre Arbeitspläne zu verwalten' : 'Erstellen Sie ein neues Konto'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <Ticket size={14} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Einladungs-Code
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Code eingeben" 
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())} 
                  required={!isLogin}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                  data-testid="invitation-code-input" 
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Sie erhalten den Code von Ihrer Schulleitung oder Fachschaft
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ihr Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)} 
                  required={!isLogin} 
                  data-testid="register-name-input" 
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="ihre@email.de" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
              data-testid="email-input" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
              data-testid="password-input" 
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            disabled={loading} 
            data-testid="login-submit-btn"
          >
            {loading ? <span className="spinner" /> : (isLogin ? 'Anmelden' : 'Konto erstellen')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => setIsLogin(!isLogin)} 
            data-testid="toggle-auth-mode-btn"
          >
            {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
