import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddressInput } from '@welpco/ui/platform/profile-management';
import { useState } from 'react';

const meta = {
  title: 'Platform/ProfileManagement/AddressInput',
  component: AddressInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AddressInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [values, setValues] = useState({
      streetAddress: '',
      city: '',
      stateProvince: '',
      zipPostalCode: '',
      country: '',
    });
    return (
      <div style={{ width: '600px' }}>
        <AddressInput
          values={values}
          onChange={setValues}
          required
        />
      </div>
    );
  },
};

export const WithDefaultValues: Story = {
  render: () => {
    const [values, setValues] = useState({
      streetAddress: '123 Main Street',
      city: 'San Francisco',
      stateProvince: 'CA',
      zipPostalCode: '94102',
      country: 'United States',
    });
    return (
      <div style={{ width: '600px' }}>
        <AddressInput
          values={values}
          onChange={setValues}
          required
        />
      </div>
    );
  },
};

export const Optional: Story = {
  render: () => {
    const [values, setValues] = useState({
      streetAddress: '',
      city: '',
      stateProvince: '',
      zipPostalCode: '',
      country: '',
    });
    return (
      <div style={{ width: '600px' }}>
        <AddressInput
          values={values}
          onChange={setValues}
          required={false}
        />
      </div>
    );
  },
};

export const WithErrors: Story = {
  render: () => {
    const [values, setValues] = useState({
      streetAddress: '12',
      city: '',
      stateProvince: 'C',
      zipPostalCode: '94',
      country: '',
    });
    return (
      <div style={{ width: '600px' }}>
        <AddressInput
          values={values}
          onChange={setValues}
          errors={{
            streetAddress: 'Street address is too short',
            city: 'City is required',
            stateProvince: 'State/Province is too short',
            zipPostalCode: 'ZIP/Postal code is too short',
          }}
          required
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const [values, setValues] = useState({
      streetAddress: '123 Main Street',
      city: 'San Francisco',
      stateProvince: 'CA',
      zipPostalCode: '94102',
      country: 'United States',
    });
    return (
      <div style={{ width: '600px' }}>
        <AddressInput
          values={values}
          onChange={setValues}
          loading={true}
          required
        />
      </div>
    );
  },
};

