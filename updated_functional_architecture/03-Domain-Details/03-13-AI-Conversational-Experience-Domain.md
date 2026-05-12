# Domain 13 — AI Conversational Experience

> **Status**: Planned
> **Last Updated**: February 2026
> **Owner**: AI & Product Team
> **Dependencies**: Service Discovery (1), Booking & Scheduling (3), Payment Processing (4), User Management (5), Profile Management (6), Review & Rating (8), Notification (11)

---

## 1. Purpose and Business Value

### The Vision

Imagine a world where booking a local service is as effortless as texting a friend. No forms. No filters. No friction. You simply say what you need — and the platform understands, finds, and books it for you.

**Domain 13 is Welpco's magic layer.** It replaces the traditional search → filter → compare → book funnel with a single, fluid conversation. The AI doesn't just answer questions — it *renders interactive UI components* directly inside the chat. Search results appear as tappable cards. Calendars appear for date selection. Payment forms appear inline. The entire transaction happens without ever leaving the conversation.

### Why This Matters

| Competitive Advantage | Description |
|----------------------|-------------|
| **Zero-friction booking** | Users don't need to learn the UI — they just talk |
| **Accessibility-first** | Voice input makes the platform usable by everyone |
| **Emotional connection** | A conversational AI feels personal, not transactional |
| **Higher conversion** | Fewer steps = fewer drop-offs; the AI guides users to completion |
| **Differentiation** | No competing marketplace offers generative UI chat booking |
| **Retention** | Proactive suggestions ("Your usual Friday cleaning?") keep users coming back |

### Business Metrics

- **Booking Completion Rate**: Target 40% higher than traditional funnel
- **Time to Book**: Target < 90 seconds from first message to confirmed booking
- **Voice Adoption**: Target 25% of chat interactions initiated by voice
- **User Satisfaction (CSAT)**: Target 4.5+/5.0 for AI-assisted bookings
- **Escalation Rate**: Target < 10% of conversations require human handoff

---

## 2. Core Capabilities

### 2.1 Natural Language Understanding

The AI understands freeform human language — messy, informal, multilingual:

```
User: "hey i need someone to fix my leaky kitchen faucet, im in laval
       and it's kinda urgent, maybe tomorrow morning?"

AI understands:
  → Service: Plumbing (faucet repair)
  → Location: Laval, QC
  → Urgency: High
  → Time preference: Tomorrow morning
  → Intent: Search + Book
```

**Capabilities:**
- Intent detection: search, book, reschedule, cancel, review, get help
- Entity extraction: service type, location, date/time, budget, preferences
- Bilingual support: English and French (Quebec market)
- Typo and slang tolerance: "plmber", "asap", "this wknd"
- Contextual disambiguation: "the same one as last time" → resolves from booking history

### 2.2 Generative UI Rendering

This is what makes Domain 13 revolutionary. The AI doesn't just return text — it streams **live, interactive React components** directly into the chat interface.

When the user says "find me a cleaner near me Saturday", the AI response is not a wall of text. It's a rendered UI:

```
┌─────────────────────────────────────────────┐
│ 🤖 AI: I found 3 cleaners near you!        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ★ Marie-Claire D. — 4.9 ⭐ (127 jobs) │ │
│ │   Deep cleaning specialist              │ │
│ │   $35/hr · Available Saturday 9am-2pm   │ │
│ │   📍 2.3 km away                        │ │
│ │   [View Profile]  [Book Now]            │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │   Jean-Luc P. — 4.7 ⭐ (89 jobs)      │ │
│ │   Residential cleaning                  │ │
│ │   $30/hr · Available Saturday 10am-4pm  │ │
│ │   📍 4.1 km away                        │ │
│ │   [View Profile]  [Book Now]            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📅 Pick a time for your booking:        │ │
│ │ [Saturday, Feb 7]                       │ │
│ │   ○ 9:00 AM  ○ 10:00 AM  ● 11:00 AM   │ │
│ │   ○ 12:00 PM ○ 1:00 PM   ○ 2:00 PM    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 💬 Tap "Book Now" or tell me your pick!     │
└─────────────────────────────────────────────┘
```

The user can interact with these components *or* keep chatting — the AI adapts to both.

**How it works (Vercel AI SDK `streamUI`):**

```typescript
// Simplified: AI tool returns React Server Components
const result = await streamUI({
  model: openai('gpt-4o'),
  messages: conversationHistory,
  tools: {
    searchWelpers: {
      description: 'Search for service providers',
      parameters: z.object({
        query: z.string(),
        location: z.string(),
        category: z.string().optional(),
      }),
      generate: async function* ({ query, location, category }) {
        yield <SearchingSpinner query={query} />;
        const results = await bffClient.searchWelpers({ query, location, category });
        return <WelperSearchResults results={results} />;
      },
    },
    // ... more tools
  },
});
```

### 2.3 Voice Interaction

**Speech-to-Text (Input):**
- Primary: Web Speech API (browser-native, zero-latency, free)
- Fallback: OpenAI Whisper API (for browsers without Web Speech support)
- Streaming transcription with real-time visual feedback
- Language detection: auto-switch between English and French

**Text-to-Speech (Output — optional):**
- Browser-native SpeechSynthesis API for quick responses
- OpenAI TTS API for natural-sounding longer responses
- User toggle: "Read responses aloud" in accessibility settings
- Respects system-level voice preferences

**Voice UX:**
```
User taps 🎤 → "I need someone to mow my lawn this weekend"
                     ↓ (real-time transcription appears)
AI: [streaming response with generative UI cards]
     ↓ (optional TTS reads summary aloud)
"I found 5 lawn care providers near you. Marie has the best ratings
 and is available Saturday morning. Shall I book her?"
```

### 2.4 Multi-Turn Conversational Context

The AI maintains rich context throughout the conversation:

```
Turn 1: "Find me a plumber in Montreal"
         → AI searches, shows results

Turn 2: "What about the second one?"
         → AI knows "second one" = second result from previous search

Turn 3: "Is she available Thursday?"
         → AI knows "she" = the welper from turn 2, checks Thursday availability

Turn 4: "Book her for 2pm"
         → AI creates booking with all accumulated context

Turn 5: "Actually, make it 3pm"
         → AI updates the booking time
```

**Context window includes:**
- Full conversation messages (up to token limit)
- User's profile data (name, location, preferences)
- User's booking history (recent, frequent welpers)
- Current search results and selections
- Active booking drafts

### 2.5 Smart Proactive Suggestions

The AI doesn't just react — it anticipates:

| Trigger | AI Suggestion |
|---------|---------------|
| Friday afternoon, user has weekly cleaning history | "It's Friday! Want me to book your usual cleaning with Marie for tomorrow?" |
| User's last lawn service was 3 weeks ago | "Your lawn might be due for a trim — want me to find someone?" |
| Welper the user likes has a new discount | "Jean-Luc is offering 15% off deep cleaning this week. Interested?" |
| Seasonal event (spring) | "Spring cleaning season! I can help you find a cleaner for a big refresh." |
| User's booking is approaching | "Your plumbing appointment with Sarah is tomorrow at 2pm. Need to reschedule?" |

Proactive suggestions are powered by Domain 14 (AI/ML Intelligence) signals.

### 2.6 In-Chat Booking Completion

The AI can complete the entire booking lifecycle without leaving the chat:

```
Search → Select Welper → Pick Date/Time → Confirm Details → Payment → Confirmation
```

Each step renders as a generative UI component. The user can:
- Tap buttons in the UI components
- Type responses ("yes", "the first one", "Thursday at 3")
- Use voice for any step
- Mix all three interaction modes freely

### 2.7 Human Support Escalation

When the AI can't resolve an issue:

1. AI detects confusion/frustration (repeated unclear messages, explicit "talk to a human")
2. AI offers: "I'd like to connect you with our support team — they can help with this"
3. Creates a support ticket with full conversation context
4. Hands off to human agent (if live chat is available) or confirms ticket created
5. Conversation context transfers seamlessly — user doesn't repeat themselves

**Escalation triggers:**
- User explicitly requests human help
- 3+ consecutive misunderstandings
- Sensitive issues (disputes, safety concerns, payment problems)
- Topics outside AI scope (legal, complaints about specific welpers)

---

## 3. Generative UI Components

These are React Server Components streamed by the AI into the chat interface:

### 3.1 `<WelperCard>`

Interactive welper profile summary displayed in search results.

| Property | Type | Description |
|----------|------|-------------|
| `welper` | `WelperProfile` | Welper data (name, photo, rating, bio) |
| `distance` | `number` | Distance from customer in km |
| `availability` | `TimeSlot[]` | Next available slots |
| `onBook` | `() => void` | Triggers booking flow in chat |
| `onViewProfile` | `() => void` | Expands full profile in chat |

**Rendered as:** Card with avatar, name, rating stars, specialty, distance badge, and "Book Now" CTA button.

### 3.2 `<ServiceOfferingList>`

Displays a welper's service menu with prices.

| Property | Type | Description |
|----------|------|-------------|
| `offerings` | `ServiceOffering[]` | List of services with prices |
| `onSelect` | `(offeringId) => void` | User selects a service |

**Rendered as:** Compact list with service name, description, hourly rate, and radio/check selection.

### 3.3 `<CalendarPicker>`

Interactive date and time selection.

| Property | Type | Description |
|----------|------|-------------|
| `availableSlots` | `TimeSlot[]` | Available date/time combinations |
| `welperId` | `string` | Welper whose availability is shown |
| `onSelect` | `(slot: TimeSlot) => void` | User picks a slot |

**Rendered as:** Compact calendar showing available days highlighted, with time slot buttons for the selected day.

### 3.4 `<MapView>`

Shows welper location, service area, and customer position.

| Property | Type | Description |
|----------|------|-------------|
| `welperLocation` | `LatLng` | Welper's base location |
| `customerLocation` | `LatLng` | Customer's location |
| `serviceRadius` | `number` | Welper's service area in km |

**Rendered as:** Embedded map (Mapbox GL) with two pins and a radius circle. Tapping the welper pin shows their card.

### 3.5 `<BookingConfirmation>`

Pre-booking summary for final review.

| Property | Type | Description |
|----------|------|-------------|
| `welper` | `WelperProfile` | Selected welper |
| `service` | `ServiceOffering` | Selected service |
| `dateTime` | `DateTime` | Confirmed date/time |
| `estimatedCost` | `number` | Projected cost |
| `onConfirm` | `() => void` | Confirm and proceed to payment |
| `onEdit` | `(field: string) => void` | Modify a specific field |

**Rendered as:** Summary card with all booking details, estimated cost, "Confirm Booking" and "Edit" buttons.

### 3.6 `<PaymentForm>`

Inline payment capture (Stripe Elements).

| Property | Type | Description |
|----------|------|-------------|
| `bookingId` | `string` | Associated booking |
| `amount` | `number` | Payment amount |
| `clientSecret` | `string` | Stripe payment intent secret |
| `onSuccess` | `() => void` | Payment completed callback |

**Rendered as:** Compact Stripe payment form with saved cards and "Pay Now" button. Never leaves the chat.

### 3.7 `<ReviewPrompt>`

Post-service review collection.

| Property | Type | Description |
|----------|------|-------------|
| `booking` | `Booking` | Completed booking |
| `onSubmit` | `(review: ReviewData) => void` | Submit review |

**Rendered as:** Star rating selector, text area for comments, and "Submit Review" button. AI pre-fills a suggested review based on the conversation.

---

## 4. AI Tools (Function Calling)

The LLM orchestrates the conversation by calling tools — each tool maps to a BFF API endpoint:

### Tool Definitions

```typescript
const aiTools = {
  searchWelpers: {
    description: 'Search for service providers (welpers) based on query, location, and category. Use this when the user is looking for someone to do a job.',
    parameters: z.object({
      query: z.string().describe('Natural language description of the service needed'),
      location: z.string().describe('City, postal code, or area name'),
      category: z.string().optional().describe('Service category slug if known'),
      date: z.string().optional().describe('Preferred date in ISO format'),
      maxDistance: z.number().optional().describe('Max distance in km, default 25'),
    }),
    // Internally calls: GET /api/search/services?q={query}&location={location}&category={category}
  },

  getWelperProfile: {
    description: 'Get detailed profile of a specific welper including bio, services, availability, and reviews.',
    parameters: z.object({
      welperId: z.string().describe('Unique welper identifier'),
    }),
    // Internally calls: GET /api/search/welpers/:id
  },

  checkAvailability: {
    description: 'Check a welper\'s availability for a specific date or date range.',
    parameters: z.object({
      welperId: z.string().describe('Welper to check'),
      date: z.string().describe('Date to check in ISO format'),
      duration: z.number().optional().describe('Estimated job duration in hours'),
    }),
    // Internally calls: GET /api/profiles/welpers/:id/availability?date={date}
  },

  createBooking: {
    description: 'Create a new booking with a welper. Only use after the user has confirmed all details.',
    parameters: z.object({
      welperId: z.string().describe('Selected welper'),
      serviceOfferingId: z.string().describe('Selected service offering'),
      dateTime: z.string().describe('Confirmed date and time in ISO format'),
      notes: z.string().optional().describe('Special instructions from the user'),
    }),
    // Internally calls: POST /api/bookings
  },

  getMyBookings: {
    description: 'Retrieve the user\'s upcoming and past bookings.',
    parameters: z.object({
      status: z.enum(['upcoming', 'past', 'all']).optional(),
    }),
    // Internally calls: GET /api/bookings?status={status}
  },

  geocodeLocation: {
    description: 'Convert a postal code or address to geographic coordinates for location-based search.',
    parameters: z.object({
      postalCode: z.string().optional(),
      address: z.string().optional(),
    }),
    // Internally calls: POST /api/geocode/forward
  },

  getCategories: {
    description: 'Get the list of service categories available on Welpco. Use when the user is browsing or uncertain about what service they need.',
    parameters: z.object({}),
    // Internally calls: GET /api/search/categories
  },

  escalateToSupport: {
    description: 'Transfer the conversation to human support. Use when the user is frustrated, requests a human, or the issue is outside AI capabilities.',
    parameters: z.object({
      reason: z.string().describe('Brief summary of why escalation is needed'),
      urgency: z.enum(['low', 'medium', 'high']).describe('Urgency level'),
    }),
    // Internally calls: POST /api/support/tickets
  },
};
```

### Tool Call Flow

```
User message
    ↓
LLM processes message + conversation history
    ↓
LLM decides: respond with text OR call a tool
    ↓ (tool call)
BFF executes the API call with user's auth context
    ↓
Tool result returned to LLM
    ↓
LLM generates response with optional generative UI
    ↓
Streamed to client as text + React components
```

---

## 5. Data Entities

### Conversation

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique conversation identifier |
| `userId` | `UUID` | Owning user (FK to User) |
| `title` | `string \| null` | Auto-generated conversation title |
| `status` | `enum` | `active`, `archived`, `escalated` |
| `metadata` | `jsonb` | Context: last search, selected welper, etc. |
| `createdAt` | `timestamp` | When conversation started |
| `updatedAt` | `timestamp` | Last activity |

### Message

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique message identifier |
| `conversationId` | `UUID` | Parent conversation (FK) |
| `role` | `enum` | `user`, `assistant`, `tool`, `system` |
| `content` | `text` | Text content of the message |
| `toolCalls` | `jsonb \| null` | Tool call requests (for assistant messages) |
| `toolResults` | `jsonb \| null` | Tool execution results (for tool messages) |
| `generativeUI` | `jsonb \| null` | Serialized UI component tree |
| `createdAt` | `timestamp` | When message was sent |

### GenerativeUIBlock

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique block identifier |
| `messageId` | `UUID` | Parent message (FK) |
| `componentType` | `string` | Component name: `WelperCard`, `CalendarPicker`, etc. |
| `props` | `jsonb` | Serialized component props |
| `interactionState` | `jsonb \| null` | Tracks user interactions (selected slot, etc.) |
| `renderedAt` | `timestamp` | When component was rendered |

### VoiceTranscription

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Unique transcription identifier |
| `messageId` | `UUID` | Associated message (FK) |
| `audioUrl` | `string \| null` | Stored audio URL (if Whisper used) |
| `transcript` | `text` | Final transcription text |
| `language` | `string` | Detected language (`en`, `fr`) |
| `confidence` | `float` | Transcription confidence score |
| `provider` | `enum` | `web_speech_api`, `whisper` |
| `durationMs` | `integer` | Audio duration in milliseconds |
| `createdAt` | `timestamp` | When transcription was created |

---

## 6. API Endpoints

### Chat Endpoints

#### `POST /api/chat`

Send a user message and receive a streamed AI response with generative UI.

**Request:**
```json
{
  "conversationId": "uuid-optional (creates new if omitted)",
  "message": "I need a plumber in Laval, preferably tomorrow morning",
  "context": {
    "location": { "lat": 45.6066, "lng": -73.7124 },
    "timezone": "America/Montreal"
  }
}
```

**Response:** Server-Sent Events (SSE) stream

```
event: text-delta
data: {"text": "I found 3 plumbers "}

event: text-delta
data: {"text": "near Laval! Here are the best matches:\n\n"}

event: tool-call
data: {"toolName": "searchWelpers", "args": {"query": "plumber", "location": "Laval"}}

event: tool-result
data: {"toolName": "searchWelpers", "result": [...]}

event: component
data: {"type": "WelperCard", "props": {"welper": {...}, "distance": 2.3}}

event: component
data: {"type": "WelperCard", "props": {"welper": {...}, "distance": 4.1}}

event: component
data: {"type": "CalendarPicker", "props": {"availableSlots": [...]}}

event: text-delta
data: {"text": "\nTap 'Book Now' on any card, or just tell me which one you prefer!"}

event: finish
data: {"messageId": "uuid", "conversationId": "uuid"}
```

#### `POST /api/chat/voice`

Send audio for transcription + AI response.

**Request:** `multipart/form-data`
- `audio`: Audio blob (webm/opus or wav)
- `conversationId`: Optional existing conversation
- `language`: Optional language hint (`en` or `fr`)

**Response:** Same SSE stream as `/api/chat`, prefixed with transcription event:

```
event: transcription
data: {"text": "I need a plumber in Laval", "language": "en", "confidence": 0.97}

event: text-delta
data: {"text": "Let me find plumbers near Laval..."}
...
```

#### `GET /api/chat/history`

Retrieve conversation history for the authenticated user.

**Query Parameters:**
- `conversationId` (optional): Get messages for specific conversation
- `limit` (optional, default 50): Number of messages
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Plumber in Laval",
      "lastMessage": "Your booking with Sarah is confirmed for Thursday at 2pm!",
      "updatedAt": "2026-02-05T14:30:00Z",
      "messageCount": 12
    }
  ],
  "cursor": "next-page-cursor"
}
```

#### `DELETE /api/chat/history`

Clear conversation history for the authenticated user.

**Query Parameters:**
- `conversationId` (optional): Delete specific conversation (or all if omitted)

**Response:** `204 No Content`

---

## 7. User Experience Flow

### The Magical User Journey

```
┌────────────────────────────────────────────────────────────────┐
│                    THE WELPCO CHAT EXPERIENCE                  │
│                                                                │
│  Step 1: OPEN                                                  │
│  User taps the ✨ chat icon in the nav bar                     │
│  A warm welcome appears:                                       │
│  "Hey Sarah! What can I help you find today?"                  │
│                                                                │
│  Step 2: ASK (text or voice)                                   │
│  User: "I need a house cleaner near me this Saturday"          │
│  (or taps 🎤 and says it aloud)                                │
│                                                                │
│  Step 3: AI SEARCHES (streaming)                               │
│  "Looking for cleaners near Pointe-Claire... 🔍"              │
│  [Animated search indicator]                                   │
│                                                                │
│  Step 4: GENERATIVE UI APPEARS                                 │
│  Three WelperCards stream in with photos, ratings, prices      │
│  A MapView shows their locations relative to the user          │
│  A CalendarPicker shows Saturday time slots                    │
│                                                                │
│  Step 5: USER SELECTS                                          │
│  User taps "Book Now" on Marie's card                          │
│  (or says "Book the first one for 10am")                       │
│                                                                │
│  Step 6: CONFIRMATION                                          │
│  BookingConfirmation component appears with all details        │
│  "Marie-Claire D. · Deep Cleaning · Sat Feb 7, 10:00 AM"      │
│  Estimated cost: $105 (3 hrs × $35/hr)                         │
│  [Confirm Booking] [Edit Details]                              │
│                                                                │
│  Step 7: PAYMENT                                               │
│  PaymentForm appears inline with saved card                    │
│  User taps "Pay $105" — payment captured instantly             │
│                                                                │
│  Step 8: DONE ✅                                                │
│  "You're all set! Marie-Claire will be at your place           │
│   Saturday at 10am. I've added it to your calendar.            │
│   Anything else I can help with?"                              │
│                                                                │
│  Total time: ~45 seconds from first message to confirmed       │
│  booking. Zero page navigation. Zero forms. Pure magic.        │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI SDK** | Vercel AI SDK (`ai` package) | Streaming, tool calling, generative UI |
| **Streaming** | `streamUI()` / RSC pattern | Stream React components from server |
| **LLM (Primary)** | OpenAI GPT-4o | Main language model |
| **LLM (Fallback)** | Claude 3.5 Sonnet / Gemini 1.5 Pro | Provider abstraction for swap |
| **Provider Abstraction** | Vercel AI SDK providers | `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google` |
| **Voice Input** | Web Speech API + Whisper API | Speech-to-text |
| **Voice Output** | SpeechSynthesis API + OpenAI TTS | Text-to-speech (optional) |
| **Chat UI** | Custom React components | Message list, input bar, voice button |
| **Maps** | Mapbox GL JS | Location visualization |
| **Payments** | Stripe Elements | Inline payment in chat |
| **State** | React `useChat()` hook | Client-side conversation state |

### Provider Abstraction Pattern

```typescript
// ai/providers.ts — swap LLM with a single env var
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

const providers = {
  openai: () => openai('gpt-4o'),
  anthropic: () => anthropic('claude-3-5-sonnet-20241022'),
  google: () => google('gemini-1.5-pro'),
};

export function getModel() {
  const provider = process.env.AI_PROVIDER || 'openai';
  return providers[provider]();
}
```

---

## 9. Accessibility

### Voice-First Design

- **Motor impairment**: Full functionality via voice input — no typing required
- **Visual impairment**: All generative UI components have ARIA labels, roles, and screen reader descriptions
- **Cognitive accessibility**: AI uses clear, simple language; offers step-by-step guidance
- **Keyboard navigation**: All interactive components are fully keyboard accessible (Tab, Enter, Arrow keys)

### Screen Reader Support

Each generative UI component includes semantic markup:

```tsx
<WelperCard
  role="article"
  aria-label="Marie-Claire D., 4.9 stars, Deep cleaning specialist, $35 per hour, 2.3 kilometers away"
>
  {/* Visual content */}
</WelperCard>
```

### Language Support

- Auto-detect language from user input (English/French)
- AI responds in the same language
- Voice recognition supports both languages with auto-switching
- All generative UI labels are localized

---

## 10. Security & Privacy

### Authentication

- All chat endpoints require a valid JWT token
- Conversation data is scoped to the authenticated user — no cross-user access
- Unauthenticated users see a prompt to sign in before using chat

### Data Protection

| Principle | Implementation |
|-----------|---------------|
| **PII never sent to LLM** | User names, emails, phone numbers are replaced with placeholders before sending to OpenAI |
| **Anonymized context** | "The customer (user_123) is searching for a plumber near location_456" |
| **No training on user data** | OpenAI API configured with `store: false` — data not used for model training |
| **Conversation encryption** | Messages encrypted at rest in PostgreSQL |
| **Retention policy** | Conversations auto-archived after 90 days, deleted after 1 year |
| **Right to delete** | Users can delete their conversation history at any time |

### Rate Limiting

- Max 60 messages per hour per user
- Max 10 voice transcriptions per hour per user
- Abuse detection: repeated identical messages, rapid-fire requests

---

## 11. System Prompt Architecture

The AI's behavior is governed by a carefully crafted system prompt:

```
You are Welpco Assistant — a friendly, bilingual (English/French) AI that helps
customers find and book local service providers ("Welpers") on the Welpco platform.

PERSONALITY:
- Warm, helpful, and efficient
- You speak like a knowledgeable local friend, not a corporate bot
- Use casual but professional tone
- Match the user's language (English or French)

RULES:
- ALWAYS use tools to search — never make up welper names or availability
- NEVER share one user's data with another
- If unsure, ask clarifying questions rather than guessing
- Guide users toward completing a booking when intent is clear
- Offer to help with related needs ("Need anything else?")

CAPABILITIES:
- Search for welpers by service, location, and availability
- Show interactive results (generative UI)
- Complete bookings end-to-end
- Check and manage existing bookings
- Escalate to human support when needed

CONTEXT:
- Current user: {user.firstName} (ID: {user.id})
- Location: {user.location.city}, {user.location.province}
- Timezone: {user.timezone}
- Language preference: {user.language}
- Recent bookings: {recentBookings.summary}
```

---

## 12. Integration Points

### Domain Dependencies

```
Domain 13 (AI Chat)
    ├── Domain 1  (Service Discovery) — search welpers, categories
    ├── Domain 3  (Booking)           — create, view, manage bookings
    ├── Domain 4  (Payment)           — inline payment processing
    ├── Domain 5  (User Management)   — authentication, user context
    ├── Domain 6  (Profile)           — welper profiles, availability
    ├── Domain 8  (Review & Rating)   — post-service review collection
    ├── Domain 11 (Notification)      — booking confirmations, reminders
    └── Domain 14 (AI/ML Intelligence)— smart suggestions, ranking signals
```

### Internal Architecture (BFF)

```
Next.js Web App (Client)
    ↓ SSE stream
Next.js API Route / Server Action
    ↓ Vercel AI SDK (streamUI)
OpenAI GPT-4o (tool calling)
    ↓ tool calls
NestJS BFF (Domain 13 Module)
    ↓ in-process calls
Other Domain Modules (Search, Booking, Profile, etc.)
    ↓
PostgreSQL
```

---

## 13. Future Enhancements

| Phase | Enhancement | Description |
|-------|------------|-------------|
| **v1.1** | Image understanding | User sends a photo of a broken pipe → AI identifies the issue and suggests relevant welpers |
| **v1.2** | Multi-party chat | Customer + Welper + AI in a shared conversation for coordination |
| **v1.3** | Proactive outreach | AI initiates conversations via push notification for reminders and suggestions |
| **v2.0** | AI agent mode | AI autonomously handles recurring bookings, rescheduling, and follow-ups |
| **v2.1** | AR integration | User points camera at a problem → AI overlays repair instructions + suggests welpers |

---

> *"The best interface is no interface. Domain 13 makes Welpco feel less like an app and more like having a helpful friend who happens to know every service provider in your neighborhood."*
