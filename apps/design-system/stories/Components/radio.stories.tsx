import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from '@welpco/ui/radio';
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
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  render: () => (
    <fieldset style={{ border: 0, padding: 0 }}>
      <Flex direction="column" gap="2">
        <Text as="label" size="2" htmlFor="radio-default-1">
          <Flex gap="2" align="center">
            <Radio id="radio-default-1" name="default" value="option1" defaultChecked />
            <Text>Option 1</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-default-2">
          <Flex gap="2" align="center">
            <Radio id="radio-default-2" name="default" value="option2" />
            <Text>Option 2</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-default-3">
          <Flex gap="2" align="center">
            <Radio id="radio-default-3" name="default" value="option3" />
            <Text>Option 3</Text>
          </Flex>
        </Text>
      </Flex>
    </fieldset>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <fieldset style={{ border: 0, padding: 0 }}>
      <Flex direction="column" gap="3">
        <Text as="label" size="2" htmlFor="radio-notifications-email">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-email" name="notifications" value="email" defaultChecked />
            <Text>Email notifications</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-notifications-sms">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-sms" name="notifications" value="sms" />
            <Text>SMS notifications</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-notifications-push">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-push" name="notifications" value="push" />
            <Text>Push notifications</Text>
          </Flex>
        </Text>
        <Text as="label" size="2" htmlFor="radio-notifications-none">
          <Flex gap="2" align="center">
            <Radio id="radio-notifications-none" name="notifications" value="none" />
            <Text>No notifications</Text>
          </Flex>
        </Text>
      </Flex>
    </fieldset>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="6" direction="column">
      <fieldset style={{ border: 0, padding: 0 }}>
        <Flex direction="column" gap="2">
          <Text as="label" size="2" htmlFor="radio-color-blue">
            <Flex gap="2" align="center">
              <Radio id="radio-color-blue" name="color" value="blue" defaultChecked color="blue" />
              <Text>Blue</Text>
            </Flex>
          </Text>
          <Text as="label" size="2" htmlFor="radio-color-green">
            <Flex gap="2" align="center">
              <Radio id="radio-color-green" name="color" value="green" color="green" />
              <Text>Green</Text>
            </Flex>
          </Text>
        </Flex>
      </fieldset>
    </Flex>
  ),
};

