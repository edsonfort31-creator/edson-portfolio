import React from 'react';
import {Composition} from 'remotion';
import manifest from './data/proto_manifest.json';
import {Prototipo} from './scenes/Prototipo';
import {FPS, H, W} from './theme';

export const Root: React.FC = () => (
  <Composition id="Prototipo" component={Prototipo} width={W} height={H} fps={FPS} durationInFrames={Math.ceil(manifest.totalSec * FPS)} />
);
