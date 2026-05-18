import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const buildTime = Date.now();

function versionJsonPlugin() {
  const payload = JSON.stringify(
    { version: pkg.version, buildTime },
    null,
    2
  );
  return {
    name: 'emit-version-json',
    configResolved() {
      fs.mkdirSync(path.resolve('public'), { recursive: true });
      fs.writeFileSync(path.resolve('public/version.json'), payload);
    },
  };
}

// 若以后改仓库名，请同步修改 base 为 '/<新仓库名>/'
export default defineConfig({
  base: '/xixi-cosmos/',
  plugins: [react(), versionJsonPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
});
