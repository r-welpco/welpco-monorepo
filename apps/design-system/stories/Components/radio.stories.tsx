import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from '@welpco/ui/radio';
import { RadioGroup } from '@welpco/ui/radio-group';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <Flex direction="column" gap="2">
        <Text as="label" size="2" htmlFor="radio-default-1">
          <Flex gap="2" align="center">
            <Radio id="radio-default-1" value="option1" />
            <Text>Option 1</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-default-2">
          <Flex gap="2" align="center">
            <Radio id="radio-default-2" value="option2" />
            <Text>Option 2</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-default-3">
          <Flex gap="2" align="center">
            <Radio id="radio-default-3" value="option3" />
            <Text>Option 3</Text>
          </Flex>
        </Text>
      </Flex>
    </RadioGroup>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <RadioGroup defaultValue="email">
      <Flex direction="column" gap="3">
        <Text as="label" size="2" htmlFor="radio-notifications-email">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-email" value="email" />
            <Text>Email notifications</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-notifications-sms">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-sms" value="sms" />
            <Text>SMS notifications</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-notifications-push">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-push" value="push" />
            <Text>Push notifications</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-notifications-none">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-none" value="none" />
            <Text>No notifications</Text>
          </Flex>
        </Text>
      </Flex>
    </RadioGroup>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="6" direction="column">
      <RadioGroup defaultValue="blue">
        <Flex direction="column" gap="2">
          <Text as="label" size="2" htmlFor="radio-color-blue">
            <Flex gap="2" align="center">
              <Radio id="radio-color-blue" value="blue" color="blue" />
              <Text>Blue</Text>
            </Flex>
          </Text>
          <Text as="label" size="2" htmlFor="radio-color-green">
            <Flex gap="2" align="center">
              <Radio id="radio-color-green" value="green" color="green" />
              <Text>Green</Text>
            </Flex>
          </Text>
        </Flex>
      </RadioGroup>
    </Flex>
  ),
};

