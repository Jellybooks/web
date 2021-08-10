/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBSpread } from "./EPUBSpread";
import { EPUBSpreadView } from "./EPUBSpreadView";
import { ILocator } from "../../../shared-models/src/Publication/Locator";
import { IVisualNavigatorDelegate, Point } from "../VisualNavigator";
import { ReadingProgression } from "../../../shared-models/src/Publication/ReadingProgression";

export class PageLocation {
  public progression?: number;
  public locator?: ILocator | null;

  constructor(config: { progression?: number, locator?: ILocator | null }) {
    this.progression = config.progression;
    this.locator = config.locator;
  }

  public static start() {
    return new this({progression: 0});
  }
  
  public static end() {
    return new this({progression: 1});
  }

  public static locator(locator: ILocator | null) {
    return new this({locator: locator});
  }

  public isStart(): boolean {
    if (this.progression && this.progression === 0) {
      return true;
    } else if (this.locator && this.locator.locations.progression && this.locator.locations.progression === 0) {
      return true;
    }
    return false;
  }
}

export class PaginationView implements IVisualNavigatorDelegate {
  host: HTMLElement;
  spreadViews: Array<EPUBSpreadView>;

  public didLoad: () => void = () => {};
  public locationChanged: (location: ILocator) => void = () => {};
  public presentError: (error: any) => void = () => {};
  public presentExternalURL: (url: string) => void = () => {};
  public clicked: (atPoint: Point) => void = () => {};

  private currentIndex: number = 0;
  private readingProgression: ReadingProgression = ReadingProgression.ltr;

  constructor(host: HTMLElement, readiumCSSStyleSheets?: Array<string>) {
    this.host = host;
  }

  public goToIndex(spreadIndex: number, location: PageLocation | null = null, animated: boolean = false, completion: () => void = () => {}): boolean {
    return false;
  }
}