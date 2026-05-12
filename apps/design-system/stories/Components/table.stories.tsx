import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumnHeaderCell,
  TableRowHeaderCell,
  TableCell,
} from '@welpco/ui/table';
import { Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table.Root>
      <TableHeader>
        <TableRow>
          <TableColumnHeaderCell>Name</TableColumnHeaderCell>
          <TableColumnHeaderCell>Email</TableColumnHeaderCell>
          <TableColumnHeaderCell>Role</TableColumnHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableRowHeaderCell>John Doe</TableRowHeaderCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>Admin</TableCell>
        </TableRow>
        <TableRow>
          <TableRowHeaderCell>Jane Smith</TableRowHeaderCell>
          <TableCell>jane@example.com</TableCell>
          <TableCell>User</TableCell>
        </TableRow>
        <TableRow>
          <TableRowHeaderCell>Bob Johnson</TableRowHeaderCell>
          <TableCell>bob@example.com</TableCell>
          <TableCell>User</TableCell>
        </TableRow>
      </TableBody>
    </Table.Root>
  ),
};

export const WithManyRows: Story = {
  render: () => (
    <Table.Root>
      <TableHeader>
        <TableRow>
          <TableColumnHeaderCell>ID</TableColumnHeaderCell>
          <TableColumnHeaderCell>Name</TableColumnHeaderCell>
          <TableColumnHeaderCell>Status</TableColumnHeaderCell>
          <TableColumnHeaderCell>Date</TableColumnHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }, (_, i) => (
          <TableRow key={i}>
            <TableRowHeaderCell>{i + 1}</TableRowHeaderCell>
            <TableCell>Item {i + 1}</TableCell>
            <TableCell>
              <Text size="2" color={i % 2 === 0 ? 'green' : 'gray'}>
                {i % 2 === 0 ? 'Active' : 'Inactive'}
              </Text>
            </TableCell>
            <TableCell>2024-01-{String(i + 1).padStart(2, '0')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table.Root>
  ),
};

