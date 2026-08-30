import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextSelector } from './ContextSelector';
import type { ContextOptions } from '@/types';

const SCHEME_OPTIONS: ContextOptions = {
  type: 'scheme_selection',
  schemes: [
    {
      slug: 'discovery',
      name: 'Discovery Health Medical Scheme',
      plans: [{ id: 'executive', name: 'Executive Plan' }],
    },
    {
      slug: 'bonitas',
      name: 'Bonitas Medical Fund',
      plans: [{ id: 'boncomplete', name: 'BonComplete' }],
    },
  ],
};

const PLAN_OPTIONS: ContextOptions = {
  type: 'plan_selection',
  plans: [
    { id: 'executive', name: 'Executive Plan' },
    { id: 'classic_comprehensive', name: 'Classic Comprehensive' },
  ],
};

describe('ContextSelector', () => {
  it('renders scheme chips', () => {
    const onSelect = vi.fn();
    render(<ContextSelector options={SCHEME_OPTIONS} onSelect={onSelect} />);

    expect(screen.getByText('Select a scheme')).toBeInTheDocument();
    expect(screen.getByText('Discovery Health Medical Scheme')).toBeInTheDocument();
    expect(screen.getByText('Bonitas Medical Fund')).toBeInTheDocument();
  });

  it('calls onSelect with the scheme name on chip click', () => {
    const onSelect = vi.fn();
    render(<ContextSelector options={SCHEME_OPTIONS} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Discovery Health Medical Scheme'));
    expect(onSelect).toHaveBeenCalledWith('Discovery Health Medical Scheme', 'scheme');
  });

  it('renders plan chips', () => {
    const onSelect = vi.fn();
    render(<ContextSelector options={PLAN_OPTIONS} onSelect={onSelect} />);

    expect(screen.getByText('Select a plan')).toBeInTheDocument();
    expect(screen.getByText('Executive Plan')).toBeInTheDocument();
    expect(screen.getByText('Classic Comprehensive')).toBeInTheDocument();
  });

  it('calls onSelect with the plan name on chip click', () => {
    const onSelect = vi.fn();
    render(<ContextSelector options={PLAN_OPTIONS} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Executive Plan'));
    expect(onSelect).toHaveBeenCalledWith('Executive Plan', 'plan');
  });

  it('renders nothing for unknown option types', () => {
    const { container } = render(
      <ContextSelector options={{ type: 'unknown' } as unknown as ContextOptions} onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
