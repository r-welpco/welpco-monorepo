import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceOfferingCard } from '@welpco/ui';

const meta = {
  title: 'Platform/ProfileManagement/ServiceOfferingCard',
  component: ServiceOfferingCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceOfferingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Premium home cleaning',
    category: 'Home',
    hourlyRate: 95,
    durationMinutes: 90,
    description: 'Deep cleaning with eco-friendly products and checklists.',
    rating: 4.9,
    reviewsCount: 182,
  },
};

export const Compact: Story = {
  args: {
    title: 'Pet sitting',
    category: 'Pet',
    hourlyRate: 45,
    description: 'Drop-ins, walks, and feeding for dogs and cats.',
  },
};

