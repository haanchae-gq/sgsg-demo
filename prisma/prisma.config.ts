export default {
  datasourceUrl: process.env.DB_URL,
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
}