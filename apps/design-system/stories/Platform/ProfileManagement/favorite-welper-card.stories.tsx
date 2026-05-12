import type { Meta, StoryObj } from '@storybook/react-vite';
import { FavoriteWelperCard } from '@welpco/ui';

const meta = {
  title: 'Platform/ProfileManagement/FavoriteWelperCard',
  component: FavoriteWelperCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof FavoriteWelperCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Alex Carter',
    role: 'Home Cleaning',
    location: 'San Francisco, CA',
    rating: 4.9,
    completedJobs: 220,
    isFavorite: true,
  },
};

export const NotFavorited: Story = {
  args: {
    name: 'Maria Gomez',
    role: 'Child Care',
    location: 'Austin, TX',
    rating: 4.7,
    completedJobs: 140,
    isFavorite: false,
  },
};

