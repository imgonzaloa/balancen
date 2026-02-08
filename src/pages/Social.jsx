import { Users, Share2 } from "lucide-react";

export default function Social() {
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
            Social
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Share progress with friends
          </p>
        </div>

        {/* Invite Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(219, 39, 119, 0.2))',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Share2 size={24} style={{ color: '#c084fc' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '4px'
              }}>
                Invite Friends
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Get 1 month free for every 3 friends
              </p>
            </div>
          </div>
          <button style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.3)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Share Invite Link
          </button>
        </div>

        {/* Empty State */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '48px 24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px'
          }}>
            Training with friends increases consistency
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Invite someone and start sharing progress together
          </p>
        </div>
      </div>
    </div>
  );
}