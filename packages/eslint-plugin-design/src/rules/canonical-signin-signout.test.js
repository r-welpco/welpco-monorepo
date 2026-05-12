"use strict";

const rule = require("./canonical-signin-signout");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

ruleTester.run("canonical-signin-signout", rule, {
  valid: [
    { code: "const x = <Button>Sign in</Button>;" },
    { code: "const x = <Button>Sign out</Button>;" },
    // Prop names that reference the concept — explicit allow-list.
    { code: "const x = <Menu onLogout={fn} />;" },
    { code: "const x = <Menu onLogin={fn} />;" },
    // Identifiers / imports — not user-visible.
    { code: "import { login, logout } from './auth';" },
    { code: "function handleLogin() { return null; }" },
    { code: "const login = 1; const logout = 2;" },
    // Non-user-visible attribute (id) — not checked.
    { code: 'const x = <button id="login">Sign in</button>;' },
    // Dynamic expression — we can't read it statically, so don't flag.
    { code: "const x = <Button>{label}</Button>;" },
  ],
  invalid: [
    {
      code: "const x = <Button>Log in</Button>;",
      errors: [{ messageId: "canonical", data: { value: "Log in", ref: "ui-ux-bible.md §22.3" } }],
    },
    {
      code: "const x = <Button>Login</Button>;",
      errors: [{ messageId: "canonical" }],
    },
    {
      code: "const x = <Button>Log out</Button>;",
      errors: [{ messageId: "canonical" }],
    },
    {
      code: "const x = <Button>Logout</Button>;",
      errors: [{ messageId: "canonical" }],
    },
    {
      code: 'const x = <TextField placeholder="Login here" />;',
      errors: [{ messageId: "canonical" }],
    },
    {
      code: 'const x = <IconButton aria-label="Log out" />;',
      errors: [{ messageId: "canonical" }],
    },
    {
      code: 'const x = <Tooltip title="Click to login" />;',
      errors: [{ messageId: "canonical" }],
    },
  ],
});
