"use strict";

const rule = require("./no-raw-semantic-color");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

ruleTester.run("no-raw-semantic-color", rule, {
  valid: [
    { code: 'const x = <Button color={SEMANTIC_COLOR.danger}>Delete</Button>;' },
    { code: 'const x = <Callout.Root color={SEMANTIC_COLOR.warning}>Heads up</Callout.Root>;' },
    { code: 'const x = <Text color="gray">neutral</Text>;' },
    { code: 'const x = <Text as="span" color="red">*</Text>;' },
    { code: 'const x = <Badge color="red">Urgent</Badge>;' }, // Badge is exempt.
    { code: "const x = <Button>Save</Button>;" },
    { code: 'const x = <IconButton color="gray" aria-label="menu" />;' },
  ],
  invalid: [
    {
      code: 'const x = <Button color="red">Delete</Button>;',
      errors: [{ messageId: "raw", data: { value: "red", component: "Button", ref: "ui-ux-bible.md §5.2" } }],
    },
    {
      code: 'const x = <Callout color="amber">Watch out</Callout>;',
      errors: [{ messageId: "raw" }],
    },
    {
      code: 'const x = <Callout.Root color="green">Success</Callout.Root>;',
      errors: [{ messageId: "raw" }],
    },
    {
      code: 'const x = <Text color="blue">link</Text>;',
      errors: [{ messageId: "raw" }],
    },
    {
      code: 'const x = <IconButton color="red" aria-label="delete" />;',
      errors: [{ messageId: "raw" }],
    },
    {
      // Marker pattern but wrong child — still fires.
      code: 'const x = <Text as="span" color="red">required</Text>;',
      errors: [{ messageId: "raw" }],
    },
    {
      // Marker pattern but wrong `as` — still fires.
      code: 'const x = <Text color="red">*</Text>;',
      errors: [{ messageId: "raw" }],
    },
  ],
});
