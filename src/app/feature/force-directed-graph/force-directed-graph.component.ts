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
  ZoomTransform,
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
  selectionType = 'debtLayers';
  searchForm = new FormGroup({
    q: new FormControl('', [Validators.required]),
  });
  @ViewChild('graphContainer')
  private el!: ElementRef;
  private height!: number;
  private width!: number;
  private svg!: d3Selection<SVGElement, any, any, any>;
  private zoomBehaviour?: ZoomBehavior<SVGElement, any>;
  private data: ForceDirectedGraphData | null = null;
  private debtLayerNode: ForceDirectedGraphNode | undefined;
  private multipleSelectionNodes: ForceDirectedGraphNode[] | undefined;
  constructor(private forceDirectedGraphService: ForceDirectedGraphService) {}
  ngOnInit(): void {
    this.svg = d3select<SVGElement, any>('svg');
  }
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.initializeHeightAndWidth();
    this.adjustProperties();
  }
  ngAfterViewInit() {
    this.initializeHeightAndWidth();
    this.adjustProperties();
    this.forceDirectedGraphService.loadData().then(
      (data) => {
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
          .then(({ node, zoomBehaviour }) => {
            this.zoomBehaviour = zoomBehaviour;
            this.addNodeClickHandlers(node);
            this.addZoomHandlers(zoomBehaviour);
            this.addTooltip(this.svg);
            const transform = zoomIdentity
              .translate(this.width / 2, this.height / 2)
              .scale(1);
            this.svg
              .transition()
              .duration(750)
              .call(zoomBehaviour.transform, transform);
          });
      },
      (error) => {
        console.log(error);
        this.popup('Data provided to draw chart seems not valid');
      }
    );
  }
  url(url: string): string {
    return environment.baseUrl + url;
  }
  onSearchFormSubmit() {
    this.data?.nodes?.some((item) => {
      if (item.id === this.searchForm.value.q) {
        const selectedNode = select(`#node-${item.id}`);
        selectedNode
          .select('circle')
          .dispatch('click', { bubbles: true, cancelable: true, detail: null });
        const mainGroupTransform = zoomTransform(
          this.svg.select('#main-group').node() as Element
        );
        if (this.zoomBehaviour) {
          const dcx =
            item.x && !isNaN(item.x)
              ? this.width / 2 - item.x * mainGroupTransform.k
              : this.width / 2;
          const dcy =
            item.y && !isNaN(item.y)
              ? this.height / 2 - item.y * mainGroupTransform.k
              : this.height / 2;
          console.log(dcx, dcy);
          const transform = zoomIdentity
            .translate(dcx, dcy)
            .scale(mainGroupTransform.k);
          this.svg
            .transition()
            .duration(750)
            .call(this.zoomBehaviour.transform, transform);
        }
        return;
      }
    });
  }
  actionButtonClicked(action: string) {
    let data: string = '';
    if (this.selectionType === 'multipleNodes') {
      data = this.multipleSelectionNodes
        ?.map((item) => item.id)
        .join(':') as string;
    } else {
      data = this.debtLayerNode?.id as string;
    }
    if (data) {
      const url = Object.values(environment.actionUrls)[
        Object.keys(environment.actionUrls).findIndex((item) => item === action)
      ];
      window.open(`${url}?data=${data}`);
    } else {
      this.popup(`Please choose some nodes to go to ${action} page`);
    }
  }
  onNodeSelectionTypeChanged(value: string) {
    this.selectionType = value;
    this.resetNodesndLinkSelection();
    this.debtLayerNode = undefined;
    this.multipleSelectionNodes = undefined;
  }
  private addZoomHandlers(zoomBehaviour: ZoomBehavior<SVGElement, any>) {
    select('#zoomOut').on('click', () => {
      this.svg.transition().duration(750).call(zoomBehaviour.scaleBy, 0.5);
    });
    select('#zoomIn').on('click', () => {
      this.svg.transition().duration(750).call(zoomBehaviour.scaleBy, 2);
    });
    select('#zoomReset').on('click', () => {
      this.svg
        .transition()
        .duration(1000)
        .call(
          zoomBehaviour.transform,
          new ZoomTransform(1, this.width / 2, this.height / 2)
        );
    });
    this.svg.call(zoomBehaviour);
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
        if (!this.multipleSelectionNodes) {
          this.multipleSelectionNodes = [];
        }
        this.multipleSelectionNodes.push(d);
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
    const adjacentNodes: string[] | undefined = adjacentLinks?.map(
      (item) => item.targetNodeId
    );
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
    const immediateNodes: string[] | undefined = immediateLinks?.map(
      (item) => item.targetNodeId
    );
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
  private updateNodeSelection(nodeId: string): any {
    this.updateElementSelection(
      this.svg.select('#nodes').select(`#node-${nodeId}`).select('circle'),
      true
    );
  }
  private updateLinkSelection(sourceNodeId: string, targetNodeId: string): any {
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
  private initializeHeightAndWidth(): void {
    this.height = this.el.nativeElement.offsetHeight;
    this.width = this.el.nativeElement.offsetWidth;
  }
  private adjustProperties() {
    d3select<SVGElement, any>('svg')
      .attr('height', this.height)
      .attr('width', this.width)
      .attr('fill', '#000000');
  }
  private addTooltip(svg: d3Selection<SVGElement, any, any, any>) {
    const tooltip = select('#tooltip')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip');
    const mouseover = (event: MouseEvent, d: ForceDirectedGraphNode) => {
      tooltip
        .html(
          `<div class="tooltip-wrapper">
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
          </div>`
        )
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px')
        .style('opacity', 1);
    };
    const mousemove = (event: MouseEvent, d: ForceDirectedGraphNode) => {
      tooltip
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px');
    };
    const mouseleave = () => {
      tooltip.style('opacity', 0);
    };
    svg
      .select('#nodes')
      .selectAll<SVGGElement, ForceDirectedGraphNode>('g')
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave);
  }
  private popup(message: string) {
    let popup = select('#popup').select('div');
    if (popup.size()) {
      popup.remove();
    }
    popup = select('#popup').append('div') as unknown as d3Selection<
      BaseType,
      unknown,
      HTMLElement,
      any
    >;
    popup.style('opacity', 1).attr('class', 'popup');
    popup.html(
      `<div class="popup-wrapper">
        <div class="popup-title">Alert</div>
        <div class="popup-content">${message}</div>
        <button>CLOSE</button>
      </div>`
    );
    popup.select('button').on('click', () => {
      popup.style('opacity', 0).remove();
    });
  }
}
