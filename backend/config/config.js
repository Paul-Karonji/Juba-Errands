module.exports = {
  development: {
    port: process.env.PORT || 5000,
    database: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'juba_errands_nairobi'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'juba-errands-secret-key-2024', // Add fallback
      expiresIn: '24h'
    }
  },
  production: {
    port: process.env.PORT,
    database: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'juba-errands-secret-key-2024', // Add fallback
      expiresIn: '24h'
    }
  }
};
