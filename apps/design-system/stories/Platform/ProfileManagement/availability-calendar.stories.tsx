import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvailabilityCalendar } from '@welpco/ui/platform/profile-management';
import { useState } from 'react';

const meta = {
  title: 'Platform/ProfileManagement/AvailabilityCalendar',
  component: AvailabilityCalendar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AvailabilityCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    return (
      <div style={{ width: '800px' }}>
        <AvailabilityCalendar
          selectedDates={selectedDates}
          onToggleDate={(date) => {
            setSelectedDates((prev) => {
              const exists = prev.some((d) => d.toDateString() === date.toDateString());
              if (exists) {
                return prev.filter((d) => d.toDateString() !== date.toDateString());
              }
              return [...prev, date];
            });
          }}
        />
      </div>
    );
  },
};

export const WithStatuses: Story = {
  render: () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    return (
      <div style={{ width: '800px' }}>
        <AvailabilityCalendar
          dateAvailabilities={[
            { date: today, status: 'available', hasTimeSlots: true },
            { date: tomorrow, status: 'busy', hasTimeSlots: true },
            { date: dayAfter, status: 'unavailable' },
          ]}
          showTimeSlots={true}
        />
      </div>
    );
  },
};

export const WithExceptions: Story = {
  render: () => {
    const today = new Date();
    const exceptionDate = new Date(today);
    exceptionDate.setDate(exceptionDate.getDate() + 5);

    return (
      <div style={{ width: '800px' }}>
        <AvailabilityCalendar
          exceptions={[
            {
              id: '1',
              date: exceptionDate,
              available: false,
              reason: 'Holiday',
            },
          ]}
          dateAvailabilities={[
            { date: today, status: 'available', hasTimeSlots: true },
          ]}
          showTimeSlots={true}
        />
      </div>
    );
  },
};

export const WithEffectiveDateRange: Story = {
  render: () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    return (
      <div style={{ width: '800px' }}>
        <AvailabilityCalendar
          effectiveDateRange={{
            start: startDate,
            end: endDate,
          }}
          dateAvailabilities={[
            { date: today, status: 'available', hasTimeSlots: true },
          ]}
          showTimeSlots={true}
        />
      </div>
    );
  },
};

export const ComplexExample: Story = {
  render: () => {
    const today = new Date();
    const dates: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    const exceptionDate = new Date(today);
    exceptionDate.setDate(exceptionDate.getDate() + 10);

    return (
      <div style={{ width: '800px' }}>
        <AvailabilityCalendar
          selectedDates={dates.filter((_, i) => i % 2 === 0)}
          dateAvailabilities={dates.map((date, i) => ({
            date,
            status: i % 3 === 0 ? 'available' : i % 3 === 1 ? 'busy' : 'unavailable',
            hasTimeSlots: i % 2 === 0,
          }))}
          exceptions={[
            {
              id: '1',
              date: exceptionDate,
              available: false,
              reason: 'Personal appointment',
            },
          ]}
          showTimeSlots={true}
          effectiveDateRange={{
            start: today,
            end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          }}
          onDateClick={(date) => {
            console.log('Date clicked:', date);
          }}
        />
      </div>
    );
  },
};
