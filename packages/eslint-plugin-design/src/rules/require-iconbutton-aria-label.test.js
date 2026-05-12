"use strict";

const rule = require("./require-iconbutton-aria-label");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

ruleTester.run("require-iconbutton-aria-label", rule, {
  valid: [
    { code: 'const x = <IconButton aria-label="menu"><Icon /></IconButton>;' },
    { code: 'const x = <IconButton aria-labelledby="title"><Icon /></IconButton>;' },
    { code: "const x = <Button>Save</Button>;" }, // Not an IconButton.
    { code: 'const x = <IconButton {...props}><Icon /></IconButton>;' }, // Spread is conservative.
    { code: 'const x = <IconButton aria-label={labels.close} />;' },
    { code: "const x = <div><span>hello</span></div>;" },
  ],
  invalid: [
    {
      code: "const x = <IconButton><Icon /></IconButton>;",
      errors: [{ messageId: "missing", data: { ref: "ui-ux-bible.md §13.3" } }],
    },
    {
      code: 'const x = <IconButton size="2"><Icon /></IconButton>;',
      errors: [{ messageId: "missing" }],
    },
    {
      code: 'const x = <IconButton variant="soft" color="gray" />;',
      errors: [{ messageId: "missing" }],
    },
    {
      code: 'const x = <IconButton onClick={fn}><Icon /></IconButton>;',
      errors: [{ messageId: "missing" }],
    },
    {
      code: 'const x = <IconButton title="not a label"><Icon /></IconButton>;',
      errors: [{ messageId: "missing" }],
    },
    {
      code:
        'const x = (<div><IconButton><Icon /></IconButton><IconButton aria-label="ok"/></div>);',
      errors: [{ messageId: "missing" }],
    },
  ],
});
