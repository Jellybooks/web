/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBSpread } from "./EPUBSpread";
import { EPUBSpreadViewDirection } from "./EPUBSpreadView";
import { IEPUBSettings } from "./EPUBSettings";
import { ILocator } from "../../../shared-models/src/Publication/Locator";
import { IVisualNavigator, IVisualNavigatorDelegate } from "../VisualNavigator";
import { Link, Links } from "../../../shared-models/src/Publication/Link";
import { PaginationView, PageLocation } from "./PaginationView";
import { Publication } from "../../../shared-models/src/Publication/Publication";
import { ReadingProgression } from "../../../shared-models/src/Publication/ReadingProgression";

export class EPUBNavigatorViewController implements IVisualNavigator {
  view: PaginationView;
  publication: Publication;
  currentLocation: ILocator;
  readingProgression: ReadingProgression;
  userSettings: IEPUBSettings;

  private spreads: Array<EPUBSpread> = [];
  private currentSpreadIndex: number;

  constructor(publication: Publication, initialLocation: ILocator, host: HTMLElement) {
    this.publication = publication;
    this.currentLocation = initialLocation;
    this.readingProgression = publication.metadata.effectiveReadingProgression();
    this.view = new PaginationView(host);
  }

  /** TODO
   *  Index of the currently visible spread.
   */
  private getCurrentSpreadIndex(): number {
    return 0;
  }

  /** Reading order index of the left-most resource in the visible spread. */
  private getCurrentResourceIndex(): number {
    return this.publication.readingOrder.findIndexWithHref(this.spreads[this.currentSpreadIndex].getLeft().href);
  }

  /** Mapping between reading order hrefs and the table of contents title. */
  private tableOfContentsTitleByHref(): { [href: string]: string } {
    const fulfill = (links: Links): { [href: string]: string } => {
      let result: { [href: string]: string } = {};
      for (const link of links) {
        const title = link.title;
        if (title) {
          result[link.href] = title;
        }
        const subresult = fulfill(link.children);
        Object.assign(result, subresult);
      }
      return result;
    }
    return fulfill(this.publication.tableOfContents);
  }

  /** Goes to the reading order resource at given `index`, and given content location. */
  private goToReadingOrder(index: number, locator: ILocator | null = null, animated: boolean = false, completion: () => void = () => { }): boolean {
    const href = this.publication.readingOrder[index].href;
    const spreadIndex = this.spreads.findIndex((spread: EPUBSpread) => {
      const found = spread.contains(href);
      if (found !== null) {
        return true;
      }
      return false;
    });
    if (spreadIndex) {
      return this.view.goToIndex(spreadIndex, PageLocation.locator(locator), animated, completion);
    }
    return false;
  }

  /** TODO PAGINATION VIEW
   *  Goes to the next or previous page in the given scroll direction. 
   */
  private goToDirection(direction: EPUBSpreadViewDirection, animated?: boolean, completion?: () => void): boolean {
    return false;
  }

  /** TODO */
  public getCurrentLocation(): ILocator | null {
    return null;
  }

  public goToLocator(locator: ILocator, animated?: boolean, completion?: () => void): boolean {
    const spreadIndex = this.spreads.findIndex((spread: EPUBSpread) => {
      const found = spread.contains(locator.href);
      if (found !== null) {
        return true;
      }
      return false;
    });
    if (spreadIndex) {
      return this.view.goToIndex(spreadIndex, PageLocation.locator(locator), animated, completion);
    }
    return false;
  }

  public goToLink(link: Link, animated?: boolean, completion?: () => void): boolean {
    const locator: ILocator = {
      href: link.href,
      type: link.type || "",
      locations: {
        fragments: []
      },
      text: {}
    }
    return this.goToLocator(locator, animated, completion);
  }

  public goForward(animated?: boolean, completion?: () => void): boolean {
    let direction: EPUBSpreadViewDirection;
    switch (this.readingProgression) {
      case ReadingProgression.ltr:
      case ReadingProgression.ttb:
      case ReadingProgression.auto:
        direction = "right";
        break;
      case ReadingProgression.rtl:
      case ReadingProgression.btt:
        direction = "left";
        break;
      default:
        direction = "right";
        break;
    }
    return this.goToDirection(direction, animated, completion);
  }

  public goBackward(animated?: boolean, completion?: () => void): boolean {
    let direction: EPUBSpreadViewDirection;
    switch (this.readingProgression) {
      case ReadingProgression.ltr:
      case ReadingProgression.ttb:
      case ReadingProgression.auto:
        direction = "left";
        break;
      case ReadingProgression.rtl:
      case ReadingProgression.btt:
        direction = "right";
        break;
      default:
        direction = "left";
        break;
    }
    return this.goToDirection(direction, animated, completion);
  }

  public goLeft(animated?: boolean, completion?: () => void): boolean {
    return this.goToDirection("left", animated, completion);
  }

  public goRight(animated?: boolean, completion?: () => void): boolean {
    return this.goToDirection("right", animated, completion);
  }
}