/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { IBookView } from "./BookView";
import { IFrameLoader } from "../IFrameLoader";
import * as BrowserUtilities from "../utils/BrowserUtilities";
import { EPUBSpreadViewDirection } from "../EPUBSpreadView";

export default class ColumnsPaginatedBookView implements IBookView {
  iFrameViews: Array<IFrameLoader>;
  sideMargin: number = 0;
  height: number = 0;
  activeView: number = 0;

  protected hasFixedScrollWidth: boolean = false;

  public start(progression: number = 0): void {
    for (const iFrameView of this.iFrameViews) {
      const html = iFrameView.iFrameWindow.documentElement;
      html.style.setProperty("--USER__scroll", "readium-scroll-off");
    }

    this.setSize();

    this.checkForFixedScrollWidth();

    this.goToProgression(progression);
  }

  protected checkForFixedScrollWidth(): void {
    // Determine if the scroll width changes when the left position
    // changes. This differs across browsers and sometimes across
    // books in the same browser.
    const body = this.iFrameViews[this.activeView].iFrameWindow.body;
    const originalScrollWidth = body.scrollWidth;
    this.hasFixedScrollWidth = (body.scrollWidth === originalScrollWidth);
  }

  protected setSize(): void {
    for (const iFrameView of this.iFrameViews) {
      const body = iFrameView.iFrameWindow.body;

      iFrameView.iFrameWindow.documentElement.style.height = (this.height) + "px";
      iFrameView.iFrame.height = (this.height) + "px";
      iFrameView.iFrame.width = BrowserUtilities.getWidth() + "px";

      const images = Array.prototype.slice.call(body.querySelectorAll("img, svg"));
      for (const image of images) {
        image.style.maxWidth = "100%";

        // Determine how much vertical space there is for the image.
        let nextElement = image;
        let totalMargins = 0;
        while (nextElement !== body) {
          const computedStyle = window.getComputedStyle(nextElement);
          if (computedStyle.marginTop) {
            totalMargins += parseInt(computedStyle.marginTop.slice(0, -2), 10)
          }
          if (computedStyle.marginBottom) {
            totalMargins += parseInt(computedStyle.marginBottom.slice(0, -2), 10)
          }
          nextElement = nextElement.parentElement;
        }
        image.style.maxHeight = (this.height - totalMargins) + "px";

        // Without this, an image at the end of a resource can end up
        // with an extra empty column after it.
        image.style.verticalAlign = "top";
      }
    }
  }

  public stop(): void {
    for (const iFrameView of this.iFrameViews) {
      const body = iFrameView.iFrameWindow.body;
      const images = Array.prototype.slice.call(body.querySelectorAll("img, svg"));
      for (const image of images) {
        image.style.maxWidth = "";
        image.style.maxHeight = "";
        image.style.marginLeft = "";
        image.style.marginRight = "";
      }
    }
  }

  /** Returns the total width of the columns that are currently
      positioned to the left of the iframe viewport. */
  protected getLeftColumnsWidth(): number {
    const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
    return html.scrollLeft;
  }

  /** Returns the total width of the columns that are currently
      positioned to the right of the iframe viewport. */
  protected getRightColumnsWidth(): number {
    const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
    const scrollWidth = html.scrollWidth;

    const width = this.getColumnWidth();
    let rightWidth = scrollWidth - width;
    if (this.hasFixedScrollWidth) {
      // In some browsers (IE and Firefox with certain books), 
      // scrollWidth doesn't change when some columns
      // are off to the left, so we need to subtract them.
      const leftWidth = this.getLeftColumnsWidth();
      rightWidth = Math.max(0, rightWidth - leftWidth);
    }
    return rightWidth;
  }

  /** Returns the width of one column. */
  protected getColumnWidth(): number {
    const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
    return html.offsetWidth;
  }

  /** Shifts the columns so that the specified width is positioned
      to the left of the iframe viewport. */
  protected setLeftColumnsWidth(width: number) {
    const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
    html.scrollLeft = width;
  }

  /** Returns number in range [0..1) representing the
      proportion of columns that are currently positioned
      to the left of the iframe viewport. */
  public getCurrentProgression(): number {
    const width = this.getColumnWidth();
    const leftWidth = this.getLeftColumnsWidth();
    const rightWidth = this.getRightColumnsWidth();
    const totalWidth = leftWidth + width + rightWidth;
    return leftWidth / totalWidth;
  }

  /** Returns the current 1-indexed page number. */
  public getCurrentPage(): number {
    return this.getCurrentProgression() * this.getPageCount() + 1;
  }

  /** Returns the total number of pages. */
  public getPageCount(): number {
    const width = this.getColumnWidth();
    const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
    return html.scrollWidth / width;
  }

  public onFirstPage(): boolean {
    const leftWidth = this.getLeftColumnsWidth();

    return (leftWidth <= 0);
  }

  public onLastPage(): boolean {
    const rightWidth = this.getRightColumnsWidth();

    return (rightWidth <= 0);
  }

  protected goToPreviousPage(): boolean {
    const leftWidth = this.getLeftColumnsWidth();
    const width = this.getColumnWidth();

    var offset = leftWidth - width;
    if (offset >= 0) {
      this.setLeftColumnsWidth(offset);
    } else {
      this.setLeftColumnsWidth(0);
    }
    return true;
  }

  protected goToNextPage(): boolean {
    const leftWidth = this.getLeftColumnsWidth();
    const width = this.getColumnWidth();
    const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
    const scrollWidth = html.scrollWidth;

    var offset = leftWidth + width;
    if (offset < scrollWidth) {
      this.setLeftColumnsWidth(offset);
    } else {
      this.setLeftColumnsWidth(scrollWidth);
    }
    return true;
  }

  public goToDirection(direction: EPUBSpreadViewDirection): boolean {
    switch (direction) {
      case "left":
        return this.goToPreviousPage();
      case "right":
        return this.goToNextPage();
    }
  }

  /** Goes to a position specified by a number in the range [0..1].
      The position should be a number as returned by getCurrentPosition,
      or 1 to go to the last page. The position will be rounded down so
      it matches the position of one of the columns. */
  /** @param progression Number in range [0..1] */
  public goToProgression(progression: number): boolean {
    this.setSize();
    // If the window has changed size since the columns were set up,
    // we need to reset position so we can determine the new total width.
    this.setLeftColumnsWidth(0);
    const width = this.getColumnWidth();
    const rightWidth = this.getRightColumnsWidth();
    const totalWidth = width + rightWidth;

    const newLeftWidth = progression * totalWidth;

    // Round the new left width so it's a multiple of the column width.

    let roundedLeftWidth = Math.round(newLeftWidth / width) * width;
    if (roundedLeftWidth >= totalWidth) {
      // We've gone too far and all the columns are off to the left.
      // Move one column back into the viewport.
      roundedLeftWidth = roundedLeftWidth - width;
    }
    this.setLeftColumnsWidth(roundedLeftWidth);
    return true;
  }

  public goToElement(element: HTMLElement | null, relative?: boolean): boolean {
    if (element) {
      // Chrome + Firefox need that for handling focus properly…
      const root = this.iFrameViews[this.activeView].iFrameWindow.document.scrollingElement || this.iFrameViews[this.activeView].iFrameWindow.documentElement;
      
      // This is needed because of Chrome/Firefox,
      // which scroll the root on focus, and corrupt
      // getBoundingClientRect().left, resulting in a pagination offset
      root.scrollLeft = 0;

      // There is a bug in Safari when using getBoundingClientRect
      // on an element that spans multiple columns. Temporarily
      // set the element's height to fit it on one column so we
      // can determine the first column position.
      const originalHeight = element.style.height;
      element.style.height = "0";

      // Get the element's position in the iframe, and
      // round that to figure out the column it's in.
      const left = element.getBoundingClientRect().left;
      const width = this.getColumnWidth();
      let roundedLeftWidth = Math.floor(left / width) * width;
      if (relative) {
        const origin = this.getLeftColumnsWidth();
        roundedLeftWidth = (Math.floor(left / width) * width) + origin;
      }

      // Restore element's original height.
      element.style.height = originalHeight;

      this.setLeftColumnsWidth(roundedLeftWidth);
      return true;
    }
    return false;
  }

  public goToFragment(fragment: string, relative?: boolean): boolean {
    const element = this.iFrameViews[this.activeView].iFrameWindow.document.getElementById(fragment);
    return this.goToElement(element, relative);
  }
}