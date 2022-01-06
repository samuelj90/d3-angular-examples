import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  scaleOrdinal,
  select as d3select,
  Selection as d3Selection,
  BaseType,
  select,
  ZoomBehavior,
  TransitionLike,
  zoomIdentity,
  zoomTransform,
  Transition,
} from 'd3';
import { environment } from 'src/environments/environment';
import {
  ForceDirectedGraphData,
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
  data: ForceDirectedGraphData | null = null;
  selectionType: string = 'debtLayers';
  debtLayerNode: ForceDirectedGraphNode | undefined;
  multipleNodeSelectionData: ForceDirectedGraphNode[] | undefined;
  constructor(
    private forceDirectedGraphService: ForceDirectedGraphService,
    private activatedRoute: ActivatedRoute
  ) {
    this.searchForm = new FormGroup({
      q: new FormControl('', [Validators.required]),
    });
  }
  ngOnInit(): void {
    this.svg = d3select<SVGSVGElement, any>('svg')
  }
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.initializeHeightAndWidth();
    this.adjustProperties();
  }
  ngAfterViewInit() {
    this.initializeHeightAndWidth();
    this.adjustProperties();
    this.forceDirectedGraphService
      .loadData(
        this.activatedRoute.snapshot.paramMap.get('code')
          ? `${environment.baseUrl}/assets/transaction.csv`
          : `${environment.baseUrl}/assets/transaction-1.csv`
      )
      .then((data) => {
        this.data = data;
        const types = ['0', '1'];
        const config = {
          svg: this.svg,
          width: this.width,
          height: this.height,
          linkColor: scaleOrdinal(types, ['green', 'red']),
          nodeColor: scaleOrdinal(
            ['3', '2', '1', '0'],
            [
              'rgb(179, 222, 105)',
              'rgb(255, 255, 179)',
              'rgb(253, 180, 98)',
              'rgb(251, 128, 114)',
            ]
          ),
          types,
        };
        this.forceDirectedGraphService
          .draw(data, config)
          .then(({ node, link, zoomBehaviour }) => {
            this.node = node;
            this.link = link;
            this.zoomHandler = zoomBehaviour;
            this.addNodeClickHandlers(node);
            this.addZoomHandlers(zoomBehaviour);
            this.addTooltip(this.svg);
          });
      });
  }
  private addZoomHandlers(zoomBehaviour: ZoomBehavior<Element, unknown>) {
    select('#zoomOut').on('click', () => {
      this.svg
        .transition()
        .call(
          zoomBehaviour.scaleBy as unknown as (
            transition: Transition<SVGSVGElement, any, any, any>,
            ...args: any[]
          ) => any,
          0.5
        );
    });
    select('#zoomIn').on('click', () => {
      this.svg
        .transition()
        .call(
          zoomBehaviour.scaleBy as unknown as (
            transition: Transition<SVGSVGElement, any, any, any>,
            ...args: any[]
          ) => any,
          2
        );
    });
    select('#zoomReset').on('click', () => {
      this.svg
        .transition()
        .duration(750)
        .call(
          zoomBehaviour.transform as unknown as (
            transition: Transition<SVGSVGElement, any, any, any>,
            ...args: any[]
          ) => any,
          zoomIdentity,
          zoomTransform(this.svg?.node() as Element).invert([
            this.width / 2,
            this.height / 2,
          ])
        )
    });
  }

  private addNodeClickHandlers(
    node: d3Selection<
      BaseType | SVGGElement,
      ForceDirectedGraphNode,
      SVGGElement,
      any
    >
  ) {
    node.on('click', (event, d) => {
      if (this.selectionType === 'multipleNodes') {
        this.multipleNodeSelection(event.target);
        if (!this.multipleNodeSelectionData) {
          this.multipleNodeSelectionData = [];
        }
        this.multipleNodeSelectionData.push(d);
      } else {
        this.debtLayersSelection(event.target, d);
        this.debtLayerNode = d;
      }
    });
  }

  private debtLayersSelection(node: any, d: ForceDirectedGraphNode) {
    this.resetNodesndLinkSelection();
    const nodeSelection = select(node);
    this.updateElementSelection(nodeSelection, true);
    nodeSelection.classed('primary-node', true);
    this.updateAdjacentNodesNdLinksSelection(d);
    this.setNonDebtLayerNodesndLinksSelection();
  }
  private resetNodesndLinkSelection() {
    select('#nodes').selectAll('circle:not(.selected)').style('opacity', '1');
    select('#links').selectAll('path:not(.selected)').style('opacity', '1');
    select<SVGGElement, ForceDirectedGraphLink[]>('#links')
      .selectAll<SVGGElement, ForceDirectedGraphLink>('.selected')
      .attr(
        'marker-end',
        (d: ForceDirectedGraphLink) =>
          `url(${new URL(
            `#marker-` + (d.target as ForceDirectedGraphNode).id,
            location.href
          )})`
      );
    select('#nodes').selectAll('.selected').classed('selected', false);
    select('#nodes').selectAll('.primary-node').classed('primary-node', false);
    select('#links').selectAll('.selected').classed('selected', false);
  }
  private setNonDebtLayerNodesndLinksSelection() {
    select('#nodes')
      .selectAll('circle:not(.selected)')
      .style('opacity', '0.25');
    select('#links').selectAll('path:not(.selected)').style('opacity', '0.25');
  }
  private updateAdjacentNodesNdLinksSelection(d: ForceDirectedGraphNode) {
    const adjacentLinks:
      | { sourceNodeId: string; targetNodeId: string }[]
      | undefined = this.data?.links
      .filter((item) => (item.source as ForceDirectedGraphNode).id === d.id)
      .map((item) => ({
        sourceNodeId: (item.source as ForceDirectedGraphNode).id,
        targetNodeId: (item.target as ForceDirectedGraphNode).id,
      }));
    console.log(adjacentLinks);
    const adjacentNodes: string[] | undefined = adjacentLinks?.map(
      (item) => item.targetNodeId
    );
    console.log(adjacentNodes);
    const immediateLinks:
      | { sourceNodeId: string; targetNodeId: string }[]
      | undefined = adjacentNodes
      ?.map((adjacentNode) =>
        this.data?.links
          .filter(
            (item) =>
              (item.source as ForceDirectedGraphNode).id === adjacentNode
          )
          .map((item) => ({
            sourceNodeId: (item.source as ForceDirectedGraphNode).id,
            targetNodeId: (item.target as ForceDirectedGraphNode).id,
          }))
      )
      .reduce((prev, next) => {
        return prev?.concat(
          next as { sourceNodeId: string; targetNodeId: string }[]
        );
      });
    console.log(immediateLinks);
    const immediateNodes: string[] | undefined = immediateLinks?.map(
      (item) => item.targetNodeId
    );
    console.log(immediateNodes);
    adjacentLinks?.map((link) =>
      this.updateLinkSelection(link.sourceNodeId, link.targetNodeId)
    );
    adjacentNodes?.map((node) => this.updateNodeSelection(node));
    immediateLinks?.map((link) =>
      this.updateLinkSelection(link.sourceNodeId, link.targetNodeId)
    );
    immediateNodes?.map((node) => this.updateNodeSelection(node));
    select<SVGGElement, ForceDirectedGraphLink[]>('#links')
      .selectAll<SVGGElement, ForceDirectedGraphLink>('.selected')
      .attr(
        'marker-end',
        (d: ForceDirectedGraphLink) =>
          `url(${new URL(
            `#selected-marker-` + (d.target as ForceDirectedGraphNode).id,
            location.href
          )})`
      );
  }
  updateNodeSelection(nodeId: string): any {
    this.updateElementSelection(
      this.svg.select('#nodes').select(`#node-${nodeId}`).select('circle'),
      true
    );
  }
  updateLinkSelection(sourceNodeId: string, targetNodeId: string): any {
    this.updateElementSelection(
      select('#links').select(`#node-${sourceNodeId}-${targetNodeId}`),
      true
    );
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
    this.resetNodesndLinkSelection();
    this.debtLayerNode = undefined;
    this.multipleNodeSelectionData = undefined;
  }

  private addTooltip(svg: d3Selection<SVGSVGElement, any, any, any>) {
    const tooltip = select('#tooltip')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip');

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (event: any, d: ForceDirectedGraphNode) => {
      console.log(d);
      tooltip.html(`<div class="tooltip-wrapper">
  <div class="tooltip-title">CompanyInfo : ${d.name}</div>
  <div class="tooltip-content">
    <div class="row">
      <span class="key">Employee Count</span>
      <span class="value">${d.employeeCount}</span>
    </div>
    <div class="row">
      <span class="key">License Number</span>
      <span class="value">${d.licenseNumber}</span>
    </div>
    <div class="row">
      <span class="key">Sector</span>
      <span class="value">${d.sector}</span>
    </div>
    <div class="row">
      <span class="key">Size</span>
      <span class="value">${d.size}</span>
    </div>
  </div>
</div>`);
      tooltip.style('opacity', 1);
    };
    const mousemove = (event: any, d: ForceDirectedGraphNode) => {
      tooltip
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px');
    };
    const mouseleave = (event: any) => {
      tooltip.style('opacity', 0);
    };
    svg
      .select('#nodes')
      .selectAll<SVGGElement, ForceDirectedGraphNode>('g')
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave);
  }
  actionButtonClicked(btn: string) {
    let data: string = '';
    if (this.selectionType === 'multipleNodes') {
      data = this.multipleNodeSelectionData
        ?.map((item) => item.id)
        .join(':') as string;
    } else {
      data = this.debtLayerNode?.id as string;
    }
    window.open(`https://www.billsphere.com/link?data=${data}`);
  }
}
