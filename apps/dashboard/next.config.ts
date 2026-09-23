import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@cognigame/shared-types', '@cognigame/design-tokens'],
};

export default nextConfig;
