import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@welpco/ui/tabs';
import { Text, Heading } from '@radix-ui/themes';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" style={{ width: '500px' }}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <Heading size="4" mb="2">Tab 1 Content</Heading>
        <Text>This is the content for tab 1.</Text>
      </TabsContent>
      <TabsContent value="tab2">
        <Heading size="4" mb="2">Tab 2 Content</Heading>
        <Text>This is the content for tab 2.</Text>
      </TabsContent>
      <TabsContent value="tab3">
        <Heading size="4" mb="2">Tab 3 Content</Heading>
        <Text>This is the content for tab 3.</Text>
      </TabsContent>
    </Tabs>
  ),
};

export const WithManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" style={{ width: '600px' }}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Heading size="4" mb="2">Overview</Heading>
        <Text>Overview content goes here.</Text>
      </TabsContent>
      <TabsContent value="analytics">
        <Heading size="4" mb="2">Analytics</Heading>
        <Text>Analytics content goes here.</Text>
      </TabsContent>
      <TabsContent value="settings">
        <Heading size="4" mb="2">Settings</Heading>
        <Text>Settings content goes here.</Text>
      </TabsContent>
      <TabsContent value="team">
        <Heading size="4" mb="2">Team</Heading>
        <Text>Team content goes here.</Text>
      </TabsContent>
    </Tabs>
  ),
};

