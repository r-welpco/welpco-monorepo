import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReviewCard } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/ReviewRating/ReviewCard',
  component: ReviewCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    reviewerName: 'John Doe',
    rating: 4.5,
    comment: 'Great service! Very professional and on time.',
    date: '2 days ago',
    verified: true,
  },
};

export const WithoutComment: Story = {
  args: {
    reviewerName: 'Jane Smith',
    rating: 5,
    date: '1 week ago',
  },
};

export const Unverified: Story = {
  args: {
    reviewerName: 'Bob Johnson',
    rating: 3.5,
    comment: 'Service was okay, but could be improved.',
    date: '3 days ago',
    verified: false,
  },
};

export const MultipleReviews: Story = {
  render: () => (
    <Flex direction="column" gap="3" style={{ width: '500px' }}>
      <ReviewCard
        reviewerName="John Doe"
        rating={5}
        comment="Excellent service!"
        date="2 days ago"
        verified
      />
      <ReviewCard
        reviewerName="Jane Smith"
        rating={4}
        comment="Very good, would recommend."
        date="1 week ago"
        verified
      />
    </Flex>
  ),
};

