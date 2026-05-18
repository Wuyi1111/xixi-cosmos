import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 若以后改仓库名，请同步修改 base 为 '/<新仓库名>/'
export default defineConfig({
  base: '/xixi-cosmos/',
  plugins: [react()],
});
