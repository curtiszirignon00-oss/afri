import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

config(); // charge le fichier .env automatiquement

export default defineConfig({
  schema: 'prisma/schema.prisma',
});
