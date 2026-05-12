// Event schemas
export interface EventSchema {
  eventType: string;
  version: string;
  schema: Record<string, unknown>;
}

export const eventSchemas: Record<string, EventSchema> = {
  'user.created': {
    eventType: 'user.created',
    version: '1.0',
    schema: {
      userId: 'string',
      userRole: 'string',
      timestamp: 'string',
    },
  },
};

