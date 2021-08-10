/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { IBookView } from "./BookView";
import { IFrameLoader } from "../IFrameLoader";
import * as BrowserUtilities from "../utils/BrowserUtilities";

export default class ScrollingBookView implements IBookView {
  protected readonly scrollingElement: Element = document.scrollingElement || document.body;

  iFrameViews: Array<IFrameLoader>;
  sideMargin: number = 0;
  height: number = 0;
  activeView: number = 0;

  protected setIFrameSize(): void {
    for (const iFrameView of this.iFrameViews) {
      // Remove previous iframe height so body scroll height will be accurate.
      iFrameView.iFrame.height = "0";
      iFrameView.iFrame.width = BrowserUtilities.getWidth() + "px";

      const root = iFrameView.iFrameWindow.documentElement;
      const body = iFrameView.iFrameWindow.body;

      const width = (BrowserUtilities.getWidth() - this.sideMargin * 2) + "px";

      const images = Array.prototype.slice.call(body.querySelectorAll("img"));
      for (const image of images) {
        image.style.maxWidth = width;
        image.style.height = "auto";
      }

      // We must set that after restyling images, otherwise the iframe height may be really wrong for covers/standalone images
      const minHeight = this.height;
      let bodyHeight = root.scrollHeight + 20; // magic number to get some room

      iFrameView.iFrame.style.height = Math.max(minHeight, bodyHeight) + "px";
    }
  }

  public start(progression: number): void {
    for (const iFrameView of this.iFrameViews) {
      const html = iFrameView.iFrameWindow.documentElement;
      html.style.setProperty("--USER__scroll", "readium-scroll-on");
      this.goToProgression(progression);
    }
  }

  public stop(): void {
    for (const iFrameView of this.iFrameViews) {
      iFrameView.iFrame.height = "0";
      iFrameView.iFrame.width = "0";

      const body = iFrameView.iFrameWindow.body;

      const images = Array.prototype.slice.call(body.querySelectorAll("img"));
      for (const image of images) {
        image.style.maxWidth = "";
        image.style.height = "";
      }
    }
  }

  public getCurrentProgression(): number {
    const body = this.iFrameViews[this.activeView].iFrameWindow.body;
    return this.scrollingElement.scrollTop / body.scrollHeight;
  }

  public atTop(): boolean {
    return this.scrollingElement.scrollTop <= 0;
  }

  public atBottom(): boolean {
    // We can’t use === because Safari iOS has an off-by-one error…
    return (this.scrollingElement.scrollHeight - this.scrollingElement.scrollTop) <= window.innerHeight;
  }

  public goToDirection(): boolean {
    return false;
  }

  public goToProgression(progression: number): boolean {
    this.setIFrameSize();
    this.scrollingElement.scrollTop = this.scrollingElement.scrollHeight * progression;
    return true;
  }

  public goToElement(element: HTMLElement | null): boolean {
    if (element) {
      // Put the element as close to the top as possible.
      element.scrollIntoView();

      // Unless we're already at the bottom, scroll up so the element is
      // in the middle, and not covered by the top nav.
      if ((this.scrollingElement.scrollHeight - element.offsetTop) >= this.height) {
        this.scrollingElement.scrollTop = Math.max(0, this.scrollingElement.scrollTop - this.height / 3);
      }
      return true;
    }
    return false;
  }

  public goToFragment(fragment: string): boolean {
    const element = this.iFrameViews[this.activeView].iFrameWindow.document.getElementById(fragment);
    return this.goToElement(element);
  }
}
