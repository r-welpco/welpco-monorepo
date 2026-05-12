import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvailabilityStatusManager } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/AvailabilityStatusManager',
  component: AvailabilityStatusManager,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AvailabilityStatusManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityStatusManager
        timeSlots={[
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        ]}
        onChange={(slots) => {
          console.log('Status updated:', slots);
        }}
      />
    </div>
  ),
};

export const WithMixedStatuses: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityStatusManager
        timeSlots={[
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        ]}
        defaultStatus="available"
        onChange={(slots) => {
          console.log('Status updated:', slots);
        }}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityStatusManager
        timeSlots={[]}
        onChange={(slots) => {
          console.log('Status updated:', slots);
        }}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <AvailabilityStatusManager
        timeSlots={[
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        ]}
        loading={true}
        onChange={(slots) => {
          console.log('Status updated:', slots);
        }}
      />
    </div>
  ),
};

