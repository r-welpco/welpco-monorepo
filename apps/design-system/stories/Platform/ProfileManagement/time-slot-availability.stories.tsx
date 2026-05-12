import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeSlotAvailability } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/TimeSlotAvailability',
  component: TimeSlotAvailability,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TimeSlotAvailability>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <TimeSlotAvailability
        onChange={(schedule) => {
          console.log('Schedule updated:', schedule);
        }}
      />
    </div>
  ),
};

export const WithExistingSlots: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <TimeSlotAvailability
        defaultSchedule={{
          timeSlots: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
          ],
          recurringPattern: 'weekly',
        }}
        onChange={(schedule) => {
          console.log('Schedule updated:', schedule);
        }}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <TimeSlotAvailability
        loading={true}
        onChange={(schedule) => {
          console.log('Schedule updated:', schedule);
        }}
      />
    </div>
  ),
};

