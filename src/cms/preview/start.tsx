import { createRoot } from 'react-dom/client';

import { PreviewBridge } from './PreviewBridge';
import type { PreviewConfig } from './store';

export const mountPreview = (config: PreviewConfig) =>
  createRoot(document.createElement('div')).render(<PreviewBridge config={config} />);
