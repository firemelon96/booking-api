import { createTestApp } from '../test-app';
import request from 'supertest';
import { tour } from './data';

const app = createTestApp();

describe('Create tour flow', () => {
  it('should create a full tour', async () => {
    const res = await request(app)
      .post('/tours')
      .send({ name: tour.name, description: tour.description });
  });
});
