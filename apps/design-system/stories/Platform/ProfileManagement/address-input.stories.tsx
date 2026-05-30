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
      country: 'CA',
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
      city: 'Toronto',
      stateProvince: 'ON',
      zipPostalCode: 'M5H 1A1',
      country: 'CA',
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
      country: 'CA',
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
      stateProvince: '',
      zipPostalCode: 'M5H',
      country: 'CA',
    });
    return (
      <div style={{ width: '600px' }}>
        <AddressInput
          values={values}
          onChange={setValues}
          errors={{
            streetAddress: 'Street address is too short',
            city: 'City is required',
            stateProvince: 'Select a province',
            zipPostalCode: 'Enter a valid postal code',
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
      city: 'Montreal',
      stateProvince: 'QC',
      zipPostalCode: 'H2X 1Y4',
      country: 'CA',
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
