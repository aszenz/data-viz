declare module "*?file" {
  const content: string;
  export default content;
}
declare module "*?text" {
  const content: string;
  export default content;
}
declare module "@finos/perspective-esbuild-plugin" {
  const PerspectiveEsbuildPlugin: (options?: {}) => {
    name: string;
    setup: (buildOptions: {}) => void;
  };
  export { PerspectiveEsbuildPlugin };
}
