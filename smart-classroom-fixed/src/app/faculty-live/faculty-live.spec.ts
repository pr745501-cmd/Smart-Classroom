import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyLive } from './faculty-live';

describe('FacultyLive', () => {
  let component: FacultyLive;
  let fixture: ComponentFixture<FacultyLive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyLive]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyLive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
