'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud } from 'lucide-react';

interface WordData {
  text: string;
  count: number;
  sentiment?: string;
}

interface Props {
  words: WordData[];
}

function sentimentColor(s?: string): string {
  if (s === 'positive') return '#26de81';
  if (s === 'negative') return '#FC5C65';
  if (s === 'mixed') return '#F7B731';
  return '#48CAE4';
}

export default function WordCloud({ words }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;

    const draw = async () => {
      try {
        const d3 = await import('d3');
        // @ts-expect-error — d3-cloud has no types bundled
        const cloud = (await import('d3-cloud')).default;

        const W = svgRef.current!.clientWidth || 500;
        const H = 280;
        const maxCount = Math.max(...words.map(w => w.count));

        const fontSize = d3.scaleLinear()
          .domain([1, maxCount])
          .range([12, 42]);

        // Clear previous
        d3.select(svgRef.current).selectAll('*').remove();

        const layout = cloud()
          .size([W, H])
          .words(words.map(w => ({ text: w.text, size: fontSize(w.count), sentiment: w.sentiment })))
          .padding(5)
          .rotate(() => (Math.random() > 0.7 ? 90 : 0))
          .fontSize((d: { size: number }) => d.size)
          .on('end', (computedWords: Array<{ text: string; size: number; x: number; y: number; rotate: number; sentiment?: string }>) => {
            d3.select(svgRef.current)
              .attr('width', W)
              .attr('height', H)
              .append('g')
              .attr('transform', `translate(${W / 2},${H / 2})`)
              .selectAll('text')
              .data(computedWords)
              .join('text')
              .style('font-size', d => `${d.size}px`)
              .style('font-family', 'var(--font-body), sans-serif')
              .style('font-weight', d => d.size > 24 ? '600' : '400')
              .style('fill', d => sentimentColor(d.sentiment))
              .style('opacity', '0.85')
              .style('cursor', 'default')
              .attr('text-anchor', 'middle')
              .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
              .text(d => d.text)
              .on('mouseover', function() {
                d3.select(this).style('opacity', '1').style('filter', 'drop-shadow(0 0 6px currentColor)');
              })
              .on('mouseout', function() {
                d3.select(this).style('opacity', '0.85').style('filter', 'none');
              });

            setRendered(true);
          });

        layout.start();
      } catch (err) {
        // d3-cloud might not be installed — fallback to simple flex layout
        console.warn('d3-cloud not available, using fallback');
        setRendered(true);
      }
    };

    draw();
  }, [words]);

  // Fallback if d3-cloud not available
  const fallback = !rendered && words.length > 0;

  if (words.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
        <Cloud className="w-8 h-8 text-muted/30" />
        <p className="text-sm text-muted">Write more journal entries to see your theme cloud</p>
      </div>
    );
  }

  const maxCount = Math.max(...words.map(w => w.count));

  return (
    <div className="relative min-h-[280px]">
      <svg ref={svgRef} className="w-full" style={{ minHeight: 280 }} />

      {/* Fallback: simple tag cloud */}
      {!rendered && (
        <div className="absolute inset-0 flex flex-wrap gap-2 items-center justify-center p-4">
          {words.map(w => (
            <motion.span
              key={w.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: `${12 + (w.count / maxCount) * 24}px`,
                color: sentimentColor(w.sentiment),
                opacity: 0.85,
              }}
              className="font-body cursor-default hover:opacity-100 transition-opacity"
            >
              {w.text}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
