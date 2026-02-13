import 'react-native-get-random-values';
import { Buffer } from '@craftzdog/react-native-buffer';

global.Buffer = Buffer;
global.process = {
  env: {},
  version: '',
  nextTick: (cb) => setTimeout(cb, 0),
};
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production'; 