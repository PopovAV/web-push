/** @type {import('next').NextConfig} */

const securityHeaders = [

  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), publickey-credentials-get=*'
  }

]

const withPWA = require('next-pwa')({
  dest: 'public',

})


const config = {
  async headers() {
    return [{
      // Apply these headers to all routes in your application.
      source: '/:path*',
      headers: securityHeaders,
    }, ]
  }
}

module.exports = withPWA(config)