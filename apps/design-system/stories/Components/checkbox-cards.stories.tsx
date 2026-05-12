import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxCards, CheckboxCardsItem } from '@welpco/ui/checkbox-cards';
import { Flex, Text, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/CheckboxCards',
  component: CheckboxCards,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckboxCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Box maxWidth="600px">
      <CheckboxCards defaultValue={['1']} columns={{ initial: '1', sm: '3' }}>
        <CheckboxCardsItem value="1">
          <Flex direction="column" width="100%">
            <Text weight="bold">A1 Keyboard</Text>
            <Text>US Layout</Text>
          </Flex>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="2">
          <Flex direction="column" width="100%">
            <Text weight="bold">Pro Mouse</Text>
            <Text>Zero-lag wireless</Text>
          </Flex>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="3">
          <Flex direction="column" width="100%">
            <Text weight="bold">Lightning Mat</Text>
            <Text>Wireless charging</Text>
          </Flex>
        </CheckboxCardsItem>
      </CheckboxCards>
    </Box>
  ),
};

export const SingleColumn: Story = {
  render: () => (
    <Box maxWidth="400px">
      <CheckboxCards defaultValue={['1']} columns="1">
        <CheckboxCardsItem value="1">
          <Flex direction="column" width="100%">
            <Text weight="bold">Email notifications</Text>
            <Text size="2" color="gray">
              Receive updates about your account activity
            </Text>
          </Flex>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="2">
          <Flex direction="column" width="100%">
            <Text weight="bold">SMS notifications</Text>
            <Text size="2" color="gray">
              Get important alerts via text message
            </Text>
          </Flex>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="3">
          <Flex direction="column" width="100%">
            <Text weight="bold">Push notifications</Text>
            <Text size="2" color="gray">
              Receive real-time updates on your device
            </Text>
          </Flex>
        </CheckboxCardsItem>
      </CheckboxCards>
    </Box>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex direction="column" gap="4" maxWidth="600px">
      <CheckboxCards defaultValue={['1']} color="green">
        <CheckboxCardsItem value="1">Agree to Terms</CheckboxCardsItem>
      </CheckboxCards>
      <CheckboxCards defaultValue={['1']} color="blue">
        <CheckboxCardsItem value="1">Agree to Terms</CheckboxCardsItem>
      </CheckboxCards>
      <CheckboxCards defaultValue={['1']} color="purple">
        <CheckboxCardsItem value="1">Agree to Terms</CheckboxCardsItem>
      </CheckboxCards>
      <CheckboxCards defaultValue={['1']} color="red">
        <CheckboxCardsItem value="1">Agree to Terms</CheckboxCardsItem>
      </CheckboxCards>
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Box maxWidth="450px">
      <CheckboxCards columns="2" defaultValue="2">
        <CheckboxCardsItem value="1">Off</CheckboxCardsItem>
        <CheckboxCardsItem value="2">On</CheckboxCardsItem>
      </CheckboxCards>
      <Box mt="4">
        <CheckboxCards columns="2" defaultValue="2">
          <CheckboxCardsItem value="1" disabled>
            Off
          </CheckboxCardsItem>
          <CheckboxCardsItem value="2" disabled>
            On
          </CheckboxCardsItem>
        </CheckboxCards>
      </Box>
    </Box>
  ),
};

