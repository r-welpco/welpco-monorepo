import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryBrowser } from '@welpco/ui';

const meta = {
  title: 'Platform/ServiceDiscovery/CategoryBrowser',
  component: CategoryBrowser,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CategoryBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

const categories = [
  { title: 'Home', description: 'Cleaning, handyman, moving', servicesCount: 24 },
  { title: 'Care', description: 'Child care, pet care, elder care', servicesCount: 18 },
  { title: 'Learning', description: 'Tutoring, language, music', servicesCount: 11 },
  { title: 'Wellness', description: 'Fitness, massage, coaching', servicesCount: 9 },
];

export const Default: Story = {
  args: { categories },
};

