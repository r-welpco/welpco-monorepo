import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioCards, RadioCardsItem } from '@welpco/ui/radio-cards';
import { Flex, Text, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/RadioCards',
  component: RadioCards,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Box maxWidth="600px">
      <RadioCards defaultValue="1" columns={{ initial: '1', sm: '3' }}>
        <RadioCardsItem value="1">
          <Flex direction="column" width="100%">
            <Text weight="bold">Basic Plan</Text>
            <Text>$9/month</Text>
          </Flex>
        </RadioCardsItem>
        <RadioCardsItem value="2">
          <Flex direction="column" width="100%">
            <Text weight="bold">Pro Plan</Text>
            <Text>$29/month</Text>
          </Flex>
        </RadioCardsItem>
        <RadioCardsItem value="3">
          <Flex direction="column" width="100%">
            <Text weight="bold">Enterprise</Text>
            <Text>Custom pricing</Text>
          </Flex>
        </RadioCardsItem>
      </RadioCards>
    </Box>
  ),
};

export const SingleColumn: Story = {
  render: () => (
    <Box maxWidth="400px">
      <RadioCards defaultValue="1" columns="1">
        <RadioCardsItem value="1">
          <Flex direction="column" width="100%">
            <Text weight="bold">Credit Card</Text>
            <Text size="2" color="gray">
              Pay with your credit card
            </Text>
          </Flex>
        </RadioCardsItem>
        <RadioCardsItem value="2">
          <Flex direction="column" width="100%">
            <Text weight="bold">PayPal</Text>
            <Text size="2" color="gray">
              Pay with your PayPal account
            </Text>
          </Flex>
        </RadioCardsItem>
        <RadioCardsItem value="3">
          <Flex direction="column" width="100%">
            <Text weight="bold">Bank Transfer</Text>
            <Text size="2" color="gray">
              Direct bank transfer
            </Text>
          </Flex>
        </RadioCardsItem>
      </RadioCards>
    </Box>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex direction="column" gap="4" maxWidth="600px">
      <RadioCards defaultValue="1" color="green">
        <RadioCardsItem value="1">Option 1</RadioCardsItem>
        <RadioCardsItem value="2">Option 2</RadioCardsItem>
      </RadioCards>
      <RadioCards defaultValue="1" color="blue">
        <RadioCardsItem value="1">Option 1</RadioCardsItem>
        <RadioCardsItem value="2">Option 2</RadioCardsItem>
      </RadioCards>
      <RadioCards defaultValue="1" color="purple">
        <RadioCardsItem value="1">Option 1</RadioCardsItem>
        <RadioCardsItem value="2">Option 2</RadioCardsItem>
      </RadioCards>
      <RadioCards defaultValue="1" color="red">
        <RadioCardsItem value="1">Option 1</RadioCardsItem>
        <RadioCardsItem value="2">Option 2</RadioCardsItem>
      </RadioCards>
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Box maxWidth="450px">
      <RadioCards columns="2" defaultValue="2">
        <RadioCardsItem value="1">Off</RadioCardsItem>
        <RadioCardsItem value="2">On</RadioCardsItem>
      </RadioCards>
      <Box mt="4">
        <RadioCards columns="2" defaultValue="2">
          <RadioCardsItem value="1" disabled>
            Off
          </RadioCardsItem>
          <RadioCardsItem value="2" disabled>
            On
          </RadioCardsItem>
        </RadioCards>
      </Box>
    </Box>
  ),
};

