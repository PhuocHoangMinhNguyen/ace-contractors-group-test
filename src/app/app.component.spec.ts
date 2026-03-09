import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AppComponent } from './app.component';
import { BodyService } from './services/body.service';

describe('AppComponent', () => {
  const mockBodyService = { isPrinting: false };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: BodyService, useValue: mockBodyService }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have title "ace-contractors-group-test"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('ace-contractors-group-test');
  });

  it('exposes bodyService.isPrinting', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.bodyService.isPrinting).toBeFalse();
  });
});
