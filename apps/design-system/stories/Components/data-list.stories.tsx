import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DataList,
  DataListItem,
  DataListLabel,
  DataListValue,
} from '@welpco/ui/data-list';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/DataList',
  component: DataList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataList style={{ width: '400px' }}>
      <DataListItem>
        <DataListLabel>Name</DataListLabel>
        <DataListValue>John Doe</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Email</DataListLabel>
        <DataListValue>john@example.com</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Role</DataListLabel>
        <DataListValue>Administrator</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Status</DataListLabel>
        <DataListValue>Active</DataListValue>
      </DataListItem>
    </DataList>
  ),
};

export const MultipleItems: Story = {
  render: () => (
    <DataList style={{ width: '500px' }}>
      <DataListItem>
        <DataListLabel>First Name</DataListLabel>
        <DataListValue>John</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Last Name</DataListLabel>
        <DataListValue>Doe</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Email Address</DataListLabel>
        <DataListValue>john.doe@example.com</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Phone Number</DataListLabel>
        <DataListValue>+1 (555) 123-4567</DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Department</DataListLabel>
        <DataListValue>Engineering</DataListValue>
      </DataListItem>
    </DataList>
  ),
};

