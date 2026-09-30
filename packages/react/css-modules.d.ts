// Build-only: lets tsc type-check component modules that import CSS Modules
// when emitting declarations outside Next's generated types.
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
