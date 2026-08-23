import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownMessage } from './MarkdownMessage';

describe('MarkdownMessage', () => {
  it('renders a level-3 heading instead of literal ### text', () => {
    render(<MarkdownMessage content="### BonComprehensive" />);
    const heading = screen.getByRole('heading', { level: 3, name: 'BonComprehensive' });
    expect(heading).toBeInTheDocument();
  });

  it('renders bullet lists', () => {
    render(<MarkdownMessage content={'- one\n- two'} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders bold and inline code', () => {
    render(<MarkdownMessage content="**bold** and `code`" />);
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('code')).toBeInTheDocument();
  });

  it('renders links', () => {
    render(<MarkdownMessage content="[link](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('does not render raw HTML (XSS-safe)', () => {
    const { container } = render(<MarkdownMessage content="<script>alert(1)</script>" />);
    expect(container.querySelector('script')).toBeNull();
  });
});
