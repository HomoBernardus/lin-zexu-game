import type { NextConfig } from "next";

// 部署到 GitHub Pages（项目站点，路径为 https://<user>.github.io/lin-zexu-game/）
// basePath 让路由与静态资源都带上 /lin-zexu-game 前缀，才能在该子路径下正确加载。
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/lin-zexu-game",
  images: { unoptimized: true },
};

export default nextConfig;
