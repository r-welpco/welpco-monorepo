import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingSummary } from '@welpco/ui';

const meta = {
  title: 'Platform/ReviewRating/RatingSummary',
  component: RatingSummary,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RatingSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleDistribution = [
  { rating: 5, count: 45 },
  { rating: 4, count: 20 },
  { rating: 3, count: 8 },
  { rating: 2, count: 2 },
  { rating: 1, count: 1 },
];

export const Default: Story = {
  args: {
    averageRating: 4.3,
    totalReviews: 76,
    distribution: sampleDistribution,
  },
};

export const FewReviews: Story = {
  args: {
    averageRating: 4.5,
    totalReviews: 5,
    distribution: [
      { rating: 5, count: 3 },
      { rating: 4, count: 2 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ],
  },
};

