import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ActionConfirmDialog } from '@welpco/ui';
import { Button } from '@radix-ui/themes';

const meta = {
  title: 'Platform/Feedback/ActionConfirmDialog',
  component: ActionConfirmDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ActionConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <ActionConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Accept this booking?"
            description="A payment hold is placed on the customer's saved card before the booking is confirmed. If the hold fails, the booking stays pending."
            confirmLabel="Accept booking"
            cancelLabel="Not now"
            onConfirm={() => {
              // eslint-disable-next-line no-console
              console.log('accepted');
              setOpen(false);
            }}
          />
        </>
      );
    }
    return <Demo />;
  },
};

export const Danger: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button color="red" onClick={() => setOpen(true)}>
            Delete payment method
          </Button>
          <ActionConfirmDialog
            open={open}
            onOpenChange={setOpen}
            variant="danger"
            title="Delete this payment method?"
            description="You won't be able to book with this card anymore. You can add it back later."
            confirmLabel="Delete"
            cancelLabel="Keep card"
            onConfirm={() => {
              // eslint-disable-next-line no-console
              console.log('deleted');
              setOpen(false);
            }}
          />
        </>
      );
    }
    return <Demo />;
  },
};

export const WithReason: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button color="red" variant="outline" onClick={() => setOpen(true)}>
            Cancel booking
          </Button>
          <ActionConfirmDialog
            open={open}
            onOpenChange={setOpen}
            variant="danger"
            title="Cancel this booking?"
            description="Cancelling within the welper's notice window may release the payment hold. Tell us why so we can keep things fair."
            confirmLabel="Cancel booking"
            cancelLabel="Keep booking"
            reasonField={{
              label: 'Reason for cancellation',
              placeholder: "e.g. plans changed, found another welper",
              required: true,
            }}
            onConfirm={(reason) => {
              // eslint-disable-next-line no-console
              console.log('cancelled with reason:', reason);
              setOpen(false);
            }}
          />
        </>
      );
    }
    return <Demo />;
  },
};

export const Pending: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open pending dialog</Button>
          <ActionConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Confirm and pay $120.00?"
            description="Charge will be authorized now and captured after the service is complete."
            confirmLabel="Confirm and pay"
            pending
            onConfirm={() => undefined}
          />
        </>
      );
    }
    return <Demo />;
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Reopen</Button>
          <ActionConfirmDialog
            open={open}
            onOpenChange={setOpen}
            variant="danger"
            title="Decline this booking?"
            description="Tell the customer why so they can find another welper quickly."
            confirmLabel="Decline"
            cancelLabel="Keep pending"
            reasonField={{
              label: 'Reason (optional)',
              placeholder: 'Share a quick note',
            }}
            onConfirm={(reason) => {
              // eslint-disable-next-line no-console
              console.log('declined with reason:', reason);
              setOpen(false);
            }}
          />
        </>
      );
    }
    return <Demo />;
  },
};
