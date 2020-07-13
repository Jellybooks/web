/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBSpread } from "./EPUBSpread";
import { IFrameLoader } from "./IFrameLoader";
import { ILocator } from "../../../shared-models/src/Publication/Locator";
import { PageLocation } from "./PaginationView";
import { Point } from "../VisualNavigator";
import { Publication } from "../../../shared-models/src/Publication/Publication";
import { ReadingProgression } from "../../../shared-models/src/Publication/ReadingProgression";

export type EPUBSpreadViewDirection = "left" | "right";

export interface EPUBSpreadViewDelegate {

  /** Called before the spread view animates its content (eg. page change in reflowable). */
  willAnimate: (spreadView: EPUBSpreadView) => void;
  
  /** Called after the spread view animates its content (eg. page change in reflowable). */
  didAnimate: (spreadView: EPUBSpreadView) => void;

  /** Called when the user tapped on the spread contents. */
  didTapAt: (point: Point) => void;

  /** Called when the user tapped on an external link. */
  didTapOnExternalURL: (url: string) => void;

  /** Called when the user tapped on an internal link. */
  didTapOnInternalURL: (href: string, data?: any) => void;

  /** Called when the pages visible in the spread changed. */
  didChange: (spreadView: EPUBSpreadView) => void;

  /** Called when the spread view needs to present a view controller. */
  presentViewController: (spreadView: EPUBSpreadView, viewController: any) => void;
}

export abstract class EPUBSpreadView {
  host: HTMLElement
  delegates: Array<IFrameLoader> = []; // Workaround (should be Array<EPUBSpreadViewDelegate>)
  publication: Publication;
  spread: EPUBSpread;
  readingProgression: ReadingProgression;

  protected framesLoaded: number = 0;

  public didLoad: () => void = () => {};
  public presentError: (error: any) => void = () => {};

  constructor(publication: Publication, spread: EPUBSpread, readingProgression: ReadingProgression, host: HTMLElement) {
    this.publication = publication;
    this.spread = spread;
    this.readingProgression = readingProgression;
    this.host = host;
  }

  // Location and progression
  
  /** Current progression in the resource with given href. */
  public abstract getProgression(href: string): number;

  /** Go to a PageLocation (progression or locator) */
  public abstract goToLocation(location: PageLocation, completion?: () => void): void;

  /** Go to a Locator (fragments, progression, etc.) */
  public abstract goToLocator(locator: ILocator, completion?: () => void): void;

  /** Go left or right in the current spread */
  public abstract goToDirection(direction: EPUBSpreadViewDirection, animated: boolean, completion: () => void): boolean;
}