import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@welpco/ui/dialog';
import { Button } from '@welpco/ui/button';
import { TextField } from '@welpco/ui/text-field';
import { FORM_SPACING } from '@welpco/ui/tokens';
import { Flex, Box, Text, VisuallyHidden } from '@radix-ui/themes';
import { useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Open Dialog' });
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Edit Profile' })).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent title="Edit Profile" description="Make changes to your profile here.">
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" mb={FORM_SPACING.labelGap} htmlFor="dlg-name">
              Name
            </Text>
            <TextField.Root id="dlg-name" placeholder="Enter your name" />
          </Box>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" mb={FORM_SPACING.labelGap} htmlFor="dlg-email">
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
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open Dialog' }));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Information' })).toBeVisible());
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <VisuallyHidden asChild><DialogTitle>Information</DialogTitle></VisuallyHidden>
          <Text>This dialog has an accessible title without a visible heading.</Text>
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
          <Button color="red" highContrast>Delete Account</Button>
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

/** Mirrors controlled consumers that keep an operation open until completion. */
export const PendingDismissalGuard: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(true);
    return <Dialog open={open} onOpenChange={(next) => { if (!pending || next) setOpen(next); }}>
      <DialogTrigger><Button>Changer de rôle</Button></DialogTrigger>
      <DialogContent title="Confirmer le changement de rôle de votre compte"
        description="Votre demande est en cours de traitement."
        closeButtonLabel="Fermer la fenêtre"
        onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}
        onInteractOutside={(event) => { if (pending) event.preventDefault(); }}>
        <Button disabled={!pending} onClick={() => setPending(false)}>Terminer la demande</Button>
      </DialogContent>
    </Dialog>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Changer de rôle' });
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
    await expect(screen.getByRole('dialog')).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la fenêtre' }));
    await expect(screen.getByRole('dialog')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Terminer la demande' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la fenêtre' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ConsumerFocusHandlers: Story = {
  render: () => {
    const input = useRef<HTMLInputElement>(null);
    const destination = useRef<HTMLButtonElement>(null);
    return <>
      <Button ref={destination}>Return here</Button>
      <Dialog>
        <DialogTrigger><Button>Custom focus</Button></DialogTrigger>
        <DialogContent title="Custom focus handling" aria-describedby={undefined}
          onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); destination.current?.focus(); }}>
          <TextField.Root ref={input} aria-label="Initial focus" />
        </DialogContent>
      </Dialog>
    </>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Custom focus' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Initial focus' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Return here' })).toHaveFocus());
  },
};
