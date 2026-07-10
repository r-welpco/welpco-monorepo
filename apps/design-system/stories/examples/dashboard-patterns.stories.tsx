import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@welpco/ui/card';
import { Button } from '@welpco/ui/button';
import { Badge } from '@welpco/ui/badge';
import { TextField } from '@welpco/ui/text-field';
import { Switch } from '@welpco/ui/switch';
import { Checkbox } from '@welpco/ui/checkbox';
import { Avatar } from '@welpco/ui/avatar';
import { Separator } from '@welpco/ui/separator';
import { IconButton } from '@welpco/ui/icon-button';
import {
  Flex,
  Box,
  Heading,
  Text,
  Grid,
  DropdownMenu,
  Link,
  IconButton as RadixIconButton,
} from '@radix-ui/themes';
import {
  DotsHorizontalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@radix-ui/react-icons';
import * as React from 'react';

const meta = {
  title: 'Examples/Dashboard Patterns',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TeamManagement: Story = {
  render: () => {
    const teamMembers = [
      { name: 'John Doe', email: 'john.doe@example.com', avatar: 'JD' },
      { name: 'Jane Smith', email: 'jane.smith@example.com', avatar: 'JS' },
      { name: 'Bob Wilson', email: 'bob.wilson@example.com', avatar: 'BW' },
    ];

    return (
      <Card size="4" style={{ width: '640px' }}>
        <Heading as="h3" size="6" trim="start" mb="2">
          Your team
        </Heading>

        <Text as="p" size="2" mb="5" color="gray">
          Invite and manage your team members.
        </Text>

        <Flex gap="3" mb="5">
          <Box flexGrow="1">
            <TextField.Root size="2" placeholder="Email address" />
          </Box>
          <Button size="2">Invite</Button>
        </Flex>

        <Flex direction="column">
          {teamMembers.map((member, i) => (
            <React.Fragment key={member.name}>
              <Flex gap="4" align="center">
                <Flex gap="3" align="center" width="200px">
                  <Avatar fallback={member.avatar} />
                  <Link href="#" size="2">
                    {member.name}
                  </Link>
                </Flex>

                <Text size="2" color="gray">
                  {member.email}
                </Text>

                <Flex flexGrow="1" justify="end">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <RadixIconButton
                        color="gray"
                        variant="ghost"
                        aria-label={`More actions for ${member.name}`}
                      >
                        <DotsHorizontalIcon />
                      </RadixIconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content variant="soft">
                      <DropdownMenu.Item>View profile</DropdownMenu.Item>
                      <DropdownMenu.Item>Change role</DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item color="red">Remove</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Flex>
              </Flex>

              {i !== teamMembers.length - 1 && (
                <Box>
                  <Separator size="4" my="3" />
                </Box>
              )}
            </React.Fragment>
          ))}
        </Flex>
      </Card>
    );
  },
};

export const NotificationsSettings: Story = {
  render: () => (
    <Card size="4" style={{ width: '640px' }}>
      <Heading as="h3" size="6" trim="start" mb="2">
        Notifications
      </Heading>

      <Text as="p" size="2" mb="6" color="gray">
        Manage your notification settings.
      </Text>

      <Box>
        <Separator size="4" my="5" />
      </Box>

      <Flex gap="9" align="start" justify="between">
        <Box>
          <Heading as="h4" size="3" mb="1">
            Comments
          </Heading>
          <Text as="p" size="2" color="gray">
            Receive notifications when someone comments on your documents or
            mentions you.
          </Text>
        </Box>
        <Flex direction="column" gap="4" mt="1">
          <Text as="label" size="2">
            <Flex gap="2">
              <Switch defaultChecked />
              <Text>Push</Text>
            </Flex>
          </Text>
          <Text as="label" size="2">
            <Flex gap="2">
              <Switch defaultChecked />
              <Text>Email</Text>
            </Flex>
          </Text>
          <Text as="label" size="2">
            <Flex gap="2">
              <Switch />
              <Text>Slack</Text>
            </Flex>
          </Text>
        </Flex>
      </Flex>
    </Card>
  ),
};

export const FinancialPerformance: Story = {
  render: () => {
    const stats = [
      { title: 'MRR', value: '$350K', change: '3.2%', trend: 'up' as const },
      { title: 'OpEx', value: '$211K', change: '12.8%', trend: 'up' as const },
      { title: 'CapEx', value: '$94K', change: '8.8%', trend: 'down' as const },
      { title: 'GPM', value: '44.6%', change: '1.2%', trend: 'down' as const },
    ];

    return (
      <Card size="4" style={{ width: '640px' }}>
        <Heading as="h3" size="6" trim="start" mb="2">
          Financial performance
        </Heading>

        <Text as="p" size="2" mb="6" color="gray">
          Review your company's KPIs compared to the month before.
        </Text>

        <Grid columns="3" gap="5">
          {stats.map((stat) => (
            <Box key={stat.title}>
              <Flex gap="2" mb="2" align="center">
                <Text size="2" color="gray">
                  {stat.title}
                </Text>
                <Badge
                  color={stat.trend === 'up' ? 'teal' : 'red'}
                  radius="full"
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpIcon width="12" height="12" style={{ marginLeft: -2 }} />
                  ) : (
                    <ArrowDownIcon width="12" height="12" style={{ marginLeft: -2 }} />
                  )}
                  {stat.change}
                </Badge>
              </Flex>
              <Text as="div" mb="2" size="8" weight="bold">
                {stat.value}
              </Text>
            </Box>
          ))}
        </Grid>
      </Card>
    );
  },
};

export const RecentActivity: Story = {
  render: () => {
    const activities = [
      {
        name: 'John Doe',
        action: 'Approved invoice',
        link: '#3461',
        time: 'June 21, 11:34 am',
      },
      {
        name: 'Jane Smith',
        action: 'Purchased',
        items: ['15 office chairs', '2 drum sets'],
        time: 'June 21, 9:43 am',
      },
    ];

    return (
      <Card size="4" style={{ width: '640px' }}>
        <Heading as="h3" size="6" trim="start" mb="2">
          Recent activity
        </Heading>

        <Text as="p" size="2" mb="7" color="gray">
          Review what has happened over the past days.
        </Text>

        <Flex direction="column">
          {activities.map((activity, i) => (
            <React.Fragment key={i}>
              <Flex direction="column" gap="3" mb={i < activities.length - 1 ? '5' : '0'}>
                <Flex justify="between" align="center">
                  <Flex gap="3" align="center">
                    <Avatar size="3" fallback={activity.name[0]} />
                    <Box>
                      <Text as="div" size="2" weight="bold">
                        {activity.name}
                      </Text>
                      <Text as="div" size="2" color="gray">
                        {activity.action}{' '}
                        {activity.link && (
                          <Link href="#" onClick={(e) => e.preventDefault()}>
                            {activity.link}
                          </Link>
                        )}
                        {activity.items &&
                          activity.items.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <Link href="#" onClick={(e) => e.preventDefault()}>
                                {item}
                              </Link>
                              {idx < activity.items!.length - 1 && ' and '}
                            </React.Fragment>
                          ))}
                      </Text>
                    </Box>
                  </Flex>

                  <Text size="2" color="gray">
                    {activity.time}
                  </Text>
                </Flex>
              </Flex>

              {i < activities.length - 1 && (
                <Box>
                  <Separator size="4" />
                </Box>
              )}
            </React.Fragment>
          ))}
        </Flex>
      </Card>
    );
  },
};

export const TodoList: Story = {
  render: () => {
    const [todos, setTodos] = React.useState([
      { id: '1', text: 'Respond to comment #384 from Travis Ross', completed: false },
      { id: '2', text: 'Invite Acme Co. team to Slack', completed: false },
      { id: '3', text: 'Create a report requested by Danilo Sousa', completed: false },
      { id: '4', text: 'Review support request #85', completed: false },
      { id: '5', text: 'Close Q2 finances', completed: true },
      { id: '6', text: 'Review invoice #3456', completed: true },
    ]);

    return (
      <Card size="4" style={{ width: '640px' }}>
        <Heading as="h3" size="6" trim="start" mb="2">
          To-do
        </Heading>

        <Text as="p" size="2" mb="5" color="gray">
          Stay on top of your daily tasks.
        </Text>

        <Flex gap="2" direction="column">
          {todos.map((todo) => (
            <Text as="label" size="2" key={todo.id}>
              <Flex gap="2">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={(checked) => {
                    setTodos(
                      todos.map((t) =>
                        t.id === todo.id ? { ...t, completed: !!checked } : t
                      )
                    );
                  }}
                />
                <Text
                  color={todo.completed ? 'gray' : undefined}
                  style={{
                    textDecoration: todo.completed ? 'line-through' : undefined,
                  }}
                >
                  {todo.text}
                </Text>
              </Flex>
            </Text>
          ))}
        </Flex>
      </Card>
    );
  },
};

export const SignUpForm: Story = {
  render: () => (
    <Card size="4" style={{ width: '416px' }}>
      <Heading as="h3" size="6" trim="start" mb="5">
        Sign up
      </Heading>

      <Box mb="5">
        <Text
          as="label"
          htmlFor="email-field"
          size="2"
          weight="medium"
          mb="1"
          style={{ display: 'block' }}
        >
          Email address
        </Text>
        <TextField.Root
          id="email-field"
          placeholder="Enter your email"
        />
      </Box>

      <Box mb="5" position="relative">
        <Flex align="baseline" justify="between" mb="1">
          <Text as="label" htmlFor="password-field" size="2" weight="medium">
            Password
          </Text>
          <Link href="#" size="2" onClick={(e) => e.preventDefault()}>
            Forgot password?
          </Link>
        </Flex>
        <TextField.Root
          id="password-field"
          placeholder="Enter your password"
        />
      </Box>

      <Flex mt="6" justify="end" gap="3">
        <Button variant="outline">Create an account</Button>
        <Button>Sign in</Button>
      </Flex>
    </Card>
  ),
};

