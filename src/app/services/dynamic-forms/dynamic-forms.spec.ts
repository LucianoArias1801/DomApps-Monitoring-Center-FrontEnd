import { TestBed } from '@angular/core/testing';

import { DynamicForms } from './dynamic-forms';

describe('DynamicForms', () => {
  let service: DynamicForms;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicForms);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
