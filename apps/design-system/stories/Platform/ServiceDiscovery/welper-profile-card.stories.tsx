import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelperProfileCard } from '@welpco/ui';

const meta = {
  title: 'Platform/ServiceDiscovery/WelperProfileCard',
  component: WelperProfileCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof WelperProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Alex Carter',
    title: 'Home Cleaning Specialist',
    location: 'San Francisco, CA',
    hourlyRate: 95,
    rating: 4.9,
    reviews: 182,
    specialties: ['Deep clean', 'Move-out', 'Eco products'],
    verified: true,
  },
};

export const WithActions: Story = {
  args: {
    ...Default.args,
    onView: () => console.log('view'),
    onBook: () => console.log('book'),
  },
};

export const BackgroundCheckPassed: Story = {
  args: {
    ...Default.args,
    verified: true,
  },
};

export const BackgroundCheckNotPassed: Story = {
  args: {
    ...Default.args,
    verified: false,
  },
};

