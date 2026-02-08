import { TrendingUp, Target, Calendar } from "lucide-react";

export default function Progress() {
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
            Your Progress
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Complete analysis of your evolution
          </p>
        </div>

        {/* Momentum Score */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
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
                color: 'rgba(52, 211, 153, 1)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Momentum Score
                <span style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  ?
                </span>
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                Never resets to zero
              </p>
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'white',
              fontFamily: 'monospace'
            }}>
              0
            </div>
          </div>
          <div style={{
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '0%',
              height: '100%',
              background: 'linear-gradient(to right, #34d399, #14b8a6)'
            }} />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginTop: '16px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Consistency</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>0%</p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Adherence</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>0%</p>
            </div>
          </div>
        </div>

        {/* Projection Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))',
          backdropFilter: 'blur(40px)',
          borderRadius: '20px',
          padding: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={20} style={{ color: '#93c5fd' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '11px',
                color: 'rgba(147, 197, 253, 1)',
                fontWeight: '600',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Goal projection
              </p>
              <p style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white'
              }}>
                ~0 days
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                At current tracking pace
              </p>
            </div>
          </div>
        </div>

        {/* Progress Rings */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Calories', value: '0', goal: '2000', color: '#f97316' },
            { label: 'Protein', value: '0g', color: '#3b82f6' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(40px)',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{
                width: '112px',
                height: '112px',
                margin: '0 auto 12px',
                position: 'relative'
              }}>
                <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="10"
                    fill="none"
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    color: 'white'
                  }}>
                    {item.value}
                  </div>
                  {item.goal && (
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}>
                      / {item.goal}
                    </div>
                  )}
                </div>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center'
              }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* AI Insight */}
        <div style={{
          background: 'linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
          backdropFilter: 'blur(40px)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Target size={16} style={{ color: '#c084fc' }} />
            </div>
            <div>
              <p style={{
                fontSize: '11px',
                color: 'rgba(192, 132, 252, 1)',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                AI Coach
              </p>
              <p style={{ fontSize: '14px', color: 'white' }}>
                Start tracking meals to get personalized insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}