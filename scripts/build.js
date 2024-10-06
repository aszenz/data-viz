import esbuild from "esbuild";
import { PerspectiveEsbuildPlugin } from "@finos/perspective-esbuild-plugin";

/**
 * @type esbuild.BuildOptions
 */
export const buildOptions = {
  entryPoints: ["./src/index.ts", "./src/plot.ts"],
  plugins: [PerspectiveEsbuildPlugin()],
  loader: {
    ".wasm": "file",
    ".typ": "text",
  },
  minify: false,
  splitting: true,
  bundle: true,
  assetNames: "[name]",
  format: "esm",
  sourcemap: true,
  target: "es2022",
  outdir: "./assets/build",
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const buildResult = await esbuild.build(buildOptions);
  console.info(buildResult);
}
