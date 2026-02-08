import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const hideNav = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector"].includes(currentPageName);
  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#ffffff' }}>
      {/* Main Content */}
      <main style={{ paddingBottom: hideNav ? 0 : '80px' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 0',
          zIndex: 50
        }}>
          <div style={{
            maxWidth: '512px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: 'env(safe-area-inset-bottom, 8px)'
          }}>
            {[
              { name: "Home", icon: Home, label: "Home" },
              { name: "Social", icon: Users, label: "Social" },
              { name: "Progress", icon: Award, label: "Progress" },
              { name: "Profile", icon: User, label: "Profile" }
            ].map((item) => {
              const Icon = item.icon;
              const active = isActive(item.name);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 16px',
                    textDecoration: 'none',
                    color: active ? '#5eead4' : '#94a3b8',
                    position: 'relative'
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      width: '48px',
                      height: '4px',
                      background: 'linear-gradient(to right, #2dd4bf, #10b981)',
                      borderRadius: '999px'
                    }} />
                  )}
                  <div style={{
                    padding: '10px',
                    borderRadius: '16px',
                    background: active ? 'rgba(20, 184, 166, 0.2)' : 'transparent'
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{
                    fontSize: '10px',
                    marginTop: '2px',
                    fontWeight: '600'
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}