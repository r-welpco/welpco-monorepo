import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BookingService } from '../src/domains/booking/booking.service';
import { UsersService as DomainUsersService } from '../src/domains/user-management/users/users.service';
import { TestAuthHelper } from './helpers/test-auth.helper';

describe('BFF Bookings (e2e)', () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;
  const mockBookingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    accept: jest.fn(),
    decline: jest.fn(),
    cancel: jest.fn(),
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    getServiceReceiptDraft: jest.fn(),
    submitServiceReceipt: jest.fn(),
  };

  beforeAll(async () => {
    const mockUsersService = {
      findById: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BookingService)
      .useValue(mockBookingService)
      .overrideProvider(DomainUsersService)
      .useValue(mockUsersService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    authHelper = new TestAuthHelper();
    mockUsersService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        email: `${id}@example.com`,
        accountType: id.startsWith('welper') ? 'Welper' : 'Customer',
        status: 'Active',
        emailVerified: true,
      }),
    );
  }, 15000);

  afterAll(async () => {
    if (app) await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bookings', () => {
    it('should return 200 and list of bookings for customer', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });
      mockBookingService.findAll.mockResolvedValueOnce({
        data: [
          {
            id: 'booking-1',
            customerId: 'customer-1',
            welperId: 'welper-1',
            serviceOfferingId: 'offering-1',
            status: 'pending',
            scheduledDate: '2026-06-15',
            scheduledStartTime: '09:00',
            scheduledEndTime: '11:00',
            availableActions: ['cancel'],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data[0]).toHaveProperty('status', 'pending');
          expect(res.body).toHaveProperty('total', 1);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/bookings')
        .expect(401);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return 200 and booking details', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });
      mockBookingService.findById.mockResolvedValueOnce({
        id: 'booking-1',
        customerId: 'customer-1',
        welperId: 'welper-1',
        status: 'accepted',
        scheduledDate: '2026-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: '11:00',
        availableActions: ['cancel'],
      });

      return request(app.getHttpServer())
        .get('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'booking-1');
          expect(res.body).toHaveProperty('status', 'accepted');
        });
    });
  });

  describe('POST /api/bookings', () => {
    it('should return 201 when creating a booking', async () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });
      mockBookingService.create.mockResolvedValueOnce({
        id: 'booking-new',
        customerId: 'customer-1',
        welperId: 'welper-1',
        serviceOfferingId: 'offering-1',
        status: 'pending',
        answers: {},
        scheduledDate: '2026-06-15',
        scheduledStartTime: '09:00',
        scheduledEndTime: '11:00',
        durationMinutes: 120,
      });

      const res = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          welperId: '550e8400-e29b-41d4-a716-446655440001',
          offeringId: '550e8400-e29b-41d4-a716-446655440002',
          answers: {},
          scheduledDate: '2026-06-15',
          scheduledStartTime: '09:00',
          scheduledEndTime: '11:00',
          durationMinutes: 120,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 'booking-new');
      expect(res.body).toHaveProperty('status', 'pending');
    });

    it('should return 400 when body is invalid (missing required)', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });

      return request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          welperId: 'welper-1',
          // missing offeringId and answers
        })
        .expect(400);
    });
  });

  describe('PATCH /api/bookings/:id/accept', () => {
    it('should return 200 when welper accepts', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mockBookingService.accept.mockResolvedValueOnce({
        id: 'booking-1',
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      return request(app.getHttpServer())
        .patch('/api/bookings/booking-1/accept')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'accepted');
        });
    });
  });

  describe('PATCH /api/bookings/:id/decline', () => {
    it('should return 200 when welper declines with reason', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mockBookingService.decline.mockResolvedValueOnce({
        id: 'booking-1',
        status: 'declined',
        declineReason: 'Not available',
      });

      return request(app.getHttpServer())
        .patch('/api/bookings/booking-1/decline')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Not available' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'declined');
        });
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    it('should return 200 when cancelling with optional reason and timezone', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });
      mockBookingService.cancel.mockResolvedValueOnce({
        id: 'booking-1',
        status: 'cancelled',
        cancellationReason: 'Plans changed',
      });

      return request(app.getHttpServer())
        .patch('/api/bookings/booking-1/cancel')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Plans changed', timezoneOffsetMinutes: -300 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'cancelled');
        });
    });
  });

  describe('PATCH /api/bookings/:id/check-in', () => {
    it('should return 200 when welper checks in', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mockBookingService.checkIn.mockResolvedValueOnce({
        id: 'booking-1',
        status: 'in_progress',
        checkedInAt: new Date().toISOString(),
      });

      return request(app.getHttpServer())
        .patch('/api/bookings/booking-1/check-in')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'in_progress');
        });
    });
  });

  describe('PATCH /api/bookings/:id/check-out', () => {
    it('should return 200 when welper checks out', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mockBookingService.checkOut.mockResolvedValueOnce({
        id: 'booking-1',
        status: 'completed',
        checkedOutAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      return request(app.getHttpServer())
        .patch('/api/bookings/booking-1/check-out')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'completed');
        });
    });
  });

  describe('GET /api/bookings/:id/service-receipt', () => {
    it('should return 200 with draft payload', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mockBookingService.getServiceReceiptDraft.mockResolvedValueOnce({
        bookingId: 'booking-1',
        hourlyRate: 40,
        suggestedBillingCheckInAt: new Date().toISOString(),
        suggestedBillingCheckOutAt: new Date().toISOString(),
        computedTotalCents: 8000,
        currency: 'cad',
        authorizedHoldCents: 10000,
        confirmedReceipt: null,
      });

      return request(app.getHttpServer())
        .get('/api/bookings/booking-1/service-receipt')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('computedTotalCents', 8000);
          expect(res.body).toHaveProperty('confirmedReceipt', null);
        });
    });
  });

  describe('POST /api/bookings/:id/service-receipt', () => {
    it('should return 200 when welper confirms receipt', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      const inAt = new Date('2026-06-15T14:00:00.000Z').toISOString();
      const outAt = new Date('2026-06-15T16:00:00.000Z').toISOString();
      mockBookingService.submitServiceReceipt.mockResolvedValueOnce({
        booking: { id: 'booking-1', status: 'completed' },
        receipt: {
          id: 'rec-1',
          bookingId: 'booking-1',
          billingCheckInAt: inAt,
          billingCheckOutAt: outAt,
          hourlyRate: 40,
          totalCents: 8000,
          currency: 'cad',
          notes: null,
          confirmedAt: new Date().toISOString(),
          sentToCustomerAt: new Date().toISOString(),
        },
      });

      return request(app.getHttpServer())
        .post('/api/bookings/booking-1/service-receipt')
        .set('Authorization', `Bearer ${token}`)
        .send({ billingCheckInAt: inAt, billingCheckOutAt: outAt })
        .expect(200)
        .expect((res) => {
          expect(res.body.receipt).toHaveProperty('totalCents', 8000);
          expect(res.body.booking).toHaveProperty('status', 'completed');
        });
    });

    it('should return 403 for customer', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });
      return request(app.getHttpServer())
        .post('/api/bookings/booking-1/service-receipt')
        .set('Authorization', `Bearer ${token}`)
        .send({
          billingCheckInAt: new Date().toISOString(),
          billingCheckOutAt: new Date().toISOString(),
        })
        .expect(403);
    });
  });
});
