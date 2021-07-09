/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

export interface IFrameWindow {
  window: Window,
  document: Document;
  documentElement: HTMLHtmlElement;
  head: HTMLHeadElement;
  body: HTMLBodyElement;
}

// In theory should implement EPUBSpreadViewDelegate but it’s tied to event handling
export class IFrameLoader {
  iFrame: HTMLIFrameElement;
  iFrameWindow: IFrameWindow;
  readiumCSSStyleSheets?: Array<string>;

  didLoad: () => void = () => {};

  private static readonly REFLOW_VIEWPORT = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no";

  constructor(host: HTMLElement, readiumCSSStyleSheets?: Array<string>) {
    this.readiumCSSStyleSheets = readiumCSSStyleSheets;
    this.iFrame = document.createElement("iframe");
    this.iFrame.setAttribute("style", "border: 0; overflow: hidden;");
    host.appendChild(this.iFrame);
  }

  /** Updates the iframe window, document, documentElement, head and body */
  private updateContext(): void {
    const win = this.iFrame.contentWindow as Window;
    const doc = this.iFrame.contentDocument as Document;
    const docElement = doc.documentElement as HTMLHtmlElement;
    const head = doc.head as HTMLHeadElement;
    const body = doc.body as HTMLBodyElement;

    this.iFrameWindow = {
      window: win,
      document: doc,
      documentElement: docElement,
      head: head,
      body: body
    }
  }
}