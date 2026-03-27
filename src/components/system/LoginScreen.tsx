import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight24Regular, Globe24Regular, Speaker224Regular, Power24Regular } from '@fluentui/react-icons';

interface LoginScreenProps {
  onLogin: () => void;
  wallpaper: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, wallpaper }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [time, setTime] = useState(new Date());
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLogin(false);
      else if (!showLogin) setShowLogin(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogin]);

  useEffect(() => {
    if (showLogin && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [showLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() !== '') {
      onLogin();
    }
  };

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Segoe UI Variable Display", "Segoe UI", sans-serif',
        backgroundImage: `url("${wallpaper}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        userSelect: 'none',
      }}
      onClick={() => { if (!showLogin) setShowLogin(true); }}
    >
      {/* Overlay Background Blur */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: showLogin ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0)',
          backdropFilter: showLogin ? 'blur(30px) saturate(150%)' : 'blur(0px)',
          WebkitBackdropFilter: showLogin ? 'blur(30px) saturate(150%)' : 'blur(0px)',
          transition: 'all 0.5s cubic-bezier(0.2, 0, 0, 1)',
          pointerEvents: 'none',
        }} 
      />

      {/* Clock / Date (Lock Screen Mode) */}
      <div 
        style={{
          position: 'absolute',
          top: '12%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transform: showLogin ? 'translateY(-100px)' : 'translateY(0)',
          opacity: showLogin ? 0 : 1,
          pointerEvents: showLogin ? 'none' : 'auto',
          transition: 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease',
        }}
      >
        <span style={{ fontSize: '7.5rem', fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0px 2px 20px rgba(0,0,0,0.3)' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '8px', textTransform: 'capitalize' }}>
           {new Intl.DateTimeFormat('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }).format(time)}
        </span>
      </div>

      {/* Login Form content */}
      <div 
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: showLogin ? 'translateY(0)' : 'translateY(80px)',
          opacity: showLogin ? 1 : 0,
          pointerEvents: showLogin ? 'auto' : 'none',
          transition: 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), opacity 0.5s ease',
          transitionDelay: showLogin ? '0.1s' : '0s'
        }}
      >
        {/* Avatar Circle */}
        <div 
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            marginBottom: '24px',
            border: '2px solid transparent',
            transition: 'border-color 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop" 
            alt="User Avatar" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* User Name */}
        <h1 style={{ 
          color: 'white', 
          fontSize: '36px', 
          fontWeight: 600, 
          margin: '0 0 24px 0', 
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          letterSpacing: '-0.01em'
        }}>
          Martín
        </h1>
        
        {/* Password/PIN Form */}
        <form 
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }} 
          onSubmit={handleSubmit}
        >
          <input 
            ref={inputRef}
            type="password" 
            placeholder="PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{
              width: '320px',
              height: '44px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: 'none',
              borderBottom: '2px solid transparent',
              color: 'black',
              fontSize: '15px',
              padding: '0 40px 0 16px',
              borderRadius: '4px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.1)',
              outline: 'none',
              transition: 'background-color 0.2s, border-bottom-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderBottomColor = '#0078D4';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
              e.target.style.borderBottomColor = 'transparent';
            }}
          />
          {/* Submit Arrow Button */}
          <button 
            type="submit" 
            style={{
              position: 'absolute',
              right: '4px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'rgba(0,0,0,0.5)',
              cursor: pin.length > 0 ? 'pointer' : 'default',
              borderRadius: '2px',
              transition: 'color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (pin.length > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                e.currentTarget.style.color = 'rgba(0,0,0,0.8)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
            }}
          >
            <ArrowRight24Regular style={{ opacity: pin.length > 0 ? 1 : 0.5 }} />
          </button>
        </form>

        <div 
          style={{
            marginTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            opacity: 0.9,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
        >
           <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>
             Opciones de inicio de sesión
           </span>
        </div>
      </div>

      {/* Bottom Right System Icons */}
      <div 
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: 'white',
          opacity: showLogin ? 1 : 0,
          transform: showLogin ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showLogin ? 'auto' : 'none',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0, 0, 1)',
          transitionDelay: showLogin ? '0.2s' : '0s'
        }}
      >
        {[
          { icon: <Globe24Regular />, title: 'Red' },
          { icon: <Speaker224Regular />, title: 'Accesibilidad' },
          { icon: <Power24Regular />, title: 'Energía' }
        ].map((item, index) => (
          <div 
            key={index}
            title={item.title}
            style={{
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              transition: 'background-color 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseUp={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          >
            {item.icon}
          </div>
        ))}
      </div>

    </div>
  );
};

export default LoginScreen;

