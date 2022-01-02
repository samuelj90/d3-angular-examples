import { Injectable } from '@angular/core';
import {
  BaseType,
  csv,
  drag,
  DSVRowArray,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  Selection,
  zoom,
  ZoomBehavior,
} from 'd3';
import { ForceDirectedGraphConfig } from './force-directed-graph-config';
import {
  ForceDirectedGraphData,
  ForceDirectedGraphLink,
  ForceDirectedGraphNode,
} from './force-directed-graph-data';
@Injectable({
  providedIn: 'root',
})
export class ForceDirectedGraphService {
  constructor() {}
  loadData() {
    return new Promise<ForceDirectedGraphData>((resolve, reject) => {
      try {
        Promise.all([
          csv('/assets/entityinfo.csv'),
          csv('/assets/relationship.csv'),
          csv('/assets/transaction-1.csv'),
        ]).then(
          ([entityInfos, relationships, transactions]: [
            DSVRowArray<string>,
            DSVRowArray<string>,
            DSVRowArray<string>
          ]) => {
            let chartData: ForceDirectedGraphData = {
              nodes: [],
              links: [],
            };
            entityInfos.map((item, index) => {
              chartData.nodes.push({
                id: item['Companyid'] as string,
                name: item['Company_name'] as string,
                size: item['size'] as string,
                sector: item['sector'] as string,
                licenseNumber: item['license_number'] as string,
                employeeCount: item['employee_count'] as string,
                state: item['state'] as string,
                trnNumber: item['trnnumber'] as string,
                healthStatus: item['health_status'] as string,
                index: index,
              });
            });
            transactions.map((item, index) => {
              chartData.links.push({
                source: item['payer'] as string,
                target: item['payee'] as string,
                type: item['status'] as string,
                value: Number(item['amount']),
                index: index,
              });
            });
            resolve(chartData);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }
  draw(
    data: ForceDirectedGraphData,
    config: ForceDirectedGraphConfig
  ): Promise<{
    node: Selection<
      BaseType | SVGGElement,
      ForceDirectedGraphNode,
      SVGGElement,
      any
    >;
    link: Selection<
      BaseType | SVGPathElement,
      ForceDirectedGraphLink,
      SVGGElement,
      any
    >;
    zoomHandler: ZoomBehavior<Element, unknown>;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const links = data.links;
        const nodes = data.nodes;
        const { svg, types, linkColor: linkColor, nodeColor } = config;
        const simulation = forceSimulation(nodes)
          .force(
            'link',
            forceLink(links).id((_d, index) => nodes[index].id)
          )
          .force('charge', forceManyBody().strength(-300))
          .force('x', forceX())
          .force('y', forceY())
          .force(
            'collide',
            forceCollide((d) => 65)
          );
        svg
          .append('rect')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('fill', '#000000');
        const mainGroup = svg.append('g').attr('id', 'main-group');
        const linkDirectionMarkers: Selection<
          SVGGElement,
          ForceDirectedGraphLink[],
          any,
          ForceDirectedGraphLink
        > = svg.append('defs').append('g').attr('id', 'markers');
        linkDirectionMarkers
          .selectAll('.marker')
          .data(links)
          .enter()
          .append('marker')
          .attr('class', 'marker')
          .attr('id', (d) => {
            return 'marker-' + (d.target as ForceDirectedGraphNode).id;
          })
          .attr('viewBox', '0 -2.5 5 5')
          .attr('refX', (d) => {
            return Number((d.target as ForceDirectedGraphNode).size) * 2 + 5;
          })
          .attr('refY', 0)
          .attr('markerWidth', 5) // markerWidth equals viewBox width
          .attr('markerHeight', 5)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-2.5 L5,0 L0,2.5')
          .style('stroke', (d) => linkColor(d.type))
          .style('fill', (d) => linkColor(d.type))
          .style('opacity', '1');
        linkDirectionMarkers
          .selectAll('.marker-selected')
          .data(links)
          .enter()
          .append('marker')
          .attr('class', 'marker-selected')
          .attr('id', (d) => {
            return 'selected-marker-' + (d.target as ForceDirectedGraphNode).id;
          })
          .attr('viewBox', '0 -2.5 5 5')
          .attr('refX', (d) => {
            return Number((d.target as ForceDirectedGraphNode).size) * 2 + 5;
          })
          .attr('refY', 0)
          .attr('markerWidth', 5) // markerWidth equals viewBox width
          .attr('markerHeight', 5)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-2.5 L5,0 L0,2.5')
          .style('stroke', 'rgba(255, 255, 255, 0.5)')
          .style('fill', 'rgba(255, 255, 255, 1)')
          .style('opacity', '1');
        const link = mainGroup
          .append('g')
          .attr('id', 'links')
          .attr('fill', 'none')
          .attr('stroke-width', 1.5)
          .selectAll('path')
          .data(links)
          .join('path')
          .attr(
            'id',
            (d) =>
              `node-${(d.source as ForceDirectedGraphNode).id}-${
                (d.target as ForceDirectedGraphNode).id
              }`
          )
          .attr('stroke', (d) => linkColor(d.type))
          .attr(
            'marker-end',
            (d) =>
              `url(${new URL(
                `#marker-` + (d.target as ForceDirectedGraphNode).id,
                location.href
              )})`
          );
        const dragHandler = (simulation: any) => {
          const dragStart = (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          };
          const dragged = (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          };
          const dragEnd = (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          };
          return drag()
            .on('start', dragStart)
            .on('drag', dragged)
            .on('end', dragEnd);
        };
        const node = mainGroup
          .append('g')
          .attr('id', 'nodes')
          .attr('fill', 'currentColor')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .selectAll('g')
          .data(nodes)
          .join('g')
          .attr('id', (d) => `node-${d.id}`)
          .call(dragHandler(simulation).bind(this));
        node
          .append('circle')
          .attr('stroke', 'rgb(0, 0, 0)')
          .attr('stroke-width', 1.5)
          .attr('r', (d) => Number(d.size) * 2)
          .attr('fill', (d) => nodeColor(d.healthStatus));
        node
          .append('text')
          .attr('x', 30 + 4)
          .attr('y', '0.31em')
          .text((d) => d.id)
          .clone(true)
          .lower()
          .attr('fill', 'none')
          .attr('stroke', 'white')
          .attr('stroke-width', 3);
        const linkArc = (d: any) =>
          `M${d.source.x},${d.source.y}A0,0 0 0,1 ${d.target.x},${d.target.y}`;
        simulation.on('tick', () => {
          link.attr('d', linkArc);
          node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });
        const onZoom = (event: any) => {
          mainGroup.attr('transform', event.transform);
        };
        const zoomHandler = zoom().on('zoom', onZoom);
        zoomHandler(svg as unknown as Selection<Element, unknown, any, any>);
        resolve({
          node,
          link,
          zoomHandler,
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  getTranslate(translate: string): { x: number | null; y: number | null } {
    const translateArray = translate
      ? translate
          .substring(translate.indexOf('(') + 1, translate.indexOf(')'))
          .split(',')
      : [];
    if (translateArray && translateArray.length === 2) {
      return {
        x: parseFloat(translateArray[0] || '0'),
        y: parseFloat(translateArray[1] || '0'),
      };
    } else {
      return {
        x: null,
        y: null,
      };
    }
  }
}
