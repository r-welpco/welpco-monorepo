import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@welpco/ui/context-menu';
import { Box, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Box p="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', cursor: 'pointer', userSelect: 'none' }}>
          <Text>Right-click me</Text>
        </Box>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

