import React from 'react';

// Reusable Template wrapper for all your dashboard views
export default function DashboardLayout({ children, currentView, onViewChange }) {
  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'admin', label: '🛡️ Admin Panel', icon: '🛡️' },
    { id: 'chat', label: '💬 Real-Time Chat', icon: '💬' },
    { id: 'attendance', label: '📅 Attendance', icon: '📅' },
    { id: 'booking', label: '📆 Appointments', icon: '📆' },
    { id: 'events', label: '🎟️ Event Manager', icon: '🎟️' },
    { id: 'business', label: '💼 Business Suite', icon: '💼' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', background: '#f4f6f9' }}>
      
      {/* Reusable Sidebar Navigation */}
      <aside style={{ width: '260px', background: '#1e1e2e', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ paddingBottom: '20px', borderBottom: '1px solid #2d2d44', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '0.5px' }}>Industrial App Suite</h2>
          <small style={{ color: '#a5a5c7' }}>Firebase Portfolio v1.0</small>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange && onViewChange(item.id)}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                background: currentView === item.id ? '#3b4252' : 'transparent',
                color: currentView === item.id ? '#fff' : '#c3c3d1',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: currentView === item.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (currentView !== item.id) e.currentTarget.style.background = '#252538';
              }}
              onMouseLeave={(e) => {
                if (currentView !== item.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Dynamic Content View Area */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

    </div>
  );
}
