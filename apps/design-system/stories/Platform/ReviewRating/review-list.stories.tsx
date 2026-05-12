import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReviewList } from '@welpco/ui';

const meta = {
  title: 'Platform/ReviewRating/ReviewList',
  component: ReviewList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReviewList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleReviews = [
  {
    reviewerName: 'John Doe',
    rating: 5,
    comment: 'Excellent service! Very professional.',
    date: '2 days ago',
    verified: true,
  },
  {
    reviewerName: 'Jane Smith',
    rating: 4,
    comment: 'Very good, would recommend.',
    date: '1 week ago',
    verified: true,
  },
];

export const Default: Story = {
  args: {
    reviews: sampleReviews,
  },
};

export const Empty: Story = {
  args: {
    reviews: [],
  },
};

export const Loading: Story = {
  args: {
    reviews: [],
    loading: true,
  },
};

