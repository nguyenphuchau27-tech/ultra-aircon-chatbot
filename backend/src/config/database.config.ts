export default () => ({
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || process.env.DB_USERNAME,
    pass: process.env.DB_PASS || process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
});