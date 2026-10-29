/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  // Friendly links used in emails and copy: the agent's briefing, preferences
  // and connections. The app itself still lives under /dashboard.
  async redirects() {
    return [
      { source: '/briefing', destination: '/dashboard', permanent: false },
      { source: '/briefing/connections', destination: '/dashboard/settings/integrations', permanent: false },
      { source: '/briefing/website', destination: '/dashboard/settings/website', permanent: false },
      { source: '/briefing/billing', destination: '/dashboard/settings/billing', permanent: false },
      { source: '/briefing/preferences', destination: '/dashboard/settings/business', permanent: false },
      { source: '/briefing/account', destination: '/dashboard/settings/account', permanent: false },
    ]
  },
  // Practise what we check for: the same basic security headers the agent's
  // security check looks for on customers' sites.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
