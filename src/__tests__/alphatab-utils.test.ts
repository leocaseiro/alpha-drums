import { openFile } from '@/lib/alphatab-utils';

// Mock AlphaTab API
const mockApi = {
  load: jest.fn(),
};

// Mock FileReader
const mockFileReader = {
  onload: null as any,
  readAsArrayBuffer: jest.fn(),
  result: new ArrayBuffer(8),
};

global.FileReader = jest.fn(() => mockFileReader) as any;

describe('AlphaTab Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a file and loads it into AlphaTab API', () => {
    const mockFile = new File(['test content'], 'test.gp5', { type: 'application/octet-stream' });
    
    openFile(mockApi as any, mockFile);

    expect(mockFileReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile);
    
    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } });
    }

    expect(mockApi.load).toHaveBeenCalledWith(mockFileReader.result);
  });

  it('handles file reading error gracefully', () => {
    const mockFile = new File(['test content'], 'test.gp5', { type: 'application/octet-stream' });
    
    openFile(mockApi as any, mockFile);

    expect(mockFileReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile);
    
    // Simulate FileReader onload with no result
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: null } });
    }

    expect(mockApi.load).not.toHaveBeenCalled();
  });
});