import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAssignments } from './student-assignments';

describe('StudentAssignments', () => {
  let component: StudentAssignments;
  let fixture: ComponentFixture<StudentAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAssignments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
