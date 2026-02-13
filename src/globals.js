import 'react-native-get-random-values';
import { Buffer } from '@craftzdog/react-native-buffer';

// Polyfill for Web3Auth dependencies
global.Buffer = Buffer;
global.process = {
  env: { NODE_ENV: __DEV__ ? 'development' : 'production' },
  version: '',
  nextTick: (cb) => setTimeout(cb, 0),
};

// Polyfill for missing Node.js modules
global.window = global;
global.self = global;
global.location = {
  protocol: 'https:',
};

// Empty implementations for Node.js modules
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || ((id) => global.clearTimeout(id)); 