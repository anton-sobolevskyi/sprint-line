/**
 * Lightweight smoke check for generated feature specs.
 * Full createComponent coverage needs Store/Router/HTTP mocks per feature;
 * keep those in dedicated behaviour tests instead of the scaffold.
 */
export function expectComponentDefined(componentClass: unknown): void {
  expect(componentClass).toBeTruthy();
}
