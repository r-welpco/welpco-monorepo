import type { Meta, StoryObj } from '@storybook/react-vite';
import { LabeledSlider as Slider } from '@welpco/ui/slider';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => (
    <Flex direction="column" gap="1" style={{ width: '300px' }}>
      <Text as="label" htmlFor="slider-default" mb="1" size="2">
        Volume
      </Text>
      <Slider id="slider-default" thumbLabels={["Volume"]} defaultValue={[50]} />
    </Flex>
  ),
};

export const Range: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '300px' }}>
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="slider-volume" mb="1" size="2">
          Volume: 50%
        </Text>
        <Slider id="slider-volume" thumbLabels={["Volume"]} defaultValue={[50]} />
      </Flex>
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="slider-brightness" mb="1" size="2">
          Brightness: 75%
        </Text>
        <Slider id="slider-brightness" thumbLabels={["Brightness"]} defaultValue={[75]} />
      </Flex>
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="slider-contrast" mb="1" size="2">
          Contrast: 25%
        </Text>
        <Slider id="slider-contrast" thumbLabels={["Contrast"]} defaultValue={[25]} />
      </Flex>
    </Flex>
  ),
};

export const WithSteps: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '300px' }}>
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="slider-step" mb="1" size="2">
          Step size: 10
        </Text>
        <Slider
          id="slider-step"
          thumbLabels={["Step size"]}
          defaultValue={[50]}
          step={10}
          min={0}
          max={100}
        />
      </Flex>
    </Flex>
  ),
};
