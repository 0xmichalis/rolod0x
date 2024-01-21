import {
  render,
  // screen
} from '@testing-library/react';
import mockConsole from 'jest-mock-console';

import App from '@pages/content/ui/app';

describe('appTest', () => {
  test('render text', () => {
    // given
    mockConsole('log');
    // when
    render(<App />);

    // then
    // const text = 'content view';
    // screen.getByText(text);
    expect(console.log).toHaveBeenCalledWith('content view loaded');
  });
});
