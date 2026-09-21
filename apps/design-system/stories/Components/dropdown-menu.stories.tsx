import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTriggerIcon,
} from '@welpco/ui/dropdown-menu';
import { Button } from '@welpco/ui/button';
import { Flex } from '@radix-ui/themes';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Options' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('menu')).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('menu')).toBeVisible());
  },
  render: () => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger>
        <Button variant="soft" highContrast>
          Options
          <DropdownMenuTriggerIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent highContrast>
        <DropdownMenuItem shortcut="⌘ E">Edit</DropdownMenuItem>
        <DropdownMenuItem shortcut="⌘ D">Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut="⌘ N">Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut="⌘ ⌫" color="red">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="soft">
          Options
          <DropdownMenuTriggerIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem shortcut="⌘ E">Edit</DropdownMenuItem>
        <DropdownMenuItem shortcut="⌘ D">Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Danger Zone</DropdownMenuLabel>
        <DropdownMenuItem shortcut="⌘ ⌫" color="red">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="soft" size="1">
            Options
            <DropdownMenuTriggerIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent size="1">
          <DropdownMenuItem shortcut="⌘ E">Edit</DropdownMenuItem>
          <DropdownMenuItem shortcut="⌘ D">Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem shortcut="⌘ ⌫" color="red">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="soft" size="2">
            Options
            <DropdownMenuTriggerIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent size="2">
          <DropdownMenuItem shortcut="⌘ E">Edit</DropdownMenuItem>
          <DropdownMenuItem shortcut="⌘ D">Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem shortcut="⌘ ⌫" color="red">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  ),
};

export const Variants: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="solid">
            Options
            <DropdownMenuTriggerIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent variant="solid">
          <DropdownMenuItem shortcut="⌘ E">Edit</DropdownMenuItem>
          <DropdownMenuItem shortcut="⌘ D">Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem shortcut="⌘ ⌫" color="red">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="soft">
            Options
            <DropdownMenuTriggerIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent variant="soft">
          <DropdownMenuItem shortcut="⌘ E">Edit</DropdownMenuItem>
          <DropdownMenuItem shortcut="⌘ D">Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem shortcut="⌘ ⌫" color="red">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  ),
};

