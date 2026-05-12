import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvailabilityExceptions } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/AvailabilityExceptions',
  component: AvailabilityExceptions,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AvailabilityExceptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityExceptions
        onAdd={async (exception) => {
          console.log('Add exception:', exception);
        }}
        onRemove={async (id) => {
          console.log('Remove exception:', id);
        }}
      />
    </div>
  ),
};

export const WithExceptions: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityExceptions
        exceptions={[
          {
            id: '1',
            date: new Date('2024-12-25'),
            available: false,
            reason: 'Christmas holiday',
          },
          {
            id: '2',
            date: new Date('2024-12-31'),
            available: true,
            reason: 'New Year\'s Eve - special availability',
          },
        ]}
        onAdd={async (exception) => {
          console.log('Add exception:', exception);
        }}
        onRemove={async (id) => {
          console.log('Remove exception:', id);
        }}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityExceptions
        loading={true}
        onAdd={async (exception) => {
          console.log('Add exception:', exception);
        }}
        onRemove={async (id) => {
          console.log('Remove exception:', id);
        }}
      />
    </div>
  ),
};

