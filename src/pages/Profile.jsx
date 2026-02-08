import { ChevronLeft, Settings, LogOut, Award } from "lucide-react";

export default function Profile() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0f172a, #134e4a, #047857)',
      paddingBottom: '96px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-16px',
          width: '288px',
          height: '288px',
          background: '#14b8a6',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-32px',
          left: '80px',
          width: '288px',
          height: '288px',
          background: '#06b6d4',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
      </div>

      <div style={{
        maxWidth: '512px',
        margin: '0 auto',
        padding: '16px 16px 96px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
            My Profile
          </h1>
        </div>

        {/* Profile Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '128px',
            height: '128px',
            background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(16, 185, 129, 0.3))',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2dd4bf, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: '700',
                flexShrink: 0
              }}>
                U
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  User
                </h2>
                <p style={{ fontSize: '14px', color: '#5eead4' }}>
                  user@example.com
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(249, 115, 22, 0.2))',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '140px'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '12px'
                }}>
                  🔥
                </div>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  Current Streak
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '140px'
              }}>
                <p style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  color: '#5eead4',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>
                  0
                </p>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  Best Streak
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '140px'
              }}>
                <p style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  color: 'white',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>
                  0
                </p>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  Total Check-ins
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <div style={{ marginBottom: '24px' }}>
          <button style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={20} style={{ color: '#5eead4' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: '600', fontSize: '16px' }}>Settings</p>
                <p style={{ fontSize: '12px', color: '#5eead4' }}>App preferences</p>
              </div>
            </div>
            <ChevronLeft size={20} style={{
              color: 'rgba(255, 255, 255, 0.6)',
              transform: 'rotate(180deg)'
            }} />
          </button>
        </div>

        {/* Logout Button */}
        <button style={{
          width: '100%',
          borderRadius: '16px',
          padding: '20px',
          background: 'rgba(239, 68, 68, 0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}