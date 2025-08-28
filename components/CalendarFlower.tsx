import { useEffect, useRef , useState} from 'react';
import * as d3 from 'd3';

interface FlowerData {
  year: number;
  month: number;
  event_type: 'Drought' | 'Flood' | 'DtoF' | 'DroughtFlood';
  original_type: string;
  event_count: number;
  severity: number;
  total_events_in_month: number;
  percentage: number;
}

interface CalendarFlowerProps {
  data: FlowerData[];
  countryCode: string;
  firstYear: number;
  lastYear: number;
  width?: number;
  height?: number;
  // filter props
  eventTypeFilter?: string | null;
  dateRange?: {start: string, end: string} | null;
}

const CalendarFlower = ({ 
  data, 
  countryCode, 
  firstYear, 
  lastYear, 
  width = 600, 
  height = 650,
  eventTypeFilter = null,
  dateRange = null
}: CalendarFlowerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Responsive dimensions
  const responsiveWidth = isMobile ? Math.min(width, window.innerWidth - 40) : width;
  const responsiveHeight = isMobile ? Math.min(height, window.innerHeight * 0.7) : height;

  useEffect(() => {
    console.log('=== ENHANCED CALENDAR FLOWER DEBUG ===');
    console.log('Country:', countryCode);
    console.log('Year range:', firstYear, '-', lastYear);
    console.log('Total data points:', data.length);
    
    // Debug data types
    console.log('Sample data item:', data[0]);
    console.log('event_count type:', typeof data[0]?.event_count);

    if (!svgRef.current || !data.length || !containerRef.current) {
      console.log('Early return - missing references or no data');
      return;
    }
    // apply filters to data
    let filteredData = data;

    // filter by event type
    if(eventTypeFilter){
      filteredData = filteredData.filter(d => d.event_type === eventTypeFilter);
}
// filter by date range
if(dateRange && (dateRange.start || dateRange.end)){
filteredData = filteredData.filter(d => {
  // create date string from year and month
  const eventDate = `${d.year}-${d.month.toString().padStart(2,'0')}-01`;
  let passesFilter = true;
  if(dateRange.start){
    passesFilter = passesFilter && eventDate >= dateRange.start;
  }
  if(dateRange.end){
          // For end date, we want to include the entire month, so compare with last day of month
          const endOfMonth = new Date(d.year, d.month, 0).toISOString().split('T')[0];
          passesFilter = passesFilter && endOfMonth <= dateRange.end;
        }
  return passesFilter;
});
}

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const center = { x: width / 2, y: height / 2 };
    const maxRadius = Math.min(width, height) * 0.35;

    // container for mobile-frinedly layout
    const container = d3.select(containerRef.current);
    container.selectAll('.external-legend').remove();
    container.selectAll('.external-zoom').remove();

    if (isMobile) {
      // Create toggle button for legend
      const legendToggle = container.append('div')
        .attr('class', 'legend-toggle')
        .style('position', 'absolute')
        .style('top', '10px')
        .style('right', '10px')
        .style('z-index', '10')
        .style('background', '#ffffff')
        .style('border', '1px solid #dee2e6')
        .style('border-radius', '20px')
        .style('padding', '8px 12px')
        .style('cursor', 'pointer')
        .style('font-size', '12px')
        .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
        .text('Legend')
        .on('click', () => setShowLegend(!showLegend));

      // Create overlay legend that appears on tap
      if (showLegend) {
        const legend = container.append('div')
          .attr('class', 'external-legend mobile-overlay')
          .style('position', 'absolute')
          .style('top', '50px')
          .style('right', '10px')
          .style('width', '160px')
          .style('background', 'rgba(248, 249, 250, 0.95)')
          .style('backdrop-filter', 'blur(10px)')
          .style('border', '1px solid #dee2e6')
          .style('border-radius', '8px')
          .style('padding', '12px')
          .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
          .style('font-family', 'system-ui, -apple-system, sans-serif')
          .style('z-index', '20');

        legend.append('div')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('text-align', 'center')
          .style('margin-bottom', '8px')
          .text('Event Types');

        // Legend items...
        const eventColor = {
          'Drought': '#8B2635',
          'Flood': '#1E90FF',
          'DtoF': '#FF8C00',
          'DroughtFlood': '#9932CC'
        };

        const legendItems = [
          { event: 'Drought', color: eventColor['Drought'], description: 'Drought (D)' },
          { event: 'Flood', color: eventColor['Flood'], description: 'Flood (F)' },
          { event: 'DtoF', color: eventColor['DtoF'], description: 'Drought→Flood' },
          { event: 'DroughtFlood', color: eventColor['DroughtFlood'], description: 'D&F' }
        ];

        legendItems.forEach((item, i) => {
          const legendItem = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('margin-bottom', '6px');

          legendItem.append('div')
            .style('width', '12px')
            .style('height', '12px')
            .style('background-color', item.color)
            .style('opacity', '0.8')
            .style('margin-right', '6px')
            .style('border-radius', '2px');

          legendItem.append('div')
            .style('font-size', '10px')
            .text(item.description);
        });
      }
    } 
    // Create external legend
    const legend = container.append('div')
      .attr('class', 'external-legend')
      .style('position', 'absolute')
      .style('top', '20px')
      .style('right', '-200px')
      .style('width', '180px')
      .style('height', '140px')
      .style('background', '#f8f9fa')
      .style('border', '1px solid #dee2e6')
      .style('border-radius', '5px')
      .style('padding', '10px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('font-family', 'system-ui, -apple-system, sans-serif');
    
    legend.append('div')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('text-align', 'center')
      .style('margin-bottom', '10px')
      .text('Event Types');
    
    // Create external zoom mirror
    const zoomMirror = container.append('div')
      .attr('class', 'external-zoom')
      .style('position', 'absolute')
      .style('top', '180px')
      .style('right', '-200px')
      .style('width', '180px')
      .style('height', '220px')
      .style('background', '#f8f9fa')
      .style('border', '1px solid #dee2e6')
      .style('border-radius', '5px')
      .style('padding', '10px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    zoomMirror.append('div')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('text-align', 'center')
      .style('margin-bottom', '10px')
      .text('Zoom View');

    const zoomContent = zoomMirror.append('div')
      .attr('class', 'zoom-content')
      .style('text-align', 'center');

    // Add SVG for zoom ring
    const zoomSvg = zoomContent.append('svg')
      .attr('width', 80)
      .attr('height', 80)
      .style('margin', '0 auto')
      .style('display', 'block');

    const zoomRing = zoomSvg.append('g')
      .attr('transform', 'translate(40, 40)');

    // Default state - show instruction
    zoomContent.append('div')
      .attr('class', 'zoom-instruction')
      .style('font-size', '10px')
      .style('color', '#6c757d')
      .style('margin-top', '10px')
      .text('Hover over a ring');
    
    // Updated color mapping
    const eventColor = {
      'Drought': '#8B2635',
      'Flood': '#1E90FF',
      'DtoF': '#FF8C00',
      'DroughtFlood': '#9932CC'
    };

    // Aesthetic petal colors (softer, more varied for decoration)
    const petalColors = [
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', 
      '#BAE1FF', '#C9BAFF', '#FFBAE1', '#FFE4BA',
      '#E1BAFF', '#BAFFE4', '#FFCBA4', '#A4D4FF'
    ];

    // Create legend items
    const legendItems = [
      { event: 'Drought', color: eventColor['Drought'], description: 'Drought (D)' },
      { event: 'Flood', color: eventColor['Flood'], description: 'Flood (F)' },
      { event: 'DtoF', color: eventColor['DtoF'], description: 'Drought→Flood' },
      { event: 'DroughtFlood', color: eventColor['DroughtFlood'], description: 'Drought+Flood (D&F)' }
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin-bottom', '8px');

      legendItem.append('div')
        .style('width', '16px')
        .style('height', '16px')
        .style('background-color', item.color)
        .style('opacity', '0.8')
        .style('margin-right', '8px')
        .style('border-radius', '2px');

      legendItem.append('div')
        .style('font-size', '11px')
        .text(item.description);
    });

    legend.append('div')
      .style('font-size', '9px')
      .style('color', '#6c757d')
      .style('text-align', 'center')
      .style('margin-top', '10px')
      .text('Arc size = % of events');

    // Function to update zoom mirror with event distribution
    const updateZoomMirror = (year: number, events: FlowerData[]) => {
      console.log(`Zoom mirror update for year ${year}:`, events);
      
      // Clear previous content
      zoomRing.selectAll('*').remove();
      zoomContent.select('.zoom-instruction').style('display', 'none');
      zoomContent.selectAll('.zoom-year-text').remove();
      zoomContent.selectAll('.zoom-events-text').remove();

      // Add year label
      zoomContent.append('div')
        .attr('class', 'zoom-year-text')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('text-align', 'center')
        .style('margin-top', '5px')
        .text(`Year: ${year}`);

      // Create magnified ring (radius 25)
      const zoomRadius = 25;
      const zoomRingWidth = 8;

      // Background circle for the year
      zoomRing.append('circle')
        .attr('r', zoomRadius)
        .attr('fill', 'none')
        .attr('stroke', '#e9ecef')
        .attr('stroke-width', zoomRingWidth);

      // Group events by month for the zoom view
      const monthlyEvents = events.reduce((acc, event) => {
        if (!acc[event.month]) {
          acc[event.month] = [];
        }
        acc[event.month].push(event);
        return acc;
      }, {} as Record<number, FlowerData[]>);

      // Add events for this year with proper distribution
      for (let m = 0; m < 12; m++) {
        const month = m + 1;
        const monthEvents = monthlyEvents[month] || [];

        if (monthEvents.length > 0) {
          const monthStartAngle = m * 30;
          const monthEndAngle = (m + 1) * 30;
          const monthAngleSpan = monthEndAngle - monthStartAngle;

          let currentAngle = monthStartAngle;

          monthEvents.forEach((event) => {
            const eventAngleSpan = (parseFloat(String(event.percentage)) / 100) * monthAngleSpan;
            const eventStartAngle = currentAngle * (Math.PI / 180);
            const eventEndAngle = (currentAngle + eventAngleSpan) * (Math.PI / 180);

            // Create arc for this event type
            const arc = d3.arc()
              .innerRadius(zoomRadius - zoomRingWidth)
              .outerRadius(zoomRadius)
              .startAngle(eventStartAngle)
              .endAngle(eventEndAngle);

            zoomRing.append('path')
              .attr('d', arc({
                innerRadius: zoomRadius - zoomRingWidth,
                outerRadius: zoomRadius,
                startAngle: eventStartAngle,
                endAngle: eventEndAngle
              }))
              .attr('fill', eventColor[event.event_type])
              .attr('opacity', 0.8)
              .attr('stroke', 'white')
              .attr('stroke-width', 0.5);

            currentAngle += eventAngleSpan;
          });
        }
      }

      // Add event summary with proper number handling
      const eventCounts = events.reduce((acc, event) => {
        const key = `${event.event_type} (${event.original_type})`;
        // Ensure we're dealing with numbers, not strings
        const count = parseInt(String(event.event_count)) || 0;
        acc[key] = (acc[key] || 0) + count;
        return acc;
      }, {} as Record<string, number>);

      console.log('Event counts calculated:', eventCounts);

      // Add event summary with better formatting
      const eventSummaryDiv = zoomContent.append('div')
        .attr('class', 'zoom-events-text')
        .style('font-size', '9px')
        .style('color', '#495057')
        .style('margin-top', '8px')
        .style('max-height', '120px')
        .style('overflow-y', 'auto')
        .style('padding-right', '5px');

      Object.entries(eventCounts).forEach(([type, count]) => {
        eventSummaryDiv.append('div')
          .style('margin-bottom', '2px')
          .text(`${type}: ${count}`);
      });

      if (Object.keys(eventCounts).length === 0) {
        eventSummaryDiv.append('div').text('No events');
      }
    };

    // Function to clear zoom mirror
    const clearZoomMirror = () => {
      zoomRing.selectAll('*').remove();
      zoomContent.select('.zoom-instruction').style('display', 'block');
      zoomContent.selectAll('.zoom-year-text').remove();
      zoomContent.selectAll('.zoom-events-text').remove();
    };

    // Create year rings
    const yearCount = lastYear - firstYear + 1;
    const ringWidth = maxRadius / (yearCount * 1.5);

    // Create flower visualization
    const flower = svg.append('g')
      .attr('transform', `translate(${center.x},${center.y})`);

    // Add title
    svg.append('text')
      .attr('x', center.x)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(`${countryCode} Climate Events (${firstYear}-${lastYear})`);

    // Create gradient definitions for aesthetic petal extensions
    const defs = svg.append('defs');
    
    petalColors.forEach((color, index) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `petalGradient${index}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.6);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.2);
    });

    // Add year ring guidelines
    for (let y = 0; y < yearCount; y++) {
      const year = firstYear + y;
      const radius = (y + 1) * ringWidth;
      
      if (y % 5 === 0 || y === yearCount - 1) {
        flower.append('circle')
          .attr('r', radius)
          .attr('fill', 'none')
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.6);
      }
    }

    // Group data by year and month for proper distribution
    const dataByYearMonth = filteredData.reduce((acc, event) => {
      const key = `${event.year}-${event.month}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {} as Record<string, FlowerData[]>);

    // Calculate the boundary radius (where the thin boundary line will be)
    const boundaryRadius = yearCount * ringWidth + ringWidth * 0.3;

    // Create yearly rings with distributed events
    let totalEventsProcessed = 0;
    
    for (let y = 0; y < yearCount; y++) {
      const year = firstYear + y;
      const radius = (y + 1) * ringWidth;

      // Create monthly segments with event distribution
      for (let m = 0; m < 12; m++) {
        const month = m + 1;
        const monthKey = `${year}-${month}`;
        const monthEvents = dataByYearMonth[monthKey] || [];

        if (monthEvents.length > 0) {
          const monthStartAngle = m * 30;
          const monthEndAngle = (m + 1) * 30;
          const monthAngleSpan = monthEndAngle - monthStartAngle;

          let currentAngle = monthStartAngle;

          monthEvents.forEach((event) => {
            // Ensure event_count is treated as number
            const eventCount = parseInt(String(event.event_count)) || 0;
            const percentage = parseFloat(String(event.percentage)) || 0;
            
            totalEventsProcessed += eventCount;
            console.log(`Processing ${event.event_type} event for ${year}-${month}: ${eventCount} events (${percentage}%)`);
            
            const eventAngleSpan = (percentage / 100) * monthAngleSpan;
            const eventStartAngle = currentAngle * (Math.PI / 180);
            const eventEndAngle = (currentAngle + eventAngleSpan) * (Math.PI / 180);

            // For the outermost ring, create data segments that extend to the boundary
            if (y === yearCount - 1) {
              // Create the data segment that extends to the boundary radius
              const dataArc = d3.arc()
                .innerRadius(radius - ringWidth)
                .outerRadius(boundaryRadius)
                .startAngle(eventStartAngle)
                .endAngle(eventEndAngle)
                .cornerRadius(2);

              flower.append('path')
                .attr('d', dataArc({
                  innerRadius: radius - ringWidth,
                  outerRadius: boundaryRadius,
                  startAngle: eventStartAngle,
                  endAngle: eventEndAngle
                }))
                .attr('fill', eventColor[event.event_type])
                .attr('opacity', 0.9)
                .attr('stroke', 'white')
                .attr('stroke-width', 0.8)
                .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))')
                // .append('title')
                // .text(`${event.event_type} (${event.original_type}) in ${year}-${month.toString().padStart(2, '0')}\nEvents: ${eventCount} (${percentage}%)\nSeverity: ${typeof event.severity === 'number' ? event.severity.toFixed(1) : String(event.severity || 'N/A')}`);
            } else {
              // Create regular arc segments for inner rings
              const arc = d3.arc()
                .innerRadius(radius - ringWidth)
                .outerRadius(radius)
                .startAngle(eventStartAngle)
                .endAngle(eventEndAngle);

              flower.append('path')
                .attr('d', arc({
                  innerRadius: radius - ringWidth,
                  outerRadius: radius,
                  startAngle: eventStartAngle,
                  endAngle: eventEndAngle
                }))
                .attr('fill', eventColor[event.event_type])
                .attr('opacity', 0.8)
                .attr('stroke', 'white')
                .attr('stroke-width', 0.3)
                // .append('title')
                // .text(`${event.event_type} (${event.original_type}) in ${year}-${month.toString().padStart(2, '0')}\nEvents: ${eventCount} (${percentage}%)\nSeverity: ${typeof event.severity === 'number' ? event.severity.toFixed(1) : String(event.severity || 'N/A')}`);
            }

            currentAngle += eventAngleSpan;
          });
        }
      }

      // Add invisible hover ring for year identification
      flower.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-width', ringWidth)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
            .attr('opacity', 0.3);
          
          const tooltip = flower.append('text')
            .attr('id', `year-tooltip-${y}`)
            .attr('x', 0)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#EF5350')
            .text(`Year: ${year}`);

          // Update zoom mirror
          const yearEvents = filteredData.filter(d => d.year === year);
          updateZoomMirror(year, yearEvents);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', 'transparent').attr('opacity', 1);
          flower.select(`#year-tooltip-${y}`).remove();
          clearZoomMirror();
        });
    }

    // Add the thin boundary line around the entire outermost ring
    flower.append('circle')
      .attr('r', boundaryRadius)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9);

    // Create exactly 12 aesthetic petals that extend from the boundary line
    const petalTipRadius = maxRadius + ringWidth * 3;
    
    for (let i = 0; i < 12; i++) {
      // Calculate angles for each petal (30 degrees apart, centered on each month)
      const petalCenterAngle = (i * 30 + 15) * (Math.PI / 180); // Center of each month
      const petalHalfWidth = 12 * (Math.PI / 180); // 12 degrees half-width for each petal
      const petalStartAngle = petalCenterAngle - petalHalfWidth;
      const petalEndAngle = petalCenterAngle + petalHalfWidth;
      
      // Calculate petal points
      const baseStartX = Math.cos(petalStartAngle) * boundaryRadius;
      const baseStartY = Math.sin(petalStartAngle) * boundaryRadius;
      const baseEndX = Math.cos(petalEndAngle) * boundaryRadius;
      const baseEndY = Math.sin(petalEndAngle) * boundaryRadius;
      const tipX = Math.cos(petalCenterAngle) * petalTipRadius;
      const tipY = Math.sin(petalCenterAngle) * petalTipRadius;
      
      // Create pointed petal path
      const petalPath = `M ${baseStartX},${baseStartY} L ${tipX},${tipY} L ${baseEndX},${baseEndY} Z`;
      
      // Use a consistent color pattern for petals
      const petalColorIndex = i % petalColors.length;
      
      flower.append('path')
        .attr('d', petalPath)
        .attr('fill', `url(#petalGradient${petalColorIndex})`)
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.4)
        .style('filter', 'drop-shadow(1px 1px 3px rgba(0,0,0,0.2))')
        .on('mouseenter', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.7);
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.4);
        });
    }

    console.log(`Total events processed in visualization: ${totalEventsProcessed}`);

    // Add month labels (positioned outside petal extensions)
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    monthNames.forEach((month, i) => {
      const angle = (i * 30 + 15) * (Math.PI / 180);
      const labelRadius = maxRadius + ringWidth * 3.5; // Position outside petal extensions
      const x = Math.sin(angle) * labelRadius;
      const y = -Math.cos(angle) * labelRadius;

      svg.append('text')
        .attr('x', center.x + x)
        .attr('y', center.y + y)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
        .text(month);
    });

  }, [data, countryCode, firstYear, lastYear, width, height, eventTypeFilter, dateRange]);

  return (
    <div ref={containerRef} className="flower-container relative p-6 bg-white rounded-lg shadow-xl">
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default CalendarFlower;