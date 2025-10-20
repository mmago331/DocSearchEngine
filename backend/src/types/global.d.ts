declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

declare module "node:path" {
  const path: any;
  export default path;
}

declare module "node:fs" {
  const fs: any;
  export default fs;
}

declare module "node:url" {
  export function fileURLToPath(url: string): string;
}
