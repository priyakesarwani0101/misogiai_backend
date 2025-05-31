import { Test, TestingModule } from '@nestjs/testing';
import { RsvpsService } from './rsvps.service';

describe('RsvpsService', () => {
  let service: RsvpsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RsvpsService],
    }).compile();

    service = module.get<RsvpsService>(RsvpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
