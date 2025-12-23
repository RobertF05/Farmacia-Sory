import React, { useState, useContext, useEffect } from 'react';
import { FaEyeSlash } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import './LoginPage.css';
import { AuthContext } from '../../context/AuthContext';

// Configuración de bloqueo
const BLOCK_CONFIG = {
  initialBlock: 15,    // minutos
  secondBlock: 20,     // minutos  
  thirdPlusBlock: 30   // minutos
};

// Funciones de seguridad con localStorage
const getStorageKey = (username) => {
  return `farmacia_login_attempts_${username.toLowerCase()}`;
};

const getLoginAttempts = (username) => {
  try {
    const key = getStorageKey(username);
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const data = JSON.parse(stored);
      
      // Verificar si el bloqueo ya expiró
      if (data.is_blocked && data.block_until) {
        const now = new Date().getTime();
        if (now > data.block_until) {
          localStorage.removeItem(key);
          return null;
        }
      }
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting login attempts:', error);
    return null;
  }
};

const saveLoginAttempts = (username, attempts, isBlocked = false) => {
  try {
    const key = getStorageKey(username);
    const now = new Date().getTime();
    
    let block_until = null;
    
    if (isBlocked) {
      let blockMinutes = BLOCK_CONFIG.initialBlock;
      if (attempts >= 6) blockMinutes = BLOCK_CONFIG.secondBlock;
      if (attempts >= 9) blockMinutes = BLOCK_CONFIG.thirdPlusBlock;
      
      block_until = now + (blockMinutes * 60 * 1000);
    }
    
    const data = {
      username,
      attempts,
      last_attempt: now,
      is_blocked: isBlocked,
      block_until,
      created_at: now
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error saving login attempts:', error);
    return null;
  }
};

const incrementFailedAttempts = (username) => {
  const current = getLoginAttempts(username);
  const currentAttempts = current ? current.attempts : 0;
  const newAttempts = currentAttempts + 1;
  const shouldBlock = newAttempts % 3 === 0;
  
  return saveLoginAttempts(username, newAttempts, shouldBlock);
};

const resetLoginAttempts = (username) => {
  const key = getStorageKey(username);
  localStorage.removeItem(key);
};

const isUserBlocked = (username) => {
  const attempts = getLoginAttempts(username);
  
  if (attempts && attempts.is_blocked && attempts.block_until) {
    const now = new Date().getTime();
    if (now < attempts.block_until) {
      const secondsLeft = Math.ceil((attempts.block_until - now) / 1000);
      const minutesLeft = Math.floor(secondsLeft / 60);
      const remainingSeconds = secondsLeft % 60;
      return {
        blocked: true,
        minutesLeft,
        secondsLeft: remainingSeconds,
        totalSecondsLeft: secondsLeft,
        attempts: attempts.attempts
      };
    } else {
      resetLoginAttempts(username);
    }
  }
  
  return {
    blocked: false,
    attempts: attempts ? attempts.attempts : 0
  };
};

const getAttemptsMessage = (attempts, blocked = false, minutesLeft = 0, secondsLeft = 0) => {
  if (blocked) {
    const minutesText = minutesLeft > 0 ? `${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}` : '';
    const secondsText = `${secondsLeft} segundo${secondsLeft !== 1 ? 's' : ''}`;
    
    if (minutesLeft > 0) {
      return `Cuenta bloqueada. Tiempo restante: ${minutesText} y ${secondsText}`;
    } else {
      return `Cuenta bloqueada. Tiempo restante: ${secondsText}`;
    }
  }
  
  if (attempts > 0) {
    const attemptsUntilBlock = 3 - (attempts % 3);
    return `Intentos fallidos: ${attempts}. ${attemptsUntilBlock > 0 ? `${attemptsUntilBlock} intentos restantes antes del bloqueo.` : 'Cuenta bloqueada.'}`;
  }
  
  return '';
};

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [attempts, setAttempts] = useState(0);
  const [securityMessage, setSecurityMessage] = useState('');

  // Verificar bloqueo cuando el username cambia
  useEffect(() => {
    if (username.trim()) {
      updateSecurityStatus();
    } else {
      setSecurityMessage('');
      setIsBlocked(false);
      setAttempts(0);
    }
  }, [username]);

  const updateSecurityStatus = () => {
    const blockCheck = isUserBlocked(username);
    
    setIsBlocked(blockCheck.blocked);
    setAttempts(blockCheck.attempts);
    
    if (blockCheck.blocked) {
      setBlockTimeLeft({
        minutes: blockCheck.minutesLeft,
        seconds: blockCheck.secondsLeft
      });
      setSecurityMessage(getAttemptsMessage(
        blockCheck.attempts, 
        true, 
        blockCheck.minutesLeft, 
        blockCheck.secondsLeft
      ));
      startBlockCountdown(blockCheck.totalSecondsLeft);
    } else if (blockCheck.attempts > 0) {
      setSecurityMessage(getAttemptsMessage(blockCheck.attempts, false));
    } else {
      setSecurityMessage('');
    }
  };

  const startBlockCountdown = (totalSeconds) => {
    let secondsLeft = totalSeconds;
    
    const countdown = setInterval(() => {
      secondsLeft--;
      
      if (secondsLeft <= 0) {
        clearInterval(countdown);
        setIsBlocked(false);
        setBlockTimeLeft({ minutes: 0, seconds: 0 });
        setSecurityMessage('');
        updateSecurityStatus();
      } else {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        
        setBlockTimeLeft({ minutes, seconds });
        setSecurityMessage(getAttemptsMessage(attempts, true, minutes, seconds));
      }
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      alert('Por favor, completa todos los campos');
      return;
    }

    // Verificar bloqueo antes de enviar
    const blockCheck = isUserBlocked(username);
    if (blockCheck.blocked) {
      const timeText = blockCheck.minutesLeft > 0 
        ? `${blockCheck.minutesLeft} minuto${blockCheck.minutesLeft !== 1 ? 's' : ''} y ${blockCheck.secondsLeft} segundo${blockCheck.secondsLeft !== 1 ? 's' : ''}`
        : `${blockCheck.secondsLeft} segundo${blockCheck.secondsLeft !== 1 ? 's' : ''}`;
      
      alert(`Tu cuenta está bloqueada. Espera ${timeText} antes de intentar nuevamente.`);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        // Resetear intentos en localStorage
        resetLoginAttempts(username);
        
        // El App.jsx detectará el cambio en isAuthenticated y redirigirá a medications
        console.log('Login exitoso. Redirigiendo...');
      } else {
        // Incrementar intentos fallidos
        const newAttempts = incrementFailedAttempts(username);
        
        setAttempts(newAttempts.attempts);
        
        // Verificar si ahora está bloqueado
        const updatedBlockCheck = isUserBlocked(username);
        
        if (updatedBlockCheck.blocked) {
          setIsBlocked(true);
          setBlockTimeLeft({
            minutes: updatedBlockCheck.minutesLeft,
            seconds: updatedBlockCheck.secondsLeft
          });
          setSecurityMessage(getAttemptsMessage(
            updatedBlockCheck.attempts, 
            true, 
            updatedBlockCheck.minutesLeft, 
            updatedBlockCheck.secondsLeft
          ));
          startBlockCountdown(updatedBlockCheck.totalSecondsLeft);
          
          const timeText = updatedBlockCheck.minutesLeft > 0 
            ? `${updatedBlockCheck.minutesLeft} minuto${updatedBlockCheck.minutesLeft !== 1 ? 's' : ''} y ${updatedBlockCheck.secondsLeft} segundo${updatedBlockCheck.secondsLeft !== 1 ? 's' : ''}`
            : `${updatedBlockCheck.secondsLeft} segundo${updatedBlockCheck.secondsLeft !== 1 ? 's' : ''}`;
          
          alert(`Demasiados intentos fallidos. Tu cuenta ha sido bloqueada por ${timeText}.`);
        } else {
          setSecurityMessage(getAttemptsMessage(newAttempts.attempts, false));
          alert(result.error || 'Credenciales incorrectas');
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear el tiempo en el botón
  const formatButtonTime = () => {
    if (blockTimeLeft.minutes > 0) {
      return `Bloqueado (${blockTimeLeft.minutes}m ${blockTimeLeft.seconds}s)`;
    } else {
      return `Bloqueado (${blockTimeLeft.seconds}s)`;
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-form-section">
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-header">
                <div className="logo-container">
                  <h1 className="pharmacy-logo">💊 Farmacia Sory</h1>
                </div>
                <h2>Iniciar Sesión</h2>
                <p>Ingresa tus credenciales para acceder al sistema de farmacia</p>
                
                {securityMessage && (
                  <div className={`security-message ${isBlocked ? 'blocked' : 'warning'}`}>
                    {securityMessage}
                  </div>
                )}
              </div>

              <div className="input-group">
                <div className="input-container">
                  <input
                    type="text"
                    placeholder=" "
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading || isBlocked}
                    autoComplete="username"
                    className={isBlocked ? 'input-blocked' : ''}
                  />
                  <label>Usuario</label>
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
                    </svg>
                  </span>
                </div>

                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isBlocked}
                    autoComplete="current-password"
                    className={isBlocked ? 'input-blocked' : ''}
                  />
                  <label>Contraseña</label>

                  <span 
                    className="input-icon password-toggle"
                    onClick={() => !isBlocked && setShowPassword(!showPassword)}
                    style={{ 
                      cursor: isBlocked ? 'not-allowed' : 'pointer',
                      opacity: isBlocked ? 0.5 : 1
                    }}
                    role="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex="0"
                  >
                    {showPassword ? <IoEyeSharp size={20} /> : <FaEyeSlash size={20} />}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className={`login-button ${isLoading ? 'loading' : ''} ${isBlocked ? 'blocked' : ''}`}
                disabled={isLoading || isBlocked}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Iniciando sesión...
                  </>
                ) : isBlocked ? (
                  formatButtonTime()
                ) : (
                  'Iniciar sesión'
                )}
              </button>

              <div className="login-footer">
                <p className="footer-text">
                  Sistema de Gestión Farmacéutica v1.0
                </p>
                <p className="footer-note">
                  Para pruebas puedes usar: admin / admin123
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;