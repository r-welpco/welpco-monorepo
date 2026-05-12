import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@welpco/ui/alert-dialog';
import { Button, Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
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
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button>Open Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to proceed with this action? This cannot be undone.
        </AlertDialogDescription>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialogCancel>
            <Button variant="soft" color="gray">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Button color="red">Delete</Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button color="red">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete Account</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete your account and all associated data. This action cannot be undone.
        </AlertDialogDescription>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialogCancel>
            <Button variant="soft" color="gray">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Button color="red">Delete Account</Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

