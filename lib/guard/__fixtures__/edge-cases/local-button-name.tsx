// A locally-declared component sharing a name with a real Skrewww
// component, but never imported from anywhere — no ImportFact exists for
// "Button" in this file at all, so this must resolve as
// local-or-unresolved, never as the real Skrewww Button.
function Button({ fakeProp }: { fakeProp?: string }) {
  return <button type="button">{fakeProp}</button>;
}

export function Example() {
  return <Button fakeProp="not the real Button" />;
}
