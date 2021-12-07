import {
  Component,
  OnInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import * as d3 from 'd3';
import { ProjectScheduleData } from '../shared/project-schedule-data';

@Component({
  selector: 'app-project-schedule-chart',
  templateUrl: './project-schedule-chart.component.html',
  styleUrls: ['./project-schedule-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectScheduleChartComponent implements OnInit, OnChanges {
  @ViewChild('chart', { static: true })
  private chartContainer!: ElementRef;
  @Input()
  data: Array<ProjectScheduleData> | undefined;
  private margin: any = { top: 20, bottom: 20, left: 20, right: 20 };
  private svg:
    | d3.Selection<SVGSVGElement, unknown, null, undefined>
    | undefined;
  private width: number | undefined;
  private height: number | undefined;
  private xScale: d3.ScaleTime<number, number, never> | undefined;
  private yScale: d3.ScaleBand<string> | undefined;
  private clip: d3.Selection<d3.BaseType, unknown, null, undefined> | undefined;
  private scatter:
    | d3.Selection<SVGGElement, unknown, null, undefined>
    | undefined;
  constructor() {}

  ngOnInit() {
    this.createChart();
    if (this.data) {
      this.updateChart();
    }
  }

  ngOnChanges() {
    if (this.svg) {
      this.updateChart();
    }
  }

  createChart() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    this.svg = d3.select(element).append('svg');
    this.svg.attr('width', this.width);
    this.svg.attr('height', this.height);
    this.svg
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ') '
      );
    // Add a clipPath: everything out of this area won't be drawn.
    this.clip = this.svg
      .append('defs')
      .append('SVG:clipPath')
      .attr('id', 'clip')
      .append('SVG:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('x', 0)
      .attr('y', 0);
    this.scatter = this.svg.append('g').attr('clip-path', 'url(#clip)');
    this.xScale = d3.scaleTime();
    this.yScale = d3.scaleBand();
    var zoom = d3
      .zoom()
      .scaleExtent([0.5, 20]) // This control how much you can unzoom (x0.5) and zoom (x20)
      .extent([
        [0, 0],
        [this.width, this.height],
      ])
      .on('zoom', this.updateChartVisibleArea);
  }
  updateChartVisibleArea(event: any, d: any) {
    // recover the new scale
    var newX = event.transform.rescaleX(this.xScale);
    var newY = event.transform.rescaleY(this.yScale);

    // update axes with these new boundaries
    // this.xAxis.call(d3.axisBottom(newX));
    // this.yAxis.call(d3.axisLeft(newY));

    // update circle position
    /* this.scatter
      .selectAll('rect')
      .attr('x1', (d) => newX(d.start))
      .attr('x2', (d) => newX(d.end))
      .attr('height', 16)
      .style('fill', '#61a3a9')
      .style('opacity', 0.5);*/
  }

  updateChart() {
    console.log(this.data);
    let minDate;
    let maxDate;
    if (this.data) {
      minDate = d3.min(this.data.map((d) => d.start));
      maxDate = d3.max(this.data.map((d) => d.end));
    }
    if (
      this.scatter &&
      this.data &&
      minDate &&
      maxDate &&
      this.width &&
      this.xScale &&
      this.yScale
    ) {
      const domain = [minDate, maxDate];
      const xScale = this.xScale.domain(domain).range([0, this.width]);
      this.scatter
        .selectAll('rect')
        .data(this.data)
        .enter()
        .append('rect')
        .attr('x1', (d) => xScale(d.start))
        .attr('x2', (d) => xScale(d.end))
        .attr('height', 16)
        .style('fill', '#61a3a9')
        .style('opacity', 0.5);
    }
  }
}
