import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceCategoryCard } from '@welpco/ui';

const meta = {
  title: 'Platform/ServiceDiscovery/ServiceCategoryCard',
  component: ServiceCategoryCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceCategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Home Cleaning',
    description: 'Apartments, houses, deep clean, move-in/out',
    servicesCount: 24,
  },
};

export const Clickable: Story = {
  args: {
    title: 'Child Care',
    description: 'Babysitting, nannying, tutoring',
    servicesCount: 12,
    onSelect: () => console.log('select'),
  },
};

