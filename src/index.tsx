import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SampleView from './SampleView';
import { sampleEmbeddings } from './sampleData';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <SampleView
      embeddings={sampleEmbeddings}
      maxLevel={0}
      sliderMax={100}
    />
  </React.StrictMode>
);
