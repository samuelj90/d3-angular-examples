import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  scaleOrdinal,
  select as d3select,
  Selection as d3Selection,
  schemeCategory10,
  BaseType,
  select,
  ZoomBehavior,
  TransitionLike,
  zoomIdentity,
  zoom,
} from 'd3';
import {
  ForceDirectedGraphLink,
  ForceDirectedGraphNode,
} from './shared/services/force-directed-graph-data';
import { ForceDirectedGraphService } from './shared/services/force-directed-graph.service';

@Component({
  selector: 'app-force-directed-graph',
  templateUrl: './force-directed-graph.component.html',
  styleUrls: ['./force-directed-graph.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ForceDirectedGraphComponent implements OnInit {
  height!: number;
  width!: number;
  searchForm: FormGroup;
  @ViewChild('graphContainer')
  private el!: ElementRef;
  private svg!: d3Selection<SVGSVGElement, any, any, any>;
  node?: d3Selection<
    BaseType | SVGGElement,
    ForceDirectedGraphNode,
    SVGGElement,
    any
  >;
  link?: d3Selection<
    BaseType | SVGPathElement,
    ForceDirectedGraphLink,
    SVGGElement,
    any
  >;
  zoomHandler?: ZoomBehavior<Element, unknown>;
  selectionType: string = 'debtLayers';
  constructor(private forceDirectedGraphService: ForceDirectedGraphService) {
    this.searchForm = new FormGroup({
      q: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.svg = d3select<SVGSVGElement, any>('svg');
  }
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.initializeHeightAndWidth();
    this.adjustProperties();
  }

  ngAfterViewInit() {
    this.initializeHeightAndWidth();
    this.adjustProperties();
    this.forceDirectedGraphService.loadData().then((data) => {
      const types = ['0', '1'];
      const config = {
        svg: this.svg,
        width: this.width,
        height: this.height,
        linkColor: scaleOrdinal(types, ['green', 'red']),
        nodeColor: scaleOrdinal(
          ['3', '2', '1', '0'],
          ['green', 'yellow', 'orange', 'red']
        ),
        types,
      };
      this.forceDirectedGraphService
        .draw(data, config)
        .then(({ node, link, zoomHandler }) => {
          this.node = node;
          this.link = link;
          this.zoomHandler = zoomHandler;
          node.on('click', (event, d) => {
            if (this.selectionType === 'multipleNodes')
              this.multipleNodeSelection(event.target);
            else this.debtLayersSelection(event.target, d);
          });
          select('#zoomIn').on('click', () => {
            zoomHandler.scaleBy(
              this.svg.transition().duration(750) as unknown as TransitionLike<
                Element,
                unknown
              >,
              1.2
            );
          });
          select('#zoomOut').on('click', () => {
            zoomHandler.scaleBy(
              this.svg.transition().duration(750) as unknown as TransitionLike<
                Element,
                unknown
              >,
              0.8
            );
          });
          select('#zoomReset').on('click', () => {});
        });
    });
  }
  private debtLayersSelection(node: any, d: ForceDirectedGraphNode) {
    this.clearSelection();
    this.updateElementSelection(select(node), true);
    this.updateAdjacentNodesNdLinksSelection(d);
  }
  private clearSelection() {
    select('#nodes').selectAll('circle:not(.selected)').style('opacity', '1');
    select('#links').selectAll('path:not(.selected)').style('opacity', '1');
    select('#nodes').selectAll('.selected').classed('selected', false);
    select('#links').selectAll('.selected').classed('selected', false);
  }
  private updateAdjacentNodesNdLinksSelection(d: ForceDirectedGraphNode) {
    const adjacentNodes: ForceDirectedGraphNode[] = [];
    this.node?.each(() => {
      this.link?.each((link, linkIndex, links) => {
        if ((link.source as ForceDirectedGraphNode).id === d.id) {
          this.updateElementSelection(select(links[linkIndex]), true);
          adjacentNodes.push(link.target as ForceDirectedGraphNode);
        }
      });
    });
    adjacentNodes.forEach((node) => {
      this.updateElementSelection(
        select('#nodes')
          .select('#node-' + node.id)
          .select('circle'),
        true
      );
      this.link?.each((link, linkIndex, links) => {
        if ((link.source as ForceDirectedGraphNode).id === node.id) {
          this.updateElementSelection(select(links[linkIndex]), true);
          this.updateElementSelection(
            select('#nodes')
              .select('#node-' + (link.target as ForceDirectedGraphNode).id)
              .select('circle'),
            true
          );
        }
      });
      select('#nodes')
        .selectAll('circle:not(.selected)')
        .style('opacity', '0.25');
      select('#links')
        .selectAll('path:not(.selected)')
        .style('opacity', '0.05');
    });
  }
  private multipleNodeSelection(node: any) {
    if (select(node).classed('selected')) {
      this.updateElementSelection(select(node), false);
    } else {
      this.updateElementSelection(select(node), true);
    }
  }
  private updateElementSelection(
    element: d3Selection<
      BaseType | SVGPathElement | SVGCircleElement,
      any,
      any,
      any
    >,
    selected: boolean
  ) {
    element.classed('selected', selected);
  }
  private adjustProperties() {
    this.svg
      .attr('height', this.height)
      .attr('width', this.width)
      .attr('fill', '#000000');
  }
  private initializeHeightAndWidth(): void {
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;
  }
  onSearchFormSubmit($event: any) {
    this.node?.each((item, index, items) => {
      if (item.id === this.searchForm.value.q) {
        const selectedNode = select(items[index]);
        selectedNode
          .select('circle')
          .dispatch('click', { bubbles: true, cancelable: true, detail: null });
        const { x, y } = this.forceDirectedGraphService.getTranslate(
          selectedNode.attr('transform')
        );
        this.zoomHandler?.translateTo(
          this.svg.transition().duration(750) as unknown as TransitionLike<
            Element,
            unknown
          >,
          Number(x),
          Number(y)
        );
      }
    });
  }
  onSelectionTypeChanged(value: string) {
    this.selectionType = value;
    this.clearSelection();
  }
}
