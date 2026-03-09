import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { LineComponent } from './line.component';
import { BodyService } from '../../services/body.service';

describe('LineComponent', () => {
  let component: LineComponent;
  let fixture: ComponentFixture<LineComponent>;
  let mockBodyService: jasmine.SpyObj<BodyService>;

  beforeEach(async () => {
    mockBodyService = jasmine.createSpyObj('BodyService', ['addLine']);

    await TestBed.configureTestingModule({
      declarations: [LineComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: BodyService, useValue: mockBodyService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onAddLine() does nothing when form is invalid', () => {
    const form = {
      invalid: true,
      value: {},
      resetForm: jasmine.createSpy('resetForm'),
    } as unknown as NgForm;

    component.onAddLine(form);

    expect(mockBodyService.addLine).not.toHaveBeenCalled();
  });

  it('onAddLine() calls bodyService.addLine() with form values', () => {
    const form = {
      invalid: false,
      value: { item: 'Labour', rate: 100, quantity: 2 },
      resetForm: jasmine.createSpy('resetForm'),
    } as unknown as NgForm;

    component.onAddLine(form);

    expect(mockBodyService.addLine).toHaveBeenCalledWith('Labour', 100, 2);
  });

  it('onAddLine() resets the form after a valid submission', () => {
    const resetForm = jasmine.createSpy('resetForm');
    const form = {
      invalid: false,
      value: { item: 'Labour', rate: 100, quantity: 2 },
      resetForm,
    } as unknown as NgForm;

    component.onAddLine(form);

    expect(resetForm).toHaveBeenCalled();
  });

  it('onAddLine() does not reset an invalid form', () => {
    const resetForm = jasmine.createSpy('resetForm');
    const form = {
      invalid: true,
      value: {},
      resetForm,
    } as unknown as NgForm;

    component.onAddLine(form);

    expect(resetForm).not.toHaveBeenCalled();
  });
});
