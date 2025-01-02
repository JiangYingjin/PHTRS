import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.test' });

export default defineConfig({
    test: {
        env: {
            BASE_URL: 'https://lan.jyj.cx',
        },
        exclude: [...configDefaults.exclude, 'e2e/*'],
    },
});

