/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

/** Creates a link element to prepend/append in a document */
export function createStylesheet(href: string): HTMLLinkElement {
  const link = document.createElement("link") as HTMLLinkElement;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = href;
  return link;
}

/** Creates a script element to prepend/append in a document */
export function createScript(src: string, async: boolean = false): HTMLScriptElement {
  const script = document.createElement("script") as HTMLScriptElement;
  script.type = "application/javascript";
  script.src = src;
  if (async) {
    script.async = true;
  }
  return script;
}

/** Creates a meta element */
export function createMeta(element: Document, name: string, content: string): void {
  const head = element.head as HTMLHeadElement;
  const existingMeta = head.querySelector("meta[name=" + name + "]") as HTMLMetaElement;
  if (existingMeta) {
    existingMeta.content = content;
  } else {
    const meta = element.createElement("meta") as HTMLMetaElement;
    meta.name = name;
    meta.content = content;
    head.appendChild(meta);
  }
}