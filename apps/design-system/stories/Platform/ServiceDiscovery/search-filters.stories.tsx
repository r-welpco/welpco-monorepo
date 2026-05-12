import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchFilters } from '@welpco/ui';

const meta = {
  title: 'Platform/ServiceDiscovery/SearchFilters',
  component: SearchFilters,
  parameters: {
    layout: 'padded',
    a11y: {
      // SearchFilters contains a Radius Slider; Radix Themes Slider does not
      // forward `aria-label` to the internal thumb span, so axe's
      // `aria-input-field-name` rule flags a false-positive against the thumb.
      // The component carries a visible Text-as-label above the Slider.
      config: {
        rules: [{ id: 'aria-input-field-name', enabled: false }],
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: {
      priceRange: 'any',
      rating: 'any',
      location: undefined,
      radius: 25,
    },
  },
};

export const TightFilters: Story = {
  args: {
    value: {
      priceRange: '50-100',
      rating: '4.5',
      location: 'Montreal',
      radius: 50,
    },
  },
};

