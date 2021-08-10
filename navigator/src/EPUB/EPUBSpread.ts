/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBLayout } from "../../../shared-models/src/Publication/epub/Layout";
import { Link } from "../../../shared-models/src/Publication/Link";
import { Publication } from "../../../shared-models/src/Publication/Publication";
import { ReadingProgression } from "../../../shared-models/src/Publication/ReadingProgression";
import "../../../shared-models/src/Publication/presentation/Metadata+Presentation";

type PageCount = 1 | 2;

/** A list of EPUB resources to be displayed together on the screen, as one-page or two-pages spread. */
export class EPUBSpread {

  /** Number of page "slots" in the spread. */
  pageCount: PageCount;

  /** Links for the resources displayed in the spread, in reading order. 
   *  it's possible to have less links than the amount of `pageCount` available, because a single page 
   *  might be displayed in a two-page spread (eg. with Properties.Page center, left or right)
   */
  links: Array<Link>;

  /** Spread reading progression direction. */
  readingProgression: ReadingProgression;

  /** Rendition layout of the links in the spread. */
  layout: EPUBLayout;

  linksLTR: Array<Link>;

  constructor(config: {
    pageCount: PageCount, 
    links: Array<Link>, 
    readingProgression: ReadingProgression, 
    layout: EPUBLayout
  }) {
    this.pageCount = config.pageCount;
    this.links = config.links;
    this.readingProgression = config.readingProgression;
    this.layout = config.layout;
    this.linksLTR = this.initLinksLTR();
  }

  /** Init Links for the resources in the spread, from left to right. */
  private initLinksLTR(): Array<Link> {
    switch(this.readingProgression) {
      case ReadingProgression.ltr:
      case ReadingProgression.ttb:
      case ReadingProgression.auto:
        return this.links;
      case ReadingProgression.rtl:
      case ReadingProgression.btt:
        return this.links.reverse();
    }
  }

  /** Returns the left-most resource link in the spread. */
  public getLeft(): Link {
    return this.linksLTR[0];
  }

  /** Returns the right-most resource link in the spread. */
  public getRight(): Link {
    return this.linksLTR[this.linksLTR.length - 1];
  }

  /** Returns the leading resource link in the reading progression. */
  public getLeading(): Link {
    return this.links[0];
  }

  /** Returns whether the spread contains a resource with the given href. */
  public contains(href: string): Link | null {
    return this.links.find(link => link.href === href) || null;
  }

  /** Builds a list of spreads for the given Publication.
   * @param publication The Publication to build the spreads for.
   * @param readingProgression Reading progression direction used to layout the pages.
   * @param pageCountPerSpread Number of pages to display in a given spread (1 or 2).
   */
  public static makeSpreads(publication: Publication, readingProgression: ReadingProgression, pageCountPerSpread: PageCount): Array<EPUBSpread> {
    switch(pageCountPerSpread) {
      case 1:
        return EPUBSpread.makeOnePageSpreads(publication, readingProgression);
      case 2:
        return EPUBSpread.makeTwoPageSpreads(publication, readingProgression);
    }
  }

  private static makeOnePageSpreads(publication: Publication, readingProgression: ReadingProgression): Array<EPUBSpread> {
    const presentationHints = publication.metadata.getPresentation();
    return publication.readingOrder.map(item => {
      return new this({
        pageCount: 1,
        links: [item],
        readingProgression: readingProgression,
        layout: presentationHints.layoutOf(item)
      })
    });
  }

  private static makeTwoPageSpreads(publication: Publication, readingProgression: ReadingProgression): Array<EPUBSpread> {
    const presentationHints = publication.metadata.getPresentation();
    const makeSpreads = (links: Array<Link>, spreads: Array<EPUBSpread> = []): Array<EPUBSpread> => {
      if (links.length === 0) {
        return spreads;
      }

      const first = links.shift() as Link;
      const layout = presentationHints.layoutOf(first);
      const second = links[0];
      const secondLayout = presentationHints.layoutOf(second) || EPUBLayout.fixed;
      if (second && (layout === EPUBLayout.fixed) && (layout === secondLayout) && areConsecutive(first, second)) {
        spreads.push(new this({
          pageCount: 2,
          links: [first, second],
          readingProgression: readingProgression,
          layout: layout
        }));
        links.shift();
      } else {
        spreads.push(new this({
          pageCount: 2,
          links: [first],
          readingProgression: readingProgression,
          layout: layout
        }))
      }
      return makeSpreads(links, spreads);
    }

    const areConsecutive = (first: Link, second: Link): boolean => {
      switch(publication.metadata.readingProgression) {
        case ReadingProgression.ltr:
        case ReadingProgression.ttb:
        case ReadingProgression.auto:
          let firstPosition = first.properties.otherProperties["page"] || "left";
          let secondPosition = second.properties.otherProperties["page"] || "right";
          return (firstPosition === "left" && secondPosition === "right");
        case ReadingProgression.rtl:
        case ReadingProgression.btt:
          firstPosition = first.properties.otherProperties["page"] || "right";
          secondPosition = second.properties.otherProperties["page"] || "left";
          return (firstPosition === "right" && secondPosition === "left");
      }
    }

    return makeSpreads(Array.from(publication.readingOrder))
  }
}