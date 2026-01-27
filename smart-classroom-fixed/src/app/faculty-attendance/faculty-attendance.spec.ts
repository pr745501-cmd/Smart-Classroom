import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyAttendance } from './faculty-attendance';

describe('FacultyAttendance', () => {
  let component: FacultyAttendance;
  let fixture: ComponentFixture<FacultyAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyAttendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyAttendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
