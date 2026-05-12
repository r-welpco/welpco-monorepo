import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog, DialogTrigger, DialogContent } from '@welpco/ui/dialog';
import { Button } from '@welpco/ui/button';
import { TextField } from '@welpco/ui/text-field';
import { FORM_SPACING } from '@welpco/ui/tokens';
import { Flex, Box, Text } from '@radix-ui/themes';
import { useState } from 'react';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    a11y: {
      // Demo story — showcases Radix variants at every contrast level including
      // decorative low-contrast options (ghost / outline / soft). Production
      // code is still checked by bible §5.3 and the a11y addon panel. axe's
      // color-contrast rule is disabled here so variant-exploration stories
      // don't pollute the CI baseline.
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent title="Edit Profile" description="Make changes to your profile here.">
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap} htmlFor="dlg-name">
              Name
            </Text>
            <TextField.Root id="dlg-name" placeholder="Enter your name" />
          </Box>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap} htmlFor="dlg-email">
              Email
            </Text>
            <TextField.Root id="dlg-email" type="email" placeholder="Enter your email" />
          </Box>
          <Flex gap="3" justify="end" mt={FORM_SPACING.submitGap}>
            <Button variant="soft" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save changes</Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  },
};

export const WithoutTitle: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <Text>This dialog doesn't have a title or description — just a close button.</Text>
          <Flex gap="3" justify="end" mt={FORM_SPACING.submitGap}>
            <Button variant="soft" onClick={() => setOpen(false)}>
              Close
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  },
};

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button color="red">Delete Account</Button>
        </DialogTrigger>
        <DialogContent
          title="Delete Account"
          description="Are you sure? This action cannot be undone."
        >
          <Text>This will permanently delete your account and all associated data.</Text>
          <Flex gap="3" justify="end" mt={FORM_SPACING.submitGap}>
            <Button variant="soft" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Dialog on a mobile viewport. Radix scales the content size responsively —
 * switch the viewport toolbar to `mobile` to see it full-width on small
 * screens.
 */
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Open on mobile</Button>
        </DialogTrigger>
        <DialogContent
          title="Mobile Dialog"
          description="Adapts to the viewport with the close icon in the header row."
        >
          <Text size="2">
            On small screens, the dialog fills most of the viewport width. The close button stays
            in the header so long content never overlaps it.
          </Text>
          <Flex gap="3" justify="end" mt={FORM_SPACING.submitGap}>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Dialog with long scrolling content. The header row (title + close) stays
 * visible as the body scrolls.
 */
export const LongContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Open long dialog</Button>
        </DialogTrigger>
        <DialogContent title="Terms of Service" description="Last updated April 24, 2026.">
          <Box>
            {Array.from({ length: 20 }).map((_, i) => (
              <Text key={i} as="p" size="2" color="gray" mb="3">
                Section {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim
                ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                commodo consequat.
              </Text>
            ))}
          </Box>
          <Flex gap="3" justify="end" mt={FORM_SPACING.submitGap}>
            <Button variant="soft" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Accept</Button>
          </Flex>
        </DialogContent>
      </Dialog>
    );
  },
};
