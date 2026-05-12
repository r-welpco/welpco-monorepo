import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@welpco/ui/card';
import { CARD_SIZE } from '@welpco/ui/tokens';
import { Heading, Text, Flex, Grid, Badge } from '@radix-ui/themes';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: CARD_SIZE,
    },
    variant: {
      control: 'select',
      options: ['surface', 'classic', 'ghost'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Card content',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Card Title',
    children: 'This is a card with a title',
  },
};

export const WithTitleAndDescription: Story = {
  args: {
    title: 'Card Title',
    description: 'This is a description',
    children: 'Card content goes here',
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      {CARD_SIZE.map((size) => (
        <Card key={size} size={size}>
          <Text>Size {size} Card</Text>
        </Card>
      ))}
    </Flex>
  ),
};

export const Complex: Story = {
  render: () => (
    <Card size="4" title="Dashboard Stats" description="Overview of your account">
      <Flex direction="column" gap="4">
        <Flex justify="between">
          <Text>Active Bookings</Text>
          <Heading size="6">12</Heading>
        </Flex>
        <Flex justify="between">
          <Text>Total Spent</Text>
          <Heading size="6">$1,234</Heading>
        </Flex>
      </Flex>
    </Card>
  ),
};

/**
 * A responsive grid of cards. Switch the viewport toolbar between mobile
 * and desktop to see the grid reflow — 1 column on small screens, 3 on
 * large ones.
 */
export const ResponsiveGrid: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap={{ initial: '3', md: '4' }}>
      {[
        { title: 'Mobile first', tag: 'responsive' },
        { title: 'Reflowing grid', tag: 'layout' },
        { title: 'Radix tokens', tag: 'tokens' },
        { title: 'Accessible', tag: 'a11y' },
        { title: 'Theme aware', tag: 'theme' },
        { title: 'Composable', tag: 'api' },
      ].map((item) => (
        <Card key={item.title} title={item.title} description="Demonstrates responsive reflow.">
          <Flex justify="between" align="center">
            <Badge color="green" variant="soft">
              {item.tag}
            </Badge>
            <Text size="2" color="gray">
              Updated just now
            </Text>
          </Flex>
        </Card>
      ))}
    </Grid>
  ),
};
