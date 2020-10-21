/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBSpreadViewDirection } from "../EPUBSpreadView";
import { IFrameLoader } from "../IFrameLoader";
import { IBookView } from "./BookView";
import * as BrowserUtilities from "../utils/BrowserUtilities";


export default class ReflowableBookView implements IBookView {
    protected readonly scrollingElement: Element = document.scrollingElement || document.body;
    protected hasFixedScrollWidth: boolean = false;

    iFrameViews: Array<IFrameLoader>;
    sideMargin: number = 0;
    height: number = 0;
    activeView: number = 0;

    private scrollMode: boolean
    // TODO: needs to be used for more than just set a bollean, this is where we can set anything that might be needed for the mode
    setMode(scroll: boolean) {
        this.scrollMode = scroll
        for (const iFrameView of this.iFrameViews) {
            const html = iFrameView.iFrameWindow.documentElement;
            if (scroll) {
                html.style.setProperty("--USER__scroll", "readium-scroll-on");
            } else {
                html.style.setProperty("--USER__scroll", "readium-scroll-off");
            }
        }
        this.checkForFixedScrollWidth();
    }
    isPaginated() {
        return this.scrollMode === false
    }
    isScrollmode() {
        return this.scrollMode === true
    }

    // TODO: needs revisiting 
    start(progression: number): void {
        this.setSize();
        this.setMode(this.scrollMode)
        this.goToProgression(progression);
    }

    // TODO: needs revisiting 
    stop(): void {
        for (const iFrameView of this.iFrameViews) {

            iFrameView.iFrame.height = "0";
            iFrameView.iFrame.width = "0";
            const body = iFrameView.iFrameWindow.body;
            const images = Array.prototype.slice.call(body.querySelectorAll("img, svg"));
            for (const image of images) {
                image.style.maxWidth = "";
                image.style.height = "";
                image.style.maxHeight = "";
                image.style.marginLeft = "";
                image.style.marginRight = "";
            }
        }

    }


    getCurrentProgression(): number {
        if (this.isScrollmode()) {
            const body = this.iFrameViews[this.activeView].iFrameWindow.body;
            return this.scrollingElement.scrollTop / body.scrollHeight;
        } else {
            const width = this.getColumnWidth();
            const leftWidth = this.getLeftColumnsWidth();
            const rightWidth = this.getRightColumnsWidth();
            const totalWidth = leftWidth + width + rightWidth;
            return leftWidth / totalWidth;
        }
    }
    goToDirection(direction: EPUBSpreadViewDirection): boolean {
        if (this.isScrollmode()) {
            return false;
        } else {
            switch (direction) {
                case "left":
                    return this.goToPreviousPage();
                case "right":
                    return this.goToNextPage();
            }
        }
    }
    goToProgression(progression: number): boolean {
        this.setSize();
        if (this.isScrollmode()) {
            this.scrollingElement.scrollTop = this.scrollingElement.scrollHeight * progression;
            return true;
        } else {
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
    }
    goToFragment(fragment: string, relative?: boolean): boolean {
        const element = this.iFrameViews[this.activeView].iFrameWindow.document.getElementById(fragment);
        return this.goToElement(element, relative);
    }
    goToElement(element: HTMLElement | null, relative?: boolean): boolean {

        if (this.isScrollmode()) {
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
        } else {
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
    }

    // TODO: needs to be implemented for scrollmode
    goToPreviousPage(): boolean {
        if (this.isScrollmode()) {
            return false
        } else {
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
    }
    // TODO: needs to be implemented for scrollmode
    goToNextPage(): boolean {
        if (this.isScrollmode()) {
            return false
        } else {
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
    }
    // TODO: this is more like screens, need to think what's best to use in scrollmode
    getCurrentPage(): number {
        if (this.isScrollmode()) {
            return 0
        } else {
            return this.getCurrentProgression() * this.getPageCount() + 1;
        }
    }
    // TODO: this is more like screens, need to think what's best to use in scrollmode
    getPageCount(): number {
        if (this.isScrollmode()) {
            return 0
        } else {
            const width = this.getColumnWidth();
            const html = this.iFrameViews[this.activeView].iFrameWindow.documentElement;
            return html.scrollWidth / width;
        }
    }

    atStart(): boolean {
        if (this.isScrollmode()) {
            return document.scrollingElement.scrollTop === 0;
        } else {
            const leftWidth = this.getLeftColumnsWidth();
            return (leftWidth <= 0);
        }
    }

    atEnd(): boolean {
        if (this.isScrollmode()) {
            return (Math.ceil(document.scrollingElement.scrollHeight - document.scrollingElement.scrollTop) - 1) <= BrowserUtilities.getHeight();
        } else {
            const rightWidth = this.getRightColumnsWidth();
            return (rightWidth <= 0);
        }
    }

    protected setSize(): void {
        if (this.isScrollmode()) {
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
        } else {
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
    }
    protected checkForFixedScrollWidth(): void {
        if (this.isPaginated()) {
            // Determine if the scroll width changes when the left position
            // changes. This differs across browsers and sometimes across
            // books in the same browser.
            const body = this.iFrameViews[this.activeView].iFrameWindow.body;
            const originalScrollWidth = body.scrollWidth;
            this.hasFixedScrollWidth = (body.scrollWidth === originalScrollWidth);
        }
    }

    // TODO: Paginated functions needs revisiting 

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

}