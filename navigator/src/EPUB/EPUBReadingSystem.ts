/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

interface EPUBReadingSystemObject {
  readonly name: string,
  readonly version: string
}

export interface EPUBReadingSystem extends Navigator {
  epubReadingSystem: EPUBReadingSystemObject
}