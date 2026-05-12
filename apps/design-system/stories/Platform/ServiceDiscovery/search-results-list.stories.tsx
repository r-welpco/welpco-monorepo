import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchResultsList } from '@welpco/ui';

const meta = {
  title: 'Platform/ServiceDiscovery/SearchResultsList',
  component: SearchResultsList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchResultsList>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  {
    name: 'Alex Carter',
    title: 'Home Cleaning Specialist',
    location: 'San Francisco, CA',
    hourlyRate: 95,
    rating: 4.9,
    reviews: 182,
    specialties: ['Deep clean', 'Move-out', 'Eco products'],
  },
  {
    name: 'Maria Gomez',
    title: 'Child Care & Tutoring',
    location: 'Austin, TX',
    hourlyRate: 40,
    rating: 4.8,
    reviews: 120,
    specialties: ['Evenings', 'Homework help'],
  },
];

export const Default: Story = {
  args: { items },
};

export const Loading: Story = {
  args: { items: [], loading: true },
};

export const Empty: Story = {
  args: { items: [] },
};

export const Error: Story = {
  args: { items: [], error: 'Failed to load results.' },
};

