import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyStudents } from './faculty-students';

describe('FacultyStudents', () => {
  let component: FacultyStudents;
  let fixture: ComponentFixture<FacultyStudents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyStudents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyStudents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
