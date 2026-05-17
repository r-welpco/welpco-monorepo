import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceAreaCard } from '@welpco/ui/platform/profile-management';
import { useState } from 'react';

const meta = {
  title: 'Platform/ProfileManagement/ServiceAreaCard',
  component: ServiceAreaCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceAreaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [area, setArea] = useState(undefined);
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaCard
          defaultArea={area}
          onChange={setArea}
        />
      </div>
    );
  },
};

export const WithRadiusArea: Story = {
  render: () => {
    const [area, setArea] = useState({
      type: 'radius' as const,
      centerAddress: {
        streetAddress: '123 Main Street',
        city: 'San Francisco',
        stateProvince: 'CA',
        zipPostalCode: '94102',
        country: 'United States',
      },
      radiusKm: 40,
    });
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaCard
          defaultArea={area}
          onChange={setArea}
        />
      </div>
    );
  },
};

export const WithAddressArea: Story = {
  render: () => {
    const [area, setArea] = useState({
      type: 'address' as const,
      centerAddress: {
        streetAddress: '456 Market Street',
        city: 'Oakland',
        stateProvince: 'CA',
        zipPostalCode: '94607',
        country: 'United States',
      },
    });
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaCard
          defaultArea={area}
          onChange={setArea}
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const [area, setArea] = useState(undefined);
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaCard
          defaultArea={area}
          onChange={setArea}
          loading={true}
        />
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [area, setArea] = useState(undefined);
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaCard
          defaultArea={area}
          onChange={setArea}
          error="Failed to save service area. Please try again."
        />
      </div>
    );
  },
};
