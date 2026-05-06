export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'ultra-secret',
    expiresIn: '7d',
  },
});
