export default () => ({
  PORT: 3000,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: 5432,

  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,

  JWT_SECRET: process.env.JWT_SECRET,
});
