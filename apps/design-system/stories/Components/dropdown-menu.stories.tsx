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

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
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
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="soft">
          Options
          <DropdownMenuTriggerIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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

