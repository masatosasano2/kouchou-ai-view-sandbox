import { PlotMouseEvent } from 'plotly.js';
import { useCallback, useMemo, useRef, useState } from 'react';
import Plot from 'react-plotly.js';

type ClusterPlotType = {
  embeddings: Array<{ x: number, y: number, clusters: Array<string | number> }>;
  maxLevel?: number;
  sliderMax?: number;
};

/**
 * ClusterPlot
 *  - Single scatter view with zoom-driven hierarchical exploration
 *  - Density filter controlled by a slider
 *  - Zoom animations and cluster focus on click
 *
 * Props:
 *  - embeddings: Array<{ x: number, y: number, clusters: Array<string | number> }>
 *  - maxLevel: number        // highest hierarchical depth (0-based)
 *  - sliderMax?: number      // optional max value for density slider
 */
const ClusterPlot = (params: ClusterPlotType) => {
  const { embeddings, maxLevel = 10, sliderMax = 10 } = params;

  const [currentLevel, setCurrentLevel] = useState(0);
  const [densityThreshold, setDensityThreshold] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const plotRef = useRef(null);

  // Compute x-range for zoom-level mapping
  const [minX, maxX] = useMemo(() => {
    const xs = embeddings.map(pt => pt.x);
    return [Math.min(...xs), Math.max(...xs)];
  }, [embeddings]);
  const totalRange = maxX - minX;

  // Update hierarchy level based on zoom amount
  const handleRelayout = useCallback((event: Plotly.PlotRelayoutEvent) => {
    const x0 = event['xaxis.range[0]'];
    const x1 = event['xaxis.range[1]'];
    if (x0 != null && x1 != null) {
      const currentRange = x1 - x0;
      const relativeZoom = Math.min(Math.max((totalRange - currentRange) / totalRange, 0), 1);
      const level = Math.floor(relativeZoom * maxLevel);
      setCurrentLevel(level);
    }
  }, [totalRange, maxLevel]);

  // Filter by cluster size (density)
  const filteredData = useMemo(() => {
    const counts: Record<string | number, number> = {};
    embeddings.forEach(pt => {
      const cid = pt.clusters[currentLevel];
      counts[cid] = (counts[cid] || 0) + 1;
    });
    return embeddings.filter(pt => counts[pt.clusters[currentLevel]] >= densityThreshold);
  }, [embeddings, currentLevel, densityThreshold]);

  // Click handler to focus/unfocus a cluster
  const handleClick = useCallback((event: Readonly<PlotMouseEvent>) => {
    if (event.points && event.points.length > 0) {
      const cid = (event.points[0] as any).customdata;
      setSelectedCluster(prev => (prev === cid ? null : cid));
    } else {
      setSelectedCluster(null);
    }
  }, []);

  // Prepare marker styling arrays
  const markerColors = filteredData.map(pt => {
    if (selectedCluster != null && pt.clusters[currentLevel] !== selectedCluster) {
      return '#ccc'; // dim non-selected clusters
    }
    if (selectedCluster != null && currentLevel < maxLevel && pt.clusters[currentLevel] === selectedCluster) {
      return pt.clusters[currentLevel + 1]; // color by child cluster
    }
    return pt.clusters[currentLevel];
  });
  const markerOpacities = filteredData.map(pt => (
    selectedCluster != null && pt.clusters[currentLevel] !== selectedCluster ? 0.2 : 1
  ));

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Density threshold: {densityThreshold}</label>
          <input
            type="range"
            min={0}
            max={sliderMax}
            value={densityThreshold}
            onChange={e => setDensityThreshold(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <p>Level: {currentLevel}</p>
        </div>
      </div>

      {/* Scatter Plot with zoom animation and click focus */}
      <Plot
        ref={plotRef}
        data={[{
          x: filteredData.map(pt => pt.x),
          y: filteredData.map(pt => pt.y),
          mode: 'markers',
          customdata: filteredData.map(pt => pt.clusters[currentLevel]),
          marker: {
            size: 6,
            color: markerColors,
            opacity: markerOpacities,
            colorscale: 'Viridis',
            showscale: false,
          },
        }]}
        layout={{
          hovermode: 'closest',
          margin: { t: 40, l: 40, r: 40, b: 40 },
          transition: { duration: 500, easing: 'cubic-in-out' },
        }}
        // transition={{ duration: 500, easing: 'cubic-in-out' }}
        useResizeHandler
        style={{ width: '100%', height: '600px' }}
        onRelayout={handleRelayout}
        onClick={handleClick}
      />
    </div>
  );
};

export default ClusterPlot;
