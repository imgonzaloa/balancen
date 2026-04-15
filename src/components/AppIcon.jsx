/**
 * App Icon Generator Component
 * Creates SVG icon for PWA (192x192, 512x512)
 * Deep black background with white "B" letter
 */

export function getAppIconSVG(size = 192) {
  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0B0B0B"/>
      <text 
        x="${size / 2}" 
        y="${size * 0.65}" 
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" 
        font-size="${size * 0.65}" 
        font-weight="800" 
        fill="#FFFFFF" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >B</text>
    </svg>
  `;
}

export function AppIconLink() {
  return (
    <>
      {/* PWA Icons */}
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(getAppIconSVG(192))}" />
      <link rel="apple-touch-icon" href="data:image/svg+xml,${encodeURIComponent(getAppIconSVG(192))}" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />
    </>
  );
}