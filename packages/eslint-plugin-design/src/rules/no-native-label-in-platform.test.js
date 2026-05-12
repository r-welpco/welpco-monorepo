"use strict";

const rule = require("./no-native-label-in-platform");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

const PLATFORM_FILE = "/abs/packages/ui/src/platform/user-management/login-form.tsx";
const PLATFORM_NESTED = "/abs/packages/ui/src/platform/layout/footer.tsx";
const NON_PLATFORM_FILE = "/abs/packages/ui/src/button.tsx";
const APP_FILE = "/abs/apps/web/src/app/page.tsx";

ruleTester.run("no-native-label-in-platform", rule, {
  valid: [
    // <label> outside platform is allowed.
    { filename: NON_PLATFORM_FILE, code: 'const x = <label htmlFor="a">Name</label>;' },
    { filename: APP_FILE, code: "const x = <label>Email</label>;" },
    // Radix Text as label inside platform — OK.
    { filename: PLATFORM_FILE, code: 'const x = <Text as="label">Name</Text>;' },
    // Capitalised custom component in platform — OK.
    { filename: PLATFORM_FILE, code: "const x = <Label>Name</Label>;" },
    // No label at all in platform — OK.
    { filename: PLATFORM_FILE, code: "const x = <div>hi</div>;" },
  ],
  invalid: [
    {
      filename: PLATFORM_FILE,
      code: 'const x = <label htmlFor="a">Name</label>;',
      errors: [{ messageId: "native", data: { ref: "ui-ux-bible.md §16.1" } }],
    },
    {
      filename: PLATFORM_NESTED,
      code: "const x = <label>Raw</label>;",
      errors: [{ messageId: "native" }],
    },
    {
      filename: PLATFORM_FILE,
      code: "const x = (<form><label>Email</label><input /></form>);",
      errors: [{ messageId: "native" }],
    },
    {
      filename: PLATFORM_FILE,
      code: "const x = (<div><label>A</label><label>B</label></div>);",
      errors: [{ messageId: "native" }, { messageId: "native" }],
    },
    {
      filename: PLATFORM_FILE,
      code: "const x = <label />;",
      errors: [{ messageId: "native" }],
    },
  ],
});
