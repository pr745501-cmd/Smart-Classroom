import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentLive } from './student-live';

describe('StudentLive', () => {
  let component: StudentLive;
  let fixture: ComponentFixture<StudentLive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentLive]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentLive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
