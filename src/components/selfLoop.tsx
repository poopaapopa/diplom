function SelfLoopEdge({ sourceX, sourceY, markerEnd, style }: any) {
  const radius = 25;
  const edgePath = `
    M ${sourceX},${sourceY} 
    C ${sourceX + radius},${sourceY - 50} 
      ${sourceX - radius - 10},${sourceY - 50} 
      ${sourceX - 5},${sourceY - 2}
  `;

  return (
    <path
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

export default SelfLoopEdge;