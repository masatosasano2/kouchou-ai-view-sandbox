import React from 'react';
import ReactDOM from 'react-dom/client';
import SampleView from './SampleView';
import { sampleEmbeddings } from './sampleData';

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
.render(
  <React.StrictMode>
    <SampleView embeddings={sampleEmbeddings}/>
  </React.StrictMode>
);
