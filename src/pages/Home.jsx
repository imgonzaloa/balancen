import { Camera, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0f172a, #134e4a, #047857)',
      paddingBottom: '96px'
    }}>
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '900',
            color: 'white',
            marginBottom: '4px'
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Keep your momentum going
          </p>
        </div>

        {/* Fire Score Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(249, 115, 22, 0.2))',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(251, 146, 60, 0.3)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(251, 146, 60, 0.9)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Current Streak
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                Keep going!
              </p>
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'white',
              fontFamily: 'monospace'
            }}>
              🔥 0
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '160px',
              height: '160px',
              margin: '0 auto 16px',
              position: 'relative'
            }}>
              <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="440"
                  strokeDashoffset="440"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  color: 'white'
                }}>
                  0
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  / 2000 kcal
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600'
            }}>
              Daily Calories
            </p>
          </div>
        </div>

        {/* Add Meal Button */}
        <Button
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: '16px',
            background: 'linear-gradient(to right, #14b8a6, #10b981)',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(20, 184, 166, 0.3)'
          }}
        >
          <Camera size={20} />
          Log Meal
        </Button>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '24px'
        }}>
          {[
            { label: 'Protein', value: '0g', color: '#3b82f6' },
            { label: 'Carbs', value: '0g', color: '#f97316' },
            { label: 'Fats', value: '0g', color: '#a855f7' }
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '20px',
                fontWeight: '900',
                color: 'white',
                marginBottom: '4px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}