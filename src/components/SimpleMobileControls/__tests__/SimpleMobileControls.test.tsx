import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SimpleMobileControls } from '../SimpleMobileControls';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('SimpleMobileControls', () => {
  const mockOnMove = jest.fn();
  const mockOnLook = jest.fn();
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when enabled', () => {
    const { container } = render(
      <SimpleMobileControls
        enabled={true}
        onMove={mockOnMove}
        onLook={mockOnLook}
        onAction={mockOnAction}
      />
    );

    expect(container.querySelector('.simple-mobile-controls')).toBeInTheDocument();
  });

  it('does not render when disabled', () => {
    const { container } = render(
      <SimpleMobileControls
        enabled={false}
        onMove={mockOnMove}
        onLook={mockOnLook}
        onAction={mockOnAction}
      />
    );

    expect(container.querySelector('.simple-mobile-controls')).not.toBeInTheDocument();
  });

  it('renders joysticks and action buttons', () => {
    const { container } = render(
      <SimpleMobileControls
        enabled={true}
        onMove={mockOnMove}
        onLook={mockOnLook}
        onAction={mockOnAction}
      />
    );

    // Check for joysticks
    expect(container.querySelector('.movement-joystick')).toBeInTheDocument();
    expect(container.querySelector('.look-joystick')).toBeInTheDocument();

    // Check for action buttons
    expect(container.querySelector('.jump-btn')).toBeInTheDocument();
    expect(container.querySelector('.menu-btn')).toBeInTheDocument();
  });

  it('calls onAction when jump button is clicked', () => {
    const { container } = render(
      <SimpleMobileControls
        enabled={true}
        onMove={mockOnMove}
        onLook={mockOnLook}
        onAction={mockOnAction}
      />
    );

    const jumpButton = container.querySelector('.jump-btn') as HTMLElement;
    fireEvent.click(jumpButton);

    expect(mockOnAction).toHaveBeenCalledWith('jump');
  });

  it('calls onAction when menu button is clicked', () => {
    const { container } = render(
      <SimpleMobileControls
        enabled={true}
        onMove={mockOnMove}
        onLook={mockOnLook}
        onAction={mockOnAction}
      />
    );

    const menuButton = container.querySelector('.menu-btn') as HTMLElement;
    fireEvent.click(menuButton);

    expect(mockOnAction).toHaveBeenCalledWith('menu');
  });

  it('applies custom className', () => {
    const customClass = 'custom-mobile-controls';
    const { container } = render(
      <SimpleMobileControls
        enabled={true}
        onMove={mockOnMove}
        onLook={mockOnLook}
        onAction={mockOnAction}
        className={customClass}
      />
    );

    expect(container.querySelector(`.${customClass}`)).toBeInTheDocument();
  });
});