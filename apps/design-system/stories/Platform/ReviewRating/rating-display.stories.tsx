import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingDisplay } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/ReviewRating/RatingDisplay',
  component: RatingDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RatingDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rating: 4.5,
    showValue: true,
  },
};

export const WithoutValue: Story = {
  args: {
    rating: 4.5,
    showValue: false,
  },
};

export const FullRating: Story = {
  args: {
    rating: 5,
    showValue: true,
  },
};

export const LowRating: Story = {
  args: {
    rating: 2.5,
    showValue: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <Flex direction="column" gap="3">
      <RatingDisplay rating={4.5} size="1" showValue />
      <RatingDisplay rating={4.5} size="2" showValue />
      <RatingDisplay rating={4.5} size="3" showValue />
      <RatingDisplay rating={4.5} size="4" showValue />
    </Flex>
  ),
};

