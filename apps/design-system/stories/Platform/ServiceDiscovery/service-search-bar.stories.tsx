import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceSearchBar } from '@welpco/ui';

const meta = {
  title: 'Platform/ServiceDiscovery/ServiceSearchBar',
  component: ServiceSearchBar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    suggestions: ['Home cleaning', 'Pet walking', 'Math tutoring'],
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

