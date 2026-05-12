import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabNav, TabNavLink } from '@welpco/ui/tab-nav';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/TabNav',
  component: TabNav,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TabNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TabNav>
      <TabNavLink href="#" active>
        Overview
      </TabNavLink>
      <TabNavLink href="#">Analytics</TabNavLink>
      <TabNavLink href="#">Settings</TabNavLink>
      <TabNavLink href="#">Team</TabNavLink>
    </TabNav>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <TabNav>
      <TabNavLink href="#" active>
        <Flex align="center" gap="2">
          <span>📊</span>
          <span>Dashboard</span>
        </Flex>
      </TabNavLink>
      <TabNavLink href="#">
        <Flex align="center" gap="2">
          <span>📈</span>
          <span>Analytics</span>
        </Flex>
      </TabNavLink>
      <TabNavLink href="#">
        <Flex align="center" gap="2">
          <span>⚙️</span>
          <span>Settings</span>
        </Flex>
      </TabNavLink>
    </TabNav>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex direction="column" gap="4">
      <TabNav color="green">
        <TabNavLink href="#" active>
          Overview
        </TabNavLink>
        <TabNavLink href="#">Analytics</TabNavLink>
        <TabNavLink href="#">Settings</TabNavLink>
      </TabNav>
      <TabNav color="blue">
        <TabNavLink href="#" active>
          Overview
        </TabNavLink>
        <TabNavLink href="#">Analytics</TabNavLink>
        <TabNavLink href="#">Settings</TabNavLink>
      </TabNav>
      <TabNav color="purple">
        <TabNavLink href="#" active>
          Overview
        </TabNavLink>
        <TabNavLink href="#">Analytics</TabNavLink>
        <TabNavLink href="#">Settings</TabNavLink>
      </TabNav>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex direction="column" gap="4">
      <TabNav size="1">
        <TabNavLink href="#" active>
          Small
        </TabNavLink>
        <TabNavLink href="#">Tab</TabNavLink>
        <TabNavLink href="#">Nav</TabNavLink>
      </TabNav>
      <TabNav size="2">
        <TabNavLink href="#" active>
          Medium
        </TabNavLink>
        <TabNavLink href="#">Tab</TabNavLink>
        <TabNavLink href="#">Nav</TabNavLink>
      </TabNav>
      <TabNav size="3">
        <TabNavLink href="#" active>
          Large
        </TabNavLink>
        <TabNavLink href="#">Tab</TabNavLink>
        <TabNavLink href="#">Nav</TabNavLink>
      </TabNav>
    </Flex>
  ),
};

