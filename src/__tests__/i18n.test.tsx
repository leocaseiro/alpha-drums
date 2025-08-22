import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/app/i18n';
import I18nText from '@/app/I18nText';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('I18n System', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders English text by default', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <I18nProvider>
        <I18nText k="greeting" />
      </I18nProvider>
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders Portuguese text when language is set to pt-BR', () => {
    localStorageMock.getItem.mockReturnValue('pt-BR');
    
    render(
      <I18nProvider>
        <I18nText k="greeting" />
      </I18nProvider>
    );

    expect(screen.getByText('Olá')).toBeInTheDocument();
  });

  it('renders nested translation keys', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <I18nProvider>
        <I18nText k="player.play" />
      </I18nProvider>
    );

    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('returns key when translation is not found', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    render(
      <I18nProvider>
        <I18nText k="nonexistent.key" />
      </I18nProvider>
    );

    expect(screen.getByText('nonexistent.key')).toBeInTheDocument();
  });
});