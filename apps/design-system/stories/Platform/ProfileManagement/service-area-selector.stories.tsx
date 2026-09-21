import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceAreaSelector } from '@welpco/ui/platform/profile-management';
import { useState } from 'react';
import type { ServiceArea } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/ServiceAreaSelector',
  component: ServiceAreaSelector,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceAreaSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [area, setArea] = useState<ServiceArea | undefined>(undefined);
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaSelector
          defaultArea={area}
          onSave={setArea}
        />
      </div>
    );
  },
};

export const WithDefaultServiceArea: Story = {
  render: () => {
    const [area, setArea] = useState<ServiceArea | undefined>(undefined);
    const defaultArea = {
      type: 'radius' as const,
      centerAddress: {
        streetAddress: '123 Main Street',
        city: 'San Francisco',
        stateProvince: 'CA',
        zipPostalCode: '94102',
        country: 'United States',
      },
      radiusKm: 25,
    };
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaSelector
          defaultArea={area}
          onSave={setArea}
          allowOverride={true}
          defaultServiceArea={defaultArea}
        />
      </div>
    );
  },
};

export const RadiusType: Story = {
  render: () => {
    const [area, setArea] = useState<ServiceArea | undefined>({
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
        <ServiceAreaSelector
          defaultArea={area}
          onSave={setArea}
        />
      </div>
    );
  },
};

export const AddressType: Story = {
  render: () => {
    const [area, setArea] = useState<ServiceArea | undefined>({
      type: 'radius' as const,
      centerAddress: {
        streetAddress: '123 Main Street',
        city: 'San Francisco',
        stateProvince: 'CA',
        zipPostalCode: '94102',
        country: 'United States',
      },
    });
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaSelector
          defaultArea={area}
          onSave={setArea}
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const [area, setArea] = useState<ServiceArea | undefined>(undefined);
    return (
      <div style={{ width: '700px' }}>
        <ServiceAreaSelector
          defaultArea={area}
          onSave={setArea}
          loading={true}
        />
      </div>
    );
  },
};

