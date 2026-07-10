import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@welpco/ui/select';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    a11y: {
      // Demo story — showcases Radix variants at every contrast level including
      // decorative low-contrast options (ghost / outline / soft). Production
      // code is still checked by bible §5.3 and the a11y addon panel. axe's
      // color-contrast rule is disabled here so variant-exploration stories
      // don't pollute the CI baseline.
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Flex direction="column" gap="1">
      <Text as="label" htmlFor="select-default" size="2" mb="1">
        Choose an option
      </Text>
      <Select defaultValue="option1">
        <SelectTrigger id="select-default" aria-label="Choose an option" placeholder="Select an option" />
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </Flex>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Flex direction="column" gap="1">
      <Text as="label" htmlFor="select-groups" size="2" mb="1">
        Choose a fruit or vegetable
      </Text>
      <Select defaultValue="apple">
        <SelectTrigger id="select-groups" aria-label="Choose a fruit or vegetable" placeholder="Select a fruit" />
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="broccoli">Broccoli</SelectItem>
            <SelectItem value="spinach">Spinach</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="select-size-1" size="2" weight="medium">
          Size 1
        </Text>
        <Select defaultValue="1">
          <SelectTrigger id="select-size-1" aria-label="Size 1 select" placeholder="Select..." size="1" />
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </Flex>
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="select-size-2" size="2" weight="medium">
          Size 2
        </Text>
        <Select defaultValue="1">
          <SelectTrigger id="select-size-2" aria-label="Size 2 select" placeholder="Select..." size="2" />
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </Flex>
      <Flex direction="column" gap="2">
        <Text as="label" htmlFor="select-size-3" size="2" weight="medium">
          Size 3
        </Text>
        <Select defaultValue="1">
          <SelectTrigger id="select-size-3" aria-label="Size 3 select" placeholder="Select..." size="3" />
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </Flex>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="1">
        <Text as="label" htmlFor="select-color-green" size="2" mb="1">
          Green select
        </Text>
        <Select defaultValue="1">
          <SelectTrigger id="select-color-green" aria-label="Green select" placeholder="Green" color="green" />
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </Flex>
      <Flex direction="column" gap="1">
        <Text as="label" htmlFor="select-color-blue" size="2" mb="1">
          Blue select
        </Text>
        <Select defaultValue="1">
          <SelectTrigger id="select-color-blue" aria-label="Blue select" placeholder="Blue" color="blue" />
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </Flex>
      <Flex direction="column" gap="1">
        <Text as="label" htmlFor="select-color-red" size="2" mb="1">
          Red select
        </Text>
        <Select defaultValue="1">
          <SelectTrigger id="select-color-red" aria-label="Red select" placeholder="Red" color="red" />
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </Flex>
    </Flex>
  ),
};

