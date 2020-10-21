/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { EPUBSpreadViewDirection } from "../EPUBSpreadView";

export interface IBookView {
  getCurrentProgression(): number;
  goToDirection(direction: EPUBSpreadViewDirection): boolean;
  goToProgression(progression: number): boolean;
  goToFragment(fragment: string): boolean;


  atStart(): boolean;
  atEnd(): boolean;

  goToPreviousPage(): boolean;
  goToNextPage(): boolean;
  getCurrentPage(): number;
  getPageCount(): number;

}