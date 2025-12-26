/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config, { isServer, webpack }) => {
    // Handle ES modules and import.meta
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }
    
    // Configure module rules for ES modules
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })
    
    // Add support for import.meta and other Node.js features
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
      }
      
      // Define import.meta for browser environment
      config.plugins.push(
        new webpack.DefinePlugin({
          'import.meta': {
            url: JSON.stringify('file://'),
          },
        })
      )
    }
    
    return config
  },
}

module.exports = nextConfig
