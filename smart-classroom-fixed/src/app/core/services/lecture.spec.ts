import { TestBed } from '@angular/core/testing';

import { Lecture } from '../lecture/lecture';

describe('Lecture', () => {
  let service: Lecture;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Lecture);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
