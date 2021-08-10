/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBSpread } from "./EPUBSpread";
import { EPUBSpreadView, EPUBSpreadViewDirection } from "./EPUBSpreadView";
import { IEPUBSettings } from "./EPUBSettings";
import { IFrameLoader } from "./IFrameLoader";
import { ILocator } from "../../../shared-models/src/Publication/Locator";
import { PageLocation } from "./PaginationView";
import { Publication } from "../../../shared-models/src/Publication/Publication";
import { ReadingProgression } from "../../../shared-models/src/Publication/ReadingProgression";

export class EPUBReflowableSpreadView extends EPUBSpreadView {
  settings: IEPUBSettings;
  private progression: number = 0;

  constructor(publication: Publication, spread: EPUBSpread, readingProgression: ReadingProgression, host: HTMLElement, settings: IEPUBSettings, readiumCSSStyleSheets?: Array<string>) {
    super(
      publication, 
      spread, 
      readingProgression,
      host
    );
    this.settings = settings;

    // Delegates (IFrame)
  }

  // TODO
  public getProgression(href: string): number {
    if (this.spread.getLeading().href === href) {
      return this.progression;
    }
    return 0;
  }

  public goToLocation(location: PageLocation, completion?: () => void) {
    if (location.progression) {
      this.goToProgression(location.progression, completion);
    } else if (location.locator) {
      this.goToLocator(location.locator, completion);
    }
  }

  public goToLocator(locator: ILocator, completion: () => void = () => {}) {
    if (locator.href.includes("#") || !this.spread.contains(locator.href)) {
      console.error("The locator’s href is not in the spread");
      completion();
      return
    }

    if (Object.keys(locator).length === 0) {
      completion();
      return;
    }

    const fragment = locator.locations.fragments[0].trim();
    if (fragment) {
      return this.goToFragment(fragment, completion);
    }

    const progression = locator.locations.progression;
    if (progression) {
      return this.goToProgression(progression, completion);
    }
    completion();
  }

  public goToProgression(progression: number, completion: () => void = () => {}) {
    if (progression < 0 || progression > 1) {
      console.error("Scrolling to invalid progression progression");
      completion();
      return;
    }

    this.settings.getSelectedView().goToProgression(progression);
    completion();
  }

  public goToFragment(fragment: string, completion: () => void = () => {}) {
    this.settings.getSelectedView().goToFragment(fragment);
    completion();
  }

  // Note: missing animated + completion() params
  public goToDirection(direction: EPUBSpreadViewDirection): boolean {
    return this.settings.getSelectedView().goToDirection(direction);
  }
}