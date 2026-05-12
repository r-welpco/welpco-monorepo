"use strict";

const rule = require("./require-token-size");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

ruleTester.run("require-token-size", rule, {
  valid: [
    { code: 'const x = <Button size="3">Save</Button>;' },
    { code: 'const x = <IconButton size="1" aria-label="x" />;' },
    { code: 'const x = <TextField.Root size="3" />;' },
    { code: 'const x = <Select.Trigger size="2" />;' },
    { code: 'const x = <Badge size="2">OK</Badge>;' },
    { code: 'const x = <Card size="5">...</Card>;' },
    { code: 'const x = <Dialog.Content size="4" />;' },
    { code: 'const x = <AlertDialog.Content size="3" />;' },
    // Non-literal size — rule defers to types.
    { code: 'const x = <Button size={dynamic}>Save</Button>;' },
    // Size on a non-scoped component — not our concern.
    { code: 'const x = <Heading size="9">Hello</Heading>;' },
  ],
  invalid: [
    {
      code: 'const x = <Button size="5">Save</Button>;',
      errors: [
        {
          messageId: "outOfRange",
          data: {
            value: "5",
            component: "Button",
            allowed: "1, 2, 3, 4",
            ref: "ui-ux-bible.md §4 and §15",
          },
        },
      ],
    },
    {
      code: 'const x = <TextField.Root size="4" />;',
      errors: [{ messageId: "outOfRange" }],
    },
    {
      code: 'const x = <TextArea size="4" />;',
      errors: [{ messageId: "outOfRange" }],
    },
    {
      code: 'const x = <Select.Root size="4" />;',
      errors: [{ messageId: "outOfRange" }],
    },
    {
      code: 'const x = <Badge size="4">OK</Badge>;',
      errors: [{ messageId: "outOfRange" }],
    },
    {
      code: 'const x = <Card size="6">...</Card>;',
      errors: [{ messageId: "outOfRange" }],
    },
    {
      code: 'const x = <Dialog.Content size="5" />;',
      errors: [{ messageId: "outOfRange" }],
    },
    {
      code: 'const x = <Callout.Root size="4">hi</Callout.Root>;',
      errors: [{ messageId: "outOfRange" }],
    },
  ],
});
