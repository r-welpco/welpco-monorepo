import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@welpco/ui/card';
import { Button } from '@welpco/ui/button';
import { Badge } from '@welpco/ui/badge';
import { TextField } from '@welpco/ui/text-field';
import { Separator } from '@welpco/ui/separator';
import { IconButton } from '@welpco/ui/icon-button';
import {
  Flex,
  Box,
  Heading,
  Text,
  Link,
  Grid,
  Select,
} from '@radix-ui/themes';
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import * as React from 'react';

const meta = {
  title: 'Examples/Ecommerce Patterns',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProductCard: Story = {
  render: () => {
    const [bookmarked, setBookmarked] = React.useState(false);

    return (
      <Card size="1" style={{ width: '280px' }}>
        <Flex mb="2" position="relative">
          <img
            src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&auto=format&fit=crop&w=560&h=424&q=80"
            width="280"
            height="212"
            style={{ borderRadius: 'var(--radius-1)', objectFit: 'cover' }}
            alt="Product"
          />
          <Box
            position="absolute"
            bottom="0"
            right="0"
            m="2"
            style={{ borderRadius: 'var(--radius-3)' }}
          >
            <IconButton
              variant="ghost"
              color="gray"
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark product'}
              onClick={() => setBookmarked(!bookmarked)}
            >
              {bookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
            </IconButton>
          </Box>
        </Flex>

        <Flex align="end" justify="between" mb="2">
          <Box>
            <Link href="#" size="2" color="gray" highContrast>
              Footwear
            </Link>
            <Heading as="h3" size="3">
              Sneakers #12
            </Heading>
          </Box>
          <Text size="6" weight="bold">
            $149
          </Text>
        </Flex>

        <Text as="p" size="2" color="gray" mb="4">
          Love at the first sight for enthusiasts seeking a fresh and whimsical
          style.
        </Text>

        <Separator size="4" my="4" />

        <Flex gap="2" align="end">
          <Flex direction="column" flexGrow="1">
            <Text size="1" color="gray" mb="1">
              Color
            </Text>
            <Select.Root defaultValue="Pastel" size="2">
              <Select.Trigger variant="soft" aria-label="Color" />
              <Select.Content variant="soft">
                <Select.Item value="Pastel">Pastel</Select.Item>
                <Select.Item value="Bright">Bright</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" minWidth="80px">
            <Text size="1" color="gray" mb="1">
              Size
            </Text>
            <Select.Root defaultValue="8" size="2">
              <Select.Trigger variant="soft" aria-label="Size" />
              <Select.Content variant="soft">
                <Select.Item value="8">8</Select.Item>
                <Select.Item value="8.5">8.5</Select.Item>
                <Select.Item value="9">9</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>

          <Button size="2" variant="solid" color="gray" highContrast>
            Buy
          </Button>
        </Flex>
      </Card>
    );
  },
};

export const ShoppingCart: Story = {
  render: () => {
    const items = [
      { name: 'Poncho #4', caption: 'Size M', count: '1', price: '$79' },
      { name: 'Jeans #8', caption: 'Size 30', count: '2', price: '$118' },
      { name: 'Sneakers #14', caption: 'Size 8', count: '1', price: '$116' },
    ];

    return (
      <Card size="1" style={{ width: '280px' }}>
        <Heading as="h3" size="3" mb="3">
          Shopping cart
        </Heading>

        <Flex direction="column" gap="3">
          {items.map((item, index) => (
            <React.Fragment key={item.name}>
              <Flex gap="4" align="center" justify="between">
                <Flex flexGrow="1" align="center" gap="2">
                  <Box
                    width="32px"
                    height="32px"
                    style={{
                      backgroundColor: 'var(--gray-3)',
                      borderRadius: 'var(--radius-1)',
                    }}
                  />
                  <Box>
                    <Link href="#" size="2" weight="bold">
                      {item.name}
                    </Link>
                    <Text as="div" color="gray" size="1">
                      {item.caption}
                    </Text>
                  </Box>
                </Flex>

                <Flex direction="column" width="48px">
                  <Select.Root defaultValue={item.count} size="1">
                    <Select.Trigger aria-label={`Quantity for ${item.name}`} />
                    <Select.Content variant="soft">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Select.Item key={n} value={String(n)}>
                          {n}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>

                <Text size="2" weight="bold" style={{ width: '40px', textAlign: 'right' }}>
                  {item.price}
                </Text>
              </Flex>
              {index < items.length - 1 && <Separator size="4" />}
            </React.Fragment>
          ))}
        </Flex>

        <Separator size="4" my="4" />

        <Flex align="center" justify="between" mt="4">
          <Text size="2">
            Total <Text weight="bold">$313</Text>
          </Text>
          <Button size="2" variant="solid" color="gray" highContrast>
            Go to checkout
          </Button>
        </Flex>
      </Card>
    );
  },
};

export const ProductFilters: Story = {
  render: () => {
    const [size, setSize] = React.useState('9');
    const [material, setMaterial] = React.useState('');

    return (
      <Card size="1" style={{ width: '280px' }}>
        <Flex direction="column" gap="5">
          <Box>
            <Text as="div" size="2" weight="bold" mb="2">
              Size
            </Text>
            <Grid columns="5" gap="1">
              {['5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'].map(
                (s) => (
                  <Button
                    key={s}
                    variant={size === s ? 'solid' : 'soft'}
                    size="2"
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </Button>
                )
              )}
            </Grid>
          </Box>

          <Box>
            <Text as="div" size="2" weight="bold" mb="2">
              Material
            </Text>
            <Grid columns="4" gap="1">
              {['Leather', 'Suede', 'Mesh', 'Canvas'].map((m) => (
                <Button
                  key={m}
                  variant={material === m ? 'solid' : 'soft'}
                  size="2"
                  onClick={() => setMaterial(m)}
                >
                  {m}
                </Button>
              ))}
            </Grid>
          </Box>
        </Flex>
      </Card>
    );
  },
};

export const DeliveryInfo: Story = {
  render: () => (
    <Card size="1" style={{ width: '280px' }}>
      <Flex mb="3">
        <Heading as="h3" size="3">
          Delivery
        </Heading>
      </Flex>

      <Box position="absolute" right="0" top="0" m="2">
        <Badge size="1" color="amber">
          Guaranteed
        </Badge>
      </Box>

      <Box mb="4">
        <Text as="div" size="2" weight="bold" mb="1">
          Tomorrow
        </Text>
        <Text as="div" size="2">
          12:00 pm – 2:00 pm
        </Text>
      </Box>

      <Box mb="4">
        <Text as="div" size="2" weight="bold" mb="1">
          Luna Rodriguez
        </Text>
        <Text as="div" size="2">
          9876 Maple Avenue
        </Text>
        <Text as="div" size="2">
          Cityville, WA 54321
        </Text>
      </Box>

      <Flex gap="2" justify="end">
        <Button size="2" variant="soft" color="gray" highContrast>
          Edit
        </Button>
        <Button size="2" variant="solid" color="gray" highContrast>
          Confirm
        </Button>
      </Flex>
    </Card>
  ),
};

